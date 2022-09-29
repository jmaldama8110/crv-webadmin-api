const mongoose = require('mongoose');
const sql = require('mssql');
const { sqlConfig } = require("../db/connSQL");

const constractSchema = new mongoose.Schema({
    data_representative: [],
    data_client: [],
    documents: [],
    docusign_uri: { type: String, trim: true },
    status: { type: String, trim: true },
    client_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Client'},
    loan_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Loanapp' }
}, { timestamps: true });

constractSchema.statics.getIdContrato = async(id_loan) => {
    try{
        
        let pool = await sql.connect(sqlConfig);

        const result = await pool.request()
            .input('id_Solicitud', sql.Int, id_loan)
            .execute('MOV_GetIdContratoSolicitud')

        return result.recordset;

    } catch (err){
        console.log(err)
        return err;
    }
}

constractSchema.statics.getRepresentanteLegal = async(id_contrato) =>{
    try{

        let pool = await sql.connect(sqlConfig);

        let result = await pool.request()
            .input('id_contrato', sql.Int, id_contrato)
            .execute('MOV_getEmailRepresentanteLegal');
        
        return result.recordset; 
        
    } catch(e){
        return e;
    }
}

constractSchema.statics.getPoderNotarialByOfficeYFondo = async(idLoan, idOffice) => {
    try {
        const pool = await sql.connect(sqlConfig);

        const fondo = await pool.request()
            .input('idPrestamo', sql.Int, idLoan)
            .execute('DISB_GetFondoByPrestamo');

        const idFondeador = fondo.recordset[0].id;
        // console.log(idFondeador);

        const notarial = await pool.request()
            .input('idOficinaFinanciera', sql.Int, idOffice)
            .input('idFondeador', sql.Int, idFondeador)
            .input('idSesion', sql.Int, 0)
            .execute('OTOR_ObtenerPoderNotarialPorUsuarioOficinaYFondo');

        return notarial.recordset;
    } catch (err) {
        return err;
    }
}

const contract = mongoose.model('contract', constractSchema);
module.exports = contract;