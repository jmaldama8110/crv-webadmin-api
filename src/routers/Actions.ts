import express from 'express';
import Action from '../model/Action';
import { authorize } from '../middleware/authorize';
import { LoanAppGroup } from '../model/LoanAppGroup';
import { Client } from '../model/Client';
import { LoanApp } from '../model/LoanApp';
import { createPersonHF } from '../utils/createPerson';
import { createClientHF } from '../utils/createClient';
import { createLoanHF } from '../utils/createLoan';

let loanAppGroup = new LoanAppGroup();
let ClientDoc = new Client();

let ActionDoc = new Action();

const router = express.Router();

router.get('/actions/validate', authorize, async (req, res) => {
    try {
        // Validate action

        let RSP_Result:any = { status: 'ERROR' };
        const { id } = req.query;
        
        const response = await ActionDoc.validateAction(id as string,"VALIDATE");
        let info = { _id: id }
        let action = response.action;
        RSP_Result.action = action;
        if(response.status === "OK")
        {
            let action:any = response.action;
            let info:any = { action_type: action.name }
            let loan:any;
            let id_loan;
            let RSP_ResultNewMembers = [];
            switch (action.name)
            {
                case 'CREATE_UPDATE_LOAN':
                    // Get data
                    id_loan = action.data.id_loan;
                    loan = await loanAppGroup.getLoan(id_loan)
                    if (loan === undefined) {
                        info.loan_id = id_loan;
                        RSP_Result = await ActionDoc.generarErrorRSP(`Loan ${id_loan} is not found`,info);
                        break;
                    }
                    // Validate members
                    if(!Array.isArray(loan.members)){
                        RSP_Result = await ActionDoc.generarErrorRSP('Members were not found: ',info);
                        break;
                    }
                    let memberstransact = loan.members.filter( (row:any) => row.estatus.trim().toUpperCase() === "TRAMITE" && row.sub_estatus.trim().toUpperCase() === "NUEVO TRAMITE" );
                    let memberscancelled = loan.members.filter( (row:any) => row.estatus.trim().toUpperCase() === "CANCELADO" && row.sub_estatus.trim().toUpperCase() === "CANCELACION/ABANDONO" );
                    let membersnew = loan.members.filter( (row:any) => row.estatus.trim().toUpperCase() === "INGRESO" && row.sub_estatus.trim().toUpperCase() === "NUEVO");
                    if(membersnew.length === 0 && memberscancelled.length === 0 && memberstransact.length === 0){
                        RSP_Result = await ActionDoc.generarErrorRSP('There are not members with status in TRAMITE, CANCELADO or INGRESO',info);
                        break;
                    }
                    for (let row of membersnew) {
                        // Get data
                        let client:any;
                        const  _id  = row.client_id;
                        client = await ClientDoc.findOne({ _id });
                        if (client === undefined) {
                            info.client_id = _id;
                            RSP_Result = await ActionDoc.generarErrorRSP('Client new is not found: '+row.client_id,info);
                            RSP_ResultNewMembers.push(RSP_Result)
                        }
                        else {
                            //Validate data
                            if(client.id_cliente == 0 || client.id_persona == 0) {
                                RSP_Result = await ActionDoc.validateDataClient(client);
                                if (RSP_Result.status !== "OK") {
                                    RSP_Result.info.client_id = _id;
                                    RSP_ResultNewMembers.push(RSP_Result)
                                }
                            }
                        }
                    }
                    if(RSP_ResultNewMembers.length > 0) {
                        RSP_Result = await ActionDoc.generarErrorRSP("The new members have a trouble with any validation.",RSP_ResultNewMembers);
                        break;
                    }
                    info.id_cliente = loan.id_cliente;
                    info.id_solicitud = loan.id_solicitud;
                    info.id_loan = id_loan;
                    //Validate data
                    RSP_Result = await ActionDoc.validateDataLoan(loan, info);
                    break;
                case 'CREATE_UPDATE_CLIENT':
                    // Get data
                    let client:any;
                    const { _id } = action.data;
                    client = await ClientDoc.findOne({ _id });
                    if (client === undefined) {
                        RSP_Result = await ActionDoc.generarErrorRSP('Client is not found',info);
                        break;
                    }
                    //Validate data
                    RSP_Result = await ActionDoc.validateDataClient(client);
                    break;
                default:
                    RSP_Result = await ActionDoc.generarErrorRSP('Action "'+action.name+'" is not supported',info);
                    break;
            }
            //Save validation
            RSP_Result = await ActionDoc.saveValidation(RSP_Result,action);
            RSP_Result.action = action;
        }
        else
            RSP_Result = await ActionDoc.generarErrorRSP(response.message, info);
        res.status(201).send(RSP_Result);
    } catch (err:any) {
        let RSP_Result = await ActionDoc.generarErrorRSP(err.message, req.query);
        res.status(400).send(RSP_Result)
    }
});

router.get('/actions/exec',authorize, async (req, res) => {
    try {
        // Validate action
        let RSP_Result:any = { status: 'ERROR' };
        const { id } = req.query;
        const response = await ActionDoc.validateAction(id as string,"EXEC");
        let info:any = { _id: id }
        let action:any = response.action;
        RSP_Result.action = action;
        if(response.status === "OK") {
            info.action_type = action.name;
            RSP_Result.info = info
            if (!action.isOk)
                RSP_Result = await ActionDoc.generarErrorRSP("The action "+ action.name+ " with id "+ id+" has not been validated. You must to run option '/actions/validate'",info);
            else
            {
                let loan:any;

                switch (action.name)
                {
                    case 'CREATE_UPDATE_LOAN':
                        // Get Loan
                        let RSP_ResultNewMembers = []
                        let id_loan;
                        id_loan = action.data.id_loan;
                        loan = await loanAppGroup.getLoan(id_loan);
                        //Crear miembros nuevos
                        let membersnew = loan.members.filter( (row:any) => row.estatus.trim().toUpperCase() === "INGRESO" && row.sub_estatus.trim().toUpperCase() === "NUEVO");
                        for (let row of membersnew) {
                            let _id = row.client_id
                            let RSP_ResultClient = { status: 'ERROR' };
                            let client:any = await ClientDoc.findOne({ _id });
                            if(client.id_cliente == 0 || client.id_persona == 0) {
                                // Create person and client
                                const personCreatedHF = await createPersonHF({"_id": row.client_id});
                                //Validar error al crear persona
                                if (!personCreatedHF ||  personCreatedHF instanceof Error) {
                                    action.status = 'Error'
                                    action.errors = [personCreatedHF.message];
                                    RSP_ResultClient.status = 'ERROR';
                                    RSP_ResultNewMembers.push(RSP_ResultClient);
                                }
                                //Si no hay error crear cliente
                                else
                                {
                                    const clientSaved:any = await createClientHF({"_id": row.client_id});
                                    RSP_ResultClient.status = "OK";
                                    //Validar creación del cliente
                                    if (!clientSaved || clientSaved instanceof Error) {
                                        action.status = 'Error'
                                        action.errors = [clientSaved.message];
                                        RSP_ResultClient.status = 'ERROR';
                                        RSP_ResultNewMembers.push(RSP_ResultClient);
                                    }
                                }
                            }
                           else
                                RSP_ResultClient.status = "OK";
                           if(RSP_ResultClient.status === "OK")
                           {
                               _id = row.client_id
                               let client:any = await ClientDoc.findOne({ _id });
                               if(client.id_cliente > 0 && client.id_persona >0)
                               {
                                   row.id_member =  client.id_persona;
                                   row.id_cliente =  client.id_cliente;
                                   row.estatus =  "TRAMITE";
                                   row.sub_estatus =  "NUEVO TRAMITE";
                               }
                               else{
                                   RSP_ResultClient = await ActionDoc.generarErrorRSP("The member with client_id "+row.client_id+" was not saved",RSP_ResultNewMembers);
                                   RSP_ResultNewMembers.push(RSP_ResultClient);
                               }
                           }
                        }
                        if(RSP_ResultNewMembers.length > 0) {
                            RSP_Result = await ActionDoc.generarErrorRSP("The new members have a trouble with any validation.",RSP_ResultNewMembers);
                            break;
                        }
                        if(loan.couchdb_type === "LOANAPP_GROUP")
                            await new LoanAppGroup(loan).save();
                        else
                            await new LoanApp(loan).save();
                        loan = await loanAppGroup.getLoan(id_loan);
                        membersnew = loan.members.filter( (row:any) => row.estatus.trim().toUpperCase() === "INGRESO" && row.sub_estatus.trim().toUpperCase() === "NUEVO");
                        if(membersnew.length > 0){
                            RSP_Result = await ActionDoc.generarErrorRSP("The new members have not been saved correctly. Try again",RSP_ResultNewMembers);
                            break;
                        }
                        // Create loan
                        loan = await createLoanHF(action.data);
                        // Validate creation of loan
                        if (loan instanceof Error || !loan) {
                            action.status = 'Error';
                            action.errors = [loan.message];
                            RSP_Result.status = 'ERROR';
                            await new Action(action).save();
                        }
                        else {
                            RSP_Result.status = 'OK';
                            action.errors = [];
                            action.status = 'Done';
                        }
                        break;
                    case 'CREATE_UPDATE_CLIENT':
                        // Create person and client
                        const personCreatedHF: any = await createPersonHF(action.data);
                        //Validar error al crear persona
                        if (!personCreatedHF || personCreatedHF instanceof Error ) {
                            action.status = 'Error'
                            action.errors = [personCreatedHF.message];
                            RSP_Result.status = 'ERROR';
                        }
                        //Si no hay error crear cliente
                        else
                        {
                            const clientSaved: any = await createClientHF(action.data);
                            //Validar creación del cliente
                            if (!clientSaved || clientSaved instanceof Error) {
                                action.status = 'Error'
                                action.errors = [clientSaved.message];
                                RSP_Result.status = 'ERROR';
                                console.log('Error :', {personCreatedHF, clientSaved})
                            }
                            else
                            {
                                RSP_Result.status = 'OK';
                                action.status = 'Done';
                                action.errors = [];
                            }
                        }
                        break;
                    default:
                        RSP_Result = await ActionDoc.generarErrorRSP('Action "' + action.name + '" is not supported', info);
                        break;
                }
            }
            RSP_Result.action =  action
            //Save execution
            if(RSP_Result.status == "OK")
                await new Action(action).save();
        }
        else
            RSP_Result = await ActionDoc.generarErrorRSP(response.message, info);
        res.status(201).send(RSP_Result);

    } catch (err:any) {
        let RSP_Result = await ActionDoc.generarErrorRSP(err.message, req.query);
        res.status(400).send(RSP_Result)
    }
});

export { router as ActionsRouter }