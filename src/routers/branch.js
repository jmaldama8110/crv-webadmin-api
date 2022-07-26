const express = require('express');
const router = new express.Router();
const Employee = require("../model/employee");
const auth = require('../middleware/auth');

router.get('/branches/hf', auth, async(req, res) => {

    try{
        const branches = await Employee.getAllEmployees();
        console.log((branches.recordsets[2]).length);

        res.status(200).send(branches.recordsets[2]);

    } catch(err){
        res.status(400).send(err);
    }

})


module.exports = router;