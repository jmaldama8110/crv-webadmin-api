const mongoose = require('mongoose')
const express = require("express");
const router = new express.Router();
const User = require("../model/user");
const Client = require('../model/client');
const Identityimg = require('../model/identityimg');
const Branch = require('../model/branch');
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

        const valid = validStatus(status);
        if(!valid) {
            throw new Error("The status does not match any of the accepted statuses");
        }

        const clients = await Client.find({ status: { $in : [status] } });
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

router.post("/approveClient/:id", auth, async(req, res) => {
    
    try{

        const _id = req.params.id;
        const approve = Object.keys(req.body);
        const data = req.body;
        let official_idHf = 0;

        console.log(data);

        //Buscamos el oficial de la sucursal 
        if(data.branch != undefined && data.branch[0] != undefined){
            const official = await Branch.getOficialCredito(data.branch[0]);
            official_idHf = official[0].id_oficial; //Checar a qué oficial le asignamos el cliente porque en una officina hay varios oficiales
        }
        console.log(official_idHf);

        const client = await Client.findOne({_id});
        if(!client){
            throw new Error("Not able to find the client");
        }


        if(client.status[1] === "Aprobado"){
            throw new Error("This client is already approved");
        }
        
        // Una vez aprobado el cliente, procedemos a crear la persona en el HF
        const person = {};

        person.DATOS_PERSONALES = [
            {
                nombre: client.name,
                apellido_paterno: client.lastname,
                apellido_materno: client.second_lastname ? client.second_lastname : "S/A",
                fecha_nacimiento: client.dob ? getDates(client.dob) : "2000-08-02",
                id_sexo: client.sex[0],
                id_escolaridad: client.education_level[0] ? client.education_level[0] : 2,
                id_estado_civil: client.marital_status[0] ? client.marital_status[0] : 1,
                entidad_nacimiento: client.province_of_birth[1],
                regimen: client.tributary_regime[1] ? client.tributary_regime[1] : " ",
                id_oficina: data.branch && data.branch[0] ? data.branch[0] : 1, //Consultar el catálogo de oficinas
                curp_fisica: 0,
                datos_personales_diferentes_curp: 0,
                id_entidad_nacimiento: client.province_of_birth ? client.province_of_birth[0] : 5,
                id_nacionalidad: client.nationality ? client.nationality[0] : 1,
                id_pais_nacimiento: client.country_of_birth ? client.country_of_birth[0] : 1,
                es_pep: 0,
                es_persona_prohibida: 0
            }
        ]

        const identification = client.identification_type;

        person.IDENTIFICACIONES = [];
        person.IDENTIFICACIONES.push(
            {
                id_entidad: client.province_of_birth ? client.province_of_birth[0] : 5,
                tipo_identificacion: "CURP",
                id_numero: client.curp
            },
            {
                id_entidad: client.province_of_birth ? client.province_of_birth[0] : 5,
                tipo_identificacion: "IFE",
                id_numero: client.ine_clave
            },
            {
                id_entidad: client.province_of_birth ? client.province_of_birth[0] : 5,
                tipo_identificacion: "RFC",
                id_numero: client.rfc
            },
        )

        person.DIRECCIONES = []
        const addresses = client.address;

        const dirDomi = addresses.filter(addresses => addresses.type === 'DOMICILIO');
        const dirIfe = addresses.filter(addresses => addresses.type === 'IFE');
        const dirRfc = addresses.filter(addresses => addresses.type === 'RFC');
        
        
        person.DIRECCIONES.push(
            {
                tipo:'DOMICILIO',
                id_pais: dirDomi[0].country[0] ? dirDomi[0].country[0] : 1,
                id_estado: dirDomi[0].province[0] ? dirDomi[0].province[0] : 5,
                id_municipio: dirDomi[0].municipality[0] ? dirDomi[0].municipality[0] : 946,
                id_localidad: dirDomi[0].city[0] ? dirDomi[0].city[0] : 1534,
                id_asentamiento: dirDomi[0].colony[0] ? dirDomi[0].colony[0] : 42665,
                direccion: dirDomi[0].address_line1 ? dirDomi[0].address_line1 : "CALLE...",
                numero_exterior: dirDomi[0].exteriorNum ? dirDomi[0].exteriorNum : "SN",
                numero_interior: dirDomi[0].interiorNum ? dirDomi[0].interiorNum : "SN",
                referencia: dirDomi[0].reference ? dirDomi[0].reference :"FRENTE A ...",
                casa_situacion: 0,
                tiempo_habitado_inicio: dirDomi[0].start_date ? getDates(dirDomi[0].start_date) :"2022-06-22",
                tiempo_habitado_final: dirDomi[0].end_date ? getDates(dirDomi[0].end_date) : "2022-06-20",
                correo_electronico: client.email,
                num_interior: 2,
                num_exterior: 1,
                id_vialidad: dirDomi[0].road ? dirDomi[0].road[0] : 5,//vialidad
                domicilio_actual: 1
            }
        )
        
        //Si no se encuentra una dirección del IFE, se le asignará el mismo del domicilio, solo cambiando el tipo
        person.DIRECCIONES.push(
            {
                tipo:'IFE',
                id_pais: dirIfe.length >= 1 ? dirIfe[0].country[0] ? dirIfe[0].country[0] : (person.DIRECCIONES)[0].id_pais : (person.DIRECCIONES)[0].id_pais,
                id_estado: dirIfe.length >= 1 ? dirIfe[0].province[0] ? dirIfe[0].province[0] : (person.DIRECCIONES)[0].id_estado :(person.DIRECCIONES)[0].id_estado,
                id_municipio: dirIfe.length >= 1  ? dirIfe[0].municipality[0] ? dirIfe[0].municipality[0] : (person.DIRECCIONES)[0].id_municipio : (person.DIRECCIONES)[0].id_municipio,
                id_localidad: dirIfe.length >= 1  ? dirIfe[0].city[0] ? dirIfe[0].city[0] : (person.DIRECCIONES)[0].id_localidad: (person.DIRECCIONES)[0].id_localidad,
                id_asentamiento: dirIfe.length >= 1 ? dirIfe[0].colony[0] ? dirIfe[0].colony[0] : (person.DIRECCIONES)[0].id_asentamiento : (person.DIRECCIONES)[0].id_asentamiento,
                direccion: dirIfe.length >= 1 ? dirIfe[0].address_line1 ? dirIfe[0].address_line1 : (person.DIRECCIONES)[0].direccion : (person.DIRECCIONES)[0].direccion,
                numero_exterior: dirIfe.length >= 1 ? dirIfe[0].exteriorNum ? dirIfe[0].exteriorNum  : (person.DIRECCIONES)[0].numero_exterior : (person.DIRECCIONES)[0].numero_exterior,
                numero_interior: dirIfe.length >= 1 ? dirIfe[0].interiorNum ? dirIfe[0].interiorNum : (person.DIRECCIONES)[0].numero_interior : (person.DIRECCIONES)[0].numero_interior,
                referencia: dirIfe.length >= 1 ? dirIfe[0].reference ? dirIfe[0].reference : (person.DIRECCIONES)[0].referencia : (person.DIRECCIONES)[0].referencia,
                casa_situacion: 0,
                tiempo_habitado_inicio: dirIfe.length >= 1 ? dirIfe[0].start_date ? getDates(dirIfe[0].start_date) : (person.DIRECCIONES)[0].tiempo_habitado_inicio : (person.DIRECCIONES)[0].tiempo_habitado_inicio,
                tiempo_habitado_final: dirIfe.length >= 1 ? dirIfe[0].end_dat ? getDates(dirIfe[0].end_date) : (person.DIRECCIONES)[0].tiempo_habitado_final : (person.DIRECCIONES)[0].tiempo_habitado_final,
                correo_electronico: client.email,
                num_interior: 2,
                num_exterior: 1,
                id_vialidad: 5,//vialidad
                domicilio_actual: 1
            }
        )

        person.DATOS_IFE = [
            {
                numero_emision: "00",
                numero_vertical_ocr: client.ine_folio
            }
        ]

        person.TELEFONOS = [];
        const phones = client.phones;

        phones.forEach((phone) => {
            (person.TELEFONOS).push(
                {
                    idcel_telefono: phone.phone,
                    extension: "",
                    tipo_telefono: phone.type,
                    compania: phone.company ? phone.company : "Telcel",
                    sms: 0
                }
            )
        });

        const result = await Client.createPersonHF(person)
        console.log(result);

        if(!result){
            throw new Error('Ocurrió un error al registrar la persona al HF');
        }


        // Crear el cliente
        const id = result[0][0].id;
        // const id = 1234;
        const clientHF = {}

        clientHF.PERSONA = [
            {
                id
            }
        ];

        clientHF.TELEFONO = [];
        phones.forEach((phone) => {
            (clientHF.TELEFONO).push(
                {
                    idcel_telefono: phone.phone,
                    extension: "",
                    tipo_telefono: phone.type,
                    compania: phone.company ? phone.company : "Telcel",
                    sms: 0
                }
            )
        });

        const business_data = client.business_data;

        addresses.forEach((campo) => {
            if(campo.type === 'NEGOCIO'){
                clientHF.NEGOCIO = [
                    {
                        nombre: business_data.business_name ? business_data.business_name : "SIN NOMBRE DE NEGOCIO",
                        calle: campo.address_line1 ? campo.address_line1 : "Calle ...",
                        referencia: campo.reference ? campo.referece : "Frente a ...",
                        letra_exterior: campo.letra_exterior ? campo.letra_exterior : "C",
                        letra_interior: campo.letra_interior ? campo.letra_interior : "D",
                        num_exterior: campo.num_exterior ? campo.num_exterior : 0,
                        num_interior: campo.num_interior ? campo.num_interior : 0,
                        id_pais: campo.country[0] ? campo.country[0] : 1,
                        id_estado: campo.province[0] ? campo.province[0] : 5,
                        id_municipio: campo.municipality[0] ? campo.municipality[0] : 946,
                        id_ciudad: campo.city[0] ? campo.city[0] : 1534,
                        id_colonia: campo.colony[0] ? campo.colony[0] : 42665,
                        cp: campo.post_code,
                        rfc: client.rfc ? client.rfc : "",
                        econ_registro_egresos_ingresos: 0,
                        casa_situacion: 0,
                        correo_electronico: client.email ? client.email : "",
                        id_vialidad: 1,
                        nombre_oficina: "SUR ORIENTE_2",
                        nombre_puesto: business_data.position ? business_data.position :"dueño",//PONER SOLO dueño
                        departamento: business_data.department ? business_data.department : "cobranza",
                        numero_empleados: business_data.employees ? business_data.employees : 10,
                        registro_egresos: 0,
                        revolvencia: "QUINCENAL",
                        ventas_totales_cantidad: 5000.0,
                        ventas_totales_unidad: 0.0,
                        id_actividad_economica: business_data.economic_activity[0] ? business_data.economic_activity[0] : 716,
                        tiempo_actividad_incio: business_data.business_start_date ? getDates(business_data.business_start_date) : "2010-03-07",
                        tiempo_actividad_final: business_data.business_end_date ? getDates(business_data.business_end_date) : "2021-05-07"
                    }
                ]
            }
        });

        clientHF.CLIENTE = [
            {
                id_oficina: data.branch && data.branch[0] ? data.branch[0] : 1,//dejarlo en 1 para pruebas
                id_oficial_credito: official_idHf != 0 ? official_idHf : 346928
            }
        ]

        clientHF.INDIVIDUAL = [
            {
                econ_ocupacion: client.ocupation ? client.ocupation[0].etiqueta : "EMPLEADO",
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
                id_ocupacion: client.ocupation[0].id ? client.ocupation[0].id : 12,
                id_profesion: client.education_level[0] ? client.education_level[0] : 5
            }
        ]

        clientHF.PLD = [
            {
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

        clientHF.BANCARIO = [
            {
                id_banco: 15,
                clave_banco: "40012",
                nombre_banco: "BANJERCITO",
                id_tipo_cuenta: 1,
                clave_tipo_cuenta: "3",
                nombre_tipo_cuenta: "TARJETA DE DEBITO",
                numero_cuenta: "0123012301230123",
                principal: 1,
                activo: 1
            }
        ]

        clientHF.EFIRMA = [
            {
                id_firma_electronica: 0,
                fiel: ""
            }
        ]

        const response = await Client.createClientHF(clientHF);
        // console.log(response);

        if(!response){
            throw new Error('Ocurrió un error al registrar el cliente al HF');
        }

        const person_idHf = response[0][0].id_persona;
        const client_idHf = response[0][0].id_cliente;

        await Client.updateOne( {_id}, {$set: {client_idHf, person_idHf, official_idHf, status: [2, "Aprobado"]}} );
        approve.forEach((valor) => (client[valor] = data[valor]));
        await client.save();
        
        const clientApproved = await Client.findOne({_id})
        res.status(201).send(clientApproved);
        
        // res.status(201).send({
        //     person,
        //     clientHF
        // });

    } catch(e) {
        console.log(e + ' ')
        res.status(400).send(e + ' ');
    }

});

router.get('/client/hf', auth, async(req, res) => {

    const response = await Client.findClientByExternalId(req.query.id);

    res.send(response)

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

})

const removeAccents = (str) => {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
};

const comparar = (entrada) => {
    const permitido = ["name","lastname","second_lastname","email","password","curp","ine_folio","dob","segmento","loan_cicle","client_type","branch","is_new","bussiness_data","gender","scolarship","address","phones","credit_circuit_data","external_id", "status"];
    const result = entrada.every(campo => permitido.includes(campo));
    return result;
}

const validStatus = (status) => {

    const statusValid = ['Pendiente', 'Aprobado', 'Rechazado', 'Eliminado'];
    const result = statusValid.includes(status);
    return result;
}

const getDates = (fecha) => {
    const date = moment.utc(fecha).format(formato)
    return date;
}

module.exports = router;