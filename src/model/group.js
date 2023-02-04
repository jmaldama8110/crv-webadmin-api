const mongoose = require('mongoose');
const sql = require("mssql");
const { sqlConfig } = require("../db/connSQL");


const groupSchema = new mongoose.Schema({
    nombre: { type: String, trim : true },
    loan_cycle: { type: Number, required: true }
});

groupSchema.methods.toJSON = function(){
    const obj = this;

    const pub = obj.toObject();
    delete pub.__v;

    return pub;
}


groupSchema.statics.searchGroupLoanByName = async(groupName, branchId) => {
    try {
        const pool = await sql.connect(sqlConfig);
        const result = await pool.request()
            .input('nombre_cliente', sql.VarChar, groupName)
            .input('id_oficina', sql.Int, branchId)
            .input('pagina', sql.Int, 1)
            .input('registros_pagina', sql.Int, 50)
            .execute('CLIE_ObtenerClientesYSolicitudesPorOficina');
        const newRes = result.recordset.map( i =>({ 
                                            idCliente: i.idCliente,
                                            nombreCliente: i.nombreCliente,
                                            idSolicitud: i.idSolicitud,
                                            estatus: i.estatus.trim(),
                                            sub_estatus: i.sub_estatus.trim(),
                                            idTipoCliente: i.idTipoCliente,
                                            TipoCliente: i.TipoCliente
                                        }))

        return newRes;

    } catch (err) {
        throw new Error(err);
    }
}

groupSchema.statics.getLoanApplicationById = async ( loanAppId, branchId ) => {
    try{    
        const pool = await sql.connect(sqlConfig);
        const result = await pool.request()
            .input('id_solicitud', sql.Int, loanAppId)
            .input('id_oficina', sql.Int, branchId)
            .execute('CLIE_ObtenerSolicitudClienteServicioFinanciero_V2');


        return result.recordsets;

    }
    catch(err){
        throw new Error(err)
    }
}

const Group = mongoose.model('Group', groupSchema);
module.exports = Group;
