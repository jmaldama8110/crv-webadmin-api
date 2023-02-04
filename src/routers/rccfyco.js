const express = require('express');
const router = new express.Router();
const RccFyco = require('../model/rccfyco');
const Client = require('../model/client');
// const auth = require('../middleware/auth');
const axios = require("axios");
const rsign = require("jsrsasign");
const rsutil = require("jsrsasign-util");
const ClientCollection = require("./../model/clientCollection");
const clientCollection = new ClientCollection();
const auth = require('../middleware/authCouch');
const RccfycoCollection = require("./../model/rccfycoCollection");
const rccfycoCollection = new RccfycoCollection();

router.post('/rccfyco/:client_id', auth, async (req, res) => {
  try {
    const client_id = req.params.client_id;
    const clientInfo = await clientCollection.findOne({_id: client_id});
    console.log('👌')
    /// evalua si existe un dato en last query de rcc fyco
    let daysDiff = 0;
    // evalua si ya pasaron 90 dias
    if (clientInfo.rcc_last_query) {
      const queryDate = new Date(clientInfo.rcc_last_query.query_date);
      const now = new Date();
      const timeDiff = (now.getTime() - queryDate.getTime());
      // To calculate the no. of days between two dates
      daysDiff = timeDiff / (1000 * 3600 * 24);
    }

    if (clientInfo.rcc_last_query && daysDiff < 90) {
      console.log('Ya no solicitar');
      const match = { folioConsulta: clientInfo.rcc_last_query.folioConsulta }
      const rccFyco = await RccFyco.findOne(match);
      res.status(200).send(rccFyco);
    } else {
      console.log('volver a solicitar');
      /// customer data validation
      if (!clientInfo.address.length) {
        throw new Error('Customer found with no address...');
      }
      let address = clientInfo.address[0];

      const customerKey = process.env.CC_CUSTOMER_KEY;
      const api = axios.create({
        method: "post",
        url: "/sandbox/v2/rccficoscore",
        baseURL: process.env.CC_API_HOST,
        headers: {
          "content-type": "text/plain",
          "x-api-key": `${customerKey}`,
          "x-full-report": "true",
        },
      });

      const rccResponse = await api.post("/sandbox/v2/rccficoscore",

        {
          apellidoPaterno: "SESENTAYDOS",
          apellidoMaterno: "PRUEBA",
          primerNombre: "JUAN",
          fechaNacimiento: "1965-08-09",
          RFC: "SEPJ650809JG1",
          nacionalidad: "MX",
          domicilio: {
            direccion: "PASADISO ENCONTRADO 58",
            coloniaPoblacion: "MONTEVIDEO",
            delegacionMunicipio: "GUSTAVO A MADERO",
            ciudad: "CIUDAD DE MÉXICO",
            estado: "CDMX",
            CP: "07730",
          },
        }
        // {
        //   apellidoPaterno: clientInfo.lastname,
        //   apellidoMaterno: clientInfo.second_lastname,
        //   primerNombre: clientInfo.name,
        //   fechaNacimiento: `${clientInfo.dob.getFullYear()}-${clientInfo.dob.getMonth() +1}-${clientInfo.dob.getDate()}`,
        //   RFC: clientInfo.rfc,
        //   nacionalidad: "MX",
        //   domicilio: {
        //     direccion: address.address_line1,
        //     coloniaPoblacion: address.colony[1],
        //     delegacionMunicipio: address.municipality[1],
        //     ciudad: address.city[1],
        //     estado: address.province[1],
        //     CP: address.post_code,
        //   },
        // }

      );

      clientInfo.rcc_last_query = {
        query_date: new Date(),
        folioConsulta: rccResponse.data.folioConsulta,
      };
      await clientInfo.save();
      const newRccFyco = new RccFyco({
        client_id: client_id,
        ...rccResponse.data
      });
      await newRccFyco.save();

      res.status(201).send(rccResponse.data);
    }
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }

});
// router.post('/rccfyco/:client_id', auth, async(req, res) => {

//     try {

//        const client_id = req.params.client_id;

//         const clientInfo = await Client.findById(client_id);
//         // return res.send(clientInfo);
//         /// evalua si existe un dato en last query de rcc fyco
//         let daysDiff = 0;
//         // evalua si ya pasaron 90 dias
//         if( clientInfo.rcc_last_query ){
//           const queryDate = new Date(clientInfo.rcc_last_query.query_date);
//           const now = new Date();
//           const timeDiff = (now.getTime() - queryDate.getTime());
//           // To calculate the no. of days between two dates
//           daysDiff = timeDiff / (1000 * 3600 * 24);
//         }

//         if( clientInfo.rcc_last_query && daysDiff < 90 ){    
//             console.log('Ya no solicitar');
//             const match = { folioConsulta: clientInfo.rcc_last_query.folioConsulta   }        
//             const rccFyco = await RccFyco.findOne( match );
//             res.status(200).send(rccFyco);
//         } else 
//           {
//             console.log('volver a solicitar');
//             /// customer data validation
//             if( !clientInfo.address.length){
//               throw new Error('Customer found with no address...');
//             }
//             let address = clientInfo.address[0];

//             const customerKey = process.env.CC_CUSTOMER_KEY;
//             const api = axios.create({
//               method: "post",
//               url: "/sandbox/v2/rccficoscore",
//               baseURL: process.env.CC_API_HOST,
//               headers: {
//                 "content-type": "text/plain",
//                 "x-api-key": `${customerKey}`,
//                 "x-full-report": "true",
//               },
//             });

//             const rccResponse = await api.post("/sandbox/v2/rccficoscore", 

//             {
//               apellidoPaterno: "SESENTAYDOS",
//               apellidoMaterno: "PRUEBA",
//               primerNombre: "JUAN",
//               fechaNacimiento: "1965-08-09",
//               RFC: "SEPJ650809JG1",
//               nacionalidad: "MX",
//               domicilio: {
//                 direccion: "PASADISO ENCONTRADO 58",
//                 coloniaPoblacion: "MONTEVIDEO",
//                 delegacionMunicipio: "GUSTAVO A MADERO",
//                 ciudad: "CIUDAD DE MÉXICO",
//                 estado: "CDMX",
//                 CP: "07730",
//               },}
//             // {
//             //   apellidoPaterno: clientInfo.lastname,
//             //   apellidoMaterno: clientInfo.second_lastname,
//             //   primerNombre: clientInfo.name,
//             //   fechaNacimiento: `${clientInfo.dob.getFullYear()}-${clientInfo.dob.getMonth() +1}-${clientInfo.dob.getDate()}`,
//             //   RFC: clientInfo.rfc,
//             //   nacionalidad: "MX",
//             //   domicilio: {
//             //     direccion: address.address_line1,
//             //     coloniaPoblacion: address.colony[1],
//             //     delegacionMunicipio: address.municipality[1],
//             //     ciudad: address.city[1],
//             //     estado: address.province[1],
//             //     CP: address.post_code,
//             //   },
//             // }

//             );

//             clientInfo.rcc_last_query = {
//               query_date: new Date(),
//               folioConsulta: rccResponse.data.folioConsulta,
//             };
//             await clientInfo.save();
//             const newRccFyco = new RccFyco({
//               client_id: client_id,
//               ...rccResponse.data
//             });
//             await newRccFyco.save();

//             res.status(201).send(rccResponse.data );
//         }
//       } catch (error) {
//         console.log(error);
//         res.status(400).send(error);
//       }

// });

router.get("/securitytest", async (req, res) => {
  try {
    console.log('llega')
    const customerKey = process.env.CC_CUSTOMER_KEY;
    const url = "/v1/securitytest";

    const prvPEM = process.env.CC_PRIV_KEY;
    var prvK = rsign.KEYUTIL.getKey(prvPEM);

    const signature = new rsign.KJUR.crypto.Signature({ alg: 'SHA256withECDSA', provider: "cryptojs/jsrsa" })
    signature.init(prvK);

    const bodyData = JSON.stringify(req.body);
    signature.updateString(bodyData);
    console.log('pasa')

    const api = axios.create({
      method: "post",
      url,
      baseURL: process.env.CC_API_HOST,
      headers: {
        "x-api-key": `${customerKey}`,
        "x-signature": `${signature.sign()}`,
        "Content-Type": "application/json",
        "Connection": "keep-alive"
      },
    });

    const secApiResponse = await api.post(url, req.body);
    res.send(secApiResponse.data);

  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
});

router.get('/rccfyco/:client_id', auth, async (req, res) => {
  try {
    const client_id = req.params.client_id;
    if (!client_id) throw new Error('The parameter client_id is required');

    const rcc = await rccfycoCollection.find({ client_id });
    if (!rcc || rcc.length === 0) {
      return res.status(204).send('No records found');
    }

    res.status(200).send(rcc[rcc.length - 1]);//Le devolvemos la consulta mas actual ya que el cliente puede tener mas de un rcc

  } catch (err) {
    res.status(400).send(err.message);
  }
});
// router.get('/rccfyco/:client_id', auth, async (req, res) => {

//   try {

//     const client_id = req.params.client_id;
//     if (!client_id) {
//       throw new Error('The parameter client_id is required');
//     }

//     const rcc = await RccFyco.find({ client_id });
//     if (!rcc || rcc.length === 0) {
//       return res.status(204).send('No records found');
//     }

//     res.status(200).send(rcc[rcc.length - 1]);//Le devolvemos la consulta mas actual ya que el cliente puede tener mas de un rcc

//   } catch (err) {
//     res.status(400).send(err.message);
//   }
// });

router.get('/rccfyco', auth, async (req, res) => {
  try {
    const match = {};

    if (req.query.id) match._id = req.query.id

    const rcc = await rccfycoCollection.find(match);

    res.status(200).send(rcc);
  } catch (err) {
    res.status(400).send(err.message);
  }
})
// router.get('/rccfyco', auth, async (req, res) => {
//   try {

//     const match = {};

//     if (req.query.id) {
//       match._id = req.query.id
//     }

//     const rcc = await RccFyco.find(match);

//     res.status(200).send(rcc);

//   } catch (err) {
//     res.status(400).send(err.message);
//   }
// })


module.exports = router;