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
            this._name = obj.name,
            this._data = obj.data
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