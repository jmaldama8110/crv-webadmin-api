const cron = require('node-cron');
const TokenCollection = require('./../model/tokenCollection');
const ActionCollection = require('../model/actionCollection');
const Action = new ActionCollection();
const Token = new TokenCollection();

const { sortDataPerson, createPersonHF } = require('./../actions/createPerson');
const { sortDataClient, createClientHF } = require('./../actions/createdClient');
const { createLoanHF, sortLoanHFtoCouch } = require('./../actions/createLoan');


cron.schedule('5 * * * * *', async () => {
    try {
        const tasks = await Action.find({ status: 'Pending' });

        if (tasks.length == 0) console.log('Task not found');
        tasks.map(async (task) => {
            switch (task.name) {
                case 'CREATE_UPDATE_CLIENT':
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
                    break;
                case 'CREATE_UPDATE_LOAN':
                    const loan = await createLoanHF(task.data);
                    if (!loan) { console.log('Error to create Loan'); return };

                    task.status = 'Done';
                    await new ActionCollection(task).save();
                    console.log('Loan Done!', loan);
                    break;

                default:
                    break;
            }
        })
    } catch (err) {
        console.log(err.message);
    }
});

cron.schedule('0 */12 * * *', async () => {
    try {
        const tokens = await Token.find({});
        if (tokens.length == 0) console.log('Tokens not found');

        for (let idx = 0; idx < tokens.length; idx++) {
            const isExpired = Token.checkExpiration(tokens[idx].token);
            if (isExpired) await new TokenCollection(tokens[idx]).delete()
        }

    } catch (err) {
        console.log(err.message);
    }
});