const express = require("express");
const router = new express.Router();
const User = require("../model/user");
const Client = require('../model/client');
const auth = require("../middleware/auth");
const mongoose = require('mongoose')

router.post("/clients", auth, async(req, res) =>{

    try{
        const registro = Object.keys(req.body)
        // if(!comparar(registro)){
        //     return res.status(400).send({ error: "Body includes invalid properties..." });
        // }

        const data = req.body;
        // console.log('datos cliente', data)

        const existClient = await Client.findOne({email: data.email});
        if(existClient){
            throw new Error("The email is already linked to a registered client")
        }

        const client = new Client({...data});
    
        await client.save().then((result)=>{
            // console.log('Client created...');
            return res.status(201).send(result);
        }).catch(async(e) =>{
            return res.status(400).send(e);
        });

    } catch(e){
        console.log(e)
        res.status(400).send(e + '')
    }
});

router.post('/ImYourClient', auth, async(req, res) => {
    try{
        const _id = req.body.external_id;

        const client = await Client.findOne({_id});
        if(!client || client.length === 0){
            throw new Error("Not able to find the client");
        }

        
        const user = await User.findOne({email: client.email});
        if(!user || user.length === 0){
            throw new Error("Not able to find the user");
        }

        await Client.findByIdAndUpdate(_id, {user_id: user._id})
        await User.findByIdAndUpdate({_id: user._id}, {client_id: client._id});
        res.status(200).send(client);

   } catch(e) {
       console.log(e)
       res.status(400).send(e + '');
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
        // if(!comparar(actualizar)){
        //     return res.status(400).send({ error: "Body includes invalid properties..." });
        // }

        const _id = req.params.id;
        const data = req.body;
        const actualizar = Object.keys(data)


        const client = await Client.findOne({_id});
        if(!client){
            throw new Error("Not able to find the client")
        }

        // console.log(data);

        // if(!comparar(actualizar)){
        //     return res.status(400).send({ error: "Body includes invalid properties..." });
        // }
        
     
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

        console.log(_id);
        console.log(data);

        const client = await Client.findOne({_id});
        if(!client){
            throw new Error("Not able to find the client");
        }


        if(data.status[1] === "Aprobado" && client.status[1] === "Aprobado"){
            throw new Error("This client is already approved");
        }

        // const result = await Client.updateOne( {_id}, {$set: data} );
        
        // Una vez aprobado el cliente, procedemos a crear la persona en el HF
        const person = {};

        person.DATOS_PERSONALES = [
            {
                nombre: client.name,
                apellido_paterno: client.lastname,
                apellido_materno: "",
                fecha_nacimiento: "2000-08-02",
                id_sexo: client.sex[0],
                id_escolaridad: client.education_level[0],
                id_estado_civil: client.marital_status[0],
                entidad_nacimiento: client.province_of_birth[1],
                regimen: "",
                id_oficina: 1,
                curp_fisica: 0,
                datos_personales_diferentes_curp: 0,
                id_entidad_nacimiento: client.province_of_birth[0],
                id_nacionalidad: client.nationality[0],
                id_pais_nacimiento: client.country_of_birth[0],
                es_pep: 0,
                es_persona_prohibida: 0
            }
        ]

        person.IDENTIFICACIONES = [  
            {
                id_entidad: 5,
                tipo_identificacion: "CURP",
                id_numero: client.curp
            }
        ]

        person.DIRECCIONES = []
        const addresses = client.address;

        addresses.forEach((campo) => {
            if(campo.type === 'DOMICILIO' || campo.type === 'IFE' || campo.type === 'RFC'){
                (person.DIRECCIONES).push(
                    {
                        tipo:campo.type,
                        id_pais: campo.country[0] != undefined ? campo.country[0] : 1,
                        id_estado: campo.province[0] != undefined ? campo.province[0] : 5,
                        id_municipio: campo.municipality[0] != undefined ? campo.municipality[0] : 946,
                        id_localidad: campo.city[0] != undefined ? campo.city[0] : 1534,
                        id_asentamiento: campo.colony[0] != undefined ? campo.colony[0] : 42665,
                        direccion: campo.address_line1,
                        numero_exterior: campo.exteriorNum != undefined ? campo.exteriorNum : "SN",
                        numero_interior: campo.interiorNum != undefined ? campo.interiorNum :"SN",
                        referencia: campo.reference != undefined ? campo.reference :"FRENTE A ...",
                        casa_situacion: 0,
                        tiempo_habitado_inicio: campo.start_date != undefined ? campo.start_date :"2022-06-20",
                        tiempo_habitado_final: campo.end_date != undefined ? campo.end_date : "2022-06-20",
                        correo_electronico: client.email,
                        num_interior: 2,
                        num_exterior: 1,
                        id_vialidad: 1,
                        domicilio_actual: 1
                    }
                )
            }
        });

        person.DATOS_IFE = [
            {
                numero_emision: "00",
                numero_vertical_ocr: "0381121464732"
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
                    compania: phone.company,
                    sms: 0
                }
            )
        });

        const result = await Client.createPersonHF(person)

        if(!result){
            throw new Error('Ocurrió un error al registrar la persona al HF');
        }


        //crear el cliente
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
                    compania: phone.company,
                    sms: 0
                }
            )
        });

        const business_data = client.business_data;

        addresses.forEach((campo) => {
            if(campo.type === 'NEGOCIO'){
                clientHF.NEGOCIO = [
                    {
                        nombre: business_data.business_name != undefined ? business_data.business_name : "SIN NOMBRE DE NEGOCIO",
                        calle: campo.calle != undefined ? campo.calle : "Calle ...",
                        referencia: campo.referencia != undefined ? campo.referencia : "Frente a ...",
                        letra_exterior: campo.letra_exterior != undefined ? campo.letra_exterior : "C",
                        letra_interior: campo.letra_interior != undefined ? campo.letra_interior : "D",
                        num_exterior: campo.num_exterior != undefined ? campo.num_exterior : 0,
                        num_interior: campo.num_interior != undefined ? campo.num_interior : 0,
                        id_pais: campo.country[0] != undefined ? campo.country[0] : 1,
                        id_estado: campo.province[0] != undefined ? campo.province[0] : 5,
                        id_municipio: campo.municipality[0] != undefined ? campo.municipality[0] : 946,
                        id_ciudad: campo.city[0] != undefined ? campo.city[0] : 1534,
                        id_colonia: campo.colony[0] != undefined ? campo.colony[0] : 42665,
                        cp: campo.post_code,
                        rfc: client.rfc != undefined ? client.rfc : "",
                        econ_registro_egresos_ingresos: 0,
                        casa_situacion: 0,
                        correo_electronico: client.email != undefined ? client.email : "",
                        id_vialidad: 1,
                        nombre_oficina: "SUR ORIENTE_2",
                        nombre_puesto: business_data.position != undefined ? business_data.position :"dueño",//PONER SOLO dueño
                        departamento: business_data.department != undefined ? business_data.department : "cobranza",
                        numero_empleados: business_data.employees != undefined ? business_data.employees : 10,
                        registro_egresos: 0,
                        revolvencia: "QUINCENAL",
                        ventas_totales_cantidad: 5000.0,
                        ventas_totales_unidad: 0.0,
                        id_actividad_economica: business_data.economic_activity[0] != undefined ? business_data.economic_activity[0] : 716,
                        tiempo_actividad_incio: "2010-03-07",
                        tiempo_actividad_final: "2021-05-07"
                    }
                ]
            }
        });

        clientHF.CLIENTE = [ //falta checar
            {
                id_oficina: 1,
                id_oficial_credito: 20
            }
        ]

        clientHF.INDIVIDUAL = [
            {
                econ_ocupacion: "EMPLEADO",
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
                id_ocupacion: client.ocupation[0].id != undefined ? client.ocupation[0].id : 12,
                id_profesion: client.education_level[0] != undefined ? client.education_level[0] : 5
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

        await Client.updateOne( {_id}, {$set: {client_idHf, person_idHf}} );


        approve.forEach((valor) => (client[valor] = data[valor]));
        await client.save();
        
        // res.status(201).send({
        //     person,
        //     clientHF
        // })

        res.status(201).send(response);



    } catch(e) {
        console.log(e + ' ')
        res.status(400).send(e + ' ');
    }

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

module.exports = router;