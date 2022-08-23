const mongoose = require("mongoose");
const sql = require("mssql");
const {sqlConfig} = require("../db/connSQL");

const provinceSchema = new mongoose.Schema({
  _id: { type: Number },
  etiqueta: {
    type: String,
    required: false,
  },
  abreviatura: {type: String},
  pais: { type: Number, ref: 'Country' }
});

provinceSchema.statics.updateFromHF = async (chunk )=>{
  try {
    // make sure that any items are correctly URL encoded in the connection string
    await Province.deleteMany();

    sql.connect(sqlConfig, (err) => {
      const request = new sql.Request();
      request.stream = true;
      request.query(`select * from CATA_estado`);

      let rowData = []; 

      request.on("row", (row) => {
        rowData.push({...row, _id: row.id, pais: row.id_pais});
        if (rowData.length >= chunk) {
            request.pause();
            Province.insertMany(rowData);
            rowData = [];
            request.resume();
          }
        });

      request.on("error", (err) => {
        console.log(err);
      });

      request.on("done", (result) => {

        Province.insertMany(rowData);
        rowData = [];
        request.resume();

        console.log('Done Province!!', result) 
      });
    });
  } catch (e) {
    console.log(e);
  }
}

const Province = mongoose.model("Province", provinceSchema);
module.exports = Province;
