const mongoose = require('mongoose');
const { sqlConfig } = require("../db/connSQL");
const sql = require("mssql");

const paymentIntermediareSchema = new mongoose.Schema({
    logo: {type: String, trim:true},
    name: {type: String, trim:true, required: true},
    type: {type: Number},
    contain_barcode: {type: Boolean, default:true},
    barcode_length: {type: Number},
    associates: [],
    external_id: { type: Number },
    enabled: {type: Boolean, default:false},
    description: { type: String },
    short_description: { type:String },
}, { timestamps: true});

paymentIntermediareSchema.statics.getIntermediarios = async() =>{
    try{

        const pool = await sql.connect(sqlConfig);

        const result = await pool.request()
        .query(`select * from CATA_Intermediario WHERE estatus_registro = 'ACTIVO'`);

        return result.recordset;

    } catch(err){
        return err;
    }
}

const PaymentIntermediare = mongoose.model('PaymentIntermediare', paymentIntermediareSchema);
module.exports = PaymentIntermediare;

