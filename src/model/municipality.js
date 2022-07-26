const mongoose = require("mongoose");
const sql = require("mssql");
const {sqlConfig} = require("../db/connSQL");

const municipalitySchema = new mongoose.Schema({
  _id: { type: Number },
  etiqueta: {
    type: String,
    required: false,
  },
  estado: { type: Number, ref: 'Province' }
});

municipalitySchema.statics.updateFromHF = async (chunk) => {
  try {
    // make sure that any items are correctly URL encoded in the connection string
    await Municipality.deleteMany();

    sql.connect(sqlConfig, (err) => {
      const request = new sql.Request();
      request.stream = true;
      request.query(`select * from CATA_municipio`);

      let rowData = []; 

      request.on("row", (row) => {
        rowData.push({...row, _id: row.id, estado: row.id_estado});
        if (rowData.length >= chunk) {
            request.pause();
            Municipality.insertMany(rowData);
            rowData = [];
            request.resume();
          }
        });

      request.on("error", (err) => {
        console.log(err);
      });

      request.on("done", (result) => {

        Municipality.insertMany(rowData);
        rowData = [];
        request.resume();

        console.log('Done Municipality!!', result) 
      });
    });
  } catch (e) {
    console.log(e);
  }
}

const Municipality = mongoose.model("Municipality", municipalitySchema);
module.exports = Municipality;
