const mongoose = require('mongoose');
const sql = require("mssql");
const {sqlConfig} = require("../db/connSQL");
const Employee = require("./employee");

const branchSchema = new mongoose.Schema({
    _id: {type: Number, trim : true},
    nombre: {type: String, trim : true},
    id_zona: {type: Number, trim : true},
    id_estado: {type: Number, trim : true, ref: 'Province'},
    codigo: {type: String, trim : true},
    id_tipo_oficina: {type: Number, trim : true},
    estatus: {type: String, trim : true}
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
            request.stream = true;//Activarlo al trabajar con varias filas

            request.query(`select * from CORP_OficinasFinancieras`);

            let rowData = [];
            let rowData2 = [];

            request.on('row', async(row) => {

                rowData.push({ ...row, _id: row.id });
                if (rowData.length >= chunk) {
                    request.pause(); //Pausar la insercción
                    
                    //Guardamos sólo las oficinas que tengan oficiales
                    for(let i = 0; i < rowData.length; i ++){
                        const validate = await Employee.getOficialCredito(rowData[i]._id);
                        
                        if(validate.length != 0){
                            rowData2.push(rowData[i])
                        }
                    }
    
                    Branch.insertMany(rowData2);
                    rowData = [];
                    rowData2 = [];

                    request.resume();//continuar la insercción
                }

            })

            request.on("error", (err) => {
                console.log(err);
            });

            request.on("done", async(result) => {
                //Guardamos sólo las oficinas que tengan oficiales
                for(let i = 0; i < rowData.length; i ++){
                    const validate = await Employee.getOficialCredito(rowData[i]._id);
                    
                    if(validate.length != 0){
                        rowData2.push(rowData[i])
                    }
                }

                console.log('insertar', rowData2.length);

                Branch.insertMany(rowData2);
                rowData = [];
                rowData2 = [];

                // request.resume();
                console.log('Done Branch!!');
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

const Branch = mongoose.model('Branch', branchSchema);
module.exports = Branch;
