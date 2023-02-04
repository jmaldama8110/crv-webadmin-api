const DocumentCollection = require('./documentCollection');
const { sqlConfig } = require("../db/connSQL");
const sql = require("mssql");
const tbl = require('../utils/TablesSQL');

class LoanAppGroupCollection extends DocumentCollection {
    constructor(obj = {}) {
        super()
        this._id = obj._id || Date.now().toString(),
            this._rev = obj._rev,
            this._couchdb_type = 'LOANAPP_GROUP',
            this._name = obj.name,
            this._data = obj.data
    }


}

module.exports = LoanAppGroupCollection;