const express = require('express');
const router = new express.Router();
const auth = require('../middleware/auth');
const Loan = require('../model/loan');
const Loans = require('../model/loan');

router.post('/approveLoan', auth, async(req, res) => {

    try{

        const _id = req.params.id;

        const loan = await Loan.findOne({_id});
        if(!loan){
            throw new Error('Not able to find any loans');
        }


        //Una vez encontrada la solicitud de prestamo en mongo procedemos a crear la solicitud en HF
        const data = {
            idUsuario: 0,
            idOficina: 1 //Dejar 1 para pruebas
        }

        const result1 = await Loan.createLoanFromHF(data)

        if(!result1[0].idSolicitud){
            throw new Error('Error when creating the loan application in the HF');
        }

        //Asignamos los datos requeridos  a la solicitud generada
        const data2 = {
            id_solicitud_prestamo: result1[0].idSolicitud,
            id_cliente: 365317,//Checar cómo vendrá el loan para obtener el idclientHF 
            etiqueta_opcion: "ALTA",
            tipo_baja: "",
            id_motivo: 0,
            uid: 0
        }
        const result2 = await Loan.assignClientLoanFromHF(data2);

        
        

        //TODO: Una vez autorizado el credito en el HF se debe cambiar el status en mongo y actualizar los datos que sean necesarios
   

    } catch(err){
        res.status(400).send(err)
    }

})


module.exports = router;