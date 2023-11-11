const express = require("express");
const router = new express.Router();
const authorize = require("../middleware/authorize");
const axios = require("axios");
const url = require("url");

router.post("/verify", authorize, async (req, res) => {

  try {

    if( !req.query.clientId) throw new Error('Missing param clientId');

    if( !req.body.frontImage ){
      throw new Error('frontImage base64 property is missing at the request body')
    }
    if( !req.body.backImage ){
      throw new Error('backImage base64 property is missing at the request body')
    }
    if( !req.body.faceImage) {
      throw new Error('faceImage Image base64 property is missing at the request body')
    }
   
    const veridocToken = await getVeridocToken();
    const api = axios.create({
      method: "post",
      url: "/id/v2/verify",
      baseURL: process.env.VERIDOC_URL,
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${veridocToken}`,
      },
    });

      const veridocRes = await api.post("/id/v2/verify", {
        id: req.query.clientId,
        frontImage: req.body.frontImage,
        backImage: req.body.backImage,
        faceImage: req.body.faceImage,
      });

      res.send(veridocRes.data);

  } catch (error) {
    res.status(404).send('No coincidences found with supplied Id');
  }
});

router.post('/verify/status', authorize, async( req, res) =>{
  try {

    if( !req.query.uuid) throw new Error('Missing param uuid');
    const veridocToken = await getVeridocToken();
    const api = axios.create({
      method: "post",
      url: "/id/v2/status",
      baseURL: process.env.VERIDOC_URL,
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${veridocToken}`,
      },
    });

      const veridocRes = await api.post("/id/v2/status", {
        uuid: req.query.uuid,
      });

    res.send(veridocRes.data);
  }
  catch(e){

    res.status(404).send('Ocurrio un error!');
  }
})

router.post('/verify/results', authorize, async( req, res) =>{
  try {
      if( !req.query.uuid || !req.query.includeImages) throw new Error('Missing param uuid or includeImages');

      const veridocToken = await getVeridocToken();
      const api = axios.create({
        method: "post",
        url: "/id/v2/results",
        baseURL: process.env.VERIDOC_URL,
        headers: {
          "content-type": "application/json",
          Authorization: `Bearer ${veridocToken}`,
        },
      });
      const veridocRes = await api.post("/id/v2/results", {
        uuid: req.query.uuid, 
        includeImages: req.query.includeImages === 'true' ? true : false
      });

    res.send(veridocRes.data);

  }
  catch(e){
    
    res.status(404).send('Ocurrio un error!');
  }
})

async function getVeridocToken() {
  try {
    const api = axios.create({
      method: "post",
      url: "/auth/token",
      baseURL: process.env.VERIDOC_URL,
      headers: { "content-type": "application/x-www-form-urlencoded" },
    });
    const params = new url.URLSearchParams({
      grant_type: "client_credentials",
      client_id: process.env.VERIDOC_CLIENT_ID,
      client_secret: process.env.VERIDOC_CLIENT_SECRET,
      audience: "veridocid",
    });
    const veridocRes = await api.post("/auth/token", params);
    const veridoc_token = veridocRes.data.access_token;
    return veridoc_token;
  } catch (error) {
    
    return "";
  }
}

module.exports = router;
