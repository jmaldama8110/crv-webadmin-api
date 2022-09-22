const express = require('express');
const router =  new express.Router();
const auth = require('../middleware/auth');
const Contract = require('../model/contract');

router.post('/contracts', auth, async(req, res) => {
    try{

        const data = req.body;

        const contract = new Contract({...data});
        await contract.save();

        res.status(201).send(contract);

    } catch(err){
        res.send(err.message);
    }
});

router.get('/contracts', auth, async(req, res) => {
    try{

    } catch(err){
        res.send(err.message);
    }
});

router.patch('/contracts', auth, async(req, res) => {
    try{

    } catch(err){
        res.send(err.message);
    }
});

router.delete('/contracts', auth, async(req, res) => {
    try{

    } catch(err){
        res.send(err.message);
    }
});

module.exports = router;