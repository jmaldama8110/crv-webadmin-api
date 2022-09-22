const express = require('express');
const router = new express.Router();
const moment = require('moment')
const auth = require('../middleware/auth');
const User = require('../model/user')
const Signup = require('../model/signup');
const {
    sendWelcomeEmail,
    sendGoodbyEmail,
    sendRecoverPasswordEmail,
    sendConfirmationEmail,
  } = require("../emails/account");

router.post("/signups/:signup_code", auth, async (req, res) => {
    try {

        const code =  req.params.signup_code;

        const signup = await Signup.findOne({code});
        if (!signup) {
            throw new Error("Not able to find the confirmation code");
        }
        if (signup.code !== req.params.signup_code) {
            throw new Error("Not able to find the confirmation code");
        }
        // Checar si el administrador podra activar el codigo aunque esté expirado
        // const createdTime = moment(signup.createdAt);
        // const now = moment();
        // let ttl = now - createdTime;
        // if (ttl > 1200000) {
        //     throw new Error("Confirmation code has expired!");
        // }
    
        const user = new User({
            name: signup.name,
            lastname: signup.lastname,
            second_lastname: signup.second_lastname,
            phone: signup.phone,
            email: signup.email,
            password: signup.password
        });
        user.resetChecklist();
        await user.save();

        sendWelcomeEmail(user.email, user.name);
        await Signup.findOneAndDelete({email: signup.email})
    
    
        res.status(201).send({ user});
      
    } catch (e) {
      console.log(e)
      res.status(400).send(e + '');
    }
});

router.get('/signups', auth, async(req, res) => {
    try{

        const match = {}

        if(req.query.id){
            match._id = req.query.id;
        }

        const signups = await Signup.find(match);

        res.status(200).send(signups);

    } catch(e) {
        res.status(400).send(e.message)
    }
});

router.delete('/signups/:id', auth, async(req, res) => {
    try{

        const _id = req.params.id;

        const signup = await Signup.findOne({_id});
        await signup.remove();

        res.status(200).send({
            user: `${signup.name} ${signup.lastname} ${signup.second_lastname}`,
            message: 'Record successfully deleted!'
        });

    } catch(e){
        res.status(400).send(e.message)
    }
});

router.delete('/signups', auth, async(req, res) => {
    try{

        await Signup.deleteMany();

        res.status(200).send({Message: 'The Sign Up collection has been reset!'})

    } catch(e){
        res.status(400).send(e.message)
    }
});

module.exports = router;