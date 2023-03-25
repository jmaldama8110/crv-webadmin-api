const express = require('express');
const router = new express.Router();
const authorize = require('../middleware/authorize');
const { sqlConfig } = require("../db/connSQL");
const sql = require("mssql");

router.get('/intermediary/hf',authorize, async(req, res) => {
    try {

        const pool = await sql.connect(sqlConfig);
        let data = await pool
        .request()
        .query(`select * from CATA_Intermediario  where estatus_registro = \'ACTIVO\'`);

        res.send(data.recordsets[0]);
    } catch (error) {
        console.log(error);
        res.status(400).send(error.message);
    }


});

module.exports = router;