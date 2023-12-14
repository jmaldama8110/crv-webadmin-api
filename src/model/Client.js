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
exports.Client = void 0;
const mssql_1 = __importDefault(require("mssql"));
const connSQL_1 = require("../db/connSQL");
const DocumentCollection_1 = require("./DocumentCollection");
class Client extends DocumentCollection_1.DocumentCollection {
    constructor(obj = {}) {
        super();
        this._id = obj._id || Date.now().toString(),
            this._rev = obj._rev,
            this._couchdb_type = 'CLIENT',
            this._id_cliente = obj.id_cliente;
        this._id_persona = obj.id_persona;
        this._name = obj.name,
            this._lastname = obj.lastname,
            this._second_lastname = obj.second_lastname,
            this._email = obj.email || '',
            this._created_by = obj.created_by || '',
            this._address = obj.address || [{}], // TODO
            this._branch = obj.branch || [],
            this._business_data = obj.business_data || { economic_activity: [], profession: [] },
            this._client_type = obj.client_type || [],
            this._coordinates = obj.coordinates || [];
        this._country_of_birth = obj.country_of_birth || [],
            this._curp = obj.curp,
            this._data_company = obj.data_company || [],
            this._data_efirma = obj.data_efirma || [],
            this._dob = obj.dob,
            this._education_level = obj.education_level || [],
            this._ife_details = obj.ife_details || [],
            this._clave_ine = obj.clave_ine, // ine_clave
            this._numero_vertical = obj.numero_vertical || '',
            this._numero_emisiones = obj.numero_emisiones || '',
            this._loan_cycle = obj.loan_cycle,
            this._marital_status = obj.marital_status || [],
            this._nationality = obj.nationality || [],
            this._ocupation = obj.ocupation || [],
            this._phones = obj.phones || [{}],
            this._identities = obj.identities || [],
            this._province_of_birth = obj.province_of_birth || [],
            this._rfc = obj.rfc,
            this._sex = obj.sex || [],
            this._status = obj.status || [],
            this._tributary_regime = obj.tributary_regime || [],
            this._comment = obj.comment || '',
            this._identity_pics = obj.identity_pics || [],
            this._comprobante_domicilio_pics = obj.comprobante_domicilio_pics || [],
            this._bis_address_same = obj.bis_address_same || false,
            this._rcc_last_query = obj.rcc_last_query || {},
            this._criminal_recordquery = obj.criminal_recordquery || {},
            this._identification_type = obj.identification_type || [],
            this._guarantors = obj.guarantors, // ref: Guarantor
            this._beneficiaries = obj.beneficiaries, // ref: Reference
            this._references = obj.references, // ref: Reference
            this._guarantee = obj.guarantee, // ref: Guarantee
            this._user_id = obj.user_id, // ref: User
            this._bankacc = obj.bankacc, // ref: Bankacc
            this._id_oficial = obj.id_oficial;
    }
    static findClientByExternalId(externalId) {
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
    ;
}
exports.Client = Client;