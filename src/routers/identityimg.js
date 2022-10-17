const express = require('express');
const router = new express.Router();
const auth = require('../middleware/auth');
const IdentityImg = require('../model/identityimg');
const User = require('../model/user');


router.post('/identityImg', auth,async(req, res) => {

    try{

        const data = req.body;

        const user = await User.findById(data.user_id);
        if(!user){
            throw new Error('Could not find user');
        }
        
        const identity = new IdentityImg({...data});
        await identity.save();
        
        user["veridoc"] = identity._id;
        await user.save();

        res.status(201).send(identity);

    } catch(err){
        res.status(400).send(err.message);
    }
});

router.patch('/identityImg/:id', auth,async(req, res) => {

    try{

        const _id = req.params.id;
        const data = req.body;
        const update = Object.keys(req.body);

        const identity = await IdentityImg.findById(_id);
        if(!identity){
            return res.status(204).send();
        }

        update.forEach((valor) => (identity[valor] = data[valor]));
        await identity.save();

        res.send(identity);

    } catch(err){
        res.status(400).send(err.message);
    }
});

module.exports = router;