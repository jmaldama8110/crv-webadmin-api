const cron = require('node-cron');
const TokenCollection = require('./../model/tokenCollection');
const ActionCollection = require('../model/actionCollection');
const DocumentCollection = require('../model/documentCollection');
const Action = new ActionCollection();
const Token = new TokenCollection();
const Document = new DocumentCollection();

const { sortDataPerson, createPersonHF } = require('./../actions/createPerson');
const { sortDataClient, createClientHF } = require('./../actions/createdClient');
const { createLoanHF, sortLoanHFtoCouch, assignClientLoanFromHF } = require('./../actions/createLoan');

cron.schedule('5 * * * * *', async () => {
    try {
        const tasks = await Action.find({ status: 'Pending' });

        // if (tasks.length == 0) console.log('Task not found');
        tasks.map(async (task) => {
            switch (task.name) {
                case 'CREATE_UPDATE_CLIENT':
                    //CREATE PERSON
                    const personCreatedHF = await createPersonHF(task.data);
                    //CREATE CLIENT
                    const clientSaved = await createClientHF(task.data);
                    // Actualizar el status de Action
                    if (!personCreatedHF || !clientSaved || personCreatedHF instanceof Error || clientSaved instanceof Error) {
                        task.status = 'Error'
                        console.log('Error :',{ personCreatedHF, clientSaved })
                    } else {
                        { task.status = 'Done' }
                    };
                    await new ActionCollection(task).save();
                    console.log(`>> Client ${task.status}!`);
                    break;
                case 'CREATE_UPDATE_LOAN':
                    const loan = await createLoanHF(task.data);
                    // if (!loan) { console.log('Error to create Loan'); return };

                    if(loan instanceof Error || !loan) {task.status = 'Error'; console.log(loan)}else { task.status = 'Done' };

                    await new ActionCollection(task).save();
                    console.log(`>> Loan ${task.status}!`);
                    break;
                case 'MEMBER_DROPOUT':
                    const { client_id, loan_id, dropout_type, reason_id } = task.data;
                    if (!client_id && !loan_id && !dropout_type && !reason_id) { console.log(task.name, 'Incorrect data'); return }

                    const dataAssign = {
                        id_solicitud_prestamo: loan_id,
                        id_cliente: client_id,
                        etiqueta_opcion: "BAJA", // BAJA
                        tipo_baja: dropout_type.trim(), // CASTIGADO/CANCELACION/RECHAZADO cata_tipoBaja
                        id_motivo: reason_id, //CATA_id_motivo
                        uid: 0
                    }
                    const result = await assignClientLoanFromHF(dataAssign);
                    (!result) ? task.status = 'Error' : task.status = 'Done';

                    await new ActionCollection(task).save();
                    console.log('Member dropout Done!', result);
                    break;

                default:
                    break;
            }
        });
    } catch (err) {
        console.log(err.message);
    }
});

cron.schedule('0 */12 * * *', async () => {
    try {
        const tokens = await Token.find({});
        // if (tokens.length == 0) console.log('Tokens not found');

        for (let idx = 0; idx < tokens.length; idx++) {
            const isExpired = Token.checkExpiration(tokens[idx].token);
            if (isExpired) await new TokenCollection(tokens[idx]).delete()
        }

    } catch (err) {
        console.log(err.message);
    }
});