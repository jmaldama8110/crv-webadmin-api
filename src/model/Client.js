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
    constructor(newDoc) {
        super();
        this._id = newDoc ? newDoc._id : Date.now().toString();
        this._rev = newDoc ? newDoc._rev : '';
        this.couchdb_type = 'CLIENT';
        this.address = newDoc ? newDoc.address : [];
        this.branch = newDoc ? newDoc.branch : [0, ''];
        this.business_data = newDoc ?
            newDoc.business_data :
            {
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
            this.client_type = newDoc ? newDoc.client_type : [0, ''];
        this.coordinates = newDoc ? newDoc.coordinates : [0, 0];
        this.couchdb_type = newDoc ? newDoc.couchdb_type : "CLIENT";
        this.country_of_birth = newDoc ? newDoc.country_of_birth : ["", ""];
        this.curp = newDoc ? newDoc.curp : "";
        this.data_company = newDoc ? newDoc.data_company : [{}];
        this.data_efirma = newDoc ? newDoc.data_efirma : [{}];
        this.dob = newDoc ? newDoc.dob : '';
        this.education_level = newDoc ? newDoc.education_level : ["", ""];
        this.id_cliente = newDoc ? newDoc.id_cliente : 0;
        this.id_persona = newDoc ? newDoc.id_persona : 0;
        this.ife_details = newDoc ? newDoc.ife_details : [{}];
        this.clave_ine = newDoc ? newDoc.clave_ine : '';
        this.numero_vertical = newDoc ? newDoc.numero_vertical : '';
        this.numero_emisiones = newDoc ? newDoc.numero_emisiones : '';
        this.email = newDoc ? newDoc.email : '';
        this.lastname = newDoc ? newDoc.lastname : '';
        this.loan_cycle = newDoc ? newDoc.loan_cycle : 0;
        this.marital_status = newDoc ? newDoc.marital_status : [0, ''];
        this.name = newDoc ? newDoc.name : '';
        this.nationality = newDoc ? newDoc.nationality : [0, ""];
        this.phones = newDoc ? newDoc.phones : [];
        this.identities = newDoc ? newDoc.identities : [];
        this.province_of_birth = newDoc ? newDoc.province_of_birth : ["", ""];
        this.rfc = newDoc ? newDoc.rfc : '';
        this.second_lastname = newDoc ? newDoc.second_lastname : '';
        this.sex = newDoc ? newDoc.sex : [0, ""];
        this.status = newDoc ? newDoc.status : [0, ''];
        this.household_floor = newDoc ? newDoc.household_floor : false;
        this.household_roof = newDoc ? newDoc.household_roof : false;
        this.household_toilet = newDoc ? newDoc.household_toilet : false;
        this.household_latrine = newDoc ? newDoc.household_latrine : false;
        this.household_brick = newDoc ? newDoc.household_brick : false;
        this.economic_dependants = newDoc ? newDoc.economic_dependants : '0';
        this.internet_access = newDoc ? newDoc.internet_access : false;
        this.prefered_social = newDoc ? newDoc.prefered_social : [0, ""];
        this.rol_hogar = newDoc ? newDoc.rol_hogar : [0, ""];
        this.user_social = newDoc ? newDoc.user_social : '';
        this.has_disable = newDoc ? newDoc.has_disable : false;
        this.speaks_dialect = newDoc ? newDoc.speaks_dialect : false;
        this.has_improved_income = newDoc ? newDoc.has_improved_income : false;
        this.spld = newDoc ? newDoc.spld : {
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
            this.comment = newDoc ? newDoc.comment : '';
        this.identity_pics = newDoc ? newDoc.identity_pics : [];
        this.identity_verification = newDoc ? newDoc.identity_verification : {
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
            this.comprobante_domicilio_pics = newDoc ? newDoc.comprobante_domicilio_pics : [];
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
