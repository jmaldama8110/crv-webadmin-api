const express = require ('express');
const router = new express.Router();
const auth = require('../middleware/auth')
const PaymentIntermediare = require('../model/paymentIntermediarie'); //


router.get('/paymentIntermediareHF',auth, async(req, res) => {
    try{
        const result = await PaymentIntermediare.getIntermediarios();
        res.status(200).send(result)

    } catch(e){
        res.status(400).send(e)
    }
});

router.get('/syncPaymentIntermediareHF',auth, async(req, res) => {
    try{
        const result = await PaymentIntermediare.getIntermediarios();
        if(!result || result.length === 0){
            throw new Error('Could not get results');
        }
        const finalResult = [];

        await PaymentIntermediare.deleteMany();

        for(let i = 0; i < result.length; i++) {
            const data = result[i];
            finalResult.push({
                name: data.nombre,
                type: data.id_tipo,
                contain_barcode: data.contiene_codigo_barras,
                barcode_length: data.longitud_codigo_barras,
                associates: [],
                external_id: data.id,
                enabled: false
            });
        }

        await PaymentIntermediare.insertMany(finalResult);
        res.status(200).send('Done!!');

    } catch(e){
        res.status(400).send(e)
    }
});

router.post('/paymentIntermediare',auth, async(req, res) => {
    try{

        const data = req.body;

        const intermediarie = new PaymentIntermediare(data);
        await intermediarie.save();

        res.status(201).send(intermediarie);

    } catch(e){
        res.status(400).send(e.message);
    }
});

router.get('/paymentIntermediare',auth, async(req, res) => {
    try{
        const match = {};

        if(req.query.id){
            match._id = req.query.id
        }

        const result = await PaymentIntermediare.find(match);
        if(!result || result.length === 0){
            throw new Error('No records found');
        }
        res.status(200).send(result)

    } catch(e){
        res.status(400).send(e)
    }
});

router.patch('/paymentIntermediaries/:id', auth, async(req, res) => {
    try{
        const _id = req.params.id;
        const data = req.body;
        const actualizaciones =Object.keys(req.body);

        const intermediarie = await PaymentIntermediare.findOne({_id});
        actualizaciones.forEach((valor) => (intermediarie[valor] = data[valor]));
        await intermediarie.save();
        
        res.status(200).send(intermediarie);

    } catch(err){
        console.log(e)
        res.status(400).send(e + '')
    }
});

module.exports = router;