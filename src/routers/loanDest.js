const express = require('express');
const router = new express.Router();
const Employee = require("../model/employee");
const Branch = require("../model/branch");
const auth = require('../middleware/auth');
const LoanDestCollection = require('./../model/loanDestCollection');


router.get('/loandest/sync', async(req, res) => {
    try {
        const loanDestCollection = new LoanDestCollection();
        const loandest = loanDestCollection.updateFromHF(10000);

        res.status(201).send('!Done')
    } catch (error) {
        res.status(400).send(error.message);
    }


});

module.exports = router;