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
exports.ActionsRouter = void 0;
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
                        }
                        //Si no hay error crear cliente
                        else {
                            const clientSaved = yield (0, createClient_1.createClientHF)(action.data);
                            //Validar creación del cliente
                            if (!clientSaved || clientSaved instanceof Error) {
                                action.status = 'Error';
                                action.errors = [clientSaved.message];
                                RSP_Result.status = 'ERROR';
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
router.get('/actions/fix/10ABR2024', authorize_1.authorize, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const db = nano.use(process.env.COUCHDB_NAME ? process.env.COUCHDB_NAME : '');
        const queryActions = yield db.find({ selector: {
                couchdb_type: "GROUP"
            } });
        for (let i = 0; i < queryActions.docs.length; i++) {
            const groupDoc = queryActions.docs[i];
            const numero_exterior = `${groupDoc.address.numero_exterior}`;
            const numero_interior = `${groupDoc.address.numero_interior}`;
            const address = Object.assign(Object.assign({}, groupDoc.address), { numero_exterior,
                numero_interior });
            yield db.insert(Object.assign(Object.assign({}, groupDoc), { address }));
        }
        res.send('Ok');
    }
    catch (e) {
        console.log(e);
        res.status(400).send(e.message);
    }
}));
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
                    const clientsQuery = yield db.find({ selector: {
                            couchdb_type: "CLIENT",
                            id_cliente: newListLoans[d].members[s].id_cliente
                        } });
                    const clientDoc = clientsQuery.docs.find((k) => k.id_cliente == newListLoans[d].members[s].id_cliente);
                    newListLoans[d].members[s].client_id = clientDoc._id;
                }
                /// once the client_id field is populated, update LOANAPP_GROUP document
                const loanAppGrpObject = newListLoans[d];
                delete loanAppGrpObject.mustBeUpdated; // remove auxiliary fields
                yield db.insert(Object.assign({}, loanAppGrpObject));
            }
        }
        res.send(newListLoans.filter((l) => l.mustBeUpdated));
    }
    catch (e) {
        console.log(e);
        res.status(400).send(e.message);
    }
}));
