import sql from 'mssql';
import { sqlConfig } from '../db/connSQL';

export class Client extends DocumentCollection {
    _id_cliente: any
    _id_persona: any
    _name: any
    _lastname: any
    _second_lastname: any
    _email: any
    _created_by: any
    _address: any
    _branch: any
    _business_data: any
    _client_type: any
    _coordinates: any
    _country_of_birth: any
    _curp: any
    _data_company: any
    _data_efirma: any
    _dob: any
    _education_level: any
    _ife_details: any
    _clave_ine: any
    _numero_vertical: any
    _numero_emisiones: any
    _loan_cycle: any
    _marital_status: any
    _nationality: any
    _ocupation: any
    _phones: any
    _identities: any
    _province_of_birth: any
    _rfc: any
    _sex: any
    _status: any
    _tributary_regime: any
    _comment: any
    _identity_pics: any
    _comprobante_domicilio_pics: any
    _bis_address_same: any
    _rcc_last_query: any
    _criminal_recordquery: any
    _identification_type: any
    _guarantors: any
    _beneficiaries: any
    _references: any
    _guarantee: any
    _user_id: any
    _bankacc: any
    _id_oficial: any

    constructor(obj = {} as any) {
        super()
        this._id = obj._id || Date.now().toString(),
        this._rev = obj._rev,
        this._couchdb_type = 'CLIENT',
        this._id_cliente = obj.id_cliente
        this._id_persona = obj.id_persona
        this._name = obj.name,
        this._lastname = obj.lastname,
        this._second_lastname = obj.second_lastname,
        this._email = obj.email || '',
            this._created_by = obj.created_by || '',
        this._address = obj.address || [{}], // TODO
        this._branch = obj.branch || [],
        this._business_data = obj.business_data|| {economic_activity: [],profession: []},
            this._client_type = obj.client_type || [],
            this._coordinates = obj.coordinates || []
            this._country_of_birth = obj.country_of_birth || [],
            this._curp = obj.curp,
            this._data_company = obj.data_company|| [],
            this._data_efirma = obj.data_efirma || [],
            this._dob = obj.dob,
            this._education_level = obj.education_level || [],
            this._ife_details = obj.ife_details || [],
            this._clave_ine = obj.clave_ine, // ine_clave
            this._numero_vertical = obj.numero_vertical || '',
            this._numero_emisiones = obj.numero_emisiones || '',
            this._loan_cycle = obj.loan_cycle,
            this._marital_status = obj.marital_status|| [],
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
        this._id_oficial = obj.id_oficial
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