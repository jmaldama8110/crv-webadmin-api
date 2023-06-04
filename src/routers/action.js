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
const { createLoanHF, sortLoanHFtoCouch, assignClientLoanFromHF } = require('./../actions/createLoan');

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

        let RSP_Result = { status: 'ERROR' };
        const { id } = req.query;
        const response = await Action.validateAction(id,"VALIDATE");
        let info = { _id: id }
        let action = response.action;
        RSP_Result.action = action;
        if(response.status === "OK")
        {
            let action = response.action;
            let info = { action_type: action.name }
            let loan;
            let id_loan;
            let RSP_ResultNewMembers = [];
            switch (action.name)
            {
                case 'MEMBER_DROPOUT':
                    // Get data
                    id_loan = action.data.id_loan;
                    let dropouts = action.data.dropouts;
                    id_loan = action.data.id_loan;
                    loan = await LoanAppGroup.getLoan(id_loan)
                    if (loan === undefined) {
                        info.loan_id = id_loan;
                        RSP_Result = await Action.generarErrorRSP(`Loan ${id_loan} is not found`,info);
                        break;
                    }
                    info.id_cliente = loan.id_cliente;
                    info.id_solicitud = loan.id_solicitud;
                    info.id_loan = id_loan;
                    //Validate data
                    if(dropouts instanceof Array && dropouts.length >= 0) {
                        RSP_Result = await Action.validateDataDropMemberLoan({dropouts: dropouts}, info);
                    }
                    else
                        RSP_Result = await Action.generarErrorRSP("Without rows to dropouts", info);
                    break;
                case 'MEMBER_NEW':
                    // Get data
                    id_loan = action.data.id_loan;
                    let newmembers = action.data.newmembers;
                    loan = await LoanAppGroup.getLoan(id_loan)
                    if (loan === undefined) {
                        info.loan_id = id_loan;
                        RSP_Result = await Action.generarErrorRSP(`Loan ${id_loan} is not found`,info);
                        break;
                    }
                    info.id_cliente = loan.id_cliente;
                    info.id_solicitud = loan.id_solicitud;
                    info.id_loan = id_loan;
                    //Validate data
                    if(newmembers instanceof Array && newmembers.length >= 0)
                        RSP_Result = await Action.validateDataAddMemberLoan({newmembers: newmembers}, info);
                    else
                        RSP_Result = await Action.generarErrorRSP("Without rows to newmembers", info);
                    break;
                case 'CREATE_UPDATE_LOAN':
                    // Get data
                    id_loan = action.data.id_loan;
                    loan = await LoanAppGroup.getLoan(id_loan)
                    if (loan === undefined) {
                        info.loan_id = id_loan;
                        RSP_Result = await Action.generarErrorRSP(`Loan ${id_loan} is not found`,info);
                        break;
                    }
                    // Validate members
                    if(!Array.isArray(loan.members)){
                        RSP_Result = await Action.generarErrorRSP('Members were not found: ',info);
                        break;
                    }
                    let memberstransact = loan.members.filter( row => row.estatus.trim().toUpperCase() === "TRAMITE" && row.sub_estatus.trim().toUpperCase() === "NUEVO TRAMITE" );
                    let memberscancelled = loan.members.filter( row => row.estatus.trim().toUpperCase() === "CANCELADO" && row.sub_estatus.trim().toUpperCase() === "CANCELACION/ABANDONO" );
                    let membersnew = loan.members.filter( row => row.estatus.trim().toUpperCase() === "INGRESO" && row.sub_estatus.trim().toUpperCase() === "NUEVO");
                    if(membersnew.length === 0 && memberscancelled.length === 0 && memberstransact.length === 0){
                        RSP_Result = await Action.generarErrorRSP('There are not members with status in TRAMITE, CANCELADO or INGRESO',info);
                        break;
                    }
                    for (let row of membersnew) {
                        // Get data
                        let client;
                        const  _id  = row.client_id;
                        client = await Client.findOne({ _id });
                        if (client === undefined) {
                            info.client_id = _id;
                            RSP_Result = await Action.generarErrorRSP('Client new is not found: '+row.client_id,info);
                            RSP_ResultNewMembers.push(RSP_Result)
                        }
                        else {
                            //Validate data
                            if(client.id_cliente == 0 || client.id_persona == 0) {
                                RSP_Result = await Action.validateDataClient(client);
                                if (RSP_Result.status !== "OK") {
                                    RSP_Result.info.client_id = _id;
                                    RSP_ResultNewMembers.push(RSP_Result)
                                }
                            }
                        }
                    }
                    if(RSP_ResultNewMembers.length > 0) {
                        RSP_Result = await Action.generarErrorRSP("The new members have a trouble with any validation.",RSP_ResultNewMembers);
                        break;
                    }
                    info.id_cliente = loan.id_cliente;
                    info.id_solicitud = loan.id_solicitud;
                    info.id_loan = id_loan;
                    //Validate data
                    RSP_Result = await Action.validateDataLoan(loan, info);
                    break;
                case 'CREATE_UPDATE_CLIENT':
                    // Get data
                    let client;
                    const { _id } = action.data;
                    client = await Client.findOne({ _id });
                    if (client === undefined) {
                        RSP_Result = await Action.generarErrorRSP('Client is not found',info);
                        break;
                    }
                    //Validate data
                    RSP_Result = await Action.validateDataClient(client);
                    break;
                default:
                    RSP_Result = await Action.generarErrorRSP('Action "'+action.name+'" is not supported',info);
                    break;
            }
            //Save validation
            RSP_Result = await Action.saveValidation(RSP_Result,action);
            RSP_Result.action = action;
        }
        else
            RSP_Result = await Action.generarErrorRSP(response.message, info);
        res.status(201).send(RSP_Result);
    } catch (err) {
        let RSP_Result = await Action.generarErrorRSP(err.message, req.query);
        res.status(400).send(RSP_Result)
    }
});

router.get('/actions/exec', async (req, res) => {
    try {
        // Validate action
        let RSP_Result = { status: 'ERROR' };
        const { id } = req.query;
        const response = await Action.validateAction(id,"EXEC");
        let info = { _id: id }
        let action = response.action;
        RSP_Result.action = action;
        if(response.status === "OK") {
            info.action_type = action.name;
            RSP_Result.info = info
            if (!action.isOk)
                RSP_Result = await Action.generarErrorRSP("The action "+ action.name+ " with id "+ id+" has not been validated. You must to run option '/actions/validate'",info);
            else
            {
                let loan;
                switch (action.name) {
                    case 'MEMBER_DROPOUT':
                        id_loan = action.data.id_loan;
                        info.loan_id = id_loan;
                        let dropouts = action.data.dropouts;
                        id_loan = action.data.id_loan;
                        loan = await LoanAppGroup.getLoan(id_loan)
                        if (loan === undefined) {
                            RSP_Result = await Action.generarErrorRSP(`Loan ${id_loan} is not found`,info);
                            break;
                        }
                        if(loan.id_solicitud == 0){
                            RSP_Result = await Action.generarErrorRSP(`Loan ${id_loan} has not been created at HF`,info);
                            break;
                        }
                        for(let drop of dropouts)
                        {
                            let member = undefined;
                            drop.status = 'Not found'
                            member = loan.members.find(row => row.id_cliente == drop.id_cliente);
                            if(member !== undefined)
                            {
                                drop.status = 'Found'
                                const dataDrop = {
                                    id_solicitud_prestamo: loan.id_solicitud,
                                    id_cliente: drop.id_cliente,
                                    etiqueta_opcion: "BAJA",
                                    tipo_baja: drop.reasonType.trim(),
                                    id_motivo: drop.dropoutReason[0],
                                    uid: 0
                                }
                                let result = await assignClientLoanFromHF(dataDrop);
                                drop.result =  result;
                            }
                        }
                        RSP_Result.status = 'OK';
                        action.errors = [];
                        action.status = 'Done';
                        action.data.dropouts = dropouts;
                        break;
                    case 'MEMBER_NEW': id_loan = action.data.id_loan;
                        info.loan_id = id_loan;
                        let newmembers = action.data.newmembers;
                        id_loan = action.data.id_loan;
                        loan = await LoanAppGroup.getLoan(id_loan)
                        if (loan === undefined) {
                            RSP_Result = await Action.generarErrorRSP(`Loan ${id_loan} is not found`,info);
                            break;
                        }
                        if(loan.id_solicitud == 0){
                            RSP_Result = await Action.generarErrorRSP(`Loan ${id_loan} has not been created at HF`,info);
                            break;
                        }
                        for(let news of newmembers)
                        {
                            let member = undefined;
                            news.status = 'Duplicated'
                            //member = loan.members.find(row => row.id_cliente == news.id_cliente);
                            if(member === undefined)
                            {
                                news.status = 'Found'
                                const dataNew = {
                                    id_solicitud_prestamo: loan.id_solicitud,
                                    id_cliente: news.id_cliente,
                                    etiqueta_opcion: "ALTA",
                                    tipo_baja: '',
                                    id_motivo: 0,
                                    uid: 0
                                }
                                let result = await assignClientLoanFromHF(dataNew);
                                news.result =  result;
                            }
                        }
                        RSP_Result.status = 'OK';
                        action.errors = [];
                        action.status = 'Done';
                        action.data.newmembers = newmembers;
                        break;
                    case 'CREATE_UPDATE_LOAN':
                        // Get Loan
                        let RSP_ResultNewMembers = []
                        const { id_loan } = action.data;
                        loan = await LoanAppGroup.getLoan(id_loan);
                        //Crear miembros nuevos
                        let membersnew = loan.members.filter( row => row.estatus.trim().toUpperCase() === "INGRESO" && row.sub_estatus.trim().toUpperCase() === "NUEVO");
                        for (let row of membersnew) {
                            let _id = row.client_id
                            client = await Client.findOne({ _id });
                            if(client.id_cliente == 0 || client.id_persona == 0) {
                                // Create person and client
                                const personCreatedHF = await createPersonHF({"_id": row.client_id});
                                const clientSaved = await createClientHF({"_id": row.client_id});
                                // Validate creation person and
                                if (!personCreatedHF || !clientSaved || personCreatedHF instanceof Error || clientSaved instanceof Error) {
                                    action.status = 'Error'
                                    action.errors = [personCreatedHF.message, clientSaved.message];
                                    RSP_Result.status = 'ERROR';
                                    RSP_ResultNewMembers.push(RSP_Result);
                                }
                            }
                           else
                                RSP_Result.status = "OK";
                           if(RSP_Result.status === "OK")
                           {
                               _id = row.client_id
                               client = await Client.findOne({ _id });
                               row.id_member =  client.id_persona;
                               row.id_cliente =  client.id_cliente;
                               row.estatus =  "TRAMITE";
                               row.sub_estatus =  "NUEVO TRAMITE";;
                           }
                        }
                        if(RSP_ResultNewMembers.length > 0) {
                            RSP_Result = await Action.generarErrorRSP("The new members have a trouble with any validation.",RSP_ResultNewMembers);
                            break;
                        }
                        if(loan.couchdb_type === "LOANAPP_GROUP")
                            await new LoanAppGroupCollection(loan).save();
                        else
                            await new LoanAppCollection(loan).save()
                        // Create loan
                        loan = await createLoanHF(action.data);
                        // Validate creation of loan
                        if (loan instanceof Error || !loan) {
                            action.status = 'Error';
                            action.errors = [loan.message];
                            RSP_Result.status = 'ERROR';
                            console.log(loan)
                        }
                        else {
                            RSP_Result.status = 'OK';
                            action.errors = [];
                            action.status = 'Done';
                        }
                        break;
                    case 'CREATE_UPDATE_CLIENT':
                        // Create person and client
                        const personCreatedHF = await createPersonHF(action.data);
                        const clientSaved = await createClientHF(action.data);
                        // Validate creation person and
                        if (!personCreatedHF || !clientSaved || personCreatedHF instanceof Error || clientSaved instanceof Error) {
                            action.status = 'Error'
                            action.errors = [personCreatedHF.message, clientSaved.message];
                            RSP_Result.status = 'ERROR';
                            console.log('Error :', {personCreatedHF, clientSaved})
                        }
                        else {
                            RSP_Result.status = 'OK';
                            action.status = 'Done';
                            action.errors = [];
                        }
                        break;
                    default:
                        RSP_Result = await Action.generarErrorRSP('Action "' + action.name + '" is not supported', info);
                        break;
                }
            }
            RSP_Result.action =  action
            //Save execution
            if(RSP_Result.status == "OK")
                await new ActionCollection(action).save();
        }
        else
            RSP_Result = await Action.generarErrorRSP(response.message, info);
        res.status(201).send(RSP_Result);

    } catch (err) {
        let RSP_Result = await Action.generarErrorRSP(err.message, req.query);
        res.status(400).send(RSP_Result)
    }
});

module.exports = router;