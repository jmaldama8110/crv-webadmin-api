const DocumentCollection = require('./documentCollection');
const { sqlConfig } = require("../db/connSQL");
const sql = require("mssql");
const tbl = require('../utils/TablesSQL');

class GroupCollection extends DocumentCollection {
    constructor(obj = {}) {
        super()
        this._id = obj._id || Date.now().toString(),
        this._rev = obj._rev,
        this._couchdb_type = 'GROUP',
        this._id_cliente = obj.id_cliente,
        this._group_name = obj.group_name,
        this._weekday_meet = obj.weekday_meet,
        this._hour_meet = obj.hour_meet,
        this._loan_officer = obj.loan_officer,
        this._loan_cycle = obj.loan_cycle,
        this._address = obj.address,
        this._created_by = obj.created_by,
        this._branch = obj.branch,
        this._status = obj.status,
        this._coordinates = obj.coordinates
    }

    /**
     *
     * @param {number} idGroup Id_cliente de HF
     * @returns {Array}
     */
    async getGroupById(idGroup) {
        try {
            const pool = await sql.connect(sqlConfig);

            const result = await pool.request()
                .input('id_grupo', sql.Int, idGroup)
                .execute('MOV_ObtenerGrupoByID')

            return result.recordset;
        }
        catch (error) {
            throw new Error(error)
        }
    }
}

module.exports = GroupCollection;