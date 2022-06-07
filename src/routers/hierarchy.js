const express = require('express')
const router = new express.Router;
const Hierarchy = require('../model/hierarchy')
const auth = require("../middleware/auth")

router.get("/hierarchies",auth,async(req,res) => {

    const match = {}

    try{

        if(req.query.id){
            match._id = req.query.id;
        }
        
        const hierarchy = await Hierarchy.find(match);
        if (!hierarchy || hierarchy.length === 0) {
            throw new Error("Nothing found");
        }
        
        res.status(200).send(hierarchy);
    }catch(e){
        res.status(400).send(e + '');

    }
})

module.exports = router;