import express from 'express';
import Action from '../model/Action';
import { authorize } from '../middleware/authorize';
import { LoanAppGroup } from '../model/LoanAppGroup';
import { Client } from '../model/Client';
import { LoanApp } from '../model/LoanApp';
import { createPersonHF } from '../utils/createPerson';
import { createClientHF } from '../utils/createClient';
import { createLoanHF } from '../utils/createLoan';
import * as Nano from 'nano';
import { datsRStoJson, findClientByExternalId } from './HfServer';

let nano = Nano.default(`${process.env.COUCHDB_PROTOCOL}://${process.env.COUCHDB_USER}:${process.env.COUCHDB_PASS}@${process.env.COUCHDB_HOST}:${process.env.COUCHDB_PORT}`);

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

const clientDataDef: any = {
    address:  [],
    branch: [0, ''],
    business_data: {
      bis_location: [0,""],
      economic_activity: ['',''], 
      profession: ['',''],
      ocupation: ["", ""],
      business_start_date: '',
      business_name: '',
      business_owned: false,
      business_phone: '',
      number_employees: 0,
      loan_destination: [0,''],
      income_sales_total: 0,
      income_partner: 0,
      income_job: 0,
      income_remittances: 0,
      income_other: 0,
      income_total: 0,
      expense_family: 0,
      expense_rent: 0,
      expense_business: 0,
      expense_debt: 0,
      expense_credit_cards: 0,
      expense_total: 0,
      keeps_accounting_records: false,
      has_previous_experience: false,
      previous_loan_experience: '',
      bis_season_type: '',
      bis_quality_sales_monthly: {
        month_sale_jan: '',
        month_sale_feb: '',
        month_sale_mar: '',
        month_sale_apr: '',
        month_sale_may: '',
        month_sale_jun: '',
        month_sale_jul: '',
        month_sale_aug: '',
        month_sale_sep: '',
        month_sale_oct: '',
        month_sale_nov: '',
        month_sale_dic: '',
      }
  
    },
    client_type: [0, ''],
    coordinates: [0,0],
    couchdb_type: "CLIENT",
    country_of_birth: ['',''],
    curp: "",
    data_company: [{}],
    data_efirma: [{}],
    dob: "",
    education_level: ['', ''],
    id_cliente: 0,
    id_persona: 0,
    ife_details: [{}],
    clave_ine: "",
    numero_vertical: "",
    numero_emisiones: "",
    email: '',
    lastname: "",
    loan_cycle: 0,
    marital_status: [1, ''],
    name: "",
    nationality: [0, ''],
    phones: [],
    identities: [],
    province_of_birth: ['',''],
    rfc: "",
    second_lastname: "",
    sex: [0, ''],
    status: [0, ''],
    
    household_floor: false,
    household_roof: false,
    household_toilet: false,
    household_latrine: false,
    household_brick: false,
    economic_dependants: 0,
    internet_access: false,
    prefered_social: [0,""],
    rol_hogar: [0,""],
    user_social: '',
    has_disable: false,
    speaks_dialect: false,
    has_improved_income: false,
  
    spld: {
      desempenia_funcion_publica_cargo: "",
      desempenia_funcion_publica_dependencia: "",
      familiar_desempenia_funcion_publica_cargo: "",
      familiar_desempenia_funcion_publica_dependencia: "",
      familiar_desempenia_funcion_publica_nombre: "",
      familiar_desempenia_funcion_publica_paterno: "",
      familiar_desempenia_funcion_publica_materno: "",
      familiar_desempenia_funcion_publica_parentesco: "",
      instrumento_monetario: [0, ""],
      
    },
    comment: '',
    identity_pics: [],
    identity_verification: {
      uuid: '',
      status: 'pending',
      result: 'waiting',
      created_at: '',
      updated_at: '',
      documentData: {
        age: '',
        voter_key: '',
        nationality: '',
        name: '',
        lastname: '',
        second_lastname: '',
        dob: '',
        doc_number: '',
        duplicates: '',
        expiration_date: '',
        folio_number: '',
        ocr_number: '',
        sex: '',
        curp: '',
        street_address: '',
        suburb_address: ''
      }
    },
    comprobante_domicilio_pics: [],
    _id: "",
    _rev: ""
  }




router.get('/actions/fix/030424', authorize, async (req,res)=> {
    try {
        const db = nano.use(process.env.COUCHDB_NAME ? process.env.COUCHDB_NAME : '');
        const queryActions = await db.find( {
            selector: {
                couchdb_type: "CLIENT",
            },
            limit: 100000
        });
        
        //// gets docs only where SPLD property does not exists
        const clientList:any = queryActions.docs.filter( (i:any) => !i.spld );
        
        for( let x=0; x < clientList.length; x++){
            await db.insert({
                ...clientList[x],
                spld: {
                    desempenia_funcion_publica_cargo: "",
                    desempenia_funcion_publica_dependencia: "",
                    familiar_desempenia_funcion_publica_cargo: "",
                    familiar_desempenia_funcion_publica_dependencia: "",
                    familiar_desempenia_funcion_publica_nombre: "",
                    familiar_desempenia_funcion_publica_paterno: "",
                    familiar_desempenia_funcion_publica_materno: "",
                    familiar_desempenia_funcion_publica_parentesco: "",
                    instrumento_monetario: [0, ""],
                    
                  }
            })
        }
 
        res.send({ updated: clientList.length, data: clientList.map( (x:any) =>( {_id: x._id, _rev: x._rev })) })
    }
    catch(e:any){
        res.status(400).send(e.message);
    }
})
 
export { router as ActionsRouter }
