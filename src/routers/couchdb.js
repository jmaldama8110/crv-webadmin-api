const express = require("express");
const router = new express.Router();
const auth = require("../middleware/auth");
const nano = require('../db/connCouch');
const Product = require('../model/product');
/////////// Routes for CouchDB /////

router.get('/couchdb/getsomedata', auth ,async(req,res)=>{
    
        const db = nano.use(process.env.COUCHDB_NAME);

      try{
          const index = await db.createIndex({ index:{  fields:["couchdb_type"] }});
          const data = await db.find( { selector: { couchdb_type: "CLIENT" }});
          const clients = data.docs.map( (i)=>( {
            name: i.name,
            lastname: i.lastname,
            id_cliente: i.id_cliente
          } ))
          res.send(clients);
        }
        catch(e){
          console.log(e)
          res.status(401).send(e)
        }
    
        //// BULK dump from MongoDB to CouchDB, product info after being setup by WebAdmin
        // try{
        //   const loanProducts = await Product.find({});
        //   const newData = loanProducts.map(i =>{
        //     delete i._doc.__v
        //       delete i.__v;
        //       return {
        //         ...i._doc,
        //         couchdb_type: "PRODUCT"
        //       }
        //   })
            
        //   await db.bulk( {docs: newData} );
        //   res.send(newData);
        // }
        // catch(err){
        //   res.status(401).send(err)
        // }


});



module.exports = router;