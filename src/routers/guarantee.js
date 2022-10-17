const express = require('express');
const router = new express.Router();
const auth = require('../middleware/auth');
const Guarantee =  require('../model/guarantees');
const Client = require('../model/client');

router.post('/guarantees/:id', auth, async(req, res) => {
    try {
        
        const _id = req.params.id;

        const client = await Client.findById(_id).exec();

        // return res.send(client);
        
        const newGuarantee = new Guarantee({
            ...req.body,
            createdBy: client.user_id
        });
        client.guarantee.push(newGuarantee);
        await client.save();
        await newGuarantee.save();
        res.send(newGuarantee);
    }
    catch(error){
        console.log(error);
        res.status(400).send(error);
    }
});

router.get('/guarantees', auth, async(req, res) => {
    try{
        const match = {}
 
        if(req.query.id){
            match._id = req.query.id;
        }

        const guarantee = await Guarantee.find(match);
        if(!guarantee || guarantee.lenght === 0){
            return res.status(204).send('Not records found');
        }

        for(let i = 0; i < guarantee.length; i++){
            const data = guarantee[i];
            const dataGuarantee = await data.populate('createdBy', {client_id:1 }).execPopulate(); 
            await dataGuarantee.createdBy.populate('client_id', {name:1, lastname:1, second_lastname:1}).execPopulate();
        }

        res.status(200).send(guarantee);

    } catch(err){
        res.status(400).send(err.message);
    }
});

router.get('/guarantees/:client_id', auth, async (req, res)=>{
    try {

        const _id = req.params.client_id;
        
        const client = await Client.findById({_id}).exec();
        
        let data = await client.populate("guarantee").execPopulate();

        res.send( req.query.id ? data.guarantee.filter( (i) => i._id == req.query.id) : data.guarantee );

    }
    catch(error){
        console.log(error);
        res.status(400).send(error);
    }
})

router.patch('/guarantees/:id', auth, async(req, res) => {
    
    const _id = req.params.id

    try{
        const guarantee = await Guarantee.findOne({_id})

        if( !guarantee ){
            return res.status(204).send()
        }

        const requestProperties = Object.keys(req.body);
        requestProperties.forEach( (value)=> guarantee[value] = req.body[value] );
        await guarantee.save();

        res.status(200).send(guarantee)
    }
    catch (e){
        res.status(400).send(e)
    }

});

module.exports = router;