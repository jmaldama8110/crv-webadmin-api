const express = require('express');
const router = new express.Router();
const auth = require('../middleware/auth');
const Loan = require('../model/loanapp');
const User = require('../model/user');
const Client = require('../model/client');
const Product = require('../model/product');
const loanConstants = require('../constants/loanConstants');
const moment = require("moment");
const formato = 'YYYY-MM-DD';
const cron = require('node-cron');

cron.schedule('*/3 * * * *', async() => {
    try{

        const loans = await Loan.find();
        const loan = loans.filter(loan => loan.status[0] === 2);
        for(let i=0; i<loan.length; i++) {
            const id_loan = loan[i].id_loan;
            if(id_loan != undefined){
                const seguro = await Loan.getStatusGLByLoan(id_loan);
                loan[i]["seguro_detail"] = seguro;
                await loan[i].save();
            }
        }

        console.log('Updated loans status on', moment().format('MMMM Do YYYY, h:mm:ss a'));

    } catch(err) {
        console.log(err);
    }
});

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
            if(applyBy.apply_by != null){
                await applyBy.apply_by.populate('client_id',{branch: 1, id_cliente: 1, _id: 0}).execPopulate();
            }
        }

        res.status(200).send(loans);

    } catch(e){
        console.log(e)
        res.status(400).send(e)
    }
});

router.get('/statusLoans/:status', auth, async(req, res) =>{

    try{
        const status = req.params.status;
 
        const loans = await Loan.find({ status: { $in : [parseInt(status)] } });
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
});

router.get('/seguroProduct', async(req, res)=> {
    try{
        const idProduct = req.query.idProduct;
        if(!idProduct){
            throw new Error('Is required to provide the idProduct')
        }

        const seguro = await Loan.getSeguroProducto(idProduct);

        res.status(200).send(seguro);

    }
    catch(e){
        console.log(e);
        res.send(e + '');
    }
});

router.get('/disposition', async(req, res)=> {
    try{
        const idOffice = req.query.idOffice;
        if(!idOffice){
            throw new Error('Is required to provide the idOffice')
        }

        const disposition = await Loan.getDisposicionByOffice(idOffice);

        res.status(200).send(disposition);

    }
    catch(e){
        console.log(e);
        res.send(e + '');
    }
});

router.get('/loanDetail', auth, async(req, res) => {

    try{

        const idLoan = req.query.idLoan;
        if(!idLoan){
            throw new Error('Is required to provide the idLoan');
        }

        const detail = await Loan.getDetailLoan(idLoan, 1);
        if(detail[0].length === 0){
            throw new Error('No results found');
        }

        detail[0][0].fecha_primer_pago = getDates(detail[0][0].fecha_primer_pago);
        detail[0][0].fecha_entrega = getDates(detail[0][0].fecha_entrega);
        detail[0][0].fecha_creacion = getDates(detail[0][0].fecha_creacion);

        res.status(200).send(detail);

    } catch(e) {
        res.status(400).send(e + '');
    }

});

router.get('/toAuthorizeLoansHF', auth, async(req, res) =>{
    try{

        const idOffice = req.query.idOffice;
        if(!idOffice){
            throw new Error('idOffice must be provided');
        }

        const loans = await Loan.getLoanPorAutorizar(idOffice);

        res.status(200).send(loans);

    } catch(err) {
        res.status(400).send(err + '');
    }
});

router.post('/sendLoantoHF/:id/:action', auth, async(req, res) => {

    try{
        const _id = req.params.id;
        const data = req.body;
        const action = parseInt(req.params.action);
        let status = [2,"Listo para tramite", "Tramite"];
        
        if(action === 2){ //Por autorizar
            status = loanConstants.PorAut;
        }
        if(action === 3){ //Autorizado
            status = loanConstants.Autorizado;
        }
        

        const loan = await Loan.findOne({_id});
        if(!loan){
            throw new Error('Not able to find any loan');
        }
        if(action === 1 && loan.status[0] != 1){
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
            idOficina: branch_id != undefined ? branch_id : 1 
        }
        const result1 = await Loan.createLoanFromHF(data1)
        if(!result1[0].idSolicitud){
            throw new Error('Failed to create loan in HF');
        }

        // // Asignamos los datos requeridos  a la solicitud generada
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
        const disposition = await Loan.getDisposicionByOffice(branch_id)
        const seguro = await Loan.getSeguroProducto(product_id);
        const data3 = {
            SOLICITUD: [
                {
                    id: id_soli,
                    id_oficial: official_id != undefined ? official_id : 346928,
                    id_disposicion: disposition[0] ? disposition[0].IdDisposición : 26,
                    monto_solicitado: loan.apply_amount,
                    monto_autorizado: data.approved_amount,
                    periodicidad: loan.frequency ? validateFrecuency(loan.frequency[0]).toUpperCase() : product.allowed_frequency[0].value.toUpperCase(),
                    plazo: loan.term ? loan.term : product.min_term,
                    fecha_primer_pago: getDates(data.fecha_primer_pago),
                    fecha_entrega: getDates(data.fecha_entrega),
                    medio_desembolso: "ORP",//Orden De Pago
                    garantia_liquida: product.liquid_guarantee,
                    id_oficina: branch_id != undefined ? branch_id : 1,
                    garantia_liquida_financiable: product.GL_financeable === false ? 0 : 1,
                    id_producto: action === 1 ? 0 : loan.id_producto,
                    id_producto_maestro: product_id,
                    tasa_anual: 18.75, //Checar cómo calcular esto,
                    status,
                    creacion: getDates(loan.apply_at)
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
                    id_seguro_asignacion: seguro[0] ? seguro[0].id_seguro_asignacion : 55, 
                    nombre_beneficiario: "OMAR MELENDEZ",
                    parentesco: "CONOCIDO",
                    porcentaje: 100.00,
                    costo_seguro: 0.00,
                    incluye_saldo_deudor: seguro[0] ? seguro[0].incluye_saldo_deudor === true ? 1 : 0 : 1
                }
            ],
            REFERENCIA: []
        }
        const result3 = await await Loan.assignMontoloanHF(data3);
        if(!result3){
            throw new Error('Failed to assign the amount in the HF')
        }

        const detail = await Loan.getDetailLoan(id_soli, 1);
        const seguro2 = await Loan.getStatusGLByLoan(id_soli);

        // // Una vez asignado el monto actualizamos campos del crédito
        loan["approved_at"] = new Date();
        loan["approved_by"] = data.id != undefined ? data.id : req.user._id;
        loan["approved_amount"] = data.approved_amount;
        loan["status"] = status;
        loan["id_loan"] = id_soli;
        loan["id_oficial"] = official_id;
        loan["id_producto"] = detail[0][0].id_producto;
        loan["loan_detail"] = detail[5][0];
        loan["seguro_detail"] = seguro2;
        await loan.save();

        res.status(200).send(result3);
        // console.log(data1)
        // console.log(data2)
        // console.log(data3)
        // res.status(200).send({data1, data2, data3});

    } catch(err){
        console.log(err)
        res.status(400).send(err + '')
    }

});

// router.get('/cronUpdateLoans', auth, async (req, res) => {
//     try{

//         const loans = await Loan.find();
//         const loan = loans.filter(loan => loan.status[0] === 2);
//         for(let i=0; i<loan.length; i++) {
//             console.log('entra')
//             const id_loan = loan[i]._id;
//             console.log(id_loan);
//         }

//         res.send('updated');

//     } catch(err) {
//         res.status(400).send(err + '');
//     }
// })

router.post('/toAuthorizeLoanHF/:action/:id', auth, async(req, res) => {

    const _id = req.params.id;
    const action = parseInt(req.params.action);
    let status = [];

    try{
        
        const loan = await Loan.findOne({_id});
        if(!loan){
            throw new Error('Not able to find any loan');
        }

        if(action === 1){
            status = loanConstants.PorAut;
        }
        if(action === 2){
            status = loanConstants.Autorizado
        }
        const idLoan = loan.id_loan;
        console.log(status);

        const detail = await Loan.getDetailLoan(idLoan, 1);
        const seguro = await Loan.getStatusGLByLoan(idLoan);
        detail[0][0].fecha_primer_pago = getDates(detail[0][0].fecha_primer_pago);
        detail[0][0].fecha_entrega = getDates(detail[0][0].fecha_entrega);
        detail[0][0].fecha_creacion = getDates(detail[0][0].fecha_creacion);

        if(seguro.estatus === "FALTA G.L."){
            throw new Error("No se puede realizar la acción debido a que falta la garantía líquida")
        }

        const result = await Loan.toAuthorizeLoanHF(detail, seguro, status);
        const detail2 = await Loan.getDetailLoan(idLoan, 1);

        loan["status"] = status;
        loan["id_producto"] = detail2[0][0].id_producto;
        loan["loan_detail"] = detail2[5][0];
        loan["seguro_detail"] = seguro;
        await loan.save();

        res.status(200).send(result);

    }
    catch(err){
        res.status(400).send(err + '')
    }
});


router.get('/loanSeguroDetailHF', async(req, res)=> {
    try{
        const idLoan = req.query.idLoan;
        if(!idLoan){
            throw new Error('Is required to provide the idLoan')
        }

        const seguro = await Loan.getStatusGLByLoan(idLoan);

        res.status(200).send(seguro);

    }
    catch(e){
        console.log(e);
        res.send(e + '');
    }
});

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
        res.status(400).send(error + '')
    }
})

router.post('/loans/assign_monto', auth,async(req, res) => {
    try {

        const result = await Loan.assignMontoloanHF(req.body);

        res.status(201).send(result);
    } catch (error) {
        res.status(400).send(error.message)
    }
});

router.patch('/loans/:id', auth, async (req, res) => {
    try{
        const _id = req.params.id;
        const data = req.body;
        const updates = Object.keys(data);

        const loan = await Loan.findOne({_id});
        if(!loan){
            throw new Error('Not able to find loan');
        }

        updates.forEach((valor) => (loan[valor] =data[valor]))
        await loan.save();

        res.status(200).send(loan);

    } catch (error) {
        res.status(400).send(error + '')
    }
});

const getDates = (fecha) => {
    const date = moment.utc(fecha).format(formato)
    return date;
}

const validateFrecuency = (value) =>{
    if(value === "S"){
        return "SEMANAL"
    }
    if(value === "Q"){
        return "QUINCENAL"
    }
    if(value === "M"){
        return "MENSUAL"
    }
    return " ";
}


module.exports = router;