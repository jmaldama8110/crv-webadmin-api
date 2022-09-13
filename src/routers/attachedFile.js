const express = require('express');
const router = new express.Router();
const auth = require('../middleware/auth');
const pdfFile = require ('../model/attachedFile');

router.post('/attachedFiles', async(req, res) => {
    try{

        const data = req.body;

        const registro = new pdfFile({...data});
        res.status(201).send(registro);

    } catch(e) {
        res.send(e.message)
    }
});

router.get('/attachedFiles', async(req, res) => {

    const match = {};
    
    try{

        if(req.query.id){
            match._id = req.query.id;
        }

        const attachedsFiles = await pdfFile(match);
        if(!attachedsFiles || attachedsFiles.length === 0){
            throw new Error("Not able to find the client");
        }

        res.status(200).send(attachedsFiles);

    } catch(e) {
        res.send(e.message)
    }
});

router.patch('/attachedFiles', async(req, res) => {
    try{

    } catch(e) {
        res.send(e.message)
    }
});

module.exports = router;