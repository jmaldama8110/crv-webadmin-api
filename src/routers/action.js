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

router.get('/actions/valide', async (req, res) => {
    try {
        const { id } = req.query;

        const action = await Action.findOne({ _id: id });
        if (!action) throw new Error('Action not found')

        let loan;
        const { id_loan } = action.data;

        loan = await LoanAppGroup.findOne({ _id: id_loan });
        if (loan == undefined) {
            loan = await LoanApp.findOne({ _id: id_loan });
        }
        if (loan === undefined) throw new Error('Loan not found');

        const result = await Action.validateDataLoan(loan);

        if (result.erros.length == 0) {
            action.isOk = true
            action.errors = result.erros;
        } else {
            action.errors = result.erros; //[{...Errors}]};
            action.isOk = false;
        }

        await new ActionCollection(action).save();

        res.status(201).send(result);
    } catch (err) {
        res.status(400).send(err.message)
    }
});

router.get('/actions/exec', async (req, res) => {
    try {
        const { id } = req.query;

        const action = await Action.findOne({ _id: id });

        if (!action.isOk) throw new Error('Invalid data loan');

        const loan = await createLoanHF(action.data);
        // if (!loan) { console.log('Error to create Loan'); return };

        if (loan instanceof Error || !loan) {
            action.status = 'Error';
            // sendReportActionError(task);
            console.log(loan)
        } else {
            action.status = 'Done'
        };

        await new ActionCollection(action).save();
        console.log(`>> Loan ${action.status}!`);

        res.status(201).send('Done');
    } catch (err) {
        res.status(400).send(err.message)
    }
});

module.exports = router;