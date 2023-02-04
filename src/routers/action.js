const express = require('express');
const router = new express.Router();
const cron = require('node-cron');
const ActionCollection = require('../model/actionCollection');
const ClientCollection = require('./../model/clientCollection');
const GroupCollection = require('./../model/group');
const LoanAppCollection = require('./../model/loanAppCollection');
const LoanAppGroupCollection = require('./../model/loanAppGroup');
const Client = new ClientCollection();
const Group = new GroupCollection();
const Action = new ActionCollection();
const LoanApp = new LoanAppCollection();
const LoanAppGroup = new LoanAppGroupCollection();
const { sortDataPerson, createPersonHF } = require('./../actions/createPerson');
const { sortDataClient, createClientHF } = require('./../actions/createdClient');
const { createLoanHF } = require('./../actions/createLoan');


// cron.schedule('*/1 * * * *', async () => {
cron.schedule('5 * * * * *', async () => {
    try {
        const tasks = await Action.find({ status: 'Pending' });

        if (tasks.length == 0) console.log('Task not found');
        tasks.map(async (task) => {
            if (task.name === 'GET_CLIENT') {
                const { external_id } = task.data;

                const dataClient = await Action.getClientHFById(external_id);
                if (!dataClient) { console.log('Client not found'); return };
            }

            if (task.name === 'CREATE_CLIENT') {
                //TODO Se usar el status Aprobado para crear el cliente?

                //CREATE PERSON
                const personCreatedHF = await createPersonHF(task.data);
                if (!personCreatedHF) { console.log('Error al crear la persona'); return }

                //CREATE CLIENT
                const clientSaved = await createClientHF(task.data);
                if (!clientSaved) { console.log('Error al guardar el cliente'); return };

                // Actualizar el status de Action
                task.status = 'Done'
                await new ActionCollection(task).save();
                console.log('Done!');
            }

            if (task.name === 'CREATE_LOAN') {
                const loan = await createLoanHF(task.data);

                if (!loan) { console.log('Error to create Loan'); return };

                task.status = 'Done';
                await new ActionCollection(task).save();
                console.log('Loan Done!', loan);
            }
        })

    } catch (err) {
        console.log(err.message);
    }
});

router.post('/action', async (req, res) => {
    try {
        const newAction = new ActionCollection({ ...req.body });
        newAction.save();

        res.status(201).send(newAction);
    } catch (err) {
        res.status(400).send(err.message)
    }
});

router.get('/actiontest', async (req, res) => {
    try {
        const data = {
            id_loan: req.query.id,
            fecha_primer_pago: "2023-01-20T06:45:20.407Z",
            fecha_entrega: "2023-01-20T06:45:20.407Z",
            id_oficial: 0
        }
        // const dataLoan = await LoanAppGroup.findOne({ _id:  })
        // if (!dataLoan) throw new Error('No such loan')
        const result = await createLoanHF(data);
        if(!result) throw new Error('Error al crear LoanGroup')

        // const dataClient = await Group.findOne({ _id: dataLoan.apply_by });
        // if(!dataClient) throw new Error('No such client')
        // const result = await sortDataClient(dataClient)

        res.status(201).send(result);
    } catch (err) {
        res.status(400).send(err.message)
    }
})

router.post('/testhook', async (req, res) => {
    try {
        console.log(req.body)

        res.status(201).send(result);
    } catch (err) {
        res.status(400).send(err.message)
    }
})

module.exports = router;