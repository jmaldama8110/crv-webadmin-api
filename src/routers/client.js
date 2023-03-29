const express = require("express");
const router = new express.Router();
const User = require("../model/user");
const Client = require('../model/client');
const notificationPush = require('../model/notificationPush');
const Province = require('../model/province');
const nano = require('../db/connCouch');
const authorize = require("../middleware/authorize");

const moment = require("moment");
const formato = 'YYYY-MM-DD';
const sendSms = require("../sms/sendsms");
const formatLocalCurrency = require('../utils/numberFormatter');


router.get("/clients/hf", authorize, async(req, res) => {

    //  get the Client Data with identityNumber and externalId
    /* 
      recordsets[0][0]  -> Datos personsales
      recordsets[1] Dataset -> Identificaciones
      recordsets[2] Dataset -> Datos del IFE / INE
      recordsets[3] Direcciones -> Direcciones  
      recordsets[4] Telefonos
      recordsets[5] Aval
      recordsets[6] Ciclo
      recordsets[7] Datos economicos
      */
    try {
        
        let data;
        if ( (req.query.externalId) ) {
            data = await Client.findClientByExternalId(req.query.externalId);
        } else {
            throw new Error('Some query parameters area mising...')
        }
        
        if (data.recordset.length == 1) {

            /// extract CURP and Ine Folio
            const curp = data.recordsets[1].find(
                (i) => i.tipo_identificacion === "CURP"
            );

            const ife = data.recordsets[1].find(
                (i) => i.tipo_identificacion === "IFE"
            );
            const rfc = data.recordsets[1].find(
                (i) => i.tipo_identificacion === "RFC"
            );

            /// busca el detalle de la IFE/INE
            const ineDetail = data.recordsets[2]
            const ine_detalle = ineDetail.find( (i) => i.id_identificacion_oficial === ife.id_numero )

            const identities = []
            for( let i=0; i< data.recordsets[1].length; i++){
                const itemIdentity = data.recordsets[1][i];
                identities.push({
                    _id: itemIdentity.id,
                    id_persona: itemIdentity.id_persona,
                    tipo_id: itemIdentity.tipo_identificacion,
                    numero_id: itemIdentity.id_numero,
                    id_direccion: itemIdentity.id_direccion,
                    status: itemIdentity.estatus_registro
                })
            }

            const address = []
            for (let i = 0; i < data.recordsets[3].length; i++) {
                const add = data.recordsets[3][i]

                address.push({
                    _id: add.id,
                    type: add.tipo.trim(),

                    country: [`COUNTRY|${add.id_pais}`,  add.nombre_pais],

                    province: [`PROVINCE|${add.id_estado}`, add.nombre_estado],
                    municipality: [`MUNICIPALITY|${add.id_municipio}`, add.nombre_municipio],
                    city: [`CITY|${add.id_ciudad_localidad}`, add.nombre_ciudad_localidad],
                    colony: [`NEIGHBORHOOD|${add.id_asentamiento}`, add.nombre_asentamiento],
                    address_line1: add.direccion,
                    ext_number: add.numero_exterior,
                    int_number: add.numero_interior,
                    street_reference: add.referencia,
                    ownership: add.casa_situacion === 'RENTADO' ? true : false,
                    post_code: add.codigo_postal,
                    residence_since: add.tiempo_habitado_inicio,
                    residence_to: add.tiempo_habitado_final
                })
            }
            const phones = [];
            for (let l = 0; l < data.recordsets[4].length; l++) {
                
                const phoneAdd = data.recordsets[4][l]
                if( phoneAdd.idcel_telefono.trim() ){
                    phones.push({
                        _id: phoneAdd.id,
                        phone: phoneAdd.idcel_telefono.trim(),
                        type: phoneAdd.tipo_telefono.trim(),
                        company: phoneAdd.compania.trim(),
                        validated: false
                    });
                }
            }

            const perSet = {
                ...data.recordsets[0][0],
            };
            
            let business_data = { 
                economic_activity:[], 
                profession:[],
                business_name: '',
                business_start_date:'',
                business_owned: false,
                business_phone: ""
            }

            let econActId = 0, econActCap = ''
            if( data.recordsets[7][0].id_actividad_economica ){
                econActId = data.recordsets[7][0].id_actividad_economica ? data.recordsets[7][0].id_actividad_economica : 0,
                econActCap =  data.recordsets[7][0].nombre_actividad_economica ? data.recordsets[7][0].nombre_actividad_economica.toString(): '';
            }

            const   profId = data.recordsets[7][0].id_profesion ? data.recordsets[7][0].id_profesion : 0,
                    profCap = data.recordsets[7][0].nombre_profesion? data.recordsets[7][0].nombre_profesion.toString() : '';
            const   occupId = perSet.id_occupation ? perSet.id_occupation : 0,
                    occupCap = perSet.occupation? perSet.occupation.toString() : '';

            if( data.recordsets[7].length ) {
                business_data = {
                    economic_activity: [ econActId,econActCap],
                    profession: [profId, profCap],
                    business_name: data.recordsets[7][0].nombre_negocio,
                    business_start_date: data.recordsets[7][0].econ_fecha_inicio_act_productiva,
                    business_owned: false,
                    business_phone: ""    
                }
            }

            const cicloData = data.recordsets[6]
            const loan_cycle = cicloData.length ? cicloData[0].ciclo : 0

            const result = {
                id_persona: perSet.id_persona,
                id_cliente: perSet.id,
                name: perSet.name,
                lastname: perSet.lastname,
                second_lastname: perSet.second_lastname,
                email: `${perSet.second_lastname}_${perSet.lastname}_${perSet.name}_${perSet.gender}@conserva.org.mx`,
                curp: curp ? curp.id_numero : "",
                clave_ine: ife ? ife.id_numero : "",
                numero_emisiones: ine_detalle ? ine_detalle.numero_emision: '',
                numero_vertical: ine_detalle ? ine_detalle.numero_vertical_ocr : '',
                rfc: rfc ? rfc.id_numero : "",
                dob: perSet.dob,
                loan_cycle,
                branch: [perSet.id_oficina, perSet.nombre_oficina],
                sex: [perSet.id_gender, perSet.gender],
                education_level: [perSet.id_scholarship, perSet.scholarship],
                identities,
                address,
                phones,
                tributary_regime: [],
                not_bis: false,
                client_type: [2,'INDIVIDUAL'],
                nationality: [perSet.id_nationality, perSet.nationality],
                province_of_birth: [
                    `PROVINCE|${perSet.id_province_of_birth}`,
                    perSet.province_of_birth,
                ],
                country_of_birth: [
                    `COUNTRY|${perSet.id_country_of_birth}`,
                    perSet.country_of_birth,
                ],
                ocupation: [occupId , occupCap],
                marital_status: [perSet.id_marital_status, perSet.marital_status],
                identification_type: [], // INE/PASAPORTE/CEDULA/CARTILLA MILITAR/LICENCIA
                guarantor: [],
                business_data,
                beneficiaries: [],
                personal_references: [],
                guarantee: [],
                ife_details: ineDetail,
                data_company: [data.recordsets[8][0]],
                data_efirma: [data.recordsets[9][0]],
                
            };
            res.send(result);
        } else {
            
            res.status(404).send("Not found");
        }
    } catch (err) {
        console.log(err);
        res.status(404).send('Client data not found');
    }
});

router.get('/clients/hf/getBalance', authorize, async(req, res) => {
    
    try{
        const result = await Client.getBalanceById(req.query.idCliente);
        res.send(result[0]);
    } catch (error) {
        res.status(401).send(error.message)
    }
});

router.get('/clients/hf/loanapps', authorize, async(req, res) => {
    try{
        if( !(req.query.branchId && req.query.applicationId) ){
            throw new Error('Query parametrs branchId or groupName are missing!')
        }
        const data = await Client.getSolicitudServicioFinanciero(parseInt(req.query.applicationId),parseInt(req.query.branchId));
        
        /**
         * resultsets[0] => Detalle de la solicitud
         * resultsets[1] => Ciclo y estatus 
         * resultsets[4] => Integrantes, cargo, etc (importe solicitado, autorizado, etc)
         * resultsets[5] => Detalle Seguro (Costo, tipo seguro, Beneficiario, parentezco, etc)
         * resultsets[7] => Avales (Costo, tipo seguro, Beneficiario, parentezco, etc)
         */ 
        const loan_application = data[0][0];
        const loan_cycle = data[1][0];

        const db = nano.use(process.env.COUCHDB_NAME);

        await db.createIndex({ index:{  fields:["couchdb_type"] }});
        const productList = await db.find( { selector: { couchdb_type: "PRODUCT" }});
        const productMaster = productList.docs.find( (prod)=> prod.external_id == loan_application.id_producto_maestro  )
        
        const identifierFreq = loan_application.periodicidad.slice(0,1);
        const frequency = productMaster.allowed_term_type.find( (i) => i.identifier === identifierFreq)
        /// Uses the same loan application info, except some field, ei: id_solicitud,
        /// and fecha Desembolso y Fecha primer pago
        const fechaDesNew = new Date();
        const fechaPPagoNew = new Date();

        fechaDesNew.setDate(fechaDesNew.getDate() + 7);
        fechaPPagoNew.setDate( fechaPPagoNew.getDate() + 14);

        const members = data[4].map( (i,nCounter) =>{
            const insuranceMemberInfo = data[5].find( (x)=> x.id_individual === i.id_individual);
            ///// buscar en la DB local si existe el integrante, como cliente por medio de id_cliente
            return {
                _id: `${Date.now() + nCounter}`,
                id_member: i.id,
                id_cliente: i.id_individual,
                fullname: `${i.nombre} ${i.apellido_paterno} ${i.apellido_materno}`,
                estatus: i.estatus.trim(),
                sub_estatus: i.sub_estatus.trim(),
                position: i.cargo.trim(),
                apply_amount: i.monto_solicitado,
                approved_amount: i.monto_autorizado,
                previous_amount: i.monto_anterior,
                loan_cycle: i.ciclo,
                disbursment_mean: i.id_cata_medio_desembolso,
                insurance: {
                    beneficiary: (insuranceMemberInfo ? insuranceMemberInfo.nombre_beneficiario : ''),
                    relationship: (insuranceMemberInfo ? insuranceMemberInfo.parentesco : ''),
                    percentage: (insuranceMemberInfo ? insuranceMemberInfo.porcentaje : 0 )
                }
            }
        })

        const loan_app = {
            id_cliente: loan_application.id_cliente,
            id_solicitud: loan_application.id, // uses the same Id of the previous one
            loan_officer: loan_application.id_oficial,
            branch: loan_application.id_oficina,
            id_producto: loan_application.id_producto,
            id_disposicion: loan_application.id_disposicion,
            apply_amount: loan_application.monto_total_solicitado,
            approved_total: loan_application.monto_total_autorizado,
            term: loan_application.plazo,
            frequency: [frequency.identifier,frequency.value],
            first_repay_date: fechaPPagoNew.toISOString(),
            disbursment_date: fechaDesNew.toISOString(),
            disbursment_mean: loan_application.medio_desembolso.trim(),
            liquid_guarantee: loan_application.garantia_liquida,
            loan_cycle: loan_cycle.ciclo,
            estatus: "TRAMITE", // para renovacion
            sub_estatus: "NUEVO TRAMITE", /// 
            renovation: true,
            members,
            product: {
              external_id: productMaster.external_id,
              min_amount: productMaster.min_amount,
              max_amount: (productMaster.max_amount)*(members.length),
              step_amount: productMaster.step_amount,
              min_term: productMaster.min_term,
              max_term: productMaster.max_term,
              product_name: productMaster.product_name,
              term_types: productMaster.allowed_term_type,
              rate: productMaster.rate,
              tax: productMaster.tax,
              GL_financeable: false,
              liquid_guarantee: 10,
            }
        }

        res.send(loan_app)

    }

    catch(err){
        console.log(err);
        res.status(400).send(err);

    }
})

router.get('/clients/hf/accountstatement', authorize, async (req, res)=> {

    try {
        const months = ['01','02','03','04','05','06','07','08','09','10','11','12'];
        const idContract = req.query.contractId;
        const dateFrom = new Date(req.query.dateFrom);
        const dateEnd = new Date(req.query.dateEnd);
        const yearDate = dateEnd.getFullYear().toString();
        const month = dateEnd.getMonth().toString();
        const monthDate = months[ month ];
        const forceRefresh = !!parseInt(req.query.forceRefresh);
        let data = {};

        const db = nano.use(process.env.COUCHDB_NAME);
        try{
            data = await db.get(`CONTRACT|${idContract}`);   

            const queryDate = new Date(data.query_at);
            const now = new Date();
            const timeDiff = now.getTime() - queryDate.getTime();
            // converts miliseconds in hours, and calculate 6 hours for normal refresh
            const hoursDiff = timeDiff / (1000 * 3600);
            if( (hoursDiff > 12 || forceRefresh ) ){
                throw error('not account statement found, thus continue on cached block')
            }
            // retrieves only the Record Set part of the document
            res.send(data.rs);
        }
        catch(e) {
            
            let rs = await Client.getObtenerEstadoCuentaPeriodo(  parseInt(idContract),
                                                                dateFrom,
                                                                dateEnd,
                                                                parseInt(yearDate),
                                                                parseInt(monthDate) );
            /// rs -> Result set of the account statement at the time being query
            /// query_at -> timestamp when the query was last saved
            const timeNow = new Date().toISOString();
            /// Insert or Update document
            await db.insert({ ...data,rs, query_at: timeNow, couchdb_type: "ACC_STATEMENT"}, `CONTRACT|${idContract}`);
            res.send(rs); 
        }

    }
    catch(error){
        console.log(error);
        res.status(400).send(error);
    }
})

router.get('/clients/createReference', authorize, async(req, res) => {
    try {
        //TODO: typeReference: 1 -> id: Crédito por id_cliente (NO USAR)
        //      typeReference: 2 -> id: Garantía Líquida por id_cliente
        //      typeReference: 3 -> id: Pago de moratorios por id_cliente
        //      typeReference: 6 -> id: Pago de crédito por id_contrato

        const {typeReference, id, idIntermediario} = req.query;
        const result = await Client.createReference(typeReference, id);
        const data = idIntermediario ? result.filter( (i) => i.id_intermerdiario == idIntermediario ) : result
    
        res.status(200).send(data);
    } catch (error) {
        res.status(401).send(error.message);
    }
})


router.patch('/updateCurp/:id', async (req, res) => {

    try {
        const data = req.body; //id_persona, curp, id_cliente
        const _id = req.params.id;

        const client = await Client.findOne({ _id });
        if (!client) {
            throw new Error('Could not find client');
        }

        const result = await Client.updateCurpPersonaHF(data.id_persona, data.curp);
        if (!result) {
            throw new Error("Ocurrió un error al actualizar el curp de la persona")
        }

        //Enviamos la notificación al cliente, mandandole su id_cliente y curp
        const notification = {
            title: 'CONSERVA',
            notification: `Hemos detectado una inconsistencia al momento de validar tus datos. Por favor vuelve a completar tu registro ingresando tu CURP y tu número de cliente: ${data.id_cliente}`
        }
        const notiPush = new notificationPush({ user_id: client.user_id, ...notification })
        await notiPush.save();

        const user = await User.findOne({ _id: client.user_id });
        const body = `Hola ${user.name} hemos detectado una inconsistencia al momento de validar tus datos. \n\nPor favor vuelve a completar tu registro ingresando tu CURP y tu número de cliente: ${data.id_cliente}`
        sendSms(`+52${user.phone}`, body);

        // Reseteamos el completado de datos
        user.restartCheckList('client_completion');
        user.client_id = undefined;
        await user.save();
        //Eliminamos los datos del cliente para que se vuelva a registrar.
        await client.remove();

        res.status(200).send({ message: "La curp se ha corregido satisfactoriamente, notificación enviada..." });

    } catch (e) {
        console.log(e);
        res.status(400).send(e.message);
    }
});

router.post('/pruebaNotification/:id', async (req, res) => {
    try {

        const _id = req.params.id;
        const id_cliente = 5568974;

        const client = await Client.findOne({ _id });
        if (!client) {
            throw new Error('Could not find client');
        }

        const notification = {
            title: 'CONSERVA',
            notification: `Hemos detectado una inconsistencia de datos, por favor registrate como cliente ingresando tu curp y tu id de cliente: ${id_cliente}`
        }

        const notiPush = new notificationPush({ user_id: client.user_id, ...notification })
        await notiPush.save();

        const user = await User.findOne({ _id: client.user_id });
        // user.client_id = undefined;
        // await user.save();

        res.status(200).send(user);

    } catch (e) {
        res.status(400).send(e.message)
    }
});

router.post("/approveClient/:action/:id", authorize, async (req, res) => {

    const _id = req.params.id;
    const action = req.params.action;//Para insertar o actualizar la persona
    let client;
    let value = 1;//para insertar/actualizar el cliente
    let backupClient;
    const person = {};
    let result;
    let id = 0;
    const clientHF = {};
    
    try{

        const update = Object.keys(req.body);
        const data = req.body;

        client = await Client.findOne({ _id });
        if (!client) {
            throw new Error("Not able to find the client");
        }
        backupClient = JSON.parse(JSON.stringify(client));

        if (action === "INSERTAR_PERSONA" && client.status[1] === "Aprobado") {
            throw new Error("This client is already approved");
        }

        if (action === 'ACTUALIZAR_PERSONA' || action === 'ACTUALIZAR_CLIENTE') {
            action === 'ACTUALIZAR_CLIENTE' ? value = 2 : value;
            console.log(action);
            console.log(value);
            update.forEach((campo) => (client[campo] = data[campo]))
            await client.save()

            const user = await User.findOne({ client_id: client._id });
            update.forEach((valor) => (user[valor] = data[valor]));
            await user.save();
        }

        const addresses = client.address;
        const dirDomi = addresses.filter(addresses => addresses.type === 'DOMICILIO');
        const dirIfe = addresses.filter(addresses => addresses.type === 'IFE');
        const dirRfc = addresses.filter(addresses => addresses.type === 'RFC');

        const phones = client.phones;

        const entidad_nac = dirDomi[0].province[0] ? dirDomi[0].province[0] : 5;
        const province = await Province.findOne({ _id: entidad_nac });

        // Creamos/actualizamos la persona en el HF
        if (action === 'INSERTAR_PERSONA' || action === 'ACTUALIZAR_PERSONA') {
            console.log('Insertar/actualizar persona')
            person.DATOS_PERSONALES = [
                {
                    id: action === 'INSERTAR_PERSONA' ? 0 : client.id_persona,
                    nombre: client.name,
                    apellido_paterno: client.lastname ? client.lastname : "S/A",
                    apellido_materno: client.second_lastname ? client.second_lastname : "S/A",
                    fecha_nacimiento: client.dob ? getDates(client.dob) : "1990-01-01",
                    id_sexo: client.sex[0] ? client.sex[0] : 4,
                    id_escolaridad: client.education_level[0] ? client.education_level[0] : 2,
                    id_estado_civil: client.marital_status[0] ? client.marital_status[0] : 1,
                    entidad_nacimiento: `${province.etiqueta}-${province.abreviatura}`,
                    regimen: client.tributary_regime[1] ? client.tributary_regime[1] : " ",
                    id_oficina: client.branch && client.branch[0] ? client.branch[0] : 1,
                    curp_fisica: 0,
                    datos_personales_diferentes_curp: 0,
                    id_entidad_nacimiento: client.province_of_birth[0] ? client.province_of_birth[0] : dirDomi[0].province[0] ? dirDomi[0].province[0] : 5,
                    id_nacionalidad: client.nationality[0] ? client.nationality[0] : 1,
                    id_pais_nacimiento: client.country_of_birth[0] ? client.country_of_birth[0] : 1,
                    es_pep: 0,
                    es_persona_prohibida: 0
                }
            ]

            person.IDENTIFICACIONES = [];
            person.IDENTIFICACIONES.push(
                {
                    id: action === 'INSERTAR_PERSONA' ? 0 : client.identities[2]._id,
                    id_entidad: action === 'INSERTAR_PERSONA' ? 0 : client.id_persona,
                    tipo_identificacion: "CURP",
                    id_numero: client.curp
                },
                {
                    id: action === 'INSERTAR_PERSONA' ? 0 : client.identities[0]._id,
                    id_entidad: action === 'INSERTAR_PERSONA' ? 0 : client.id_persona,
                    tipo_identificacion: "IFE",
                    id_numero: client.ine_clave.slice(0, 18)
                },
                {
                    id: action === 'INSERTAR_PERSONA' ? 0 : client.identities[1]._id,
                    id_entidad: action === 'INSERTAR_PERSONA' ? 0 : client.id_persona,
                    tipo_identificacion: "RFC",
                    id_numero: client.rfc && client.rfc != "" ? client.rfc : client.curp.slice(0, 13)
                }
            )

            person.DIRECCIONES = []

            person.DIRECCIONES.push(
                {
                    id: action === 'INSERTAR_PERSONA' ? 0 : dirDomi[0]._id,
                    tipo: 'DOMICILIO',
                    id_pais: dirDomi[0].country[0] ? dirDomi[0].country[0] : 1,
                    id_estado: dirDomi[0].province[0] ? dirDomi[0].province[0] : 5,
                    id_municipio: dirDomi[0].municipality[0] ? dirDomi[0].municipality[0] : 946,
                    id_localidad: dirDomi[0].city[0] ? dirDomi[0].city[0] : 1534,
                    id_asentamiento: dirDomi[0].colony[0] ? dirDomi[0].colony[0] : 42665,
                    direccion: dirDomi[0].address_line1 ? dirDomi[0].address_line1 : " ",
                    numero_exterior: "SN",
                    numero_interior: "SN",
                    referencia: dirDomi[0].address_line1 ? dirDomi[0].address_line1 : " ",
                    casa_situacion: dirDomi[0].ownership ? dirDomi[0].ownership === true ? 1 : 0 : 0, //No se guarda el ownership 0 => RENTADO / 1- => PROPIO
                    tiempo_habitado_inicio: dirDomi[0].start_date ? getDates(dirDomi[0].start_date) : "2022-06-22",
                    tiempo_habitado_final: dirDomi[0].end_date ? getDates(dirDomi[0].end_date) : "2022-06-20",
                    correo_electronico: client.email,
                    num_interior: 0,
                    num_exterior: 0,
                    id_vialidad: dirDomi[0].road ? dirDomi[0].road[0] : 5,//vialidad
                    domicilio_actual: 1
                }
            )

            //Si no se encuentra una dirección del IFE, se le asignará el mismo del domicilio
            person.DIRECCIONES.push(
                {
                    id: action === 'INSERTAR_PERSONA' ? 0 : dirIfe[0]._id,
                    tipo: 'IFE',
                    id_pais: dirIfe.length >= 1 ? dirIfe[0].country[0] ? dirIfe[0].country[0] : (person.DIRECCIONES)[0].id_pais : (person.DIRECCIONES)[0].id_pais,
                    id_estado: dirIfe.length >= 1 ? dirIfe[0].province[0] ? dirIfe[0].province[0] : (person.DIRECCIONES)[0].id_estado : (person.DIRECCIONES)[0].id_estado,
                    id_municipio: dirIfe.length >= 1 ? dirIfe[0].municipality[0] ? dirIfe[0].municipality[0] : (person.DIRECCIONES)[0].id_municipio : (person.DIRECCIONES)[0].id_municipio,
                    id_localidad: dirIfe.length >= 1 ? dirIfe[0].city[0] ? dirIfe[0].city[0] : (person.DIRECCIONES)[0].id_localidad : (person.DIRECCIONES)[0].id_localidad,
                    id_asentamiento: dirIfe.length >= 1 ? dirIfe[0].colony[0] ? dirIfe[0].colony[0] : (person.DIRECCIONES)[0].id_asentamiento : (person.DIRECCIONES)[0].id_asentamiento,
                    direccion: dirIfe.length >= 1 ? dirIfe[0].address_line1 ? dirIfe[0].address_line1 : (person.DIRECCIONES)[0].direccion : (person.DIRECCIONES)[0].direccion,
                    numero_exterior: "SN",
                    numero_interior: "SN",
                    referencia: dirIfe.length >= 1 ? dirIfe[0].street_reference ? dirIfe[0].street_reference : (person.DIRECCIONES)[0].direccion : (person.DIRECCIONES)[0].direccion,
                    casa_situacion: dirIfe.length >= 1 ? dirIfe[0].ownership ? dirIfe[0].ownership === true ? 1 : 0 : 0 : (person.DIRECCIONES)[0].casa_situacion,
                    tiempo_habitado_inicio: dirIfe.length >= 1 ? dirIfe[0].start_date ? getDates(dirIfe[0].start_date) : (person.DIRECCIONES)[0].tiempo_habitado_inicio : (person.DIRECCIONES)[0].tiempo_habitado_inicio,
                    tiempo_habitado_final: dirIfe.length >= 1 ? dirIfe[0].end_dat ? getDates(dirIfe[0].end_date) : (person.DIRECCIONES)[0].tiempo_habitado_final : (person.DIRECCIONES)[0].tiempo_habitado_final,
                    correo_electronico: client.email,
                    num_interior: 0,
                    num_exterior: 0,
                    id_vialidad: 5,//vialidad
                    domicilio_actual: 1
                }
            )

            //Agregamos la dirección del RFC
            person.DIRECCIONES.push(
                {
                    id: action === 'INSERTAR_PERSONA' ? 0 : dirRfc[0]._id,
                    tipo: 'RFC',
                    id_pais: dirRfc.length >= 1 ? dirRfc[0].country[0] ? dirRfc[0].country[0] : (person.DIRECCIONES)[0].id_pais : (person.DIRECCIONES)[0].id_pais,
                    id_estado: dirRfc.length >= 1 ? dirRfc[0].province[0] ? dirRfc[0].province[0] : (person.DIRECCIONES)[0].id_estado : (person.DIRECCIONES)[0].id_estado,
                    id_municipio: dirRfc.length >= 1 ? dirRfc[0].municipality[0] ? dirRfc[0].municipality[0] : (person.DIRECCIONES)[0].id_municipio : (person.DIRECCIONES)[0].id_municipio,
                    id_localidad: dirRfc.length >= 1 ? dirRfc[0].city[0] ? dirRfc[0].city[0] : (person.DIRECCIONES)[0].id_localidad : (person.DIRECCIONES)[0].id_localidad,
                    id_asentamiento: dirRfc.length >= 1 ? dirRfc[0].colony[0] ? dirRfc[0].colony[0] : (person.DIRECCIONES)[0].id_asentamiento : (person.DIRECCIONES)[0].id_asentamiento,
                    direccion: dirRfc.length >= 1 ? dirRfc[0].address_line1 ? dirRfc[0].address_line1 : (person.DIRECCIONES)[0].direccion : (person.DIRECCIONES)[0].direccion,
                    numero_exterior: "SN",
                    numero_interior: "SN",
                    referencia: dirRfc.length >= 1 ? dirRfc[0].street_reference ? dirRfc[0].street_reference : (person.DIRECCIONES)[0].direccion : (person.DIRECCIONES)[0].direccion,
                    casa_situacion: dirRfc.length >= 1 ? dirRfc[0].ownership ? dirRfc[0].ownership === true ? 1 : 0 : 0 : (person.DIRECCIONES)[0].casa_situacion,
                    tiempo_habitado_inicio: dirRfc.length >= 1 ? dirRfc[0].start_date ? getDates(dirRfc[0].start_date) : (person.DIRECCIONES)[0].tiempo_habitado_inicio : (person.DIRECCIONES)[0].tiempo_habitado_inicio,
                    tiempo_habitado_final: dirRfc.length >= 1 ? dirRfc[0].end_dat ? getDates(dirRfc[0].end_date) : (person.DIRECCIONES)[0].tiempo_habitado_final : (person.DIRECCIONES)[0].tiempo_habitado_final,
                    correo_electronico: client.email,
                    num_interior: 0,
                    num_exterior: 0,
                    id_vialidad: 5,
                    domicilio_actual: 1
                }
            )

            person.DATOS_IFE = [
                {
                    id: action === 'INSERTAR_PERSONA' ? 0 : client.ife_details[0].id,
                    numero_emision: client.ine_duplicates ? client.ine_duplicates.slice(0, 2) : "00",
                    numero_vertical_ocr: client.ine_doc_number ? client.ine_doc_number.slice(0, 13) : "0000000000000"
                }
            ]

            person.TELEFONOS = [];
            const phonePerson = phones[0];

            (person.TELEFONOS).push(
                {
                    id: action === 'INSERTAR_PERSONA' ? 0 : phonePerson._id,
                    idcel_telefono: phonePerson ? phonePerson.phone ? phonePerson.phone : "0000000000" : "0000000000",
                    extension: "",
                    tipo_telefono: phonePerson ? phonePerson.type ? phonePerson.type : "Móvil" : "Móvil",
                    compania: phonePerson ? phonePerson.company ? phonePerson.company : "Telcel" : "Telcel",
                    sms: 0
                }
            )

            result = await Client.createPersonHF(person, action);
            if (!result) {
                throw new Error('Ocurrió un error al registrar la persona al HF');
            }
            // console.log(result);
            id = result[0][0].id;
            // id = 1234;
        }


        if (action === 'ACTUALIZAR_PERSONA') {
            return res.status(200).send(result);
        }

        // // Crear/Actualizar el cliente
        clientHF.PERSONA = [
            {
                id: action === 'INSERTAR_PERSONA' ? id : client.id_persona
            }
        ];

        clientHF.TELEFONO = [];
        const phonePerson = phones[0];
        const phoneBusiness = phones[1];
        (clientHF.TELEFONO).push(
            {
                id: action === 'INSERTAR_PERSONA' ? 0 : phoneBusiness._id,
                idcel_telefono: phoneBusiness ? phoneBusiness.phone ? phoneBusiness.phone : phonePerson.phone : phonePerson.phone,
                extension: "",
                tipo_telefono: phoneBusiness ? phoneBusiness.type ? phoneBusiness.type : " " : " ",
                compania: phoneBusiness ? phoneBusiness.company ? phoneBusiness.company : " " : " ",
                sms: 0
            }
        )

        const business_data = client.business_data;
        addresses.forEach((campo) => {
            if (campo.type === 'NEGOCIO') {
                clientHF.NEGOCIO = [
                    {
                        id: action === 'INSERTAR_PERSONA' ? 0 : client.data_company[0].id_empresa,
                        id_dir: action === 'INSERTAR_PERSONA' ? 0 : campo._id, //id de la dirección del negocio
                        nombre: business_data.business_name ? business_data.business_name : "NEGOCIO",
                        calle: campo.address_line1 ? campo.address_line1 : "Calle ...",
                        referencia: campo.address_line1 ? campo.address_line1 : "Calle ...",
                        letra_exterior: "SN",
                        letra_interior: "SN",
                        num_exterior: 0,
                        num_interior: 0,
                        id_pais: campo.country[0] ? campo.country[0] : 1,
                        id_estado: campo.province[0] ? campo.province[0] : 5,
                        id_municipio: campo.municipality[0] ? campo.municipality[0] : 946,
                        id_ciudad: campo.city[0] ? campo.city[0] : 1534,
                        id_colonia: campo.colony[0] ? campo.colony[0] : 42665,
                        cp: campo.post_code,
                        rfc: client.rfc && client.rfc != "" ? client.rfc : client.curp.slice(0, 13),
                        econ_registro_egresos_ingresos: 0,
                        casa_situacion: campo.ownership ? campo.ownership === true ? 1 : 0 : 0,
                        correo_electronico: client.email ? client.email : "",
                        id_vialidad: 1,
                        nombre_oficina: business_data.business_name ? `OFICINA ${business_data.business_name}` : "OFICINA...", //Mandar el nombre del negocio concatenar 'Oficina'
                        nombre_puesto: business_data.position ? business_data.position : "dueño",//PONER SOLO dueño //no actualizar
                        departamento: business_data.department ? business_data.department : "cobranza",
                        numero_empleados: business_data.employees ? business_data.employees : 10,
                        registro_egresos: 0,
                        revolvencia: "QUINCENAL",
                        ventas_totales_cantidad: 5000.0,
                        ventas_totales_unidad: 0.0,
                        id_actividad_economica: business_data.economic_activity[0] ? business_data.economic_activity[0] : 716,
                        tiempo_actividad_incio: business_data.business_start_date ? getDates(business_data.business_start_date) : "1970-01-01",
                        tiempo_actividad_final: business_data.business_end_date ? getDates(business_data.business_end_date) : "1970-01-01",
                        id_empresa: action === 'INSERTAR_PERSONA' ? 0 : client.data_company[0].id_empresa,
                        id_oficina_empresa: action === 'INSERTAR_PERSONA' ? 0 : client.data_company[0].id_oficina_empresa
                    }
                ]
            }
        });

        clientHF.CLIENTE = [
            {
                id_cliente: action === 'INSERTAR_PERSONA' ? 0 : client.id_cliente,//id del cliente
                id_oficina: client.branch && client.branch[0] ? client.branch[0] : 1,
                id_oficial_credito: 0
            }
        ]

        clientHF.IDENTIFICACIONES = [
            {
                id: action === 'INSERTAR_PERSONA' ? 0 : client.identities[3]._id,
                id_entidad: action === 'INSERTAR_PERSONA' ? 0 : client.id_persona,
                tipo_identificacion: "PROSPERA",
                id_numero: ""
            }
        ]

        clientHF.INDIVIDUAL = [ //Datos socieconomicos
            {
                id_cliente: action === 'INSERTAR_PERSONA' ? 0 : client.id_cliente,
                id_persona: action === 'INSERTAR_PERSONA' ? id : client.id_persona,
                econ_ocupacion: client.ocupation[1] ? client.ocupation[1] : "EMPLEADO",
                econ_id_actividad_economica: 5,
                econ_id_destino_credito: 5,
                econ_id_ubicacion_negocio: 14,
                econ_id_rol_hogar: 1,
                econ_id_empresa: 1,
                econ_cantidad_mensual: 0.0,
                econ_sueldo_conyugue: 0.0,
                econ_otros_ingresos: 0.0,
                econ_otros_gastos: 0.0,
                econ_familiares_extranjeros: 0,
                econ_parentesco: "",
                envia_dinero: 0,
                econ_dependientes_economicos: 1,
                econ_pago_casa: 0.0,
                econ_gastos_vivienda: 2000.0,
                econ_gastos_familiares: 0.0,
                econ_gastos_transporte: 0.0,
                credito_anteriormente: 0,
                mejorado_ingreso: 0,
                lengua_indigena: 0,
                habilidad_diferente: 0,
                utiliza_internet: 0,
                utiliza_redes_sociales: 0,
                id_actividad_economica: business_data.economic_activity[0] != undefined ? business_data.economic_activity[0] : 5,
                id_ocupacion: client.ocupation[0] ? client.ocupation[0] : 12,
                id_profesion: business_data.profession[0] ? business_data.profession[0] : 5
            }
        ]

        clientHF.PLD = [
            {
                id_cliente: action === 'INSERTAR_PERSONA' ? 0 : client.id_cliente,
                desempenia_funcion_publica: 0,
                desempenia_funcion_publica_cargo: "",
                desempenia_funcion_publica_dependencia: "",
                familiar_desempenia_funcion_publica: 0,
                familiar_desempenia_funcion_publica_cargo: "",
                familiar_desempenia_funcion_publica_dependencia: "",
                familiar_desempenia_funcion_publica_nombre: "",
                familiar_desempenia_funcion_publica_paterno: "",
                familiar_desempenia_funcion_publica_materno: "",
                familiar_desempenia_funcion_publica_parentesco: "",
                id_instrumento_monetario: 1
            }
        ]

        clientHF.BANCARIO = []

        clientHF.EFIRMA = [
            {
                id_firma_electronica: action === 'INSERTAR_PERSONA' ? 0 : client.data_efirma[0].id,
                fiel: ""
            }
        ]

        // console.log(person);
        // console.log(clientHF);

        const response = await Client.createClientHF(clientHF, value);
        if (!response) {
            console.log('Errorr', response);
            throw new Error('Ocurrió un error al registrar el cliente al HF');
        }

        const id_persona = response[0][0].id_persona;
        const id_cliente = response[0][0].id_cliente;

        //Creado el cliente agregamos sus datos del hf
        const dataHF = await Client.findClientByExternalId(id_cliente);
        const identificationsHF = addIdentities(dataHF.recordsets[1]);
        // const ife_details = dataHF.recordsets[2];
        const ife_details = { ...dataHF.recordsets[2][dataHF.recordsets[2].length - 1] };
        const addressHF = addAddress(dataHF.recordsets[3]);
        const phonesHF = addPhones(dataHF.recordsets[4]);
        const personData = dataHF.recordsets[0][0];

        client["id_persona"] = id_persona;
        client["id_cliente"] = id_cliente;
        client["phones"] = phonesHF;
        client["address"] = addressHF;
        client["identities"] = identificationsHF;
        client["ife_details"] = ife_details;
        client["ine_duplicates"] = ife_details ? ife_details.numero_emision : "00";
        client["data_company"] = dataHF.recordsets[8];
        client["data_efirma"] = dataHF.recordsets[9];
        client["branch"] = [personData.id_oficina, personData.nombre_oficina]
        client["nationality"] = [personData.id_nationality, personData.nationality];
        client["province_of_birth"] = [personData.id_province_of_birth, personData.province_of_birth]
        client["country_of_birth"] = [personData.id_country_of_birth, personData.country_of_birth]
        client["status"] = [2, "Aprobado"];
        await client.save();

        if (action === 'INSERTAR_PERSONA') {
            const user = await User.findOne({ client_id: _id })
            const body = `Bienvenido ${user.name}, tus datos han sido verificados, ahora ya eres cliente de Conserva. \nYa puedes solicitar cualquiera de nuestros créditos disponibles para ti. Siempre estaremos aquí cerca para ayudarte en lo que necesites.`;
            sendSms(`+52${user.phone}`, body)
        }

        res.status(201).send({
            result,
            response,
            person,
            clientHF
        });

    } catch (e) {
        //Si ocurre un error al modificar datos en el hf, rstauramos los datos de ese cliente en mongo
        if (action === 'ACTUALIZAR_PERSONA' || action === 'ACTUALIZAR_CLIENTE') {
            console.log('entró al catch al actualizar')
            const restoreClient = Object.keys(backupClient);
            restoreClient.forEach((campo) => (client[campo] = backupClient[campo]))
            await client.save();
        }
        console.log(e)
        res.status(400).send(e + ' ');
    }

});

router.get('/clients/exits', authorize, async (req, res)=>{

    try {

        if( !req.query.identityNumber ){
            throw new Error('Identity Number parameter is required..');
        }

        data = await Client.findClientByCurp(req.query.identityNumber);
        if( data.recordset.length == 1 ){
            /// recordsets[0][0] contains personal Info from HF
            const personalData = {
                ...data.recordsets[0][0],
            };
        
            res.send({ id_cliente: personalData.id });
        } else {
            res.send({id_cliente: ''});
        }

    }
    catch(error){
        console.log(error)
        res.status(400).send(error)
    }
});

router.post('/createClientHF/:id', authorize, async (req, res) => {
    try {

        const _id = req.params.id
        const client = await Client.findById(_id);
        if (!client) {
            return res.status(204).send('Not found any record');
        }

        // return  res.send(client);

        const clientHF = {};
        const phones = client.phones;
        const addresses = client.address;

        clientHF.PERSONA = [
            {
                id: client.id_persona ? client.id_persona : 0
            }
        ];

        clientHF.TELEFONO = [];
        const phonePerson = phones[0];
        const phoneBusiness = phones[1];

        (clientHF.TELEFONO).push(
            {
                id: 0,
                idcel_telefono: phoneBusiness ? phoneBusiness.phone ? phoneBusiness.phone : phonePerson.phone : phonePerson.phone,
                extension: "",
                tipo_telefono: phoneBusiness ? phoneBusiness.type ? phoneBusiness.type : "Móvil" : "Móvil",
                compania: phoneBusiness ? phoneBusiness.company ? phoneBusiness.company : "Telcel" : "Telcel",
                sms: 0
            }
        );

        const business_data = client.business_data;
        const dirBussiness = addresses.filter(addresses => addresses.type === 'NEGOCIO');
        const dirNego = dirBussiness[0];

        clientHF.NEGOCIO = [
            {
                id: 0,
                id_dir: 0, //id de la dirección del negocio
                nombre: business_data.business_name ? business_data.business_name : "MI NEGOCIO",
                calle: dirNego.address_line1 ? dirNego.address_line1 : " ",
                referencia: dirNego.address_line1 ? dirNego.address_line1 : " ",
                letra_exterior: "SN",
                letra_interior: "SN",
                num_exterior: 0,
                num_interior: 0,
                id_pais: dirNego.country[0] ? dirNego.country[0] : 1,
                id_estado: dirNego.province[0] ? dirNego.province[0] : 5,
                id_municipio: dirNego.municipality[0] ? dirNego.municipality[0] : 946,
                id_ciudad: dirNego.city[0] ? dirNego.city[0] : 1534,
                id_colonia: dirNego.colony[0] ? dirNego.colony[0] : 42665,
                cp: dirNego.post_code,
                rfc: client.rfc && client.rfc != "" ? client.rfc : client.curp.slice(0, 13),
                econ_registro_egresos_ingresos: 0,
                casa_situacion: dirNego.ownership ? dirNego.ownership === true ? 1 : 0 : 0,
                correo_electronico: client.email ? client.email : "",
                id_vialidad: 1,
                nombre_oficina: business_data.business_name ? `OFICINA ${business_data.business_name}` : "OFICINA...", //Mandar el nombre del negocio concatenar 'Oficina'
                nombre_puesto: business_data.position ? business_data.position : "dueño",//PONER SOLO dueño //no actualizar
                departamento: business_data.department ? business_data.department : "cobranza",
                numero_empleados: business_data.employees ? business_data.employees : 10,
                registro_egresos: 0,
                revolvencia: "QUINCENAL",
                ventas_totales_cantidad: 5000.0,
                ventas_totales_unidad: 0.0,
                id_actividad_economica: business_data.economic_activity[0] ? business_data.economic_activity[0] : 716,
                tiempo_actividad_incio: business_data.business_start_date ? getDates(business_data.business_start_date) : "1970-01-01",
                tiempo_actividad_final: business_data.business_end_date ? getDates(business_data.business_end_date) : "1970-01-01",
                id_empresa: 0,
                id_oficina_empresa: 0
            }
        ];

        clientHF.CLIENTE = [
            {
                id_cliente: 0,
                id_oficina: client.branch && client.branch[0] ? client.branch[0] : 1,
                id_oficial_credito: 0
            }
        ]

        clientHF.IDENTIFICACIONES = [
            {
                id: 0,
                id_entidad: 0,
                tipo_identificacion: "PROSPERA",
                id_numero: ""
            }
        ]

        clientHF.INDIVIDUAL = [ //Datos socieconomicos
            {
                id_cliente: 0,
                id_persona: client.id_persona,
                econ_ocupacion: client.ocupation[1] ? client.ocupation[1] : "EMPLEADO",
                econ_id_actividad_economica: 5,
                econ_id_destino_credito: 5,
                econ_id_ubicacion_negocio: 14,
                econ_id_rol_hogar: 1,
                econ_id_empresa: 1,
                econ_cantidad_mensual: 0.0,
                econ_sueldo_conyugue: 0.0,
                econ_otros_ingresos: 0.0,
                econ_otros_gastos: 0.0,
                econ_familiares_extranjeros: 0,
                econ_parentesco: "",
                envia_dinero: 0,
                econ_dependientes_economicos: 1,
                econ_pago_casa: 0.0,
                econ_gastos_vivienda: 2000.0,
                econ_gastos_familiares: 0.0,
                econ_gastos_transporte: 0.0,
                credito_anteriormente: 0,
                mejorado_ingreso: 0,
                lengua_indigena: 0,
                habilidad_diferente: 0,
                utiliza_internet: 0,
                utiliza_redes_sociales: 0,
                id_actividad_economica: business_data.economic_activity[0] ? business_data.economic_activity[0] : 5,
                id_ocupacion: client.ocupation[0] ? client.ocupation[0] : 12,
                id_profesion: business_data.profession[0] ? business_data.profession[0] : 5
            }
        ]

        clientHF.PLD = [
            {
                id_cliente: 0,
                desempenia_funcion_publica: 0,
                desempenia_funcion_publica_cargo: "",
                desempenia_funcion_publica_dependencia: "",
                familiar_desempenia_funcion_publica: 0,
                familiar_desempenia_funcion_publica_cargo: "",
                familiar_desempenia_funcion_publica_dependencia: "",
                familiar_desempenia_funcion_publica_nombre: "",
                familiar_desempenia_funcion_publica_paterno: "",
                familiar_desempenia_funcion_publica_materno: "",
                familiar_desempenia_funcion_publica_parentesco: "",
                id_instrumento_monetario: 1
            }
        ]

        clientHF.BANCARIO = []

        clientHF.EFIRMA = [
            {
                id_firma_electronica: 0,
                fiel: ""
            }
        ];
        // console.log(clientHF);

        // return res.status(201).send({
        //     clientHF
        // })

        const response = await Client.createClientHF(clientHF, 1);
        if (!response) {
            console.log('Errorr', response);
            throw new Error('Ocurrió un error al registrar el cliente al HF');
        }

        const id_persona = response[0][0].id_persona;
        const id_cliente = response[0][0].id_cliente;

        //Creado el cliente agregamos sus datos del hf
        const dataHF = await Client.findClientByExternalId(id_cliente);
        const identificationsHF = addIdentities(dataHF.recordsets[1]);
        const ife_details = { ...dataHF.recordsets[2][dataHF.recordsets[2].length - 1] };
        const addressHF = addAddressClientHF(addresses, dataHF.recordsets[3]);
        const phonesHF = addPhones(dataHF.recordsets[4]);
        const personData = dataHF.recordsets[0][0];

        client["id_persona"] = id_persona;
        client["id_cliente"] = id_cliente;
        client["phones"] = phonesHF;
        client["address"] = addressHF;
        client["identities"] = identificationsHF;
        client["ife_details"] = ife_details;
        client["ine_duplicates"] = ife_details ? ife_details.numero_emision : "00";
        client["data_company"] = dataHF.recordsets[8];
        client["data_efirma"] = dataHF.recordsets[9];
        client["branch"] = [personData.id_oficina, personData.nombre_oficina]
        client["nationality"] = [personData.id_nationality, personData.nationality];
        client["province_of_birth"] = [personData.id_province_of_birth, personData.province_of_birth]
        client["country_of_birth"] = [personData.id_country_of_birth, personData.country_of_birth]
        client["status"] = [2, "Aprobado"];
        await client.save();

        res.status(201).send({
            response,
            clientHF
        });

    } catch (e) {
        console.log(e)
        res.status(400).send(e.message)
    }
})

router.post('/sendsms', authorize, async (req, res) => {
    try {

        const data = req.body;
        const cantidad = formatLocalCurrency(30000)
        // console.log(typeof data.message)
        const body = `La cantidad solicitada es de  ${cantidad} pesos`

        sendSms('+529191207777', body);
        res.send('ok');

    } catch (e) {
        res.status(404).send(e.message);
    }
})

router.get('/client/hf', authorize, async (req, res) => {
    try {
        if (!req.query.id) {
            throw new Error('Some query parameters area mising...')
        }
        const dataHF = await Client.findClientByExternalId(req.query.id);
        res.status(200).send(dataHF);
    } catch (e) {
        res.status(400).send(e.message);
    }

});

// router.get('/person/hf', authorize, async (req, res) => {

//     try {

//         if (!req.query.curp) {
//             throw new Error('Some query parameters area mising...')
//         }

//         const personHF = await Client.findPersonByCurp(req.query.curp);

//         res.status(200).send(personHF);

//     } catch (e) {
//         res.status(400).send(e.message);
//     }

// });

// router.delete("/clients/:id", authorize, async (req, res) => {

//     try {
//         const _id = req.params.id;

//         const client = await Client.findOne({ _id });
//         if (!client) {
//             throw new Error("Not able to find the client");
//         }

//         const user = await User.findOne({ client_id: client._id });
//         if (user != null) {
//             const userDeleted = await user.delete();
//             if (!userDeleted) {
//                 throw new Error("Error deleting user");
//             }
//         }

//         const clientDeleted = await client.delete();
//         if (!clientDeleted) {
//             throw new Error("Error deleting client");
//         }

//         res.status(200).send({
//             client,
//             message: 'Client successfully disabled'
//         });

//     } catch (e) {
//         res.status(400).send(e + '');
//     }

// });

// router.delete("/clientsBD", authorize, async (req, res) => {

//     try {

//         const match = {};

//         if (req.query.id) {
//             match._id = req.query.id;
//         }

//         const client = await Client.find(match);
//         if (!client || client.length === 0) {
//             throw new Error("Not found any record");
//         }

//         for (let i = 0; i < client.length; i++) {
//             const dataClient = client[i];
//             // console.log(dataClient._id)
//             const user = await User.findOne({ client_id: dataClient._id });
//             if (user != null) {
//                 const userDeleted = await user.remove();
//                 if (!userDeleted) {
//                     throw new Error("Error deleting user");
//                 }
//             }

//             const clientDeleted = await dataClient.remove();
//             if (!clientDeleted) {
//                 throw new Error("Error deleting client");
//             }
//         }

//         res.status(200).send('Done!')

//     } catch (e) {
//         console.log(e)
//         res.status(400).send(e + '');
//     }

// });

// router.get("/clientsDeleted", async (req, res) => {
//     try {

//         const client = await Client.findDeleted()
//         if (!client || client.length === 0) {
//             throw new Error("Not able to find the client");
//         }

//         res.status(200).send(client)

//     } catch (e) {
//         res.status(400).send(e + '')
//     }
// })

// router.post("/clients/restore/:id", auth, async (req, res) => {

//     try {
//         const _id = req.params.id;

//         const client = await Client.findOneDeleted({ _id });
//         if (!client) {
//             throw new Error("Not able to find the client");
//         }

//         const user = await User.findOneDeleted({ client_id: client._id });
//         if (user != null) {
//             const userRestore = await user.restore()
//             if (!userRestore) {
//                 throw new Error("Error restoring user");
//             }
//         }

//         const clientRestore = await client.restore()
//         if (!clientRestore) {
//             throw new Error("Error restore client");
//         }

//         res.status(200).send({
//             client,
//             message: 'Client successfully enabled'
//         });

//     } catch (e) {
//         res.status(400).send(e + '');
//     }

// });


//------------Crear persona en HF
// router.post('/createPersonHF', auth, async (req, res) => {
//     try {
//         const result = await Client.createPersonHF(req.body, 'INSERTAR_PERSONA')

//         res.status(201).send(result);
//     } catch (error) {
//         res.status(401).send(error.message)
//     }
// });

// // ------------------- Crear  cliente idividual en HF
// router.post('/clients/hf/create', auth, async (req, res) => { // FUNCIONA
//     try {
//         const result = await Client.createClientHF(req.body);

//         res.status(201).send(result, 1);

//     } catch (error) {
//         res.status(401).send(error.message)
//     }
// });


const getDates = (fecha) => {
    const date = moment.utc(fecha).format(formato)
    return date;
}

const addIdentities = (body) => {
    const identities = []
    for (let i = 0; i < body.length; i++) {
        const itemIdentity = body[i];
        identities.push({
            _id: itemIdentity.id,
            id_persona: itemIdentity.id_persona,
            tipo_id: itemIdentity.tipo_identificacion,
            numero_id: itemIdentity.id_numero,
            id_direccion: itemIdentity.id_direccion,
            status: itemIdentity.estatus_registro
        })

    }

    return identities;
}

const addAddress = (body) => {
    const address = []
    for (let i = 0; i < body.length; i++) {
        const add = body[i]

        address.push({
            _id: add.id,
            type: add.tipo.trim(),

            country: [add.id_pais, add.nombre_pais],

            province: [add.id_estado, add.nombre_estado],
            municipality: [add.id_municipio, add.nombre_municipio],
            city: [add.id_ciudad_localidad, add.nombre_ciudad_localidad],
            colony: [add.id_asentamiento, add.nombre_asentamiento],

            address_line1: add.direccion,
            ext_number: add.numero_exterior.trim(),
            int_number: add.numero_interior.trim(),
            street_reference: add.referencia,
            ownership: add.casa_situacion === 'RENTADO' ? true : false,
            post_code: add.codigo_postal,
            residence_since: add.tiempo_habitado_inicio,
            residence_to: add.tiempo_habitado_final
        })
    }

    return address;
}

const addAddressClientHF = (addressMongo, addressHF) => {
    const address = []
    const domicilio = addressMongo.find((item) => (item.type === 'DOMICILIO'));

    // console.log('domicilio', domicilio);
    for (let i = 0; i < addressHF.length; i++) {
        const add = addressHF[i];

        if (add.tipo.trim() === 'DOMICILIO') {
            add.id_pais = domicilio.country[0];
            add.nombre_pais = domicilio.country[1];
            add.id_estado = domicilio.province[0];
            add.nombre_estado = domicilio.province[1];
            add.id_municipio = domicilio.municipality[0];
            add.nombre_municipio = domicilio.municipality[1];
            add.id_ciudad_localidad = domicilio.city[0];
            add.nombre_ciudad_localidad = domicilio.city[1];
            add.id_asentamiento = domicilio.colony[0];
            add.nombre_asentamiento = domicilio.colony[1];
            add.direccion = domicilio.address_line1;
            add.codigo_postal = domicilio.post_code;
            add.casa_situacion = domicilio.ownership ? 'PROPIO' : 'RENTADO';
        }

        // console.log(add);

        address.push({
            _id: add.id,
            type: add.tipo.trim(),

            country: [add.id_pais, add.nombre_pais],

            province: [add.id_estado, add.nombre_estado],
            municipality: [add.id_municipio, add.nombre_municipio],
            city: [add.id_ciudad_localidad, add.nombre_ciudad_localidad],
            colony: [add.id_asentamiento, add.nombre_asentamiento],

            address_line1: add.direccion,
            ext_number: add.numero_exterior.trim(),
            int_number: add.numero_interior.trim(),
            street_reference: add.referencia,
            ownership: add.casa_situacion === 'RENTADO' ? false : true,
            post_code: add.codigo_postal,
            residence_since: add.tiempo_habitado_inicio,
            residence_to: add.tiempo_habitado_final
        })
    }

    return address;
}

const addPhones = (body) => {
    const phones = []
    for (let i = 0; i < body.length; i++) {
        const phone = body[i]
        phones.push({
            _id: phone.id,
            phone: phone.idcel_telefono.trim(),
            type: phone.tipo_telefono.trim(),
            company: phone.compania.trim(),
            validated: false
        })
    }

    return phones;
}

const orderGuarantees = (guarantees) => {

    const guarantee = JSON.parse(JSON.stringify(guarantees));

    const equipment = [];
    const vehicle = [];
    const property = [];
    const result = {};


    for (let i = 0; i < guarantee.length; i++) {
        const data = guarantee[i];
        if (data.guarantee_type === 'equipment') {
            delete data.property;
            delete data.vehicle;
            equipment.push(data);
        }
        if (data.guarantee_type === 'vehicle') {
            delete data.equipment;
            delete data.property;
            vehicle.push(data)
        }
        if (data.guarantee_type === 'property') {
            delete data.equipment;
            delete data.vehicle;
            property.push(data)
        }
    }

    result.equipment = equipment;
    result.vehicle = vehicle;
    result.property = property;

    // console.log(result);

    return result;
}

module.exports = router;