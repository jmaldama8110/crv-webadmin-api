const express = require('express');
const router = new express.Router();
const cron = require('node-cron');
const ActionCollection = require('../model/actionCollection');
const ClientCollection = require('./../model/clientCollection');
const GroupCollection = require('./../model/groupCollection');
const LoanAppCollection = require('./../model/loanAppCollection');
const LoanAppGroupCollection = require('./../model/loanAppGroup');
const TokenCollection = require('./../model/tokenCollection');
const Client = new ClientCollection();
const Group = new GroupCollection();
const Action = new ActionCollection();
const LoanApp = new LoanAppCollection();
const LoanAppGroup = new LoanAppGroupCollection();
const Token = new TokenCollection();
const { sortDataPerson, createPersonHF } = require('./../actions/createPerson');
const { sortDataClient, createClientHF } = require('./../actions/createdClient');
const { createLoanHF, sortLoanHFtoCouch } = require('./../actions/createLoan');

router.post('/action', async (req, res) => {
    try {
        const newAction = new ActionCollection({ ...req.body });
        newAction.save();

        res.status(201).send(newAction);
    } catch (err) {
        res.status(400).send(err.message)
    }
});


module.exports = router;