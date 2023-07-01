const express = require('express');
const router = new express.Router();
const sgMail = require('@sendgrid/mail')
const authorize = require("../middleware/authorize");
const axios = require("axios");

router.post('/sendemail',authorize, async (req, res) => {
  
    const sendGridApiKey = process.env.SENDGRID_API_KEY;
    const sendGridApiUrl = process.env.SENDGRID_BASE_URL;

    sgMail.setApiKey( sendGridApiKey);
  
    try{
      if( !req.query.toEmail || !req.query.templateId || !req.query.fromEmail){
        
        throw new Error('Missing some query param: toEmail, fromEmail, templateId')
      }
  
      const api = axios.create( {
        method: "post",
        url: "/v3/mail/send",
        baseURL: sendGridApiUrl,
        headers: {
          "content-type": "application/json",
          Authorization: `Bearer ${sendGridApiKey}`,
        }
      });
  
      const apiRes = await api.post('/v3/mail/send',{
        "from": { "email": req.query.fromEmail },
        "personalizations": [
        {
          "to": [ { "email": req.query.toEmail },{ "email": req.query.fromEmail} ],
          "dynamic_template_data": {
              ...req.body
          }
  
        }
        ],
        "template_id": req.query.templateId
      });
  
      res.send('Ok');
    }
    catch(e) {
      console.log(e.message);
      res.status(400).send(e.message);
    }
})

module.exports = router;