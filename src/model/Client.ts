import sql from 'mssql';
import { sqlConfig } from '../db/connSQL';
import { DocumentCollection } from './DocumentCollection';

interface DocumentIdProperties { 
    age: string;
    voter_key: string;
    nationality: string;          
    expiration_date: string;
    doc_number: string;
    folio_number: string;
    dob: string;
    ocr_number: string;
    sex: string;
    lastname: string;
    second_lastname: string;
    name: string;
    duplicates: string;
    curp: string;
    street_address: string;
    suburb_address: string;
  }
  

export class Client extends DocumentCollection {
    name: string;
    lastname: string;
    second_lastname: string;
    phones: any[];
    identities: any [];
    curp: string;
    dob: string;
    sex: [number, string];
    province_of_birth: [string, string];
    branch: [number, string];
    address: any[];
    business_data: {
      bis_location: [number, string];  // new
      economic_activity: [string, string];
      profession: [string, string];
      ocupation: [string, string];
      business_start_date: string;
      business_name: string;
      business_owned: boolean;
      business_phone: string;
      number_employees: string;
      loan_destination: [number,string];
      income_sales_total: number;
      income_partner: number;
      income_job: number;
      income_remittances: number;
      income_other: number;
      income_total: number;
      expense_family: number;
      expense_rent: number;
      expense_business: number;
      expense_debt: number;
      expense_credit_cards: number;
      expense_total: number;
      keeps_accounting_records: boolean;
      has_previous_experience: boolean;
      previous_loan_experience: string;
      bis_season_type: string;
      bis_quality_sales_monthly: {
        month_sale_jan: string;
        month_sale_feb: string;
        month_sale_mar: string;
        month_sale_apr: string;
        month_sale_may: string;
        month_sale_jun: string;
        month_sale_jul: string;
        month_sale_aug: string;
        month_sale_sep: string;
        month_sale_oct: string;
        month_sale_nov: string;
        month_sale_dic: string;
      }

    };
    client_type: [number, string];
    country_of_birth: [string, string];
    coordinates: [number, number];
    couchdb_type: "CLIENT";
    data_company: [any];
    data_efirma: [any];
    education_level: [string, string];
    email: string;
    id_cliente: number;
    id_persona: number;
    ife_details: [any];
    clave_ine: string;
    numero_vertical: string;
    numero_emisiones: string;
    loan_cycle: number;
    marital_status: [number, string];
    nationality: [number, string];
    rfc: string;
    status: [number, string];
    household_floor: boolean;
    household_roof: boolean;
    household_toilet: boolean;
    household_latrine: boolean;
    household_brick: boolean;
    economic_dependants: string;
    internet_access: boolean;

    prefered_social: [number,string]; // new
    user_social: string;
    rol_hogar: [number, string];  // new
    has_disable: boolean;
    speaks_dialect: boolean;
    has_improved_income: boolean;
  
    spld: {  // new
      desempenia_funcion_publica_cargo: string,
      desempenia_funcion_publica_dependencia: string,
      familiar_desempenia_funcion_publica_cargo: string,
      familiar_desempenia_funcion_publica_dependencia: string,
      familiar_desempenia_funcion_publica_nombre: string,
      familiar_desempenia_funcion_publica_paterno: string,
      familiar_desempenia_funcion_publica_materno: string,
      familiar_desempenia_funcion_publica_parentesco: string,
      instrumento_monetario: [number, string],
    }
  
    comment: string;
    identity_pics: any[];
    
    identity_verification: {
      uuid: string;
      status: "sent" | "pending";
      result: "ok" | "waiting" | "fail";
      created_at: string;
      updated_at: string;
      documentData: DocumentIdProperties;
    };
    comprobante_domicilio_pics: any[];

    constructor( newDoc?: Client  ) {

        super();
        this.address =  newDoc!.address
        this.branch = newDoc!.branch
        this.business_data = newDoc!.business_data;
        this.client_type = newDoc!.client_type
        this.coordinates = newDoc!.coordinates
        this.couchdb_type = newDoc!.couchdb_type
        this.country_of_birth = newDoc!.country_of_birth
        this.curp = newDoc!.curp
        this.data_company = newDoc!.data_company
        this.data_efirma = newDoc!.data_efirma
        this.dob = newDoc!.dob
        this.education_level = newDoc!.education_level
        this.id_cliente = newDoc!.id_cliente
        this.id_persona = newDoc!.id_persona
        this.ife_details = newDoc!.ife_details
        this.clave_ine = newDoc!.clave_ine
        this.numero_vertical = newDoc!.numero_vertical
        this.numero_emisiones = newDoc!.numero_emisiones
        this.email = newDoc!.email
        this.lastname = newDoc!.lastname
        this.loan_cycle = newDoc!.loan_cycle
        this.marital_status = newDoc!.marital_status
        this.name = newDoc!.name
        this.nationality = newDoc!.nationality
        this.phones = newDoc!.phones
        this.identities = newDoc!.identities
        this.province_of_birth = newDoc!.province_of_birth
        this.rfc = newDoc!.rfc
        this.second_lastname = newDoc!.second_lastname
        this.sex = newDoc!.sex
        this.status = newDoc!.status
        
        this.household_floor = newDoc!.household_floor
        this.household_roof = newDoc!.household_floor
        this.household_toilet = newDoc!.household_toilet
        this.household_latrine = newDoc!.household_latrine
        this.household_brick = newDoc!.household_brick
        this.economic_dependants = newDoc!.economic_dependants
        this.internet_access = newDoc!.internet_access
        this.prefered_social = newDoc!.prefered_social
        this.rol_hogar = newDoc!.rol_hogar
        this.user_social = newDoc!.user_social
        this.has_disable = newDoc!.has_disable
        this.speaks_dialect = newDoc!.speaks_dialect
        this.has_improved_income = newDoc!.has_improved_income
        this.spld = newDoc!.spld
        this.comment = newDoc!.comment
        this.identity_pics = newDoc!.identity_pics
        this.identity_verification = newDoc!.identity_verification
        this.comprobante_domicilio_pics = newDoc!.comprobante_domicilio_pics

    }

    static async findClientByExternalId(externalId:string) {
        try {

            let pool = await sql.connect(sqlConfig);
            let result = await pool
                .request()
                .input("idCliente", sql.Int, externalId)
                .execute("MOV_ObtenerDatosPersona");
            return result;
        } catch (err) {
            console.log(err)
            return err;
        }
    };
}