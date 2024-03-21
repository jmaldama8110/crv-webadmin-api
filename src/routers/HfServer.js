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
exports.hfRouter = exports.datsRStoJson = exports.findClientByExternalId = void 0;
const express_1 = __importDefault(require("express"));
const authorize_1 = require("../middleware/authorize");
const mssql_1 = __importDefault(require("mssql"));
const connSQL_1 = require("../db/connSQL");
const Nano = __importStar(require("nano"));
let nano = Nano.default(`${process.env.COUCHDB_PROTOCOL}://${process.env.COUCHDB_USER}:${process.env.COUCHDB_PASS}@${process.env.COUCHDB_HOST}:${process.env.COUCHDB_PORT}`);
const router = express_1.default.Router();
exports.hfRouter = router;
router.get('/clients/exists', authorize_1.authorize, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        /**
         * when IdentityNumber used CURP, returns { id_cliente (persona) } or empty when not found
         * when claveIne used, returns id:[] array of listed Ids for identity
         */
        if (!req.query.identityNumber && !req.query.claveIne) {
            throw new Error('Identity Number or Clave INE parameter is required..');
        }
        let data = undefined;
        if (req.query.identityNumber) {
            data = yield findClientByCurp(req.query.identityNumber);
            if (data.rowsAffected[0] == 1) {
                /// recordsets[0][0] contains personal Info from HF
                const personalData = Object.assign({}, data.recordset[0]);
                res.send({ id_cliente: personalData.id });
            }
            else {
                res.send({ id_cliente: '' });
            }
        }
        if (req.query.claveIne) {
            data = yield findClientByClaveIne(req.query.claveIne);
            if (data.rowsAffected[0] > 0) {
                if (data.recordsets[0].length > 0) {
                    res.send({ ids: data.recordsets[0][0].id });
                }
                else {
                    res.send({ ids: '' });
                }
            }
            else {
                res.send({ ids: '' });
            }
        }
    }
    catch (error) {
        console.log(error);
        res.status(400).send(error);
    }
}));
router.get('/groups/hf/loanapps', authorize_1.authorize, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!(req.query.branchId && req.query.applicationId)) {
            throw new Error('Query parametrs branchId or groupName are missing!');
        }
        const data = yield getLoanApplicationById(parseInt(req.query.applicationId), parseInt(req.query.branchId));
        /**
         * resultsets[0] => Detalle de la solicitud
         * resultsets[1] => Ciclo y estatus
         * resultsets[2] => Nombre del grupo, dia / hora reunion
         * resultsets[3] => Direccion del grupo
         * resultsets[4] => Integrantes, cargo, etc (importe solicitado, autorizado, etc)
         * resultsets[5] => Integrantes / Detalle Seguro (Costo, tipo seguro, Beneficiario, parentezco, etc)
         */
        const loan_application = data[0][0];
        const loan_cycle = data[1][0];
        const group_info = data[2][0];
        const group_address = data[3][0];
        const group_data = {
            id_cliente: group_info.id_cliente,
            group_name: group_info.nombre,
            weekday_meet: group_info.reunion_dia.trim(),
            hour_meet: group_info.reunion_hora.trim(),
            branch: group_info.id_oficina,
            loan_officer: loan_application.id_oficial,
            loan_cycle: loan_cycle.ciclo,
            address: {
                post_code: '',
                address_line1: group_address.direccion,
                road_type: [group_address.vialidad, ''],
                province: [`PROVINCE|${group_address.estado}`, ''],
                municipality: [`MUNICIPALITY|${group_address.municipio}`, ''],
                city: [`CITY|${group_address.localidad}`, ''],
                colony: [`NEIGHBORHOOD|${group_address.colonia}`, ''],
                address_line2: group_address.referencia,
                numero_exterior: group_address.numero_exterior,
                numero_interior: group_address.numero_interior
            }
        };
        const members = data[4].map((i, nCounter) => {
            const insuranceMemberInfo = data[5].find((x) => x.id_individual === i.id_individual);
            ///// buscar en la DB local si existe el integrante, como cliente por medio de id_cliente
            return {
                _id: `${Date.now() + nCounter}`,
                id_member: i.id,
                id_cliente: i.id_individual,
                fullname: `${i.nombre} ${i.apellido_paterno} ${i.apellido_materno}`,
                estatus: i.estatus.trim(),
                sub_estatus: i.sub_estatus.trim(),
                position: i.cargo.trim(),
                apply_amount: i.monto_solicitado,
                approved_amount: i.monto_autorizado,
                previous_amount: i.monto_anterior,
                loan_cycle: i.ciclo,
                disbursment_mean: i.id_cata_medio_desembolso,
                insurance: {
                    id: nCounter,
                    beneficiary: (insuranceMemberInfo ? insuranceMemberInfo.nombre_beneficiario : ''),
                    relationship: (insuranceMemberInfo ? insuranceMemberInfo.parentesco : ''),
                    percentage: (insuranceMemberInfo ? insuranceMemberInfo.porcentaje : 0)
                }
            };
        });
        /// retrieves Product information, that is not provided by HF
        const db = nano.use(process.env.COUCHDB_NAME ? process.env.COUCHDB_NAME : '');
        yield db.createIndex({ index: { fields: ["couchdb_type"] } });
        const productList = yield db.find({ selector: { couchdb_type: "PRODUCT" } });
        const productMaster = productList.docs.find((prod) => prod.external_id == loan_application.id_producto_maestro);
        if (!productMaster) {
            throw new Error('Se producto maestro no se encontro para id_producto_maestro: ' + loan_application.id_producto_maestro);
        }
        const identifierFreq = loan_application.periodicidad.slice(0, 1);
        const frequency = productMaster.allowed_term_type.find((i) => i.identifier === identifierFreq);
        /// Uses the same loan application info, except some field, ei: id_solicitud,
        const loan_app = {
            id_cliente: loan_application.id_cliente,
            id_solicitud: loan_application.id,
            loan_officer: loan_application.id_oficial,
            branch: loan_application.id_oficina,
            id_producto: loan_application.id_producto,
            id_disposicion: loan_application.id_disposicion,
            apply_amount: loan_application.monto_total_solicitado,
            approved_total: loan_application.monto_total_autorizado,
            term: loan_application.plazo,
            frequency: [frequency.identifier, frequency.value],
            first_repay_date: loan_application.fecha_primer_pago,
            disbursment_date: loan_application.fecha_entrega,
            disbursment_mean: loan_application.medio_desembolso.trim(),
            liquid_guarantee: loan_application.garantia_liquida,
            loan_cycle: loan_cycle.ciclo,
            estatus: loan_application.estatus.trim(),
            sub_estatus: loan_application.sub_estatus.trim(),
            members,
            product: {
                external_id: productMaster.external_id,
                min_amount: productMaster.min_amount,
                max_amount: (productMaster.max_amount) * (members.length),
                step_amount: productMaster.step_amount,
                min_term: productMaster.min_term,
                max_term: productMaster.max_term,
                product_name: productMaster.product_name,
                term_types: productMaster.allowed_term_type,
                rate: productMaster.rate,
                tax: productMaster.tax,
                GL_financeable: false,
                liquid_guarantee: loan_application.garantia_liquida
            }
        };
        res.status(200).send({ group_data, loan_app });
    }
    catch (err) {
        console.log(err);
        res.status(400).send(err);
    }
}));
function getLoanApplicationById(loanAppId, branchId) {
    return __awaiter(this, void 0, void 0, function* () {
        const pool = yield mssql_1.default.connect(connSQL_1.sqlConfig);
        const result = yield pool.request()
            .input('id_solicitud', mssql_1.default.Int, loanAppId)
            .input('id_oficina', mssql_1.default.Int, branchId)
            .execute('CLIE_ObtenerSolicitudClienteServicioFinanciero_V2');
        return result.recordsets;
    });
}
router.get('/products/hf', authorize_1.authorize, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!(req.query.branchId && req.query.clientType)) {
            throw new Error('Query parametrs branchId or ClientType are missing!');
        }
        const data = yield getProductsByBranch(parseFloat(req.query.branchId.toString()), parseFloat(req.query.clientType.toString()));
        const db = nano.use(process.env.COUCHDB_NAME ? process.env.COUCHDB_NAME : '');
        const productsQuery = yield db.find({ selector: {
                couchdb_type: "PRODUCT"
            } });
        const newData = data[0].map((x) => {
            const i = productsQuery.docs.find((y) => y.external_id == x.id);
            return Object.assign({}, i);
        });
        res.send(newData);
    }
    catch (err) {
        console.log(err);
        res.status(400).send(err);
    }
}));
function getProductsByBranch(branchId, clientType) {
    return __awaiter(this, void 0, void 0, function* () {
        const pool = yield mssql_1.default.connect(connSQL_1.sqlConfig);
        const result = yield pool.request()
            .input('id_producto', mssql_1.default.Int, 0)
            .input('id_fondeador', mssql_1.default.Int, 0)
            .input('id_disposicion', mssql_1.default.Int, 0)
            .input('id_servicio_financiero', mssql_1.default.Int, 0)
            .input('id_tipo_cliente', mssql_1.default.Int, clientType)
            .input('id_oficina', mssql_1.default.Int, branchId)
            .input('id_periodicidad', mssql_1.default.Int, 0)
            .input('id_tipo_contrato', mssql_1.default.Int, 0)
            .input('visible', mssql_1.default.Int, 1)
            .input('producto_maestro', mssql_1.default.Int, 1)
            .execute('CATA_obtenerProducto');
        return result.recordsets;
    });
}
router.get("/clients/hf", authorize_1.authorize, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    //  get the Client Data with identityNumber and externalId
    /*
      data.recordsets[0][0]  -> Datos personsales
      data.recordsets[0][1] Dataset -> Identificaciones
      data.recordsets[0][2] Dataset -> Datos del IFE / INE
      data.recordsets[0][3] Direcciones -> Direcciones
      data.recordsets[0][4] Telefonos
      data.recordsets[0][5] Aval
      data.recordsets[0][6] Ciclo
      data.recordsets[0][7] Datos economicos
      */
    try {
        let data;
        if ((req.query.externalId)) {
            data = yield findClientByExternalId(parseInt(req.query.externalId));
        }
        else {
            throw new Error('Some query parameters area mising...');
        }
        if (data.recordset.length == 1) {
            /// extract CURP and Ine Folio
            const curp = data.recordsets[1].find((i) => i.tipo_identificacion === "CURP");
            const ife = data.recordsets[1].find((i) => i.tipo_identificacion === "IFE");
            const rfc = data.recordsets[1].find((i) => i.tipo_identificacion === "RFC");
            /// busca el detalle de la IFE/INE
            const ineDetail = data.recordsets[2];
            const ine_detalle = ineDetail.find((i) => i.id_identificacion_oficial === ife.id_numero);
            const identities = [];
            for (let i = 0; i < data.recordsets[1].length; i++) {
                const itemIdentity = data.recordsets[1][i];
                identities.push({
                    _id: itemIdentity.id,
                    id_persona: itemIdentity.id_persona,
                    tipo_id: itemIdentity.tipo_identificacion,
                    numero_id: itemIdentity.id_numero,
                    id_direccion: itemIdentity.id_direccion,
                    status: itemIdentity.estatus_registro
                });
            }
            const address = [];
            let email = '';
            for (let i = 0; i < data.recordsets[3].length; i++) {
                const add = data.recordsets[3][i];
                if (add.correo_electronico) {
                    email = add.correo_electronico;
                }
                address.push({
                    _id: add.id,
                    type: add.tipo.trim(),
                    country: [`COUNTRY|${add.id_pais}`, add.nombre_pais],
                    province: [`PROVINCE|${add.id_estado}`, add.nombre_estado],
                    municipality: [`MUNICIPALITY|${add.id_municipio}`, add.nombre_municipio],
                    city: [`CITY|${add.id_ciudad_localidad}`, add.nombre_ciudad_localidad],
                    colony: [`NEIGHBORHOOD|${add.id_asentamiento}`, add.nombre_asentamiento],
                    address_line1: add.direccion,
                    exterior_number: add.numero_exterior.trim(),
                    interior_number: add.numero_interior.trim(),
                    ext_number: add.num_exterior,
                    int_number: add.num_interior,
                    street_reference: add.referencia,
                    ownership_type: [add.casa_situacion, add.casa_situacion_etiqueta],
                    post_code: add.codigo_postal,
                    residence_since: add.tiempo_habitado_inicio,
                    residence_to: add.tiempo_habitado_final,
                    road: [add.vialidad, add.etiqueta_vialidad],
                    email
                });
            }
            const phones = [];
            for (let l = 0; l < data.recordsets[4].length; l++) {
                const phoneAdd = data.recordsets[4][l];
                if (phoneAdd.idcel_telefono.trim()) {
                    phones.push({
                        _id: phoneAdd.id,
                        phone: phoneAdd.idcel_telefono.trim(),
                        type: phoneAdd.tipo_telefono.trim(),
                        company: phoneAdd.compania.trim(),
                        validated: false
                    });
                }
            }
            const perSet = Object.assign({}, data.recordsets[0][0]);
            let household_data = {
                household_floor: false,
                household_roof: false,
                household_toilet: false,
                household_latrine: false,
                household_brick: false,
                economic_dependants: '',
                internet_access: false,
                prefered_social: [0, ""],
                rol_hogar: [0, ""],
                user_social: '',
                has_disable: false,
                speaks_dialect: false,
                has_improved_income: false,
            };
            let business_data = {
                bis_location: [0, ""],
                economic_activity: ['', ''],
                profession: ['', ''],
                ocupation: ["", ""],
                business_start_date: '',
                business_name: '',
                business_owned: false,
                business_phone: '',
                number_employees: '',
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
                bis_season_type: ''
            };
            let spld = {
                desempenia_funcion_publica_cargo: "",
                desempenia_funcion_publica_dependencia: "",
                familiar_desempenia_funcion_publica_cargo: "",
                familiar_desempenia_funcion_publica_dependencia: "",
                familiar_desempenia_funcion_publica_nombre: "",
                familiar_desempenia_funcion_publica_paterno: "",
                familiar_desempenia_funcion_publica_materno: "",
                familiar_desempenia_funcion_publica_parentesco: "",
                instrumento_monetario: [0, ""]
            };
            let econActId = 0, econActCap = '', profId = 0, profCap = '', occupId = 0, occupCap = '', bisLoc = 0;
            if (data.recordsets[7].length > 0) {
                if (data.recordsets[7][0].id_actividad_economica) {
                    econActId = data.recordsets[7][0].id_actividad_economica ? data.recordsets[7][0].id_actividad_economica : 0,
                        econActCap = data.recordsets[7][0].nombre_actividad_economica ? data.recordsets[7][0].nombre_actividad_economica.toString() : '';
                }
                profId = data.recordsets[7][0].id_profesion ? data.recordsets[7][0].id_profesion : 0,
                    profCap = data.recordsets[7][0].nombre_profesion ? data.recordsets[7][0].nombre_profesion.toString() : '';
                occupId = perSet.id_occupation ? perSet.id_occupation : 0,
                    occupCap = perSet.occupation ? perSet.occupation.toString() : '';
                bisLoc = !!data.recordsets[7][0].econ_id_ubicacion_negocio ? data.recordsets[7][0].econ_id_ubicacion_negocio : 0;
            }
            if (data.recordsets[7].length) {
                business_data.bis_location = [bisLoc, ''];
                business_data.economic_activity = [econActId, econActCap];
                business_data.profession = [profId, profCap];
                business_data.ocupation = [occupId, occupCap];
                business_data.business_name = data.recordsets[7][0].nombre_negocio;
                business_data.business_start_date = data.recordsets[7][0].econ_fecha_inicio_act_productiva,
                    business_data.business_owned = false,
                    business_data.business_phone = "",
                    business_data.number_employees = data.recordsets[7][0].econ_numero_empleados;
                business_data.loan_destination = [data.recordsets[7][0].econ_id_destino_credito, ''];
                business_data.income_sales_total = data.recordsets[7][0].econ_ventas_totales_cantidad ? data.recordsets[7][0].econ_ventas_totales_cantidad : 0;
                business_data.income_partner = data.recordsets[7][0].econ_sueldo_conyugue ? data.recordsets[7][0].econ_sueldo_conyugue : 0;
                business_data.income_other = data.recordsets[7][0].econ_otros_ingresos ? data.recordsets[7][0].econ_otros_ingresos : 0;
                business_data.income_job = data.recordsets[7][0].econ_pago_casa ? data.recordsets[7][0].econ_pago_casa : 0;
                business_data.income_remittances = data.recordsets[7][0].econ_cantidad_mensual ? data.recordsets[7][0].econ_cantidad_mensual : 0;
                business_data.income_total = 0;
                business_data.expense_family = data.recordsets[7][0].econ_gastos_familiares ? data.recordsets[7][0].econ_gastos_familiares : 0;
                business_data.expense_rent = data.recordsets[7][0].econ_renta ? data.recordsets[7][0].econ_renta : 0;
                business_data.expense_business = data.recordsets[7][0].econ_otros_gastos ? data.recordsets[7][0].econ_otros_gastos : 0;
                business_data.expense_debt = data.recordsets[7][0].econ_gastos_vivienda ? data.recordsets[7][0].econ_gastos_vivienda : 0;
                business_data.expense_credit_cards = data.recordsets[7][0].econ_gastos_transporte ? data.recordsets[7][0].econ_gastos_transporte : 0;
                ;
                business_data.expense_total = 0;
                household_data.economic_dependants = data.recordsets[7][0].econ_dependientes_economicos.toString();
                household_data.household_brick = !!data.recordsets[7][0].vivienda_block;
                household_data.household_floor = !!data.recordsets[7][0].vivienda_piso;
                household_data.household_latrine = !!data.recordsets[7][0].vivienda_letrina;
                household_data.household_roof = !!data.recordsets[7][0].vivienda_techo_losa;
                household_data.household_toilet = !!data.recordsets[7][0].vivienda_bano;
                household_data.internet_access = !!data.recordsets[7][0].utiliza_internet;
                household_data.prefered_social = [data.recordsets[7][0].id_tipo_red_social, ""];
                household_data.user_social = data.recordsets[7][0].usuario_red_social;
                household_data.rol_hogar = [data.recordsets[7][0].econ_id_rol_hogar, ""];
                household_data.has_disable = data.recordsets[7][0].habilidad_diferente;
                household_data.speaks_dialect = data.recordsets[7][0].lengua_indigena;
                household_data.has_improved_income = data.recordsets[7][0].mejorado_ingreso;
                spld.desempenia_funcion_publica_cargo = data.recordsets[7][0].desempenia_funcion_publica_cargo,
                    spld.desempenia_funcion_publica_dependencia = data.recordsets[7][0].desempenia_funcion_publica_dependencia,
                    spld.familiar_desempenia_funcion_publica_cargo = data.recordsets[7][0].familiar_desempenia_funcion_publica_cargo,
                    spld.familiar_desempenia_funcion_publica_dependencia = data.recordsets[7][0].familiar_desempenia_funcion_publica_dependencia,
                    spld.familiar_desempenia_funcion_publica_nombre = data.recordsets[7][0].familiar_desempenia_funcion_publica_nombre,
                    spld.familiar_desempenia_funcion_publica_paterno = data.recordsets[7][0].familiar_desempenia_funcion_publica_paterno,
                    spld.familiar_desempenia_funcion_publica_materno = data.recordsets[7][0].familiar_desempenia_funcion_publica_materno,
                    spld.familiar_desempenia_funcion_publica_parentesco = data.recordsets[7][0].familiar_desempenia_funcion_publica_parentesco,
                    spld.instrumento_monetario = [data.recordsets[7][0].id_instrumento_monetario, ""];
            }
            const cicloData = data.recordsets[6];
            const loan_cycle = cicloData.length ? cicloData[0].ciclo : 0;
            const result = Object.assign(Object.assign({ id_persona: perSet.id_persona, id_cliente: perSet.id, name: perSet.name, lastname: perSet.lastname, second_lastname: perSet.second_lastname, email, curp: curp ? curp.id_numero : "", clave_ine: ife ? ife.id_numero : "", numero_emisiones: ine_detalle ? ine_detalle.numero_emision : '', numero_vertical: ine_detalle ? ine_detalle.numero_vertical_ocr : '', rfc: rfc ? rfc.id_numero : "", dob: perSet.dob, loan_cycle, branch: [perSet.id_oficina, perSet.nombre_oficina], sex: [perSet.id_gender, perSet.gender], education_level: [perSet.id_scholarship, perSet.scholarship], identities,
                address,
                phones, tributary_regime: [], not_bis: false, client_type: [2, 'INDIVIDUAL'], nationality: [perSet.id_nationality, perSet.nationality], province_of_birth: [
                    `PROVINCE|${perSet.id_province_of_birth}`,
                    perSet.province_of_birth,
                ], country_of_birth: [
                    `COUNTRY|${perSet.id_country_of_birth}`,
                    perSet.country_of_birth,
                ], marital_status: [perSet.id_marital_status, perSet.marital_status], identification_type: [], guarantor: [], business_data }, household_data), { spld, beneficiaries: [], personal_references: [], guarantee: [], ife_details: ineDetail, data_company: [data.recordsets[8][0]], data_efirma: [data.recordsets[9][0]] });
            res.send(result);
        }
        else {
            res.status(404).send("Not found");
        }
    }
    catch (err) {
        console.log(err);
        res.status(404).send('Client data not found');
    }
}));
router.get('/clients/hf/search', authorize_1.authorize, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!(req.query.branchId && req.query.clientName)) {
            throw new Error('Query parametrs branchId or clientName are missing!');
        }
        const data = yield searchGroupLoanByName(req.query.clientName, parseInt(req.query.branchId));
        res.status(200).send(data);
    }
    catch (err) {
        console.log(err);
        res.status(400).send(err);
    }
}));
router.get('/catalogs/sync', authorize_1.authorize, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield updateCatalogFromHF('CATA_ActividadEconomica', 10000, true);
        yield updateCatalogFromHF('CATA_sexo', 10000);
        yield updateCatalogFromHF('CATA_sector', 10000);
        yield updateCatalogFromHF('CATA_escolaridad', 10000);
        yield updateCatalogFromHF('CATA_estadoCivil', 10000);
        yield updateCatalogFromHF('CATA_nacionalidad', 10000, true);
        yield updateCatalogFromHF('CATA_parentesco', 10000);
        yield updateCatalogFromHF('CATA_profesion', 10000, true);
        yield updateCatalogFromHF('CATA_TipoRelacion', 10000);
        yield updateCatalogFromHF('CATA_TipoPuesto', 10000);
        yield updateCatalogFromHF('CATA_TipoVialidad', 10000);
        yield updateCatalogFromHF('CATA_TipoDomicilio', 10000);
        yield updateCatalogFromHF('CATA_Ciudad_Localidad', 10000);
        yield updateCatalogFromHF('CATA_destinoCredito', 10000);
        yield updateCatalogFromHF('CATA_ocupacionPLD', 10000, true);
        yield updateCatalogFromHF('CATA_banco', 10000);
        yield updateCatalogFromHF('CATA_TipoCuentaBancaria', 10000);
        yield updateCatalogFromHF('CATA_MotivoBajaCastigado', 10000);
        yield updateCatalogFromHF('CATA_MotivoBajaCancelacion', 10000);
        yield updateCatalogFromHF('CATA_MotivoBajaRechazado', 10000);
        yield updateCatalogFromHF('CATA_rolHogar', 10000);
        yield updateCatalogFromHF('CATA_ubicacionNegocio', 10000);
        yield updateCatalogFromHF('SPLD_InstrumentoMonetario', 10000);
        yield updateCatalogFromHF('CATA_RedesSociales', 10000);
        yield updateCatalogFromHFByRelationship('CATA_asentamiento', 1000, 'NEIGHBORHOOD', 'CITY', 'ciudad_localidad');
        yield updateCatalogFromHFByRelationship('CATA_ciudad_localidad', 1000, 'CITY', 'MUNICIPALITY', 'municipio');
        yield updateCatalogFromHFByRelationship('CATA_municipio', 1000, 'MUNICIPALITY', 'PROVINCE', 'estado');
        yield updateCatalogFromHFByRelationship('CATA_estado', 1000, 'PROVINCE', 'COUNTRY', 'pais');
        yield updateCatalogFromHFByRelationship('CATA_pais', 1000, 'COUNTRY');
        res.status(201).send('Done!');
    }
    catch (error) {
        console.log(error + '');
        res.status(400).send(error + '');
    }
}));
router.get('/products/sync', authorize_1.authorize, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const db = nano.use(process.env.COUCHDB_NAME ? process.env.COUCHDB_NAME : '');
        const product = yield getProductsWeb();
        if (!product || product.length === 0) {
            throw new Error("Not able to find the product(s)");
        }
        const productsDestroy = yield db.find({ selector: { couchdb_type: { "$eq": 'PRODUCT' } }, limit: 100000 });
        const docsEliminate = productsDestroy.docs.map(doc => ({ _deleted: true, _id: doc._id, _rev: doc._rev }));
        yield db.bulk({ docs: docsEliminate });
        const rowData = [];
        const creationDatetime = Date.now().toString();
        product.forEach((data) => {
            /// el dato de SQL viene en una lista separada por comas. Una vez split, hay que limpiar la cadena devuelta
            const freqTypes = data.periodicidades.split(",").map((x) => x.trim());
            rowData.push({
                default_frecuency: [
                    mapIdentifierForFrequency(freqTypes[0]),
                    freqTypes[0]
                ],
                deleted: false,
                default_mobile_product: false,
                enabled: true,
                product_type: "1",
                product_name: data.nombre,
                external_id: data.id,
                min_amount: data.valor_minimo,
                max_amount: data.valor_maximo,
                default_amount: data.valor_minimo,
                step_amount: 1000,
                min_term: data.periodo_min,
                max_term: data.periodo_max,
                default_term: data.periodo_min,
                min_rate: data.tasa_anual_min.toString(),
                max_rate: data.tasa_anual_max.toString(),
                rate: data.tasa_anual_min.toString(),
                tax: data.impuesto.toString(),
                years_type: data.tipo_ano,
                allowed_term_type: freqTypes.map((w, increment) => ({
                    _id: increment,
                    identifier: mapIdentifierForTerm(w),
                    value: mapValueForTerm(w),
                    year_periods: mapYearPeriodForTerm(w)
                })),
                allowed_frequency: freqTypes.map((w, increment) => ({
                    _id: increment,
                    identifier: mapIdentifierForFrequency(w),
                    value: w
                })),
                liquid_guarantee: data.garantia_liquida.toString(),
                GL_financeable: data.garantia_liquida_financiable,
                requires_insurance: data.requiere_seguro,
                logo: '',
                avatar: '',
                createdAt: creationDatetime,
                updatedAt: creationDatetime,
                couchdb_type: 'PRODUCT'
            });
        });
        yield db.bulk({ docs: rowData });
        res.send(rowData);
    }
    catch (e) {
        res.status(400).send(e + '');
    }
}));
function getProductsWeb() {
    return __awaiter(this, void 0, void 0, function* () {
        const pool = yield mssql_1.default.connect(connSQL_1.sqlConfig);
        let result = yield pool
            .request()
            .execute('MOV_ProductsForWeb');
        return result.recordset;
    });
}
router.get('/product', authorize_1.authorize, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const product = yield getProductsWeb();
        res.send({ count: product.length, result: product });
    }
    catch (e) {
        res.status(401).send(JSON.stringify(e));
    }
}));
function mapIdentifierForFrequency(frequencyType) {
    switch (frequencyType) {
        case 'Semanal':
            return 'Sl';
        case 'Catorcenal':
            return 'Cl';
        case 'Quincenal':
            return 'Ql';
        case 'Mensual':
            return 'Ml';
        default:
            return undefined;
    }
}
function mapIdentifierForTerm(frequencyType) {
    switch (frequencyType) {
        case 'Semanal':
            return 'S';
        case 'Catorcenal':
            return 'C';
        case 'Quincenal':
            return 'Q';
        case 'Mensual':
            return 'M';
        default:
            return undefined;
    }
}
function mapValueForTerm(frequencyType) {
    switch (frequencyType) {
        case 'Semanal':
            return 'Semana(s)';
        case 'Catorcenal':
            return 'Catorcena(s)';
        case 'Quincenal':
            return 'Quicena(s)';
        case 'Mensual':
            return 'Mes(es)';
        default:
            return undefined;
    }
}
function mapYearPeriodForTerm(frequencyType) {
    switch (frequencyType) {
        case 'Semanal':
            return '52';
        case 'Catorcenal':
            return '26';
        case 'Quincenal':
            return '24';
        case 'Mensual':
            return '12';
        default:
            return undefined;
    }
}
function updateCatalogFromHF(name, chunk, filterActive) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const db = nano.use(process.env.COUCHDB_NAME ? process.env.COUCHDB_NAME : '');
            const docsDestroy = yield db.find({ selector: { name }, limit: 100000 });
            if (docsDestroy.docs.length > 0) {
                const docsEliminate = docsDestroy.docs.map(doc => {
                    const { _id, _rev } = doc;
                    return { _deleted: true, _id, _rev };
                });
                db.bulk({ docs: docsEliminate })
                    .then((body) => { console.log('DELETE', name); })
                    .catch((error) => console.log(error));
            }
            mssql_1.default.connect(connSQL_1.sqlConfig, (err) => {
                const request = new mssql_1.default.Request();
                request.stream = true; //Activarlo al trabajar con varias filas
                if (filterActive) {
                    request.query(`select * from ${name} where estatus_registro = \'ACTIVO\'`);
                }
                else {
                    request.query(`select * from ${name}`);
                }
                let rowData = [];
                request.on('row', row => {
                    // console.log(row);
                    rowData.push(Object.assign({ name, couchdb_type: 'CATALOG' }, row));
                    if (rowData.length >= chunk) {
                        request.pause(); //Pausar la insercción
                        db.bulk({ docs: rowData })
                            .then((body) => { })
                            .catch((error) => { throw new Error(error); });
                        rowData = [];
                        request.resume(); //continuar la insercción
                    }
                });
                request.on("error", (err) => {
                    console.log(err);
                });
                request.on("done", (result) => {
                    db.bulk({ docs: rowData })
                        .then((body) => { })
                        .catch((error) => console.log(error));
                    rowData = [];
                    request.resume();
                    console.log("Catalog Done!", name, "!!", result);
                });
            });
        }
        catch (e) {
            console.log(e);
        }
    });
}
function updateCatalogFromHFByRelationship(name, chunk, shortname, relationship_name, relationship) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const db = nano.use(process.env.COUCHDB_NAME ? process.env.COUCHDB_NAME : '');
            const docsDestroy = yield db.find({ selector: { couchdb_type: shortname }, limit: 100000 });
            if (docsDestroy.docs.length > 0) {
                const docsEliminate = docsDestroy.docs.map(doc => {
                    const { _id, _rev } = doc;
                    return { _deleted: true, _id, _rev };
                });
                db.bulk({ docs: docsEliminate })
                    .then((body) => { })
                    .catch((error) => console.log(error));
            }
            mssql_1.default.connect(connSQL_1.sqlConfig, (err) => {
                const request = new mssql_1.default.Request();
                request.stream = true; //Activarlo al trabajar con varias filas
                request.query(`select * from ${name}`);
                let rowData = [];
                request.on('row', row => {
                    // relationship
                    const codigo_postal = row.codigo_postal;
                    let dataRow = relationship ? {
                        _id: `${shortname.toUpperCase()}|${(row.id).toString()}`,
                        codigo_postal,
                        couchdb_type: shortname,
                        etiqueta: row.etiqueta,
                        [relationship]: `${relationship_name}|${(row[`id_${relationship}`]).toString()}`,
                    } : {
                        _id: `${shortname.toUpperCase()}|${(row.id).toString()}`,
                        // name: shortname,
                        couchdb_type: shortname,
                        etiqueta: row.etiqueta
                    };
                    // if(relationship) dataRow.[relationship] = `${relationship_name}|${(row[`id_${relationship}`]).toString()}`;
                    // if(row.codigo_postal || row.abreviatura || row.codigo) console.log(row.codigo_postal, row.abreviatura, row.codigo)
                    if (row.codigo_postal)
                        dataRow.codigo_postal = row.codigo_postal;
                    if (row.codigo)
                        dataRow.codigo = row.codigo;
                    if (row.abreviatura)
                        dataRow.abreviatura = row.abreviatura;
                    rowData.push(dataRow);
                    // rowData.push(relationship ? codigo_postal ?  {
                    //     _id:`${shortname.toUpperCase()}|${(row.id).toString()}`,
                    //     codigo_postal,
                    //     couchdb_type: shortname,
                    //     etiqueta: row.etiqueta,
                    //     [relationship]: `${relationship_name}|${(row[`id_${relationship}`]).toString()}`,
                    // } : {
                    //     _id:`${shortname.toUpperCase()}|${(row.id).toString()}`,
                    //     couchdb_type: shortname,
                    //     etiqueta: row.etiqueta,
                    //     [relationship]: `${relationship_name}|${(row[`id_${relationship}`]).toString()}`,
                    // } : {
                    //     _id:`${shortname.toUpperCase()}|${(row.id).toString()}`,
                    //     // name: shortname,
                    //     couchdb_type: shortname,
                    //     etiqueta: row.etiqueta
                    // });
                    if (rowData.length >= chunk) {
                        request.pause(); //Pausar la insercción
                        db.bulk({ docs: rowData })
                            .then((body) => { })
                            .catch((error) => { throw new Error(error); });
                        rowData = [];
                        request.resume(); //continuar la insercción
                    }
                });
                request.on("error", (err) => {
                    console.log(err);
                });
                request.on("done", (result) => {
                    db.bulk({ docs: rowData })
                        .then((body) => { })
                        .catch((error) => console.log(error));
                    rowData = [];
                    request.resume();
                    console.log("Dones Catalog Special", name, "!!", result);
                });
            });
        }
        catch (e) {
            console.log(e);
            throw new Error(e);
        }
    });
}
router.get('/clients/hf/getBalance', authorize_1.authorize, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield getBalanceById(parseInt(req.query.idCliente));
        res.send(result[0]);
    }
    catch (error) {
        res.status(401).send(error.message);
    }
}));
function getBalanceById(idClient) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const pool = yield mssql_1.default.connect(connSQL_1.sqlConfig);
            const result = yield pool.request()
                .input('idCliente', mssql_1.default.Int, idClient)
                .execute('MOV_ObtenerSaldoClienteById');
            return result.recordsets;
        }
        catch (err) {
            throw new Error(err);
        }
    });
}
function createReference(typeReference, idClient) {
    return __awaiter(this, void 0, void 0, function* () {
        const pool = yield mssql_1.default.connect(connSQL_1.sqlConfig);
        const result = yield pool.request()
            .input('tipoEvento', mssql_1.default.Int, typeReference)
            .input('id_cliente', mssql_1.default.Int, idClient)
            .execute('MARE_ObtenerReferenciaIntermediario');
        return result.recordset;
    });
}
router.get('/clients/hf/loanapps', authorize_1.authorize, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!(req.query.branchId && req.query.applicationId)) {
            throw new Error('Query parametrs branchId or groupName are missing!');
        }
        const data = yield getSolicitudServicioFinanciero(parseInt(req.query.applicationId), parseInt(req.query.branchId));
        /**
         * resultsets[0] => Detalle de la solicitud
         * resultsets[1] => Ciclo y estatus
         * resultsets[4] => Integrantes, cargo, etc (importe solicitado, autorizado, etc)
         * resultsets[5] => Detalle Seguro (Costo, tipo seguro, Beneficiario, parentezco, etc)
         * resultsets[7] => Avales (Costo, tipo seguro, Beneficiario, parentezco, etc)
         */
        const loan_application = data[0][0];
        const loan_cycle = data[1][0];
        const db = nano.use(process.env.COUCHDB_NAME ? process.env.COUCHDB_NAME : '');
        yield db.createIndex({ index: { fields: ["couchdb_type"] } });
        const productList = yield db.find({ selector: { couchdb_type: "PRODUCT" } });
        const productMaster = productList.docs.find((prod) => prod.external_id == loan_application.id_producto_maestro);
        const identifierFreq = loan_application.periodicidad.slice(0, 1);
        const frequency = productMaster.allowed_term_type.find((i) => i.identifier === identifierFreq);
        /// Uses the same loan application info, except some field, ei: id_solicitud,
        /// and fecha Desembolso y Fecha primer pago
        const fechaDesNew = new Date();
        const fechaPPagoNew = new Date();
        fechaDesNew.setDate(fechaDesNew.getDate() + 7);
        fechaPPagoNew.setDate(fechaPPagoNew.getDate() + 14);
        const members = data[4].map((i, nCounter) => {
            const insuranceMemberInfo = data[5].find((x) => x.id_individual === i.id_individual);
            ///// buscar en la DB local si existe el integrante, como cliente por medio de id_cliente
            return {
                _id: `${Date.now() + nCounter}`,
                id_member: i.id,
                id_cliente: i.id_individual,
                fullname: `${i.nombre} ${i.apellido_paterno} ${i.apellido_materno}`,
                estatus: i.estatus.trim(),
                sub_estatus: i.sub_estatus.trim(),
                position: i.cargo.trim(),
                apply_amount: i.monto_solicitado,
                approved_amount: i.monto_autorizado,
                previous_amount: i.monto_anterior,
                loan_cycle: i.ciclo,
                disbursment_mean: i.id_cata_medio_desembolso,
                insurance: {
                    id: nCounter,
                    beneficiary: (insuranceMemberInfo ? insuranceMemberInfo.nombre_beneficiario : ''),
                    relationship: (insuranceMemberInfo ? insuranceMemberInfo.parentesco : ''),
                    percentage: (insuranceMemberInfo ? insuranceMemberInfo.porcentaje : 0)
                }
            };
        });
        const loan_app = {
            id_cliente: loan_application.id_cliente,
            id_solicitud: loan_application.id,
            loan_officer: loan_application.id_oficial,
            branch: loan_application.id_oficina,
            id_producto: loan_application.id_producto,
            id_disposicion: loan_application.id_disposicion,
            apply_amount: loan_application.monto_total_solicitado,
            approved_total: loan_application.monto_total_autorizado,
            term: loan_application.plazo,
            frequency: [frequency.identifier, frequency.value],
            first_repay_date: fechaPPagoNew.toISOString(),
            disbursment_date: fechaDesNew.toISOString(),
            disbursment_mean: loan_application.medio_desembolso.trim(),
            liquid_guarantee: loan_application.garantia_liquida,
            loan_cycle: loan_cycle.ciclo,
            estatus: loan_application.estatus.trim(),
            sub_estatus: loan_application.sub_estatus.trim(),
            renovation: true,
            members,
            product: {
                external_id: productMaster.external_id,
                min_amount: productMaster.min_amount,
                max_amount: (productMaster.max_amount) * (members.length),
                step_amount: productMaster.step_amount,
                min_term: productMaster.min_term,
                max_term: productMaster.max_term,
                product_name: productMaster.product_name,
                term_types: productMaster.allowed_term_type,
                rate: productMaster.rate,
                tax: productMaster.tax,
                GL_financeable: false,
                liquid_guarantee: 10,
            }
        };
        res.send(loan_app);
    }
    catch (err) {
        console.log(err);
        res.status(400).send(err);
    }
}));
function getSolicitudServicioFinanciero(loanAppId, branchId) {
    return __awaiter(this, void 0, void 0, function* () {
        // MOV_ObtenerSolicitudClienteServicioFinanciero_V2
        const pool = yield mssql_1.default.connect(connSQL_1.sqlConfig);
        const result = yield pool.request()
            .input('id_solicitud', mssql_1.default.Int, loanAppId)
            .input('id_oficina', mssql_1.default.Int, branchId)
            .execute('CLIE_ObtenerSolicitudClienteServicioFinanciero_V2');
        return result.recordsets;
    });
}
router.get('/clients/hf/accountstatement', authorize_1.authorize, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
        const idContract = req.query.contractId;
        const dateFrom = new Date(req.query.dateFrom);
        const dateEnd = new Date(req.query.dateEnd);
        const yearDate = dateEnd.getFullYear().toString();
        const month = dateEnd.getMonth();
        const monthDate = months[month];
        const forceRefresh = !!parseInt(req.query.forceRefresh);
        let data = {};
        const db = nano.use(process.env.COUCHDB_NAME ? process.env.COUCHDB_NAME : '');
        try {
            data = yield db.get(`CONTRACT|${idContract}`);
            const queryDate = new Date(data.query_at);
            const now = new Date();
            const timeDiff = now.getTime() - queryDate.getTime();
            // converts miliseconds in hours, and calculate 6 hours for normal refresh
            const hoursDiff = timeDiff / (1000 * 3600);
            if ((hoursDiff > 12 || forceRefresh)) {
                throw new Error('not account statement found, thus continue on cached block');
            }
            // retrieves only the Record Set part of the document
            res.send(data.rs);
        }
        catch (e) {
            let rs = yield getObtenerEstadoCuentaPeriodo(parseInt(idContract), dateFrom, dateEnd, parseInt(yearDate), parseInt(monthDate));
            /// rs -> Result set of the account statement at the time being query
            /// query_at -> timestamp when the query was last saved
            const timeNow = new Date().toISOString();
            /// Insert or Update document
            yield db.insert(Object.assign(Object.assign({}, data), { rs, query_at: timeNow, couchdb_type: "ACC_STATEMENT" }), `CONTRACT|${idContract}`);
            res.send(rs);
        }
    }
    catch (error) {
        console.log(error);
        res.status(400).send(error);
    }
}));
function getObtenerEstadoCuentaPeriodo(idContract, fechaInicial, fechaFinal, anio, mes) {
    return __awaiter(this, void 0, void 0, function* () {
        // -- DATOS DEL CONTRATO
        // -- DATOS IFE, CURP, TELEFONO
        // -- MONTO AUTORIZADO
        // -- TABLA DE AMORTIZACION
        // -- MOVIMIENTOS DEL PERIODO
        const pool = yield mssql_1.default.connect(connSQL_1.sqlConfig);
        const result = yield pool.request()
            .input('idContrado', mssql_1.default.Int, idContract)
            .input('fechaInicial', mssql_1.default.Date, fechaInicial)
            .input('fechaFinal', mssql_1.default.Date, fechaFinal)
            .input('anio', mssql_1.default.Int, anio)
            .input('mes', mssql_1.default.Int, mes)
            .execute('MOV_ObtenerEstadoCuentaPeriodo');
        return result.recordsets;
    });
}
router.get('/clients/createReference', authorize_1.authorize, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        //TODO: typeReference: 1 -> id: Crédito por id_cliente (NO USAR)
        //      typeReference: 2 -> id: Garantía Líquida por id_cliente
        //      typeReference: 3 -> id: Pago de moratorios por id_cliente
        //      typeReference: 6 -> id: Pago de crédito por id_contrato
        const { typeReference, contractId, clientId } = req.query;
        const id = typeReference === '2' ? clientId : contractId;
        const sqlRes = yield createReference(typeReference, parseInt(id));
        res.status(200).send(sqlRes);
    }
    catch (error) {
        res.status(401).send(error.message);
    }
}));
function findClientByCurp(curp) {
    return __awaiter(this, void 0, void 0, function* () {
        let pool = yield mssql_1.default.connect(connSQL_1.sqlConfig);
        let result = yield pool
            .request()
            .input("id", mssql_1.default.Int, 0)
            .input("palabra", mssql_1.default.VarChar, curp)
            .input("pagina_inicio", mssql_1.default.Int, 0)
            .input("numero_registros", mssql_1.default.Int, 0)
            .input("contador", mssql_1.default.Int, 0)
            // .execute("CONT_BuscarPersona");
            .execute("MOV_BuscarPersona");
        return result;
    });
}
function findClientByExternalId(externalId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let pool = yield mssql_1.default.connect(connSQL_1.sqlConfig);
            let result = yield pool
                .request()
                .input("idCliente", mssql_1.default.Int, externalId)
                .execute("MOV_ObtenerDatosPersona");
            return result;
        }
        catch (err) {
            console.log(err);
            return err;
        }
    });
}
exports.findClientByExternalId = findClientByExternalId;
;
function findClientByClaveIne(claveIne) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let pool = yield mssql_1.default.connect(connSQL_1.sqlConfig);
            let result = yield pool
                .request()
                .input("clave_ife", mssql_1.default.VarChar, claveIne)
                .execute("CLIE_getPersonByIFE");
            return result;
        }
        catch (err) {
            console.log(err);
            return err;
        }
    });
}
;
function searchGroupLoanByName(groupName, branchId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const pool = yield mssql_1.default.connect(connSQL_1.sqlConfig);
            const result = yield pool.request()
                .input('nombre_cliente', mssql_1.default.VarChar, groupName)
                .input('id_oficina', mssql_1.default.Int, branchId)
                .input('pagina', mssql_1.default.Int, 1)
                .input('registros_pagina', mssql_1.default.Int, 50)
                .execute('CLIE_ObtenerClientesYSolicitudesPorOficina');
            const newRes = result.recordset.map(i => ({
                idCliente: i.idCliente,
                nombreCliente: i.nombreCliente,
                idSolicitud: i.idSolicitud,
                estatus: i.estatus.trim(),
                sub_estatus: i.sub_estatus.trim(),
                idTipoCliente: i.idTipoCliente,
                TipoCliente: i.TipoCliente
            }));
            return newRes;
        }
        catch (err) {
            throw new Error(err);
        }
    });
}
router.get("/reset/group", authorize_1.authorize, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    /** BASADO EN UN ACTION _id elimina informacion de la misma y sus dependencias */
    try {
        if (!req.query.actionId) {
            throw new Error('acionId param is missing');
        }
        const db = nano.use(process.env.COUCHDB_NAME ? process.env.COUCHDB_NAME : '');
        const docAction = yield db.get(req.query.actionId);
        if (docAction.couchdb_type !== 'ACTION') {
            throw new Error(`${docAction._id} is not an ACTION type`);
        }
        if (docAction.name === 'CREATE_UPDATE_CLIENT') {
            throw new Error(`${docAction._id} is an ACTION but CREATE/UPDATE CLIENT  is not supported`);
        }
        if (docAction.name === 'CREATE_UPDATE_LOAN') {
            const loanApp = yield db.get(docAction.data.id_loan);
            const ClientApplyby = yield db.get(loanApp.apply_by);
            if (ClientApplyby.couchdb_type !== 'GROUP') {
                throw new Error(`${docAction._id} is an ACTION but APPLY_BY is not GROUP`);
            }
            const idCliente = loanApp.id_cliente;
            const idSolicitud = loanApp.id_solicitud;
            /// crear lo indices de busqueda
            yield db.createIndex({ index: { fields: [
                        "couchdb_type", "idCliente"
                    ] } });
            yield db.createIndex({ index: { fields: [
                        "couchdb_type", "apply_by"
                    ] } });
            /// obtiene todos los Loans de ese grupo
            const queryLoans = yield db.find({ selector: {
                    couchdb_type: "LOANAPP_GROUP",
                    apply_by: loanApp.apply_by
                } });
            //// obtiene todos los contratos de este grupo
            const queryContracts = yield db.find({ selector: {
                    couchdb_type: "CONTRACT",
                    idCliente
                } });
            ///
            const queryGroup = yield db.get(loanApp.apply_by);
            const actionDelete = { _id: docAction._id, _rev: docAction._rev, deleted: true };
            const groupDelete = { _id: queryGroup._id, _rev: queryGroup._rev, deleted: true };
            const loansDelete = queryLoans.docs.map((i) => ({ _id: i._id, _rev: i._rev, deleted: true }));
            const contractsDelete = queryContracts.docs.map((i) => ({ _id: i._id, _rev: i._rev, deleted: true }));
            /// Eliminar CONTRATO
            /// Eliminar TODOS los loans
            ////Eliminar el GRUPO
            /// Eliminar la ACTION
            const documents = [
                actionDelete, groupDelete, ...loansDelete, ...contractsDelete
            ];
            const response = yield db.bulk({ docs: documents });
            res.send(response);
        }
        // res.send('OK')
    }
    catch (e) {
        res.status(400).send(e.message);
    }
}));
function datsRStoJson(data) {
    if (data.recordset.length == 1) {
        /// extract CURP and Ine Folio
        const curp = data.recordsets[1].find((i) => i.tipo_identificacion === "CURP");
        const ife = data.recordsets[1].find((i) => i.tipo_identificacion === "IFE");
        const rfc = data.recordsets[1].find((i) => i.tipo_identificacion === "RFC");
        /// busca el detalle de la IFE/INE
        const ineDetail = data.recordsets[2];
        const ine_detalle = ineDetail.find((i) => i.id_identificacion_oficial === ife.id_numero);
        const identities = [];
        for (let i = 0; i < data.recordsets[1].length; i++) {
            const itemIdentity = data.recordsets[1][i];
            identities.push({
                _id: itemIdentity.id,
                id_persona: itemIdentity.id_persona,
                tipo_id: itemIdentity.tipo_identificacion,
                numero_id: itemIdentity.id_numero,
                id_direccion: itemIdentity.id_direccion,
                status: itemIdentity.estatus_registro
            });
        }
        const address = [];
        let email = '';
        for (let i = 0; i < data.recordsets[3].length; i++) {
            const add = data.recordsets[3][i];
            if (add.correo_electronico) {
                email = add.correo_electronico;
            }
            address.push({
                _id: add.id,
                type: add.tipo.trim(),
                country: [`COUNTRY|${add.id_pais}`, add.nombre_pais],
                province: [`PROVINCE|${add.id_estado}`, add.nombre_estado],
                municipality: [`MUNICIPALITY|${add.id_municipio}`, add.nombre_municipio],
                city: [`CITY|${add.id_ciudad_localidad}`, add.nombre_ciudad_localidad],
                colony: [`NEIGHBORHOOD|${add.id_asentamiento}`, add.nombre_asentamiento],
                address_line1: add.direccion,
                exterior_number: add.numero_exterior.trim(),
                interior_number: add.numero_interior.trim(),
                ext_number: add.num_exterior,
                int_number: add.num_interior,
                street_reference: add.referencia,
                ownership_type: [add.casa_situacion, add.casa_situacion_etiqueta],
                post_code: add.codigo_postal,
                residence_since: add.tiempo_habitado_inicio,
                residence_to: add.tiempo_habitado_final,
                road: [add.vialidad, add.etiqueta_vialidad],
                email
            });
        }
        const phones = [];
        for (let l = 0; l < data.recordsets[4].length; l++) {
            const phoneAdd = data.recordsets[4][l];
            if (phoneAdd.idcel_telefono.trim()) {
                phones.push({
                    _id: phoneAdd.id,
                    phone: phoneAdd.idcel_telefono.trim(),
                    type: phoneAdd.tipo_telefono.trim(),
                    company: phoneAdd.compania.trim(),
                    validated: false
                });
            }
        }
        const perSet = Object.assign({}, data.recordsets[0][0]);
        let household_data = {
            household_floor: false,
            household_roof: false,
            household_toilet: false,
            household_latrine: false,
            household_brick: false,
            economic_dependants: '',
            internet_access: false,
            prefered_social: [0, ""],
            rol_hogar: [0, ""],
            user_social: '',
            has_disable: false,
            speaks_dialect: false,
            has_improved_income: false,
        };
        let business_data = {
            bis_location: [0, ""],
            economic_activity: ['', ''],
            profession: ['', ''],
            ocupation: ["", ""],
            business_start_date: '',
            business_name: '',
            business_owned: false,
            business_phone: '',
            number_employees: '',
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
            bis_season_type: ''
        };
        let spld = {
            desempenia_funcion_publica_cargo: "",
            desempenia_funcion_publica_dependencia: "",
            familiar_desempenia_funcion_publica_cargo: "",
            familiar_desempenia_funcion_publica_dependencia: "",
            familiar_desempenia_funcion_publica_nombre: "",
            familiar_desempenia_funcion_publica_paterno: "",
            familiar_desempenia_funcion_publica_materno: "",
            familiar_desempenia_funcion_publica_parentesco: "",
            instrumento_monetario: [0, ""]
        };
        let econActId = 0, econActCap = '', profId = 0, profCap = '', occupId = 0, occupCap = '', bisLoc = 0;
        if (data.recordsets[7].length > 0) {
            if (data.recordsets[7][0].id_actividad_economica) {
                econActId = data.recordsets[7][0].id_actividad_economica ? data.recordsets[7][0].id_actividad_economica : 0,
                    econActCap = data.recordsets[7][0].nombre_actividad_economica ? data.recordsets[7][0].nombre_actividad_economica.toString() : '';
            }
            profId = data.recordsets[7][0].id_profesion ? data.recordsets[7][0].id_profesion : 0,
                profCap = data.recordsets[7][0].nombre_profesion ? data.recordsets[7][0].nombre_profesion.toString() : '';
            occupId = perSet.id_occupation ? perSet.id_occupation : 0,
                occupCap = perSet.occupation ? perSet.occupation.toString() : '';
            bisLoc = !!data.recordsets[7][0].econ_id_ubicacion_negocio ? data.recordsets[7][0].econ_id_ubicacion_negocio : 0;
        }
        if (data.recordsets[7].length) {
            business_data.bis_location = [bisLoc, ''];
            business_data.economic_activity = [econActId, econActCap];
            business_data.profession = [profId, profCap];
            business_data.ocupation = [occupId, occupCap];
            business_data.business_name = data.recordsets[7][0].nombre_negocio;
            business_data.business_start_date = data.recordsets[7][0].econ_fecha_inicio_act_productiva,
                business_data.business_owned = false,
                business_data.business_phone = "",
                business_data.number_employees = data.recordsets[7][0].econ_numero_empleados;
            business_data.loan_destination = [data.recordsets[7][0].econ_id_destino_credito, ''];
            business_data.income_sales_total = data.recordsets[7][0].econ_ventas_totales_cantidad ? data.recordsets[7][0].econ_ventas_totales_cantidad : 0;
            business_data.income_partner = data.recordsets[7][0].econ_sueldo_conyugue ? data.recordsets[7][0].econ_sueldo_conyugue : 0;
            business_data.income_other = data.recordsets[7][0].econ_otros_ingresos ? data.recordsets[7][0].econ_otros_ingresos : 0;
            business_data.income_job = data.recordsets[7][0].econ_pago_casa ? data.recordsets[7][0].econ_pago_casa : 0;
            business_data.income_remittances = data.recordsets[7][0].econ_cantidad_mensual ? data.recordsets[7][0].econ_cantidad_mensual : 0;
            business_data.income_total = 0;
            business_data.expense_family = data.recordsets[7][0].econ_gastos_familiares ? data.recordsets[7][0].econ_gastos_familiares : 0;
            business_data.expense_rent = data.recordsets[7][0].econ_renta ? data.recordsets[7][0].econ_renta : 0;
            business_data.expense_business = data.recordsets[7][0].econ_otros_gastos ? data.recordsets[7][0].econ_otros_gastos : 0;
            business_data.expense_debt = data.recordsets[7][0].econ_gastos_vivienda ? data.recordsets[7][0].econ_gastos_vivienda : 0;
            business_data.expense_credit_cards = data.recordsets[7][0].econ_gastos_transporte ? data.recordsets[7][0].econ_gastos_transporte : 0;
            ;
            business_data.expense_total = 0;
            household_data.economic_dependants = data.recordsets[7][0].econ_dependientes_economicos.toString();
            household_data.household_brick = !!data.recordsets[7][0].vivienda_block;
            household_data.household_floor = !!data.recordsets[7][0].vivienda_piso;
            household_data.household_latrine = !!data.recordsets[7][0].vivienda_letrina;
            household_data.household_roof = !!data.recordsets[7][0].vivienda_techo_losa;
            household_data.household_toilet = !!data.recordsets[7][0].vivienda_bano;
            household_data.internet_access = !!data.recordsets[7][0].utiliza_internet;
            household_data.prefered_social = [data.recordsets[7][0].id_tipo_red_social, ""];
            household_data.user_social = data.recordsets[7][0].usuario_red_social;
            household_data.rol_hogar = [data.recordsets[7][0].econ_id_rol_hogar, ""];
            household_data.has_disable = data.recordsets[7][0].habilidad_diferente;
            household_data.speaks_dialect = data.recordsets[7][0].lengua_indigena;
            household_data.has_improved_income = data.recordsets[7][0].mejorado_ingreso;
            spld.desempenia_funcion_publica_cargo = data.recordsets[7][0].desempenia_funcion_publica_cargo,
                spld.desempenia_funcion_publica_dependencia = data.recordsets[7][0].desempenia_funcion_publica_dependencia,
                spld.familiar_desempenia_funcion_publica_cargo = data.recordsets[7][0].familiar_desempenia_funcion_publica_cargo,
                spld.familiar_desempenia_funcion_publica_dependencia = data.recordsets[7][0].familiar_desempenia_funcion_publica_dependencia,
                spld.familiar_desempenia_funcion_publica_nombre = data.recordsets[7][0].familiar_desempenia_funcion_publica_nombre,
                spld.familiar_desempenia_funcion_publica_paterno = data.recordsets[7][0].familiar_desempenia_funcion_publica_paterno,
                spld.familiar_desempenia_funcion_publica_materno = data.recordsets[7][0].familiar_desempenia_funcion_publica_materno,
                spld.familiar_desempenia_funcion_publica_parentesco = data.recordsets[7][0].familiar_desempenia_funcion_publica_parentesco,
                spld.instrumento_monetario = [data.recordsets[7][0].id_instrumento_monetario, ""];
        }
        const cicloData = data.recordsets[6];
        const loan_cycle = cicloData.length ? cicloData[0].ciclo : 0;
        const result = Object.assign(Object.assign({ id_persona: perSet.id_persona, id_cliente: perSet.id, name: perSet.name, lastname: perSet.lastname, second_lastname: perSet.second_lastname, email, curp: curp ? curp.id_numero : "", clave_ine: ife ? ife.id_numero : "", numero_emisiones: ine_detalle ? ine_detalle.numero_emision : '', numero_vertical: ine_detalle ? ine_detalle.numero_vertical_ocr : '', rfc: rfc ? rfc.id_numero : "", dob: perSet.dob, loan_cycle, branch: [perSet.id_oficina, perSet.nombre_oficina], sex: [perSet.id_gender, perSet.gender], education_level: [perSet.id_scholarship, perSet.scholarship], identities,
            address,
            phones, tributary_regime: [], not_bis: false, client_type: [2, 'INDIVIDUAL'], nationality: [perSet.id_nationality, perSet.nationality], province_of_birth: [
                `PROVINCE|${perSet.id_province_of_birth}`,
                perSet.province_of_birth,
            ], country_of_birth: [
                `COUNTRY|${perSet.id_country_of_birth}`,
                perSet.country_of_birth,
            ], marital_status: [perSet.id_marital_status, perSet.marital_status], identification_type: [], guarantor: [], business_data }, household_data), { spld, beneficiaries: [], personal_references: [], guarantee: [], ife_details: ineDetail, data_company: [data.recordsets[8][0]], data_efirma: [data.recordsets[9][0]] });
        return (result);
    }
    return undefined;
}
exports.datsRStoJson = datsRStoJson;
