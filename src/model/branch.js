const mongoose = require('mongoose');
const sql = require("mssql");
const {sqlConfig} = require("../db/connSQL");
// const extractor = require("../utils/extractor.js");

const branchSchema = new mongoose.Schema({
    _id: {type: Number, trim : true},
    nombre: {type: String, trim : true},
    alias: {type: String, trim : true},
    colonia: [],
    municipio: [],
    estado: [],
    pais: [],
    direccion: {type: String, trim : true},
    codigo_postal: {type: String, trim : true},
    enabled: {type: Boolean, default: false}
});

branchSchema.methods.toJSON = function(){
    const branch = this;

    const branchPublic = branch.toObject();
    delete branchPublic.__v;

    return branchPublic;
}

branchSchema.statics.getAllBranches = async(chunk) => {
    try{

        await Branch.deleteMany({});

        sql.connect(sqlConfig, (err) => {
            const request = new sql.Request();
            request.stream = true;

            request.query(`select * from CORP_OficinasFinancieras WHERE id_tipo_oficina = 1`);

            let rowData = [];

            request.on('row', async(row) => {

                rowData.push({ ...row, _id: row.id });
                if (rowData.length >= chunk) {
                    request.pause();
                    Branch.insertMany(rowData);

                    rowData = [];
                    request.resume();
                }

            })

            request.on("error", (err) => {
                console.log(err);
            });

            request.on("done", async(result) => {

                Branch.insertMany(rowData);
                rowData = [];

                request.resume();
                console.log('Done Branch!!', result);
            });

        })

    } catch(e){
        console.log(e)
        return e;
    }
}

branchSchema.statics.getOficialCredito = async(idOffice) => {
    try {
        const pool = await sql.connect(sqlConfig);
        const result = await pool.request()
            .input('id_sucursal', sql.Int, idOffice)
            .input('id_zona', sql.Int, 0)
            .input('id_coordinador', sql.Int, 0)
            .input('codigo', sql.VarChar, 'PROM')
            .input('operacion', sql.VarChar, 'CLIENTE')
            .input('id_sesion', sql.Int, 1)
            .execute('COMM_ObtenerPlantillaPuesto');
        
        return result.recordset;

    } catch (err) {
        throw new Error(err);
    }
}

branchSchema.statics.getAllBranchesHF = async(chunk) => {
    try{
        const request = new sql.Request();

        try {
            let pool = await sql.connect(sqlConfig);
            let result = await pool
                .request()
                .execute("MOV_ObtenerOficinasFinancieras");
            return result.recordset;
        } catch (err) {
            console.log(err)
            return err;
        }


    } catch(e){
        console.log(e)
        return e;
    }
}

const Branch = mongoose.model('Branch', branchSchema);
module.exports = Branch;
