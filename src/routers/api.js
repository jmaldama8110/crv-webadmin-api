const express = require('express');
const moment = require("moment/moment");
const routes = express.Router();

routes.get('/api',(req, res)=>{
    res.json({ status: 'OK',fecha: moment().format('YYYY-MM-DD hh:mm:ss') });
});
module.exports = routes;