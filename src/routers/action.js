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

router.get('/actions/validate', async (req, res) => {
    try {
        // Validate action
        const { id } = req.query;
        const response = await Action.validateAction(id,"VALIDATE");

        if(response.status !== "OK")
            throw new Error(response.message);

        let action = response.action;
        let RSP_Result;
        switch (action.name)
        {
            case 'CREATE_UPDATE_LOAN':
                // Get data
                let loan;
                const { id_loan } = action.data;
                loan = await LoanAppGroup.findOne({ _id: id_loan });
                if (loan === undefined) loan = await LoanApp.findOne({ _id: id_loan });
                if (loan === undefined) throw new Error('Loan not found');

                //Validate data
                RSP_Result = await Action.validateDataLoan(loan);
                break;
            case 'CREATE_UPDATE_CLIENT':
                // Get data
                let client;
                const { _id } = action.data;
                client = await Client.findOne({ _id });
                if (client === undefined) throw new Error('Client not found');

                //Validate data
                RSP_Result = await Action.validateDataClient(client);
                break;
            default:
                throw new Error('Action "'+action.name+'" is not supported')
        }

        //Save validation
        RSP_Result = await Action.saveValidation(RSP_Result,action);
        RSP_Result.action = action;
        res.status(201).send(RSP_Result);

    } catch (err) {
        res.status(400).send(err.message)
    }
});

router.get('/actions/exec', async (req, res) => {
    try {
        // Validate action
        const { id } = req.query;
        const response = await Action.validateAction(id,"EXEC");

        if(response.status !== "OK")
            throw new Error(response.message);

        const action = response.action;

        switch (action.name){
            case 'CREATE_UPDATE_LOAN':
                if (!action.isOk) throw new Error('Invalid data loan');
                // Crate loan
                const loan = await createLoanHF(action.data);
                // Validate creation of loan
                if (loan instanceof Error || !loan) {
                    action.status = 'Error';
                    // sendReportActionError(task);
                    console.log(loan)
                } else {
                    action.status = 'Done'
                };
                break;
            case 'CREATE_UPDATE_CLIENT':
                if (!action.isOk) throw new Error('Invalid data client');
                // Create person and client
                const personCreatedHF = await createPersonHF(action.data);
                const clientSaved = await createClientHF(action.data);
                // Validate creation person and
                if (!personCreatedHF || !clientSaved || personCreatedHF instanceof Error || clientSaved instanceof Error) {
                    action.status = 'Error'
                    Action.repostActionError(action.data);
                    console.log('Error :', { personCreatedHF, clientSaved })
                } else {
                    { action.status = 'Done' }
                };
                break;
            default:
                throw new Error('Action "'+action.name+'" is not supported')
        }
        //Save execution
        await new ActionCollection(action).save();
        console.log(`>> ${action.name} ${action.status}!`);
        res.status(201).send('Done');

    } catch (err) {
        res.status(400).send(err.message)
    }
});

module.exports = router;