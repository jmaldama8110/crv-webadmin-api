const express = require('express')
const router = new express.Router;
const Position = require('../model/position')
const auth = require("../middleware/auth")

router.get("/positions",auth,async(req,res) => {

    const match = {}

    try{
        const position = await Position.find(match);
        if (!position || position.length === 0) {
            throw new Error("Not able to find the position");
        }
        
        res.status(200).send(position);
    }catch(e){
        res.status(400).send(e + '');

    }
})

module.exports = router;