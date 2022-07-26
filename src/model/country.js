const mongoose = require("mongoose");
const sql = require("mssql");
const { sqlConfig } = require("../db/connSQL");

const countrySchema = new mongoose.Schema({
    _id: { type: Number },
    etiqueta: {
        type: String,
        required: false,
    }

});

countrySchema.statics.updateFromHF = async(chunk) => {

    try {
        // make sure that any items are correctly URL encoded in the connection string
        await Country.deleteMany();

        sql.connect(sqlConfig, (err) => {
            const request = new sql.Request();
            request.stream = true;
            request.query(`select * from CATA_pais`);

            let rowData = [];

            request.on("row", (row) => {
                rowData.push({...row, _id: row.id });
                if (rowData.length >= chunk) {
                    request.pause();
                    Country.insertMany(rowData);
                    rowData = [];
                    request.resume();
                }
            });

            request.on("error", (err) => {
                console.log(err);
            });

            request.on("done", (result) => {

                Country.insertMany(rowData);
                rowData = [];
                request.resume();

                console.log('Done Country!!', result) 
            });
        });
    } catch (e) {
        console.log(e);
    }
}

const Country = mongoose.model("Country", countrySchema);
module.exports = Country;