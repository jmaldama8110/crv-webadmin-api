"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActionsRouter = exports.updateLoanAppStatus = void 0;
const express_1 = __importDefault(require("express"));
const Action_1 = __importDefault(require("../model/Action"));
const authorize_1 = require("../middleware/authorize");
const LoanAppGroup_1 = require("../model/LoanAppGroup");
const Client_1 = require("../model/Client");
const LoanApp_1 = require("../model/LoanApp");
const createPerson_1 = require("../utils/createPerson");
const createClient_1 = require("../utils/createClient");
const createLoan_1 = require("../utils/createLoan");
const Nano = __importStar(require("nano"));
const mssql_1 = __importDefault(require("mssql"));
const connSQL_1 = require("../db/connSQL");
const HfServer_1 = require("./HfServer");
const misc_1 = require("../utils/misc");
let nano = Nano.default(`${process.env.COUCHDB_PROTOCOL}://${process.env.COUCHDB_USER}:${process.env.COUCHDB_PASS}@${process.env.COUCHDB_HOST}:${process.env.COUCHDB_PORT}`);
let loanAppGroup = new LoanAppGroup_1.LoanAppGroup();
let ClientDoc = new Client_1.Client();
let ActionDoc = new Action_1.default();
const router = express_1.default.Router();
exports.ActionsRouter = router;
router.get('/actions/validate', authorize_1.authorize, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Validate action
        let RSP_Result = { status: 'ERROR' };
        const { id } = req.query;
        const response = yield ActionDoc.validateAction(id, "VALIDATE");
        let info = { _id: id };
        let action = response.action;
        RSP_Result.action = action;
        if (response.status === "OK") {
            let action = response.action;
            let info = { action_type: action.name };
            let loan;
            let id_loan;
            let RSP_ResultNewMembers = [];
            switch (action.name) {
                case 'CREATE_UPDATE_LOAN':
                    // Get data
                    id_loan = action.data.id_loan;
                    loan = yield loanAppGroup.getLoan(id_loan);
                    if (loan === undefined) {
                        info.loan_id = id_loan;
                        RSP_Result = yield ActionDoc.generarErrorRSP(`Loan ${id_loan} is not found`, info);
                        break;
                    }
                    // Validate members
                    if (!Array.isArray(loan.members)) {
                        RSP_Result = yield ActionDoc.generarErrorRSP('Members were not found: ', info);
                        break;
                    }
                    let memberstransact = loan.members.filter((row) => row.estatus.trim().toUpperCase() === "TRAMITE" && row.sub_estatus.trim().toUpperCase() === "NUEVO TRAMITE");
                    let memberscancelled = loan.members.filter((row) => row.estatus.trim().toUpperCase() === "CANCELADO" && row.sub_estatus.trim().toUpperCase() === "CANCELACION/ABANDONO");
                    let membersnew = loan.members.filter((row) => row.estatus.trim().toUpperCase() === "INGRESO" && row.sub_estatus.trim().toUpperCase() === "NUEVO");
                    if (membersnew.length === 0 && memberscancelled.length === 0 && memberstransact.length === 0) {
                        RSP_Result = yield ActionDoc.generarErrorRSP('There are not members with status in TRAMITE, CANCELADO or INGRESO', info);
                        break;
                    }
                    for (let row of membersnew) {
                        // Get data
                        let client;
                        const _id = row.client_id;
                        client = yield ClientDoc.findOne({ _id });
                        if (client === undefined) {
                            info.client_id = _id;
                            RSP_Result = yield ActionDoc.generarErrorRSP('Client new is not found: ' + row.client_id, info);
                            RSP_ResultNewMembers.push(RSP_Result);
                        }
                        else {
                            //Validate data
                            if (client.id_cliente == 0 || client.id_persona == 0) {
                                RSP_Result = yield ActionDoc.validateDataClient(client);
                                if (RSP_Result.status !== "OK") {
                                    RSP_Result.info.client_id = _id;
                                    RSP_ResultNewMembers.push(RSP_Result);
                                }
                            }
                        }
                    }
                    if (RSP_ResultNewMembers.length > 0) {
                        RSP_Result = yield ActionDoc.generarErrorRSP("The new members have a trouble with any validation.", RSP_ResultNewMembers);
                        break;
                    }
                    info.id_cliente = loan.id_cliente;
                    info.id_solicitud = loan.id_solicitud;
                    info.id_loan = id_loan;
                    //Validate data
                    RSP_Result = yield ActionDoc.validateDataLoan(loan, info);
                    break;
                case 'CREATE_UPDATE_CLIENT':
                    // Get data
                    let client;
                    const { _id } = action.data;
                    client = yield ClientDoc.findOne({ _id });
                    if (client === undefined) {
                        RSP_Result = yield ActionDoc.generarErrorRSP('Client is not found', info);
                        break;
                    }
                    //Validate data
                    RSP_Result = yield ActionDoc.validateDataClient(client);
                    break;
                default:
                    RSP_Result = yield ActionDoc.generarErrorRSP('Action "' + action.name + '" is not supported', info);
                    break;
            }
            //Save validation
            RSP_Result = yield ActionDoc.saveValidation(RSP_Result, action);
            RSP_Result.action = action;
        }
        else
            RSP_Result = yield ActionDoc.generarErrorRSP(response.message, info);
        res.status(201).send(RSP_Result);
    }
    catch (err) {
        let RSP_Result = yield ActionDoc.generarErrorRSP(err.message, req.query);
        res.status(400).send(RSP_Result);
    }
}));
router.get('/actions/exec', authorize_1.authorize, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Validate action
        let RSP_Result = { status: 'ERROR' };
        const { id } = req.query;
        const response = yield ActionDoc.validateAction(id, "EXEC");
        let info = { _id: id };
        let action = response.action;
        RSP_Result.action = action;
        if (response.status === "OK") {
            info.action_type = action.name;
            RSP_Result.info = info;
            if (!action.isOk)
                RSP_Result = yield ActionDoc.generarErrorRSP("The action " + action.name + " with id " + id + " has not been validated. You must to run option '/actions/validate'", info);
            else {
                let loan;
                switch (action.name) {
                    case 'CREATE_UPDATE_LOAN':
                        // Get Loan
                        let RSP_ResultNewMembers = [];
                        let id_loan;
                        id_loan = action.data.id_loan;
                        loan = yield loanAppGroup.getLoan(id_loan);
                        //Crear miembros nuevos
                        let membersnew = loan.members.filter((row) => row.estatus.trim().toUpperCase() === "INGRESO" && row.sub_estatus.trim().toUpperCase() === "NUEVO");
                        for (let row of membersnew) {
                            let _id = row.client_id;
                            let RSP_ResultClient = { status: 'ERROR' };
                            let client = yield ClientDoc.findOne({ _id });
                            if (client.id_cliente == 0 || client.id_persona == 0) {
                                // Create person and client
                                const personCreatedHF = yield (0, createPerson_1.createPersonHF)({ "_id": row.client_id });
                                //Validar error al crear persona
                                if (!personCreatedHF || personCreatedHF instanceof Error) {
                                    action.status = 'Error';
                                    action.errors = [personCreatedHF.message];
                                    RSP_ResultClient.status = 'ERROR';
                                    RSP_ResultNewMembers.push(RSP_ResultClient);
                                }
                                //Si no hay error crear cliente
                                else {
                                    const clientSaved = yield (0, createClient_1.createClientHF)({ "_id": row.client_id });
                                    RSP_ResultClient.status = "OK";
                                    //Validar creación del cliente
                                    if (!clientSaved || clientSaved instanceof Error) {
                                        action.status = 'Error';
                                        action.errors = [clientSaved.message];
                                        RSP_ResultClient.status = 'ERROR';
                                        RSP_ResultNewMembers.push(RSP_ResultClient);
                                    }
                                }
                            }
                            else
                                RSP_ResultClient.status = "OK";
                            if (RSP_ResultClient.status === "OK") {
                                _id = row.client_id;
                                let client = yield ClientDoc.findOne({ _id });
                                if (client.id_cliente > 0 && client.id_persona > 0) {
                                    row.id_member = client.id_persona;
                                    row.id_cliente = client.id_cliente;
                                    row.estatus = "TRAMITE";
                                    row.sub_estatus = "NUEVO TRAMITE";
                                }
                                else {
                                    RSP_ResultClient = yield ActionDoc.generarErrorRSP("The member with client_id " + row.client_id + " was not saved", RSP_ResultNewMembers);
                                    RSP_ResultNewMembers.push(RSP_ResultClient);
                                }
                            }
                        }
                        if (RSP_ResultNewMembers.length > 0) {
                            RSP_Result = yield ActionDoc.generarErrorRSP("The new members have a trouble with any validation.", RSP_ResultNewMembers);
                            break;
                        }
                        if (loan.couchdb_type === "LOANAPP_GROUP")
                            yield new LoanAppGroup_1.LoanAppGroup(loan).save();
                        else
                            yield new LoanApp_1.LoanApp(loan).save();
                        loan = yield loanAppGroup.getLoan(id_loan);
                        membersnew = loan.members.filter((row) => row.estatus.trim().toUpperCase() === "INGRESO" && row.sub_estatus.trim().toUpperCase() === "NUEVO");
                        if (membersnew.length > 0) {
                            RSP_Result = yield ActionDoc.generarErrorRSP("The new members have not been saved correctly. Try again", RSP_ResultNewMembers);
                            break;
                        }
                        // Create loan
                        loan = yield (0, createLoan_1.createLoanHF)(action.data);
                        // Validate creation of loan
                        if (loan instanceof Error || !loan) {
                            action.status = 'Error';
                            action.errors = [loan.message];
                            RSP_Result.status = 'ERROR';
                            yield new Action_1.default(action).save();
                        }
                        else {
                            RSP_Result.status = 'OK';
                            action.errors = [];
                            action.status = 'Done';
                        }
                        break;
                    case 'CREATE_UPDATE_CLIENT':
                        // Create person and client
                        const personCreatedHF = yield (0, createPerson_1.createPersonHF)(action.data);
                        //Validar error al crear persona
                        if (!personCreatedHF || personCreatedHF instanceof Error) {
                            action.status = 'Error';
                            action.errors = [personCreatedHF.message];
                            RSP_Result.status = 'ERROR';
                            yield new Action_1.default(action).save();
                        }
                        //Si no hay error crear cliente
                        else {
                            const clientSaved = yield (0, createClient_1.createClientHF)(action.data);
                            //Validar creación del cliente
                            if (!clientSaved || clientSaved instanceof Error) {
                                action.status = 'Error';
                                action.errors = [clientSaved.message];
                                RSP_Result.status = 'ERROR';
                                yield new Action_1.default(action).save();
                                console.log('Error :', { personCreatedHF, clientSaved });
                            }
                            else {
                                RSP_Result.status = 'OK';
                                action.status = 'Done';
                                action.errors = [];
                            }
                        }
                        break;
                    default:
                        RSP_Result = yield ActionDoc.generarErrorRSP('Action "' + action.name + '" is not supported', info);
                        break;
                }
            }
            RSP_Result.action = action;
            //Save execution
            if (RSP_Result.status == "OK")
                yield new Action_1.default(action).save();
        }
        else
            RSP_Result = yield ActionDoc.generarErrorRSP(response.message, info);
        res.status(201).send(RSP_Result);
    }
    catch (err) {
        let RSP_Result = yield ActionDoc.generarErrorRSP(err.message, req.query);
        res.status(400).send(RSP_Result);
    }
}));
const clientDataDef = {
    address: [],
    branch: [0, ''],
    business_data: {
        bis_location: [0, ""],
        economic_activity: ['', ''],
        profession: ['', ''],
        ocupation: ["", ""],
        business_start_date: '',
        business_name: '',
        business_owned: false,
        business_phone: '',
        number_employees: 0,
        loan_destination: [0, ''],
        income_sales_total: 0,
        income_partner: 0,
        income_job: 0,
        income_remittances: 0,
        income_other: 0,
        income_total: 0,
        expense_family: 0,
        expense_rent: 0,
        expense_business: 0,
        expense_debt: 0,
        expense_credit_cards: 0,
        expense_total: 0,
        keeps_accounting_records: false,
        has_previous_experience: false,
        previous_loan_experience: '',
        bis_season_type: '',
        bis_quality_sales_monthly: {
            month_sale_jan: '',
            month_sale_feb: '',
            month_sale_mar: '',
            month_sale_apr: '',
            month_sale_may: '',
            month_sale_jun: '',
            month_sale_jul: '',
            month_sale_aug: '',
            month_sale_sep: '',
            month_sale_oct: '',
            month_sale_nov: '',
            month_sale_dic: '',
        }
    },
    client_type: [0, ''],
    coordinates: [0, 0],
    couchdb_type: "CLIENT",
    country_of_birth: ['', ''],
    curp: "",
    data_company: [{}],
    data_efirma: [{}],
    dob: "",
    education_level: ['', ''],
    id_cliente: 0,
    id_persona: 0,
    ife_details: [{}],
    clave_ine: "",
    numero_vertical: "",
    numero_emisiones: "",
    email: '',
    lastname: "",
    loan_cycle: 0,
    marital_status: [1, ''],
    name: "",
    nationality: [0, ''],
    phones: [],
    identities: [],
    province_of_birth: ['', ''],
    rfc: "",
    second_lastname: "",
    sex: [0, ''],
    status: [0, ''],
    household_floor: false,
    household_roof: false,
    household_toilet: false,
    household_latrine: false,
    household_brick: false,
    economic_dependants: 0,
    internet_access: false,
    prefered_social: [0, ""],
    rol_hogar: [0, ""],
    user_social: '',
    has_disable: false,
    speaks_dialect: false,
    has_improved_income: false,
    spld: {
        desempenia_funcion_publica_cargo: "",
        desempenia_funcion_publica_dependencia: "",
        familiar_desempenia_funcion_publica_cargo: "",
        familiar_desempenia_funcion_publica_dependencia: "",
        familiar_desempenia_funcion_publica_nombre: "",
        familiar_desempenia_funcion_publica_paterno: "",
        familiar_desempenia_funcion_publica_materno: "",
        familiar_desempenia_funcion_publica_parentesco: "",
        instrumento_monetario: [0, ""],
    },
    comment: '',
    identity_pics: [],
    identity_verification: {
        uuid: '',
        status: 'pending',
        result: 'waiting',
        created_at: '',
        updated_at: '',
        documentData: {
            age: '',
            voter_key: '',
            nationality: '',
            name: '',
            lastname: '',
            second_lastname: '',
            dob: '',
            doc_number: '',
            duplicates: '',
            expiration_date: '',
            folio_number: '',
            ocr_number: '',
            sex: '',
            curp: '',
            street_address: '',
            suburb_address: ''
        }
    },
    comprobante_domicilio_pics: [],
    _id: "",
    _rev: ""
};
router.get('/db_update_loans_contracts', authorize_1.authorize, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const loans = yield updateLoanAppStatus();
        res.send({ loans });
    }
    catch (e) {
        console.log(e);
        res.status(400).send(e.message);
    }
}));
function updateLoanAppStatus() {
    return __awaiter(this, void 0, void 0, function* () {
        const db = nano.use(process.env.COUCHDB_NAME ? process.env.COUCHDB_NAME : '');
        const queryActions = yield db.find({
            selector: {
                couchdb_type: "LOANAPP_GROUP"
            }, limit: 100000
        });
        const toBeUpdated = [];
        //// cuando el estatus de LOANAPP esta en Nuevo tramite y cambia a ACEPTADO/PRESTAMO ACTIVO
        /// Se debe importar el contrato de este LOAN.
        const clientIdsToUpdate = []; // here we add all clients/group uniquely, so perform sigle get balance from HF
        for (let i = 0; i < queryActions.docs.length; i++) {
            const loanAppDoc = queryActions.docs[i];
            const idSolicitud = parseInt(loanAppDoc.id_solicitud);
            const newStatus = yield getCurrentLoanStatus(idSolicitud);
            /// only updates when newStatus is not equal current Status
            if (newStatus) {
                const statusChanged = !(loanAppDoc.estatus === newStatus.estatus && loanAppDoc.sub_estatus === newStatus.sub_estatus);
                console.log(`${idSolicitud} (${statusChanged}), ${loanAppDoc.estatus}/${loanAppDoc.sub_estatus} => ${newStatus === null || newStatus === void 0 ? void 0 : newStatus.estatus}/${newStatus === null || newStatus === void 0 ? void 0 : newStatus.sub_estatus}`);
                if (statusChanged && !loanAppDoc.renovation) {
                    // renovation flag must be FALSE
                    /// only when changed excepting ACEPTADO/PRESTAMO FINALIZADO
                    toBeUpdated.push(Object.assign(Object.assign({}, loanAppDoc), { estatus: newStatus.estatus, sub_estatus: newStatus.sub_estatus }));
                    // check if there is any PRESTAMO ACTIVO STATUS
                    if (newStatus.estatus === 'ACEPTADO' &&
                        newStatus.sub_estatus === 'PRESTAMO ACTIVO') {
                        /// here we found that an status changed to ACTIVE LOAN, therefore, need to get 
                        /// current contract balance
                        clientIdsToUpdate.push({ id_cliente: loanAppDoc.id_cliente, _id: loanAppDoc.apply_by, branch: loanAppDoc.branch });
                    }
                }
            }
            if (!newStatus) {
                console.log(`${idSolicitud}, unable to retrieve status from SQL`);
            }
        }
        /// run the bulk update
        /**1. UPDATE all LOANAPP_DOC docs status/substatus */
        yield db.bulk({ docs: toBeUpdated });
        console.log(`Updated: ${toBeUpdated.length}, Nothing to do: ${queryActions.docs.length - toBeUpdated.length}`);
        /**2. UPDATE all CONTRACT from HF data*/
        const queryContracts = yield db.find({
            selector: {
                couchdb_type: "CONTRACT"
            }, limit: 100000
        });
        const dataToBeUpdated = [];
        for (let w = 0; w < queryContracts.docs.length; w++) {
            const contractDoc = queryContracts.docs[w];
            const dataFromHF = yield (0, HfServer_1.getContractInfo)(contractDoc.idContrato);
            if (dataFromHF[0][0]) {
                console.log(`${contractDoc.idContrato} updated.`);
                dataToBeUpdated.push(Object.assign(Object.assign(Object.assign({}, contractDoc), dataFromHF[0][0]), { updated_by: `${process.env.COUCHDB_USER}`, updated_at: new Date().toISOString() }));
            }
            else {
                console.log(`${contractDoc.idContrato} not found info from SQL`);
            }
        }
        yield db.bulk({ docs: dataToBeUpdated });
        console.log(`Updated contracts: ${dataToBeUpdated.length}`);
        /** UPDATE all contracts in db */
        /*** finally, create contracts for ACEPTADO/PRESTAMO ACTIVO */
        const newContractsToCreate = [];
        for (let i = 0; i < clientIdsToUpdate.length; i++) {
            const contractData = yield (0, HfServer_1.getBalanceById)(clientIdsToUpdate[i].id_cliente);
            for (let x = 0; x < contractData.length; x++) {
                const contractExists = queryContracts.docs.find((f) => f.idContrato == contractData[0][x].idContrato);
                if (!contractExists) {
                    const newContract = Object.assign(Object.assign({}, contractData[0][x]), { _id: Date.now().toString(), client_id: clientIdsToUpdate[i]._id, created_by: `${process.env.COUCHDB_USER}`, created_at: new Date().toISOString(), branch: clientIdsToUpdate[i].branch, couchdb_type: "CONTRACT" });
                    newContractsToCreate.push(newContract);
                    console.log(`${newContract.idContract}, created.`);
                }
            }
        }
        yield db.bulk({ docs: newContractsToCreate });
        console.log(`Created contracts: ${newContractsToCreate.length}`);
        /*** create contracts for */
        return queryActions.docs.length;
    });
}
exports.updateLoanAppStatus = updateLoanAppStatus;
function getCurrentLoanStatus(idSolicitud) {
    return __awaiter(this, void 0, void 0, function* () {
        const pool = yield mssql_1.default.connect(connSQL_1.sqlConfig);
        const result = yield pool
            .request()
            .input("id", mssql_1.default.Int, idSolicitud)
            .query("select * from OTOR_SolicitudPrestamos WHERE OTOR_SolicitudPrestamos.id = @id");
        if (result.recordsets.length) {
            if (!!result.recordset[0])
                return {
                    estatus: result.recordset[0].estatus.trim(),
                    sub_estatus: result.recordset[0].sub_estatus.trim(),
                };
        }
        return undefined;
    });
}
router.get('/actions/fix/09042024', authorize_1.authorize, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.query.loanAppId) {
            throw new Error('No id');
        }
        let loanAppId = req.query.loanAppId;
        const db = nano.use(process.env.COUCHDB_NAME ? process.env.COUCHDB_NAME : '');
        const queryActions = yield db.find({
            selector: {
                couchdb_type: "LOANAPP_GROUP"
            },
            limit: 10000
        });
        //// Extraemos todos los LoanApp y evaluamos si el client_id esta vacio
        const loanappGrpList = queryActions.docs.map((i) => {
            return Object.assign(Object.assign({}, i), { mustBeUpdated: !!(i.members.find((w) => !w.client_id)) });
        });
        const newListLoans = loanappGrpList.filter((i) => i._id === loanAppId);
        /// Iteramos y ejecutamos un update en cada LoanApp que requiere
        for (let d = 0; d < newListLoans.length; d++) {
            if (newListLoans[d].mustBeUpdated) {
                for (let s = 0; s < newListLoans[d].members.length; s++) {
                    const clientsQuery = yield db.find({
                        selector: {
                            couchdb_type: "CLIENT",
                            id_cliente: newListLoans[d].members[s].id_cliente
                        }
                    });
                    const clientDoc = clientsQuery.docs.find((k) => k.id_cliente == newListLoans[d].members[s].id_cliente);
                    newListLoans[d].members[s].client_id = clientDoc._id;
                }
                /// once the client_id field is populated, update LOANAPP_GROUP document
                const loanAppGrpObject = newListLoans[d];
                delete loanAppGrpObject.mustBeUpdated; // remove auxiliary fields
                yield db.insert(Object.assign({}, loanAppGrpObject));
            }
        }
        res.send(newListLoans);
    }
    catch (e) {
        console.log(e);
        res.status(400).send(e.message);
    }
}));
router.get('/fix_address_ext_int_numbers_types', authorize_1.authorize, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const db = nano.use(process.env.COUCHDB_NAME ? process.env.COUCHDB_NAME : '');
        yield db.createIndex({ index: { fields: ["couchdb_type"] } });
        const queryActions = yield db.find({
            selector: {
                couchdb_type: "CLIENT"
            },
            limit: 100000
        });
        const recordsToUpdate = [];
        for (let i = 0; i < queryActions.docs.length; i++) {
            let clientDoc = queryActions.docs[i];
            let addressError = false;
            let newAddressArray = [];
            for (let j = 0; j < clientDoc.address.length; j++) {
                let addressDoc = clientDoc.address[j];
                if (!(0, misc_1.checkProperty)('ext_number', addressDoc, 0) ||
                    !(0, misc_1.checkProperty)('int_number', addressDoc, 0) ||
                    !(0, misc_1.checkProperty)('exterior_number', addressDoc, "SN") ||
                    !(0, misc_1.checkProperty)('interior_number', addressDoc, "SN")) {
                    addressError = true;
                    addressDoc = Object.assign(Object.assign({}, addressDoc), { ext_number: 0, int_number: 0, exterior_number: 'SN', interior_number: 'SN' });
                }
                newAddressArray.push(addressDoc);
            }
            if (addressError) {
                clientDoc.address = newAddressArray;
                recordsToUpdate.push(clientDoc);
            }
        }
        yield db.bulk({ docs: recordsToUpdate });
        res.send({ recordsUpdated: recordsToUpdate.map((i) => ({ id_cliente: i.id_cliente })) });
    }
    catch (e) {
        res.status(400).send(e.message);
    }
}));
router.get('/fix_loans_missing_member_id', authorize_1.authorize, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const db = nano.use(process.env.COUCHDB_NAME ? process.env.COUCHDB_NAME : '');
        yield db.createIndex({ index: { fields: ["couchdb_type"] } });
        const queryActions = yield db.find({
            selector: {
                couchdb_type: "LOANAPP_GROUP"
            },
            limit: 10000
        });
        console.log(`Loans: ${queryActions.docs.length}`);
        const clientsQuery = yield db.find({
            selector: {
                couchdb_type: "CLIENT"
            },
            limit: 10000
        });
        console.log(`Clients: ${clientsQuery.docs.length}`);
        const recordsToUpdate = [];
        for (let i = 0; i < queryActions.docs.length; i++) {
            let loanDoc = queryActions.docs[i];
            let loanWithIssues = false;
            let newMembersArray = [];
            for (let j = 0; j < loanDoc.members.length; j++) {
                let memberDoc = loanDoc.members[j];
                if (!memberDoc.client_id) { // founds an client_id empty
                    loanWithIssues = true;
                    const clientDoc = clientsQuery.docs.find((k) => (k.id_cliente == memberDoc.id_cliente));
                    if (clientDoc) {
                        memberDoc = Object.assign(Object.assign({}, memberDoc), { client_id: clientDoc._id });
                    }
                }
                newMembersArray.push(memberDoc);
            }
            if (loanWithIssues) {
                loanDoc.members = newMembersArray;
                recordsToUpdate.push(loanDoc);
            }
        }
        yield db.bulk({ docs: recordsToUpdate });
        console.log(`Loans to update: ${recordsToUpdate.length}`);
        res.send({ recordsUpdated: recordsToUpdate.map((i) => (Object.assign({}, i))) });
    }
    catch (e) {
        res.status(400).send(e.message);
    }
}));
