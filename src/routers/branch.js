const express = require('express');
const router = new express.Router();
const Employee = require("../model/employee");
const Branch = require("../model/branch");
const auth = require('../middleware/auth');


router.get('/branchCatalog', auth, async(req, res) => {
    const match = {}
    
    try{

        if (req.query.id){
            match._id = req.query.id
        }

        const branch = await Branch.find(match);
        if(!branch || branch.length == 0){
            throw new Error('No records found');
        }

        for(let i = 0; i < branch.length; i ++){
            await branch[i].populate('id_estado', {__v: 0}).execPopulate();
        }
        
        res.status(200).send(branch);

    } catch(e){
        console.log(e + '');
        res.status(400).send(e + '');
    }
});

router.get('/oficialOfBranch/:idBranch', auth, async(req, res) => {
    try{

        const idBranch = req.params.idBranch;

        const oficial = await Branch.getOficialCredito(idBranch);

        res.status(200).send(oficial);

    } catch(e){
        console.log(e + '');
        res.status(400).send(e + '');
    }
});

router.get('/branches/hf', auth, async(req, res) => {

    try{
        const branches = await Employee.getAllEmployees();
        console.log((branches.recordsets[2]).length);

        res.status(200).send(branches.recordsets[2]);

    } catch(err){
        res.status(400).send(err);
    }

});


module.exports = router;