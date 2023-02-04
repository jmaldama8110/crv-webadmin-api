const DocumentCollection = require('./documentCollection');
const connCouch = require("./../db/connCouch");
const validador = require('validator')
const { sqlConfig } = require("../db/connSQL");
const sql = require("mssql");

class EmployeeCollection extends DocumentCollection {
    constructor(obj = {}) {
        super()
        this._id = obj._id || Date.now().toString(),
        this._rev = obj._rev,
        this._couchdb_type = 'EMPLOYEE',
        this._name = obj.name,
        this._lastname = obj.lastname,
        this._second_lastname = obj.second_lastname,
        this._email = obj.email,
        this._phone = obj.phone,
        this._dob = obj.dob,
        this._hierarchy_id = obj.hierarchy_id,
        this._role = obj.role || [],
        this._user_id = obj.user_id,
        this._workstation = obj.workstation,
        this._is_committee = obj.is_committee
    }

    // async getAllEmployees() {
    //     try {
    //         const db = connCouch.use(process.env.COUCHDB_NAME);
    //         let selector = { couchdb_type: { "$eq": this._couchdb_type } }

    //         for (const [key, value] of Object.entries(data)) {
    //             selector = Object.assign(selector, { [key]: { "$eq": value } })
    //         }
    //         const allEmployess = await db.find({ selector });

    //         return allEmployess.docs
    //     } catch (error) {
    //         throw new Error(error)
    //     }
    // }

    async getAllEmployees(id) {
        try {
            let pool = await sql.connect(sqlConfig);
            let result = await pool
                .request()
                .execute("MOV_ObtenerDatosDelPersonal");
            return result;
            // console.log(result)
        } catch (err) {
            console.log(err)
            return err;
        }
    };

    async getAllOfficial(chunk) {
        try {

            let pool = await sql.connect(sqlConfig);
            let result = await pool
                .request()
                .execute("MOV_ObtenerTodosOficialesFinancieros");
            return result.recordset;

        } catch (err) {
            console.log(err)
            return err;
        }
    }
}

module.exports = EmployeeCollection;