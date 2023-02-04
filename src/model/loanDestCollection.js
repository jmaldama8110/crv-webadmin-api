const DocumentCollection = require('./documentCollection');
const connCouch = require("./../db/connCouch");
const { sqlConfig } = require("../db/connSQL");
const sql = require("mssql");

class LoanDestColletion extends DocumentCollection {
    constructor(obj = {}) {
        super()
        this._id = obj.id,
        this._id_fondeador = obj.fondeador,
        this._descripcion = obj.descripcion,
        this._tipo = obj.tipo,
        this._couchdb_type = 'LOANDEST',
        this._name = obj.name
    }

    async updateFromHF(chunk) {
        try {
            const shortname = 'LOANDEST';
            // const name = CATA_destinoCredito;
            // make sure that any items are correctly URL encoded in the connection string
            const db = connCouch.use(process.env.COUCHDB_NAME);
            const docsDestroy = await db.find({ selector: { name: this._couchdb_type }, limit: 100000 });
            if(docsDestroy.docs.length > 0 ) {
                const docsEliminate = docsDestroy.docs.map(doc => {
                    const { _id, _rev } = doc;
                    return { _deleted: true, _id, _rev }
                })
                db.bulk({ docs: docsEliminate })
                .then((body) => {console.log('DELETE', this._couchdb_type)})
                .catch((error) => console.log(error));
            }
            // await Loandest.deleteMany();
    
            sql.connect(sqlConfig, (err) => {
                const request = new sql.Request();
                request.stream = true;
                request.query(`select * from CATA_destinoCredito`);
    
                let rowData = [];
    
                request.on("row", (row) => {
                    
                    rowData.push({
                        _id:`${shortname.toUpperCase()}|${(row.id).toString()}`,
                        couchdb_type: this._couchdb_type,
                        id_fondeador: row.id_fondeador,
                        tipo: row.tipo,
                        descripcion: row.descripcion
                    });
                    
                    if (rowData.length >= chunk) {
                        request.pause();
                        // Loandest.insertMany(rowData);
                        
                        db.bulk({ docs: rowData })
                            .then((body) => { })
                            .catch((error) => {throw new Error(error)});
                        rowData = [];
                        request.resume();
                    }
                });
    
                request.on("error", (err) => {
                    console.log(err);
                });
    
                request.on("done", (result) => {
                    // Loandest.insertMany(rowData);
                    
                    db.bulk({ docs: rowData })
                    .then((body) => { })
                    .catch((error) => {throw new Error(error)});
    
                    rowData = [];
                    request.resume();
                    console.log("Done!:", result);
                });
            });
        } catch (err) {
            console.log(err)
            throw new Error(err)
        }
    }
}

module.exports = LoanDestColletion;