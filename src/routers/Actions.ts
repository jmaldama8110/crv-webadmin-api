import express, { query } from 'express';
import Action from '../model/Action';
import { authorize } from '../middleware/authorize';
import { LoanAppGroup } from '../model/LoanAppGroup';
import { Client } from '../model/Client';
import { LoanApp } from '../model/LoanApp';
import { createPersonHF } from '../utils/createPerson';
import { createClientHF } from '../utils/createClient';
import { createLoanHF } from '../utils/createLoan';
import * as Nano from 'nano';
import sql from 'mssql';
import { sqlConfig } from '../db/connSQL';
import { getBalanceById, getContractInfo } from './HfServer';

let nano = Nano.default(`${process.env.COUCHDB_PROTOCOL}://${process.env.COUCHDB_USER}:${process.env.COUCHDB_PASS}@${process.env.COUCHDB_HOST}:${process.env.COUCHDB_PORT}`);

let loanAppGroup = new LoanAppGroup();
let ClientDoc = new Client();

let ActionDoc = new Action();

const router = express.Router();

router.get('/actions/validate', authorize, async (req, res) => {
    try {
        // Validate action

        let RSP_Result: any = { status: 'ERROR' };
        const { id } = req.query;

        const response = await ActionDoc.validateAction(id as string, "VALIDATE");
        let info = { _id: id }
        let action = response.action;
        RSP_Result.action = action;
        if (response.status === "OK") {
            let action: any = response.action;
            let info: any = { action_type: action.name }
            let loan: any;
            let id_loan;
            let RSP_ResultNewMembers = [];
            switch (action.name) {
                case 'CREATE_UPDATE_LOAN':
                    // Get data
                    id_loan = action.data.id_loan;
                    loan = await loanAppGroup.getLoan(id_loan)
                    if (loan === undefined) {
                        info.loan_id = id_loan;
                        RSP_Result = await ActionDoc.generarErrorRSP(`Loan ${id_loan} is not found`, info);
                        break;
                    }
                    // Validate members
                    if (!Array.isArray(loan.members)) {
                        RSP_Result = await ActionDoc.generarErrorRSP('Members were not found: ', info);
                        break;
                    }
                    let memberstransact = loan.members.filter((row: any) => row.estatus.trim().toUpperCase() === "TRAMITE" && row.sub_estatus.trim().toUpperCase() === "NUEVO TRAMITE");
                    let memberscancelled = loan.members.filter((row: any) => row.estatus.trim().toUpperCase() === "CANCELADO" && row.sub_estatus.trim().toUpperCase() === "CANCELACION/ABANDONO");
                    let membersnew = loan.members.filter((row: any) => row.estatus.trim().toUpperCase() === "INGRESO" && row.sub_estatus.trim().toUpperCase() === "NUEVO");
                    if (membersnew.length === 0 && memberscancelled.length === 0 && memberstransact.length === 0) {
                        RSP_Result = await ActionDoc.generarErrorRSP('There are not members with status in TRAMITE, CANCELADO or INGRESO', info);
                        break;
                    }
                    for (let row of membersnew) {
                        // Get data
                        let client: any;
                        const _id = row.client_id;
                        client = await ClientDoc.findOne({ _id });
                        if (client === undefined) {
                            info.client_id = _id;
                            RSP_Result = await ActionDoc.generarErrorRSP('Client new is not found: ' + row.client_id, info);
                            RSP_ResultNewMembers.push(RSP_Result)
                        }
                        else {
                            //Validate data
                            if (client.id_cliente == 0 || client.id_persona == 0) {
                                RSP_Result = await ActionDoc.validateDataClient(client);
                                if (RSP_Result.status !== "OK") {
                                    RSP_Result.info.client_id = _id;
                                    RSP_ResultNewMembers.push(RSP_Result)
                                }
                            }
                        }
                    }
                    if (RSP_ResultNewMembers.length > 0) {
                        RSP_Result = await ActionDoc.generarErrorRSP("The new members have a trouble with any validation.", RSP_ResultNewMembers);
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
                    let client: any;
                    const { _id } = action.data;
                    client = await ClientDoc.findOne({ _id });
                    if (client === undefined) {
                        RSP_Result = await ActionDoc.generarErrorRSP('Client is not found', info);
                        break;
                    }
                    //Validate data
                    RSP_Result = await ActionDoc.validateDataClient(client);
                    break;
                default:
                    RSP_Result = await ActionDoc.generarErrorRSP('Action "' + action.name + '" is not supported', info);
                    break;
            }
            //Save validation
            RSP_Result = await ActionDoc.saveValidation(RSP_Result, action);
            RSP_Result.action = action;
        }
        else
            RSP_Result = await ActionDoc.generarErrorRSP(response.message, info);
        res.status(201).send(RSP_Result);
    } catch (err: any) {
        let RSP_Result = await ActionDoc.generarErrorRSP(err.message, req.query);
        res.status(400).send(RSP_Result)
    }
});

router.get('/actions/exec', authorize, async (req, res) => {
    try {
        // Validate action
        let RSP_Result: any = { status: 'ERROR' };
        const { id } = req.query;
        const response = await ActionDoc.validateAction(id as string, "EXEC");
        let info: any = { _id: id }
        let action: any = response.action;
        RSP_Result.action = action;
        if (response.status === "OK") {
            info.action_type = action.name;
            RSP_Result.info = info
            if (!action.isOk)
                RSP_Result = await ActionDoc.generarErrorRSP("The action " + action.name + " with id " + id + " has not been validated. You must to run option '/actions/validate'", info);
            else {
                let loan: any;

                switch (action.name) {
                    case 'CREATE_UPDATE_LOAN':
                        // Get Loan
                        let RSP_ResultNewMembers = []
                        let id_loan;
                        id_loan = action.data.id_loan;
                        loan = await loanAppGroup.getLoan(id_loan);
                        //Crear miembros nuevos
                        let membersnew = loan.members.filter((row: any) => row.estatus.trim().toUpperCase() === "INGRESO" && row.sub_estatus.trim().toUpperCase() === "NUEVO");
                        for (let row of membersnew) {
                            let _id = row.client_id
                            let RSP_ResultClient = { status: 'ERROR' };
                            let client: any = await ClientDoc.findOne({ _id });
                            if (client.id_cliente == 0 || client.id_persona == 0) {
                                // Create person and client
                                const personCreatedHF = await createPersonHF({ "_id": row.client_id });
                                //Validar error al crear persona
                                if (!personCreatedHF || personCreatedHF instanceof Error) {
                                    action.status = 'Error'
                                    action.errors = [personCreatedHF.message];
                                    RSP_ResultClient.status = 'ERROR';
                                    RSP_ResultNewMembers.push(RSP_ResultClient);
                                }
                                //Si no hay error crear cliente
                                else {
                                    const clientSaved: any = await createClientHF({ "_id": row.client_id });
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
                            if (RSP_ResultClient.status === "OK") {
                                _id = row.client_id
                                let client: any = await ClientDoc.findOne({ _id });
                                if (client.id_cliente > 0 && client.id_persona > 0) {
                                    row.id_member = client.id_persona;
                                    row.id_cliente = client.id_cliente;
                                    row.estatus = "TRAMITE";
                                    row.sub_estatus = "NUEVO TRAMITE";
                                }
                                else {
                                    RSP_ResultClient = await ActionDoc.generarErrorRSP("The member with client_id " + row.client_id + " was not saved", RSP_ResultNewMembers);
                                    RSP_ResultNewMembers.push(RSP_ResultClient);
                                }
                            }
                        }
                        if (RSP_ResultNewMembers.length > 0) {
                            RSP_Result = await ActionDoc.generarErrorRSP("The new members have a trouble with any validation.", RSP_ResultNewMembers);
                            break;
                        }
                        if (loan.couchdb_type === "LOANAPP_GROUP")
                            await new LoanAppGroup(loan).save();
                        else
                            await new LoanApp(loan).save();
                        loan = await loanAppGroup.getLoan(id_loan);
                        membersnew = loan.members.filter((row: any) => row.estatus.trim().toUpperCase() === "INGRESO" && row.sub_estatus.trim().toUpperCase() === "NUEVO");
                        if (membersnew.length > 0) {
                            RSP_Result = await ActionDoc.generarErrorRSP("The new members have not been saved correctly. Try again", RSP_ResultNewMembers);
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
                        if (!personCreatedHF || personCreatedHF instanceof Error) {
                            action.status = 'Error'
                            action.errors = [personCreatedHF.message];
                            RSP_Result.status = 'ERROR';
                            await new Action(action).save();
                        }
                        //Si no hay error crear cliente
                        else {
                            const clientSaved: any = await createClientHF(action.data);
                            //Validar creación del cliente
                            if (!clientSaved || clientSaved instanceof Error) {
                                action.status = 'Error'
                                action.errors = [clientSaved.message];
                                RSP_Result.status = 'ERROR';
                                await new Action(action).save();
                                console.log('Error :', { personCreatedHF, clientSaved })
                            }
                            else {
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
            RSP_Result.action = action
            //Save execution
            if (RSP_Result.status == "OK")
                await new Action(action).save();
        }
        else
            RSP_Result = await ActionDoc.generarErrorRSP(response.message, info);
        res.status(201).send(RSP_Result);

    } catch (err: any) {
        let RSP_Result = await ActionDoc.generarErrorRSP(err.message, req.query);
        res.status(400).send(RSP_Result)
    }
});

const clientDataDef: any = {
    address: [],
    branch: [0, ''],
    business_data: {
        bis_location: [0, ""],
        economic_activity: ['', ''],
        profession: ['', ''],
        ocupation: ["", ""],
        business_start_date: '',
        business_name: '',
        business_owned: false,
        business_phone: '',
        number_employees: 0,
        loan_destination: [0, ''],
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
    coordinates: [0, 0],
    couchdb_type: "CLIENT",
    country_of_birth: ['', ''],
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
    province_of_birth: ['', ''],
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
    prefered_social: [0, ""],
    rol_hogar: [0, ""],
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


router.get('/db_update_loans_contracts', authorize, async (req, res) => {
    try {

        const loans = await updateLoanAppStatus();
        res.send({ loans })
    }
    catch (e: any) {
        console.log(e);
        res.status(400).send(e.message)
    }
});


export async function updateLoanAppStatus() {

    const db = nano.use(process.env.COUCHDB_NAME ? process.env.COUCHDB_NAME : '');
    const queryActions = await db.find({
        selector: {
            couchdb_type: "LOANAPP_GROUP"
        }, limit: 100000
    });
    const toBeUpdated = [];
    //// cuando el estatus de LOANAPP esta en Nuevo tramite y cambia a ACEPTADO/PRESTAMO ACTIVO
    /// Se debe importar el contrato de este LOAN.
    const clientIdsToUpdate: { 
        id_cliente:number, 
        _id: string,
        branch: [number, string ] } [] = []; // here we add all clients/group uniquely, so perform sigle get balance from HF

    for (let i = 0; i < queryActions.docs.length; i++) {
        const loanAppDoc: any = queryActions.docs[i];
        const idSolicitud = parseInt(loanAppDoc.id_solicitud);
        const newStatus = await getCurrentLoanStatus(idSolicitud);

        /// only updates when newStatus is not equal current Status
        if (newStatus) {
            const statusChanged = !(loanAppDoc.estatus === newStatus.estatus && loanAppDoc.sub_estatus === newStatus.sub_estatus)
            console.log(`${idSolicitud} (${statusChanged}), ${loanAppDoc.estatus}/${loanAppDoc.sub_estatus} => ${newStatus?.estatus}/${newStatus?.sub_estatus}`);

            if (statusChanged && !loanAppDoc.renovation ) {
                // renovation flag must be FALSE
                /// only when changed excepting ACEPTADO/PRESTAMO FINALIZADO
                toBeUpdated.push({
                    ...loanAppDoc,
                    estatus: newStatus.estatus,
                    sub_estatus: newStatus.sub_estatus
                });
                // check if there is any PRESTAMO ACTIVO STATUS
                if( newStatus.estatus === 'ACEPTADO' && 
                newStatus.sub_estatus === 'PRESTAMO ACTIVO'){
                    /// here we found that an status changed to ACTIVE LOAN, therefore, need to get 
                    /// current contract balance
                    clientIdsToUpdate.push({ id_cliente: loanAppDoc.id_cliente, _id: loanAppDoc.apply_by, branch: loanAppDoc.branch });
                }
            }

        }
        if(!newStatus){
            console.log(`${idSolicitud}, unable to retrieve status from SQL`)
        }


    }
    /// run the bulk update
    /**1. UPDATE all LOANAPP_DOC docs status/substatus */
    await db.bulk({ docs: toBeUpdated });
    console.log(`Updated: ${toBeUpdated.length}, Nothing to do: ${queryActions.docs.length - toBeUpdated.length}`)

    /**2. UPDATE all CONTRACT from HF data*/
    const queryContracts = await db.find({
        selector: {
            couchdb_type: "CONTRACT"
        }, limit: 100000 });

    const dataToBeUpdated:any = [];

    for( let w=0; w< queryContracts.docs.length; w++){
        const contractDoc:any = queryContracts.docs[w];
        const dataFromHF:any = await getContractInfo(contractDoc.idContrato);
        if( dataFromHF[0][0]){
            console.log(`${contractDoc.idContrato} updated.`)
            dataToBeUpdated.push( {
                ...contractDoc,
                ...dataFromHF[0][0],
                updated_by: `${process.env.COUCHDB_USER}`,
                updated_at: new Date().toISOString(),
            })
        }
        else {
            console.log(`${contractDoc.idContrato} not found info from SQL`)
        }
            
    }
    await db.bulk( {docs: dataToBeUpdated });
    console.log(`Updated contracts: ${dataToBeUpdated.length}`);

    /** UPDATE all contracts in db */

    /*** finally, create contracts for ACEPTADO/PRESTAMO ACTIVO */

    const newContractsToCreate = [];
    for( let i=0; i < clientIdsToUpdate.length; i++){
        const contractData:any = await getBalanceById(clientIdsToUpdate[i].id_cliente);

        for( let x=0; x<contractData.length; x ++){
            
            const contractExists = queryContracts.docs.find( (f:any) => f.idContrato == contractData[0][x].idContrato );
            if( !contractExists ){
                const newContract = {
                    ...contractData[0][x],
                    _id: Date.now().toString(),
                    client_id: clientIdsToUpdate[i]._id,
                    created_by: `${process.env.COUCHDB_USER}`,
                    created_at: new Date().toISOString(),
                    branch: clientIdsToUpdate[i].branch,
                    couchdb_type: "CONTRACT",
                }
                newContractsToCreate.push(newContract);
                console.log(`${newContract.idContract}, created.`);
            }
        }

    }
    await db.bulk( {docs: newContractsToCreate });
    console.log(`Created contracts: ${newContractsToCreate.length}`);

    /*** create contracts for */
    
    return queryActions.docs.length;

}

const uniqueArray = (array:[]) => {
    return Array.from(
        array.reduce((set, e) => set.add(e), new Set())
    )
}


async function getCurrentLoanStatus(idSolicitud: number) {

    const pool = await sql.connect(sqlConfig);
    const result = await pool
        .request()
        .input("id", sql.Int, idSolicitud)
        .query("select * from OTOR_SolicitudPrestamos WHERE OTOR_SolicitudPrestamos.id = @id");

    if (result.recordsets.length) {
        if( !!result.recordset[0] )
        return {
            estatus: result.recordset[0].estatus.trim(),
            sub_estatus: result.recordset[0].sub_estatus.trim(),
        };

    }
    return undefined

}



router.get('/actions/fix/09042024', authorize, async (req, res) => {
    try {

        if (!req.query.loanAppId) {
            throw new Error('No id');
        }

        let loanAppId = req.query.loanAppId as string;

        const db = nano.use(process.env.COUCHDB_NAME ? process.env.COUCHDB_NAME : '');
        const queryActions = await db.find({
            selector: {
                couchdb_type: "LOANAPP_GROUP"
            },
            limit: 10000
        });

        //// Extraemos todos los LoanApp y evaluamos si el client_id esta vacio
        const loanappGrpList: any = queryActions.docs.map((i: any) => {

            return {
                ...i,
                mustBeUpdated: !!(i.members.find((w: any) => !w.client_id))
            }
        });

        const newListLoans = loanappGrpList.filter((i: any) => i._id === loanAppId)
        /// Iteramos y ejecutamos un update en cada LoanApp que requiere

        for (let d = 0; d < newListLoans.length; d++) {

            if (newListLoans[d].mustBeUpdated) {
                for (let s = 0; s < newListLoans[d].members.length; s++) {

                    const clientsQuery: any = await db.find({
                        selector: {
                            couchdb_type: "CLIENT",
                            id_cliente: newListLoans[d].members[s].id_cliente
                        }
                    })

                    const clientDoc = clientsQuery.docs.find((k: any) => k.id_cliente == newListLoans[d].members[s].id_cliente);
                    newListLoans[d].members[s].client_id = clientDoc._id


                }

                /// once the client_id field is populated, update LOANAPP_GROUP document
                const loanAppGrpObject = newListLoans[d];
                delete loanAppGrpObject.mustBeUpdated; // remove auxiliary fields
                await db.insert({ ...loanAppGrpObject });
            }
        }


        res.send(newListLoans);
    }
    catch (e: any) {
        console.log(e);
        res.status(400).send(e.message);
    }
});




export { router as ActionsRouter }
