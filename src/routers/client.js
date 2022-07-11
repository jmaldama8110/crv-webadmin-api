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

router.get("/clients", auth, async(req, res) =>{

    const match = {};

   try{
        if(req.query.id){
            match._id = req.query.id
        }

        const client = await Client.find(match);
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
        // if(update.name != undefined){
        //     update.name = removeAccents(update.name)
        // }
        // if(update.lastname != undefined){
        //     update.lastname = removeAccents(update.lastname)
        // }
        // if(update.second_lastname != undefined){
        //     update.second_lastname = removeAccents(update.second_lastname)
        // }

        const _id = req.params.id;
        const data = req.body;
        const actualizar = Object.keys(data)


        const client = await Client.findOne({_id});
        if(!client){
            throw new Error("Not able to find the client")
        }

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
        console.log(e);
        res.status(400).send(e + '');
    }

})

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

const comparar = (entrada) =>{
    const permitido = ["name","lastname","second_lastname","email","password","curp","ine_folio","dob","segmento","loan_cicle","client_type","branch","is_new","bussiness_data","gender","scolarship","address","phones","credit_circuit_data","external_id"];
    const result = entrada.every(campo => permitido.includes(campo));
    return result;
}

const validStatus = (status) =>{

    const statusValid = ['PENDING', 'DELETED', 'DECLINED', 'APROVED'];
    const result = statusValid.includes(status);
    return result;
}

module.exports = router;