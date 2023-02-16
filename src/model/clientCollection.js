const DocumentCollection = require('./documentCollection');
const { sqlConfig } = require("../db/connSQL");
const sql = require("mssql");

class ClientCollection extends DocumentCollection {
    constructor(obj = {}) {
        super()
        this._id = obj._id || Date.now().toString(),
        this._rev = obj._rev,
        this._couchdb_type = 'CLIENT',
        this._id_cliente = obj.id_cliente
        this._id_persona = obj.id_persona
        this._name = obj.name,
        this._lastname = obj.lastname,
        this._second_lastname = obj.lastname,
        this._email = obj.email,
        this._curp = obj.curp,
        this._clave_ine = obj.clave_ine, // ine_clave
        this._ine_duplicates = obj.ine_duplicates,
        this._ine_doc_number = obj.ine_doc_number,
        this._dob = obj.dob,
        this._loan_cycle = obj.loan_cycle,
        this._branch = obj.branch || [],
        this._sex = obj.sex || [],
        this._education_level = obj.education_level || [],
        this._not_bis = obj.not_bis || false,
        this._bis_address_same = obj.bis_address_same || false,
        this._address = obj.address || [{}],
        this._phones = obj.phones || [{}],
        this._tributary_regime = obj.tributary_regime || [],
        this._rfc = obj.rfc,
        this._rcc_last_query = obj.rcc_last_query || {},
        this._criminal_recordquery = obj.criminal_recordquery || {},
        this._nationality = obj.nationality || [],
        this._province_of_birth = obj.province_of_birth || [],
        this._country_of_birth = obj.country_of_birth || [],
        this._ocupation = obj.ocupation || [],
        this._marital_status = obj.marital_status|| [],
        this._identities = obj.identities || [],
        this._identification_type = obj.identification_type || [],
        this._business_data = obj.business_data|| {economic_activity: [],profession: []},
        this._guarantors = obj.guarantors, // ref: Guarantor
        this._beneficiaries = obj.beneficiaries, // ref: Reference
        this._references = obj.references, // ref: Reference
        this._guarantee = obj.guarantee, // ref: Guarantee
        this._user_id = obj.user_id, // ref: User
        this._bankacc = obj.bankacc, // ref: Bankacc
        this._id_oficial = obj.id_oficial,
        this._ife_details = obj.ife_details || [],
        this._data_company = obj.data_company|| [],
        this._data_efirma = obj.data_efirma || [],
        this._status = obj.status || [],
        this._coordinates = obj.coordinates || []
    }

    async findClientByExternalId(externalId) {
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

module.exports = ClientCollection;