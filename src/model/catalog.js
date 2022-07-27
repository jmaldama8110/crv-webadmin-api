const mongoose = require('mongoose');
const sql = require ('mssql');
const {sqlConfig} = require('../db/connSQL');

const catalogSchema =  new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    id: { type: Number },
    codigo_estado: { type: String },
    codigo_municipio: { type: String },
    codigo_locallidad: { type: String },
    nombre_localidad: { type: String },
    codigo_postal: { type: String },
    id_ciudad_localidad: { type: Number },
    id_municipio: { type: Number },
    id_estado: { type: Number },
    id_pais: { type: Number },
    etiqueta: { type: String },
    codigo: { type: String },
    abreviatura: { type: String },
    descripcion: { type: String },
    eliminado: { type: String },
    tipo: { type: String }
});

catalogSchema.statics.updateCatalogFromHF = async(name, chunk) => {
    try{

        await Catalog.deleteMany({name});

        sql.connect(sqlConfig, (err) => {
            const request = new sql.Request();
            request.stream = true;//Activarlo al trabajar con varias filas

            request.query(`select * from ${name}`);

            let rowData = [];

            request.on('row', row => {
                // console.log(row);
                rowData.push({ name, ...row });
                if (rowData.length >= chunk) {
                    request.pause(); //Pausar la insercción
                    Catalog.insertMany(rowData);
                    rowData = [];

                    request.resume();//continuar la insercción
                }
            })

            request.on("error", (err) => {
                console.log(err);
            });

            request.on("done", (result) => {

                Catalog.insertMany(rowData);
                rowData = [];
                request.resume();

                console.log("Done Catalogs!!", result);
            });

        })

    } catch(e){
        console.log(e)
    }
}

const Catalog = mongoose.model('Catalog', catalogSchema);
module.exports = Catalog;
