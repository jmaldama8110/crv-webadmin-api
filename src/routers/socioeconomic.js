const express = require("express");
const router = new express.Router();
const auth = require("../middleware/auth");
const Socioeconomic = require('../model/socioeconomic');

router.get('/socioeconomics/:id', auth, async(req, res) => {

    let match = { created_by: req.params.id }
    try {
        const data = await Socioeconomic.find(match);
        if (!data) {
            throw new Error("Not able to find socioeconomic data");
        }
        res.status(200).send(data);
    } catch (e) {
        console.log(e);
        res.status(400).send(e + "");
    }

});

module.exports = router;