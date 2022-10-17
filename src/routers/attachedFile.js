const express = require('express');
const router = new express.Router();
const auth = require('../middleware/auth');
const attachedFile = require ('../model/attachedFile');
const Loan = require('../model/loanapp');

router.post('/attachedFiles', auth, async(req, res) => {
    try{

        const data = req.body;

        const registro = new attachedFile({...data});
        const file = await registro.save();

        if(data.loan_id && req.query.order){
            console.log('es para el loan')
            
            const _id = data.loan_id;
            const loan = await Loan.findById({_id})

            const check = loan.general_checklist.find((checklist) => checklist.order === parseInt(req.query.order));
            check.id_file = file._id;

            await loan.save();
            // return res.send(check);

        }

        res.status(201).send(file);

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

        const file = await attachedFile.find(match);
        if(!file || file.length === 0){
            throw new Error("Not able to find any records");
        }

        for(let i = 0; i < file.length; i++) {

            if(file[i].client_id != undefined){
                await file[i].populate('client_id',{name:1, lastname: 1, second_lastname:1}).execPopulate();
            }
            if(file[i].loan_id != undefined){
                const f = await file[i].populate('loan_id',{product:1, apply_amount:1, apply_by:1}).execPopulate();
                const loan = f.loan_id;
                await loan.populate('product', {product_name:1}).execPopulate();
                const applyBy = await loan.populate('apply_by', {_id:1, client_id: 1}).execPopulate();
                if(applyBy.client_id !== undefined || applyBy.client_id !== null){
                    await applyBy.apply_by.populate('client_id', {name:1, lastname:1, second_lastname:1, id_persona: 1, id_cliente:1, branch: 1}).execPopulate();
                }
            }

        }

        res.status(200).send(file);

    } catch(e) {
        res.send(e.message)
    }
});

router.get('/attachedFiles/client/:client_id', async(req, res) => {

    const match = {};
    
    try{

        if(req.params.client_id){
            match.client_id = req.params.client_id;
        }

        const file = await attachedFile.find(match);
        if(!file || file.length === 0){
            throw new Error("Not able to find any file");
        }

        for(let i = 0; i < file.length; i++) {

            if(file[i].client_id != undefined){
                await file[i].populate('client_id',{name:1, lastname: 1, second_lastname:1}).execPopulate();
            }

        }

        res.status(200).send(file);

    } catch(e) {
        res.send(e.message)
    }
});

router.get('/attachedFiles/loan/:loan_id', async(req, res) => {

    const match = {};
    
    try{

        if(req.params.loan_id){
            match.loan_id = req.params.loan_id;
        }

        const file = await attachedFile.find(match);
        if(!file || file.length === 0){
            throw new Error("Not able to find any file");
        }

        for(let i = 0; i < file.length; i++) {

            if(file[i].loan_id != undefined){
                const f = await file[i].populate('loan_id',{product:1, apply_amount:1, apply_by:1}).execPopulate();
                const loan = f.loan_id;
                await loan.populate('product', {product_name:1}).execPopulate();
                const applyBy = await loan.populate('apply_by', {_id:1, client_id: 1}).execPopulate();
                if(applyBy.client_id !== undefined || applyBy.client_id !== null){
                    await applyBy.apply_by.populate('client_id', {name:1, lastname:1, second_lastname:1, id_persona: 1, id_cliente:1, branch: 1}).execPopulate();
                }
            }

        }

        res.status(200).send(file);

    } catch(e) {
        res.send(e.message)
    }
});

router.patch('/attachedFiles/:id', async(req, res) => {
    try{

        const _id = req.params.id;
        const data = req.body;
        const updates = Object.keys(data);

        const file = await attachedFile.findOne({_id});
        if(!file){
            throw new Error('No records found');
        }

        updates.forEach( (campo) => (file[campo] = data[campo]))
        await file.save();

        res.status(200).send(file);

    } catch(e) {
        res.send(e.message)
    }
});

router.delete('/attachedFiles/:id', auth, async(req, res) => {
    try{

        const _id = req.params.id;

        const file = await attachedFile.findOne({_id});
        if(!file){
            throw new Error('File not found');
        }

        await file.remove();

        res.status(200).send({
            file: file.file_name,
            description: file.description,
            Message: 'File deleted successfully'
        });

    } catch(e) {
        res.status(400). send(e.message);
    }
});

router.delete('/attachedFiles', auth, async(req, res) => {
    try{

        await attachedFile.deleteMany();

        res.status(200).send({Message: 'The Attacheds Files collection has been reset!'})

    } catch(e) {
        res.status(400). send(e.message);
    }
});

module.exports = router;