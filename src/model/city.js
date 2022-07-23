const mongoose = require("mongoose");
const sql = require("mssql");
const { sqlConfig } = require("../db/connSQL");

const citySchema = new mongoose.Schema({
    _id: { type: Number },
    etiqueta: {
        type: String,
        required: false,
    },
    municipio: { type: Number, ref: 'Municipality' },
});


citySchema.statics.updateFromHF = async(chunk) => {
    try {
        // make sure that any items are correctly URL encoded in the connection string
        await City.deleteMany();

        sql.connect(sqlConfig, (err) => {
            const request = new sql.Request();
            request.stream = true;
            request.query(`select * from CATA_ciudad_localidad`);

            let rowData = [];

            request.on("row", (row) => {
                // console.log(row);
                rowData.push({...row, _id: row.id, municipio: row.id_municipio });
                if (rowData.length >= chunk) {
                    request.pause();
                    City.insertMany(rowData);
                    rowData = [];
                    request.resume();
                }
            });

            request.on("error", (err) => {
                console.log(err);
            });

            request.on("done", (result) => {

                City.insertMany(rowData);
                rowData = [];
                request.resume();

                console.log('Done City!!', result) 

            });
        });
    } catch (e) {
        console.log(e);
    }
}

const City = mongoose.model("City", citySchema);
module.exports = City;