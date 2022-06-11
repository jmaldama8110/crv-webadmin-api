const express = require("express");
const router = new express.Router();
const User = require("../model/user");
const Client = require('../model/client');
const auth = require("../middleware/auth");


// router.post("/clients", auth, async(req, res) =>{

//     try{

//         const registro = Object.keys(req.body)
//         console.log(registro);
//         if(!comparar(registro)){
//             return res.status(400).send({ error: "Body includes invalid properties..." });
//         }

//         req.body.password = await User.passwordHashing(req.body.password);
//         const user = new User({
//             name: req.body.name,
//             lastname: req.body.lastname,
//             second_lastname: req.body.second_lastname,
//             email: req.body.email,
//             password: req.body.password,
//             dob: req.body.dob,
//             is_client: true,
//         });
//         const userSaved = await user.save()
//         .then(async(result) => {

//             // console.log("User created", result)
//             const client = new Client({
//                 user_id: result._id,
//                 name: req.body.name,
//                 lastname: req.body.lastname,
//                 second_lastname: req.body.second_lastname,
//                 curp: "",
//                 ine_folio: "",
//                 dob: req.body.dob,
//                 segmento: "0",
//                 loan_cicle: req.body.loan_cicle,
//                 client_type: req.body.client_type,
//                 branch : req.body.branch,
//                 is_new: req.body.is_new,
//                 bussiness_data: req.body.bussiness_data,
//                 gender: req.body.gender,
//                 scolarship: req.body.scolarship,
//                 address: req.body.address,
//                 phones: req.body.phones,
//                 credit_circuit_data: req.body.credit_circuit_data
//             });
    
//             await client.save().then(()=>{
//                 console.log('Client created...');
//                return res.status(200).send(result);

//             }).catch(async(e) =>{
//                 await User.findOneAndDelete({ _id: result._id })
//                 console.log("User Deleted");
//                 throw new Error("Error Creating Client");
//             });
            
//         }).catch((err) => {
//             console.log(err);
//             throw new Error("Error Creating User");
//         });

//     } catch(e){
//         res.status(400).send(e + '')
//     }
// });

router.post("/clients", auth, async(req, res) =>{

    try{

        const registro = Object.keys(req.body.data)
        if(!comparar(registro)){
            return res.status(400).send({ error: "Body includes invalid properties..." });
        }

        const data = req.body.data;

        const client = new Client({
            name: removeAccents(data.name),
            lastname: removeAccents(data.lastname),
            second_lastname: removeAccents(data.second_lastname),
            email: data.email,
            curp: "",
            ine_folio: "",
            dob: data.dob,
            segmento: "0",
            loan_cicle: data.loan_cicle,
            client_type: data.client_type,
            branch : data.branch,
            is_new: data.is_new,
            bussiness_data: data.bussiness_data,
            gender: data.gender,
            scolarship: data.scolarship,
            address: data.address,
            phones: data.phones,
            credit_circuit_data: data.credit_circuit_data,
            external_id: data.external_id
        });
    
        await client.save().then((result)=>{
            // console.log('Client created...');
            return res.status(200).send(result);
        }).catch(async(e) =>{
            return res.status(400).send(e);
        });

    } catch(e){
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
       console.log(e)
       res.status(400).send(e + '');
   }
})

router.patch("/clients/:id", auth, async(req, res) =>{

    
    try{
        const update = req.body.data;
        const actualizar = Object.keys(update)
        if(!comparar(actualizar)){
            return res.status(400).send({ error: "Body includes invalid properties..." });
        }
        if(update.name != undefined){
            update.name = removeAccents(update.name)
        }
        if(update.lastname != undefined){
            update.lastname = removeAccents(update.lastname)
        }
        if(update.second_lastname != undefined){
            update.second_lastname = removeAccents(update.second_lastname)
        }

        const _id = req.params.id;
        const data = update;

        const client = await Client.findOne({_id});
        if(!client){
            throw new Error("Not able to find the client")
        }
        
     
        const user = await User.findOne({client_id:_id});
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

        res.status(200).send('ok');

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
        res.status(200).send('ok');

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

module.exports = router;