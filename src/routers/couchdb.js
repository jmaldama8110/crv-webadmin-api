const express = require("express");
const router = new express.Router();
const authorize = require("../middleware/authorize");
const nano = require('../db/connCouch');
const Product = require('../model/product');
const { sendReportActionError } = require('../emails/account')
/////////// Routes for CouchDB /////

router.get('/couchdb/getsomedata', authorize ,async(req,res)=>{
    
      const db = nano.use(process.env.COUCHDB_NAME);

      try{
          const index = await db.createIndex({ index:{  fields:["couchdb_type"] }});
          const data = await db.find( { selector: { couchdb_type: "PRODUCT"}});
          
          res.send(data.docs);
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


router.get('/couchdb/sample',authorize, async (req, res)=>{
  try {

    // const pool = await sql.connect(sqlConfig);

    // let data = await pool
    // .request()
    // .query(`SELECT  
    //         [id]
    //         ,[etiqueta]
    //         ,[creado_por]
    //         ,[fecha_registro]
    //       FROM [HBMFS].[dbo].[CATA_MotivoBajaRechazado]`)

          await sendReportActionError({ name: 'SOME ACTION ID', _id:'id de prueba para el correo' })
          res.status(200).send('Ok');

      /**
       * Update some partes of the data already created
       */
     /*
      const db = nano.use(process.env.COUCHDB_NAME);        
      const loanProducts = await Product.find({});
      await db.bulk( {docs: loanProducts} );
      console.log('Loan Products: ', loanProducts);

      */
      /**
       * Completely reconstruct the entire database
       */
      /*
      await nano.db.destroy(process.env.COUCHDB_NAME);
      await nano.db.create(process.env.COUCHDB_NAME);

      const db = nano.use(process.env.COUCHDB_NAME);        
      
      const catalogs = await Catalog.find({});
      await db.bulk({ docs: catalogs });

      console.log('Catalogs: ',catalogs.length);

      const users = await User.find({});
      await db.bulk({docs: users });
      console.log('Users: ',users.length);

      let newData = [] // buffer to convert data from Mongo to CouchDB
      /// Couch does not support _id as Number, thus convertion required

      const neighborhood = await Neighborhood.find({});
      newData = neighborhood.map( i => (  { 
          _id: `NEIGHBORHOOD|${i._id.toString()}`,
          couchdb_type: i.couchdb_type,
          etiqueta: i.etiqueta,
          codigo_postal: i.codigo_postal,
          ciudad_localidad: `CITY|${i.ciudad_localidad.toString()}`
        }))
      await db.bulk( {docs: newData} );
      console.log('Neighborhood: ',newData.length);

      const city = await City.find({}); 
      newData = city.map( i =>({
          _id: `CITY|${i._id.toString()}`,
          couchdb_type: i.couchdb_type,
          etiqueta: i.etiqueta,
          municipio: `MUNICIPALITY|${i.municipio.toString()}`
      }))
      await db.bulk( { docs: newData });
      console.log('City: ',newData.length);     

      const municipality = await Municipality.find({});
      newData = municipality.map( i => ({
        _id: `MUNICIPALITY|${i._id.toString()}`,
        couchdb_type: i.couchdb_type,
        etiqueta: i.etiqueta,
        estado: `PROVINCE|${i.estado.toString()}`
      }))
      await db.bulk({docs: newData});
      console.log('Municipality: ',newData.length);

      const province = await Province.find({});
      newData = province.map( i => ({
          _id: `PROVINCE|${i._id.toString()}`,
          couchdb_type: i.couchdb_type,
          etiqueta: i.etiqueta,
          pais: `COUNTRY|${i.pais.toString()}`
      }))
      await db.bulk({ docs: newData});
      console.log('Province: ',newData.length);
      
      const country = await Country.find({});
      newData = country.map( i =>({
          _id: `COUNTRY|${i._id.toString()}`,
          couchdb_type: i.couchdb_type,
          etiqueta: i.etiqueta
      }))
      await db.bulk({ docs: newData});
      console.log('Country: ',newData.length);
      */

      

  } catch(error){
    console.log(error);
    res.status(400).send(error.message);
  }

})



module.exports = router;