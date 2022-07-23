const express = require('express');
const router = new express.Router();
const User = require('../model/user');
const Client = require('../model/client');
const auth = require ('../middleware/auth');

router.get('/users', auth, async(req, res) =>{

    const match = {}
    
    try{

        if (req.query.id){
            match._id = req.query.id
        }

        const users = await User.find(match);
        if(!users || users.length == 0){
            throw new Error('Not able to find the user(s)');
        }

        res.status(200).send(users);

    } catch(e){
        console.log(e + '');
        res.status(400).send(e + '');
    }
});

module.exports = router;