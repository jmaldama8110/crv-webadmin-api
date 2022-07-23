const mongoose = require("mongoose");
const sql = require("mssql");
const {sqlConfig} = require("../db/connSQL");

const neighborhoodSchema = new mongoose.Schema({
  _id: {type: Number},
  codigo_postal: { type: String },
  etiqueta: { type: String },
  ciudad_localidad: { type: Number, ref: "City" },
});


neighborhoodSchema.statics.updateFromHF = async (chunk) => {

  try {
    // make sure that any items are correctly URL encoded in the connection string
    await Neighborhood.deleteMany();

    sql.connect(sqlConfig, (err) => {
      const request = new sql.Request();
      request.stream = true;
      request.query(`select * from CATA_asentamiento`);

      let rowData = []; 

      request.on("row", (row) => {
        rowData.push({...row, _id: row.id, ciudad_localidad: row.id_ciudad_localidad });
        if (rowData.length >= chunk) {
            request.pause();
            Neighborhood.insertMany(rowData);
            rowData = [];
            request.resume();
          }
        });

      request.on("error", (err) => {
        console.log(err);
      });

      request.on("done", (result) => {

        Neighborhood.insertMany(rowData);
        request.resume();

        console.log('Done Neighborhood!!', result) 
      });
    });
  } catch (err) {
    console.log(err);
  }

}

const Neighborhood = mongoose.model("Neighborhood", neighborhoodSchema);

module.exports = Neighborhood;

