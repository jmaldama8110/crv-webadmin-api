"use strict";
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
exports.LoanApp = void 0;
const mssql_1 = __importDefault(require("mssql"));
const connSQL_1 = require("../db/connSQL");
const DocumentCollection_1 = require("./DocumentCollection");
class LoanApp extends DocumentCollection_1.DocumentCollection {
    constructor(obj = {}) {
        super();
        this._id = obj._id || Date.now().toString(),
            this._rev = obj._rev,
            this._couchdb_type = 'LOANAPP',
            this._apply_by = obj.apply_by,
            this._id_solicitud = obj.id_solicitud || 0,
            this._id_cliente = obj.id_cliente || 0,
            this._loan_officer = obj.loan_officer || 0,
            this._branch = obj.branch || [1, 'ORIENTE'],
            this._id_producto = obj.id_producto || 0, // Product HF, Se crea cuando pasa a estatus Por Autorizar
            this._id_disposicion = obj.id_disposicion || 0, // Se obtiene dependiendo el producto maestro
            this._apply_amount = obj.apply_amount || 0, // En caso de grupos es la suma total de monto de lo integrantes
            this._approved_total = obj.approved_total || 0,
            this._term = obj.term || 0,
            this._estatus = obj.estatus || 'TRAMITE',
            this._sub_estatus = obj.sub_estatus || 'NUEVO TRAMITE',
            this._renovation = obj.renovation || false,
            this._frequency = obj.frequency || ['S', 'Semana(s)'],
            this._first_repay_date = obj.first_repay_date || '', // type Date
            this._disbursment_date = obj.disbursment_date || '', // type Date
            this._disbursment_mean = obj.disbursment_mean || 'ORP', // ORP/
            this._liquid_guarantee = obj.liquid_guarantee || 0, // ORP/
            this._product = obj.product || {
                external_id: 1,
                min_amount: 2000,
                max_amount: 58000,
                step_amount: 1000,
                min_term: 8,
                max_term: 24,
                product_name: "CREDITO SOLIDARIO",
                term_types: [],
                rate: "91.21",
                tax: "16",
                GL_financeable: true,
                liquid_guarantee: 10
            }, // TODO Buscar el extenal id en couch al sincronizar, Product Couch
            this._created_by = obj.created_by || 'promotor@grupoconserva.mx',
            this._status = obj.status || [1, 'Pendiente'],
            this._dropout = obj.dropout || [],
            this._members = obj.members || [{
                    client_id: '',
                    id_cliente: 0,
                    id_persona: 0,
                    estatus: '',
                    sub_estatus: '',
                    position: '',
                    apply_amount: 0,
                    suggested_amount: 0,
                    approved_amount: 0,
                    id_activity_economic: 0,
                    previus_amount: 0,
                    // id_solicitud_prestamo: 0,
                    cicle: 0,
                    id_riesgo_pld: 0,
                    riesgo_pld: '',
                    id_cata_medio_desembolso: 2,
                    monto_garantia_financiable: 0,
                    insurance: {
                        id_insurance: 0,
                        id_individual: 0,
                        id_seguro: 0,
                        id_asignacion_seguro: 0,
                        fullname: '',
                        relationship: '',
                        porcentage: 100,
                        costo_seguro: 0,
                        incluye_saldo_deudor: 1,
                        activo: 1,
                    }
                }];
    }
    getDetailLoan(idLoan, idOffice) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const pool = yield mssql_1.default.connect(connSQL_1.sqlConfig);
                const result = yield pool.request()
                    .input('id_solicitud', mssql_1.default.Int, idLoan)
                    .input('id_oficina', mssql_1.default.Int, idOffice)
                    .execute('MOV_ObtenerSolicitudClienteServicioFinanciero_V2');
                return result.recordsets;
            }
            catch (error) {
                throw new Error(error);
            }
        });
    }
}
exports.LoanApp = LoanApp;
