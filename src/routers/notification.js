const express = require('express');
const router = new express.Router();
const auth = require('../middleware/auth');
const Notification = require('../model/notification');

router.get('/notification', auth, async(req, res) => {
    try{

        const data = await Notification.find();
        if( !data ){
            throw new Error('There is no data loaded for this identifier')
        }

        res.status(200).send(data);

    } catch(e) {
        console.log(e)
        res.status(400).send(e.message);
    }
});

router.get('/notificationVeridoc/:identifier', auth, async(req, res) => {
    try{

        const identifier = req.params.identifier;
        // console.log('llegaaa', identifier);

        const data = await Notification.findOne({identifier});
        if( !data ){
            throw new Error('There is no data loaded for this identifier')
        }

        // console.log(data);

        res.status(200).send(data);

    } catch(e) {
        console.log(e)
        res.status(400).send(e.message);
    }
});

module.exports = router;