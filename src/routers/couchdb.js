const express = require("express");
const router = new express.Router();
const auth = require("../middleware/auth");
const nano = require('../db/connCouch');

/////////// Routes for CouchDB /////

router.get('/couchdb/test', auth ,async(req,res)=>{
    try {
        // const db = nano.use(process.env.COUCHDB_NAME); 
        const data = await  nano.db.list();
        res.status(200).send(data);
    }
    catch(error){
        res.status(401).send(error.message);
    }
});


module.exports = router;