const express = require('express');
const router = new express.Router();
const auth = require('../middleware/auth');
const Loan = require('../model/loanapp');
const User = require('../model/user');
const Client = require('../model/client');
const Product = require('../model/product');

router.get('/loans', auth, async(req, res) =>{
    try{

        const match = {}

        if(req.query.id){
            match._id = req.query.id
        }

        const loans = await Loan.find(match);
        if(!loans){
            throw new Error('Not able to find any loan');
        }

        for(let i = 0; i < loans.length; i++){
            await loans[i].populate('product', {product_name:1}).execPopulate();
            const applyBy = await loans[i].populate('apply_by', {client_id: 1, name:1, lastname:1, second_lastname:1}).execPopulate();
            await applyBy.apply_by.populate('client_id',{branch: 1, _id: 0}).execPopulate();
        }

        res.status(200).send(loans);

    } catch(e){
        console.log(e)
        res.status(400).send(e)
    }
});

router.get("/statusLoans/:status", auth, async(req, res) =>{

    try{
        const status = req.params.status;
 
         const valid = validStatus(status);
         if(!valid) {
             throw new Error("The status does not match any of the accepted statuses");
         }
 
        const loans = await Loan.find({ status: { $in : [status] } });
        if(!loans || loans.length === 0){
            throw new Error("No records with this status");
        }

        for(let i = 0; i < loans.length; i++){
            await loans[i].populate('product', {product_name:1}).execPopulate();
            const applyBy = await loans[i].populate('apply_by', {client_id: 1, name:1, lastname:1, second_lastname:1}).execPopulate();
            // await applyBy.apply_by.populate('client_id').execPopulate();
        }

        res.status(200).send(loans);
 
    } catch(e) {
     //    console.log(e)
        res.status(400).send(e + '');
    }
 })

router.post('/prueba/:value', async(req, res)=> {
    try{
        const value = req.params.value;

        console.log(value);
    }
    catch(e){
        console.log(e)
    }
})

router.post('/sendLoantoHF/:id', auth, async(req, res) => {

    try{
        const _id = req.params.id;
        const data = req.body;
        console.log(data);

        const loan = await Loan.findOne({_id});
        if(!loan){
            throw new Error('Not able to find any loan');
        }
        if(loan.status[1] === "ListoparaTramite"){
            throw new Error("This loan is ready for processing...");
        }

        //Buscamos el usuario que hizo la solicitud
        const client = await User.findOne({_id: loan.apply_by}).populate('client_id',{branch:1, id_cliente:1, id_persona:1});
        const client_id = client.client_id.id_cliente;
        const person_id = client.client_id.id_persona;
        const official_id = data.id_oficial;
        const branch_id = client.client_id.branch[0];
        //Buscamos el producto que solicitó
        const product = await Product.findOne({_id: loan.product});
        const product_id = product.external_id;

        //Una vez encontrada la solicitud, procedemos a crear la solicitud en HF
        const data1 = {
            idUsuario: 0,
            idOficina: branch_id != undefined ? branch_id : 1 //Dejar 1 para pruebas, esta debe ser la oficina del cliente
        }

        const result1 = await Loan.createLoanFromHF(data1)
        if(!result1[0].idSolicitud){
            throw new Error('Failed to create loan in HF');
        }

        //Asignamos los datos requeridos  a la solicitud generada
        const id_soli = result1[0].idSolicitud;
        // const id_soli = '1234';

        const data2 = {
            id_solicitud_prestamo: id_soli,
            id_cliente: client_id, 
            etiqueta_opcion: "ALTA",
            tipo_baja: "",
            id_motivo: 0,
            uid: 0
        }
        const result2 = await Loan.assignClientLoanFromHF(data2);
        if(!result2) {
            throw new Error('Failed to assign client to loan')
        }

        //Una vez asignado el cliente al loan del HF, procedemos a asignar el monto a la solicitud
        const data3 = {
            SOLICITUD: [
                {
                    id: id_soli,
                    id_oficial: official_id != undefined ? official_id : 346928,
                    id_disposicion: 26,
                    monto_solicitado: loan.apply_amount,
                    monto_autorizado: data.approved_amount,
                    periodicidad: loan.frequency ? validateFrecuency(loan.frequency[0]) : product.allowed_frequency[0].value,
                    plazo: loan.term ? loan.term : product.min_term,
                    fecha_primer_pago: "2022-07-20",
                    fecha_entrega: "2022-07-20",
                    medio_desembolso: "ORP",
                    garantia_liquida: product.liquid_guarantee,
                    id_oficina: branch_id != undefined ? branch_id : 1,
                    garantia_liquida_financiable: product.GL_financeable === false ? 0 : 1,
                    id_producto_maestro: product_id,
                    tasa_anual: 18.75 //Checar cómo calcular esto
                }
            ],
            CLIENTE: [
                {
                    id: client_id,
                    id_persona: person_id,
                    tipo_cliente: 2,//INDIVIDUAL
                    ciclo: 0
                }
            ],
            SEGURO: [
                {
                    id: 0,
                    id_seguro_asignacion: 55,
                    nombre_beneficiario: "OMAR MELENDEZ",
                    parentesco: "CONOCIDO",
                    porcentaje: 100.00,
                    costo_seguro: 624.00,
                    incluye_saldo_deudor: 1
                }
            ],
            REFERENCIA: []
        }
        const result3 = await await Loan.assignMontoloanHF(data3);
        if(!result3){
            throw new Error('Failed to assign the amount in the HF')
        }

        //Una vez asignado el monto actualizamos campos del crédito
        const resp = await Loan.updateOne({_id},{ 
            $set:{
                approved_at: new Date(),
                approved_by: data.id != undefined ? data.id : user._id,
                approved_amount: data.approved_amount,
                status : [5, 'ListoparaTramite'],
                id_loan : id_soli,
                id_oficial: official_id
            }
        })

        const approveLoan = await Loan.findOne({_id});
        res.status(200).send(approveLoan);

    } catch(err){
        console.log(err)
        res.status(400).send(err + '')
    }

})

//Endpoints for HF
router.post('/loans/create', auth, async(req, res) => { //FUNCIONA
    try {
        const result = await Loan.createLoanFromHF(req.body)

        res.status(201).send(result)
    } catch (error) {
        console.log(error);
        res.status(400).send(error.message)
    }
})

router.post('/loans/assign_client', auth, async(req, res) => { // FUNCIONA
    try {
        const result = await Loan.assignClientLoanFromHF(req.body)

        res.status(201).send(result);
    } catch (error) {
        res.status(401).send(error + '')
    }
})

router.post('/loans/assign_monto', auth,async(req, res) => {
    try {

        const result = await Loan.assignMontoloanHF(req.body);

        res.status(201).send(result);
    } catch (error) {
        res.status(401).send(error.message)
    }
});

const validStatus = (status) => {

    const statusValid = ['Pendiente', 'Aprobado', 'Rechazado', 'Eliminado','ListoparaTramite'];
    const result = statusValid.includes(status);
    return result;
}

const validateFrecuency = (value) =>{
    if(value === "S"){
        return "Semanal"
    }
    if(value === "Q"){
        return "Quincenal"
    }
    if(value === "M"){
        return "Mensual"
    }
    return " ";
}


module.exports = router;