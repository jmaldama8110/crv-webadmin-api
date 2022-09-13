const mongoose = require('mongoose')
const express = require("express");
const router = new express.Router();
const User = require("../model/user");
const Client = require('../model/client');
const Identityimg = require('../model/identityimg');
const Branch = require('../model/branch');
const notificationPush = require('../model/notificationPush');
const Province = require('../model/province');
const auth = require("../middleware/auth");
const moment = require("moment");
const formato = 'YYYY-MM-DD';


router.post("/clients", auth, async(req, res) =>{

    try{
        const registro = Object.keys(req.body)
        // if(!comparar(registro)){
        //     return res.status(400).send({ error: "Body includes invalid properties..." });
        // }

        const data = req.body;
        const status = [1, "Pendiente"];
        // console.log('datos cliente', data)

        const existClient = await Client.findOne({email: data.email});
        if(existClient){
            throw new Error("The email is already linked to a registered client")
        }

        const client = new Client({...data, status});
        
        // console.log(client);
        const result = await client.save();

        res.status(201).send(result);

    } catch(e){
        console.log(e + '')
        res.status(400).send(e + '')
    }
});

router.get("/clients", auth, async(req, res) =>{

    const match = {};

    try{
            if(req.query.id){
                match._id = req.query.id
            }

            const client = await Client.find(match);
            // console.log(client);
            if(!client || client.length === 0){
                throw new Error("Not able to find the client");
            }

            for(let i = 0; i < client.length; i++) {

                if(client[i].user_id != undefined){
                    const c1 = await client[i].populate('user_id',{veridoc:1}).execPopulate();
                    await c1.user_id.populate('veridoc', {frontImage: 1, backImage:1, faceImage: 1, _id:0}).execPopulate()
                }

            }

            res.status(200).send(client);

    } catch(e) {
        //    console.log(e)
        res.status(400).send(e + '');
    }
})

router.get("/statusClients/:status", auth, async(req, res) =>{

   try{
        const status = req.params.status;

        const clients = await Client.find({ status: { $in : [parseInt(status)] } });
        if(!clients || clients.length === 0){
            throw new Error("No records with this status");
        }

        res.status(200).send(clients);

   } catch(e) {
    //    console.log(e)
       res.status(400).send(e + '');
   }
})

router.patch("/clients/:id", auth, async(req, res) =>{

    
    try{
        // const update = req.body;
        // if(!comparar(update)){
        //     return res.status(400).send({ error: "Body includes invalid properties..." });
        // }

        const _id = req.params.id;
        const data = req.body;
        const actualizar = Object.keys(data);

        const client = await Client.findOne({_id});
        if(!client){
            throw new Error("Not able to find the client")
        }
        
     
        const user = await User.findOne({ client_id: mongoose.Types.ObjectId(_id) });
        if(user != null){
            actualizar.forEach((valor) => (user[valor] = data[valor]));
            await user.save()
            .then((result) =>{
                
            })
            .catch((e) =>{
                throw new Error("Error updating user");
            })
        }

        actualizar.forEach((valor) => (client[valor] = data[valor]));
        await client.save();

        res.status(200).send(client);
        
    }catch(e) {
        console.log(e + '');
        res.status(400).send(e + '');
    }

});

router.post('/checkHomonimos', async (req, res) => {
    try{
        const data = req.body;

        const result = await Client.getHomonimoHF(data.name, data.lastname, data.second_lastname);

        // return res.status(200).send(result);

        if(result.length > 0) {
            const finalResult = [];

            for(let i=0; i<result.length; i++) {
                const person = result[i];
                finalResult.push({
                    id_persona: person.id,
                    id_cliente: person.id_cliente ? person.id_cliente : 0,
                    name: person.nombre,
                    lastname: person.apellido_paterno,
                    second_lastname: person.apellido_materno,
                    curp: person.curp[0].trim(),
                    dob: person.fecha_nacimiento,
                    creation_date: person.fecha_registro
                });
            }

            return res.status(200).send(finalResult);
        }

        throw new Error('No se encontraron homónimos para esta persona');

    } catch(e){
        // console.log(e);
        res.status(400).send(e +'');
    }
});

router.patch('/updateCurp/:id', async (req, res) => {

    try{
        const data = req.body; //id_persona, curp, id_cliente
        const _id = req.params.id;

        const client = await Client.findOne({_id});
        if(!client){
            throw new Error('Could not find client');
        }

        const result = await Client.updateCurpPersonaHF(data.id_persona, data.curp);
        if(!result){
            throw new Error("Ocurrió un error al actualizar el curp de la persona")
        }

        //Enviamos la notificación al cliente, mandandole su id_cliente y curp
        const notification = {
            title: 'CONSERVA',
            notification: `Hemos detectado una inconsistencia de datos, por favor registrate como cliente ingresando tu curp y tu id de cliente: ${data.id_cliente}`
        }
        const notiPush = new notificationPush({ user_id: client.user_id, ...notification}) 
        await notiPush.save();

        //Eliminamos los datos del cliente para que se vuelva a registrar.
        const user = await User.findOne({_id: client.user_id});
        user.client_id = undefined;
        await user.save();
        await client.remove();

        res.status(200).send({message: "La curp se ha corregido satisfactoriamente, notificación enviada..."});

    } catch(e){
        console.log(e);
        res.status(400).send(e.message);
    }
});

router.post('/pruebaNotification/:id', async(req, res) => {
    try{

        const _id = req.params.id;
        const id_cliente = 5568974;

        const client = await Client.findOne({_id});
        if(!client){
            throw new Error('Could not find client');
        }

        const notification = {
            title: 'CONSERVA',
            notification: `Hemos detectado una inconsistencia de datos, por favor registrate como cliente ingresando tu curp y tu id de cliente: ${id_cliente}`
        }

        const notiPush = new notificationPush({ user_id: client.user_id, ...notification}) 
        await notiPush.save();

        const user = await User.findOne({_id: client.user_id});
        // user.client_id = undefined;
        // await user.save();

        res.status(200).send(user);

    } catch(e){
        res.status(400).send(e.message)
    }
});

router.post("/approveClient/:action/:id", auth, async(req, res) => {

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

        // return res.send(data);

        client = await Client.findOne({_id});
        if(!client){
            throw new Error("Not able to find the client");
        }
        backupClient = JSON.parse(JSON.stringify(client));

        if( action === "INSERTAR_PERSONA" && client.status[1] === "Aprobado"){
            throw new Error("This client is already approved");
        }

        if(action === 'ACTUALIZAR_PERSONA' || action === 'ACTUALIZAR_CLIENTE'){
            // value = 2;
            action === 'ACTUALIZAR_CLIENTE' ? value = 2 : value;
            console.log(action);
            console.log(value);
            update.forEach((campo) => (client[campo] = data[campo]))
            await client.save()

            const user = await User.findOne({ client_id: client._id});
            update.forEach((valor) => (user[valor] = data[valor]));
            await user.save();
        }

        const addresses = client.address;
        const dirDomi = addresses.filter(addresses => addresses.type === 'DOMICILIO');
        const dirIfe = addresses.filter(addresses => addresses.type === 'IFE');
        const dirRfc = addresses.filter(addresses => addresses.type === 'RFC');

        const phones = client.phones;

        const entidad_nac = dirDomi[0].province[0] ? dirDomi[0].province[0] : 5;
        const province = await Province.findOne({_id: entidad_nac});

        // Creamos/actualizamos la persona en el HF
        if(action === 'INSERTAR_PERSONA' || action === 'ACTUALIZAR_PERSONA'){
            console.log('Insertar/actualizar persona')
            person.DATOS_PERSONALES = [
                {
                    id: action === 'INSERTAR_PERSONA' ? 0 : client.id_persona,
                    nombre: client.name,
                    apellido_paterno: client.lastname ? client.lastname : "S/A",
                    apellido_materno: client.second_lastname ? client.second_lastname : "S/A",
                    fecha_nacimiento: client.dob ? getDates(client.dob) : "1970-01-01",
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
                    id_numero: client.ine_clave.slice(0,18)
                },
                {
                    id: action === 'INSERTAR_PERSONA' ? 0 : client.identities[1]._id,
                    id_entidad: action === 'INSERTAR_PERSONA' ? 0 : client.id_persona,
                    tipo_identificacion: "RFC",
                    id_numero: client.rfc ? client.rfc : client.curp.slice(0,10)
                }
            )
    
            person.DIRECCIONES = []     
            
            person.DIRECCIONES.push(
                {
                    id: action === 'INSERTAR_PERSONA' ? 0 : dirDomi[0]._id,
                    tipo:'DOMICILIO',
                    id_pais: dirDomi[0].country[0] ? dirDomi[0].country[0] : 1,
                    id_estado: dirDomi[0].province[0] ? dirDomi[0].province[0] : 5,
                    id_municipio: dirDomi[0].municipality[0] ? dirDomi[0].municipality[0] : 946,
                    id_localidad: dirDomi[0].city[0] ? dirDomi[0].city[0] : 1534,
                    id_asentamiento: dirDomi[0].colony[0] ? dirDomi[0].colony[0] : 42665,
                    direccion: dirDomi[0].address_line1 ? dirDomi[0].address_line1 : "CALLE...",
                    numero_exterior: "SN",
                    numero_interior: "SN",
                    referencia: dirDomi[0].street_reference ? dirDomi[0].street_reference :"FRENTE A ...",
                    casa_situacion: dirDomi[0].ownership ? dirDomi[0].ownership === true ? 1 : 0 : 0, //No se guarda el ownership 0 => RENTADO / 1- => PROPIO
                    tiempo_habitado_inicio: dirDomi[0].start_date ? getDates(dirDomi[0].start_date) :"2022-06-22",
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
                    tipo:'IFE',
                    id_pais: dirIfe.length >= 1 ? dirIfe[0].country[0] ? dirIfe[0].country[0] : (person.DIRECCIONES)[0].id_pais : (person.DIRECCIONES)[0].id_pais,
                    id_estado: dirIfe.length >= 1 ? dirIfe[0].province[0] ? dirIfe[0].province[0] : (person.DIRECCIONES)[0].id_estado :(person.DIRECCIONES)[0].id_estado,
                    id_municipio: dirIfe.length >= 1  ? dirIfe[0].municipality[0] ? dirIfe[0].municipality[0] : (person.DIRECCIONES)[0].id_municipio : (person.DIRECCIONES)[0].id_municipio,
                    id_localidad: dirIfe.length >= 1  ? dirIfe[0].city[0] ? dirIfe[0].city[0] : (person.DIRECCIONES)[0].id_localidad: (person.DIRECCIONES)[0].id_localidad,
                    id_asentamiento: dirIfe.length >= 1 ? dirIfe[0].colony[0] ? dirIfe[0].colony[0] : (person.DIRECCIONES)[0].id_asentamiento : (person.DIRECCIONES)[0].id_asentamiento,
                    direccion: dirIfe.length >= 1 ? dirIfe[0].address_line1 ? dirIfe[0].address_line1 : "Dirección IFE" : "Dirección IFE",
                    numero_exterior: "SN",
                    numero_interior: "SN",
                    referencia: dirIfe.length >= 1 ? dirIfe[0].street_reference ? dirIfe[0].street_reference : (person.DIRECCIONES)[0].referencia : (person.DIRECCIONES)[0].referencia,
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
                    tipo:'RFC',
                    id_pais: dirRfc.length >= 1 ? dirRfc[0].country[0] ? dirRfc[0].country[0] : (person.DIRECCIONES)[0].id_pais : (person.DIRECCIONES)[0].id_pais,
                    id_estado: dirRfc.length >= 1 ? dirRfc[0].province[0] ? dirRfc[0].province[0] : (person.DIRECCIONES)[0].id_estado :(person.DIRECCIONES)[0].id_estado,
                    id_municipio: dirRfc.length >= 1  ? dirRfc[0].municipality[0] ? dirRfc[0].municipality[0] : (person.DIRECCIONES)[0].id_municipio : (person.DIRECCIONES)[0].id_municipio,
                    id_localidad: dirRfc.length >= 1  ? dirRfc[0].city[0] ? dirRfc[0].city[0] : (person.DIRECCIONES)[0].id_localidad: (person.DIRECCIONES)[0].id_localidad,
                    id_asentamiento: dirRfc.length >= 1 ? dirRfc[0].colony[0] ? dirRfc[0].colony[0] : (person.DIRECCIONES)[0].id_asentamiento : (person.DIRECCIONES)[0].id_asentamiento,
                    direccion: dirRfc.length >= 1 ? dirRfc[0].address_line1 ? dirRfc[0].address_line1 : "Dirección RFC": "Dirección RFC",
                    numero_exterior: "SN",
                    numero_interior: "SN",
                    referencia: dirRfc.length >= 1 ? dirRfc[0].street_reference ? dirRfc[0].street_reference : (person.DIRECCIONES)[0].referencia : (person.DIRECCIONES)[0].referencia,
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
                    numero_emision: client.ine_duplicates ?  client.ine_duplicates.slice(0,2) : "00",
                    numero_vertical_ocr: client.ine_doc_number ? client.ine_doc_number.slice(0,13) : "0000000000000"
                }
            ]
    
            person.TELEFONOS = [];
            const phonePerson = phones[0];
    
            (person.TELEFONOS).push(
                {
                    id: action === 'INSERTAR_PERSONA' ? 0 : phonePerson._id,
                    idcel_telefono: phonePerson ? phonePerson.phone ? phonePerson.phone : "0000000000" :"0000000000",
                    extension: "",
                    tipo_telefono: phonePerson ? phonePerson.type ? phonePerson.type : "Móvil" : "Móvil",
                    compania: phonePerson ? phonePerson.company ? phonePerson.company : "Telcel" : "Telcel",
                    sms: 0
                }
            )

            result = await Client.createPersonHF(person, action);
            if(!result){
                throw new Error('Ocurrió un error al registrar la persona al HF');
            }
            console.log(result);
            id = result[0][0].id;
            // id = 1234;
        }
        

        if(action === 'ACTUALIZAR_PERSONA'){
            return res.status(200).send(result);
        }

        // // Crear/Actualizar el cliente
        clientHF.PERSONA = [
            {
                id: action === 'INSERTAR_PERSONA' ? id : client.id_persona
            }
        ];

        clientHF.TELEFONO = [];
        const phoneBusiness = phones[1];
        (clientHF.TELEFONO).push(
            {
                id: action === 'INSERTAR_PERSONA' ? 0 : phoneBusiness._id,
                idcel_telefono: phoneBusiness ? phoneBusiness.phone ? phoneBusiness.phone : "0000000000" : "000000000",
                extension: "",
                tipo_telefono: phoneBusiness? phoneBusiness.type ? phoneBusiness.type : " " : " ",
                compania: phoneBusiness ? phoneBusiness.company ? phoneBusiness.company : " " : " ",
                sms: 0
            }
        )

        const business_data = client.business_data;
        addresses.forEach((campo) => {
            if(campo.type === 'NEGOCIO'){
                clientHF.NEGOCIO = [
                    {
                        id: action === 'INSERTAR_PERSONA' ? 0 : client.data_company[0].id_empresa,
                        id_dir: action === 'INSERTAR_PERSONA' ? 0 : campo._id, //id de la dirección del negocio
                        nombre: business_data.business_name ? business_data.business_name : "NEGOCIO",
                        calle: campo.address_line1 ? campo.address_line1 : "Calle ...",
                        referencia: campo.street_reference ? campo.street_reference : "Frente a ...",
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
                        rfc: client.rfc ? client.rfc : client.curp.slice(0,10),
                        econ_registro_egresos_ingresos: 0,
                        casa_situacion: campo.ownership ? campo.ownership === true ? 1 :0 : 0,
                        correo_electronico: client.email ? client.email : "",
                        id_vialidad: 1,
                        nombre_oficina: business_data.business_name ? `OFICINA ${business_data.business_name}` : "OFICINA...", //Mandar el nombre del negocio concatenar 'Oficina'
                        nombre_puesto: business_data.position ? business_data.position :"dueño",//PONER SOLO dueño //no actualizar
                        departamento: business_data.department ? business_data.department : "cobranza",
                        numero_empleados: business_data.employees ? business_data.employees : 10,
                        registro_egresos: 0,
                        revolvencia: "QUINCENAL",
                        ventas_totales_cantidad: 5000.0,
                        ventas_totales_unidad: 0.0,
                        id_actividad_economica: business_data.economic_activity[0] ? business_data.economic_activity[0] : 716,
                        tiempo_actividad_incio: business_data.business_start_date ? getDates(business_data.business_start_date) : "2010-03-07",
                        tiempo_actividad_final: business_data.business_end_date ? getDates(business_data.business_end_date) : "2008-01-01",
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

        const response = await Client.createClientHF(clientHF, value);
        if(!response){
            console.log('Errorr', response);
            throw new Error('Ocurrió un error al registrar el cliente al HF');
        }

        const id_persona = response[0][0].id_persona;
        const id_cliente = response[0][0].id_cliente;

        //Creado el cliente agregamos sus datos del hf
        const dataHF = await Client.findClientByExternalId(id_cliente);
        const identificationsHF = addIdentities(dataHF.recordsets[1]);
        // const ife_details = dataHF.recordsets[2];
        const ife_details = {...dataHF.recordsets[2][dataHF.recordsets[2].length - 1]};
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

        res.status(201).send({
            result,
            response,
            person,
            clientHF
        });

    } catch(e) {
        //Si ocurre un error al modificar datos en el hf, rstauramos los datos de ese cliente en mongo
        if(action === 'ACTUALIZAR_PERSONA' || action === 'ACTUALIZAR_CLIENTE'){
            console.log('entró al catch al actualizar')
            const restoreClient = Object.keys(backupClient);
            restoreClient.forEach((campo) => (client[campo] = backupClient[campo]))
            await client.save();
        }
        console.log(e)
        res.status(400).send(e + ' ');
    }

});

router.get('/client/hf', auth, async(req, res) => {

    const dataHF = await Client.findClientByExternalId(req.query.id);

        const personData = {...dataHF.recordsets[0][0]};
    const econPer = {...dataHF.recordsets[7][0]}
    const business_data = {
        economic_activity: [econPer.id_actividad_economica, econPer.nombre_actividad_economica],
        profession: [econPer.id_profesion,econPer.nombre_profesion],
        business_name: econPer.nombre_negocio,
        business_start_date: econPer.econ_fecha_inicio_act_productiva
    }

    // console.log(personData);

    const province_of_birth = [personData.id_province_of_birth, personData.province_of_birth];
    const country_of_birth = [personData.id_country_of_birth, personData.country_of_birth];
    const nationality = [personData.id_nationality, personData.nationality];
    const branch = [personData.id_oficina, personData.nombre_oficina];

    const curp = dataHF.recordsets[1].find((i) => i.tipo_identificacion === "CURP");
    const ife = dataHF.recordsets[1].find((i) => i.tipo_identificacion === "IFE");
    const rfc = dataHF.recordsets[1].find((i) => i.tipo_identificacion === "RFC");

    const ife_details = {...dataHF.recordsets[2][dataHF.recordsets[2].length - 1]};
    const emision= ife_details ? ife_details.numero_emision : "";
    const vertical = ife_details ? ife_details.numero_vertical_ocr : "";
    const rfc2 = rfc ? rfc.id_numero : "";

    // console.log(emision);
    // console.log(vertical);
    // console.log(rfc2);

    res.status(200).send(dataHF);

});

router.delete("/clients/:id", auth, async(req, res) =>{

    try{
        const _id = req.params.id;

        const client = await Client.findOne({_id});
        if(!client){
            throw new Error("Not able to find the client");
        }

        const user = await User.findOne({client_id: client._id});
        if(user!= null){
            const userDeleted = await user.delete();
            if(!userDeleted){
                throw new Error("Error deleting user");
            }
        }

        const clientDeleted = await client.delete();
        if(!clientDeleted){
            throw new Error("Error deleting client");
        }

        res.status(200).send({
            client,
            message: 'Client successfully disabled'
        });

    }catch(e) {
       res.status(400).send(e + '');
    }

});

router.delete("/clientsBD/:id", auth, async(req, res) =>{

    try{
        const _id = req.params.id;

        const client = await Client.findOne({_id});
        if(!client){
            throw new Error("Not able to find the client");
        }

        const user = await User.findOne({client_id: client._id});
        if(user!= null){
            const userDeleted = await user.remove();
            if(!userDeleted){
                throw new Error("Error deleting user");
            }
        }

        const clientDeleted = await client.remove();
        if(!clientDeleted){
            throw new Error("Error deleting client");
        }

        res.status(200).send({
            client: `${client.name} ${client.lastname} ${client.second_lastname}`,
            message: 'Client removed successfully'
        });

    }catch(e) {
       res.status(400).send(e + '');
    }

});

router.get("/clientsDeleted", async(req, res) =>{
    try{

        const client = await Client.findDeleted()
        if(!client || client.length === 0){
            throw new Error("Not able to find the client");
        }

        res.status(200).send(client)

    }catch(e) {
        res.status(400).send(e + '')
    }
})

router.post("/clients/restore/:id", auth,async(req,res) =>{
    
    try{
        const _id = req.params.id;

        const client = await Client.findOneDeleted({_id});
        if(!client){
            throw new Error("Not able to find the client");
        }

        const user = await User.findOneDeleted({client_id: client._id});
        if(user!=null){
            const userRestore = await user.restore()
            if(!userRestore){
                throw new Error("Error restoring user");
            }
        }

        const clientRestore = await client.restore()
        if(!clientRestore){
            throw new Error("Error restore client");
        }
        
        res.status(200).send({
            client,
            message: 'Client successfully enabled'
        });

    }catch(e) {
       res.status(400).send(e + '');
    }

});

//------------Crear persona en HF
router.post('/createPersonHF', auth, async(req, res) => {
    try {
        const result = await Client.createPersonHF(req.body,'INSERTAR_PERSONA')

        res.status(201).send(result);
    } catch (error) {
        res.status(401).send(error.message)
    }
});

// ------------------- Crear  cliente idividual en HF
router.post('/clients/hf/create', auth, async(req, res) => { // FUNCIONA
    try {
        const result = await Client.createClientHF(req.body);

        res.status(201).send(result, 1);

    } catch (error) {
        res.status(401).send(error.message)
    }
});

const removeAccents = (str) => {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
};

const comparar = (entrada) => {
    const permitido = ["name","lastname","second_lastname","email","password","curp","ine_clave", "ine_duplicates", "ine_doc_number","dob","segmento","loan_cicle","client_type","branch","is_new","bussiness_data","gender","scolarship","address","phones","credit_circuit_data","external_id", "status"];
    const result = entrada.every(campo => permitido.includes(campo));
    return result;
}

const getDates = (fecha) => {
    const date = moment.utc(fecha).format(formato)
    return date;
}

const addIdentities = (body) => {
    const identities = []
    for( let i=0; i< body.length; i++){
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

const addPhones = (body) =>{
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

module.exports = router;