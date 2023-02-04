const express = require("express");
const router = new express.Router();
// const auth = require("../middleware/auth");
const Socioeconomic = require('../model/socioeconomic');
const SocioeconomicsCollection = require("./../model/socioeconomicsCollection");
const socioeconomicsCollection = new SocioeconomicsCollection();
const auth = require("../middleware/authCouch");

router.post('/socioeconomics', auth, async (req, res)=>{
    try {
        const newData = new SocioeconomicsCollection({...req.body});
        await newData.save();
        res.send(newData.getDataPrivate());
    }
    catch(error){
        res.status(400).send(error.message);
    }
});
// router.post('/socioeconomics', auth, async (req, res)=>{
//     try {
//         const newData = new Socioeconomic({...req.body});
//         await newData.save();
//         res.send(newData);
//     }
//     catch(error){
//         console.log(error);
//         res.status(400).send(error);
//     }
// });

router.get('/socioeconomics/:id', auth, async(req, res) => {
    try {
        let match = { created_by: req.params.id }

        const data = await socioeconomicsCollection.find(match);
        if (!data || data.length === 0) throw new Error("Not able to find socioeconomic data");

        res.status(200).send(data);
    } catch (e) {
        res.status(400).send(e.message);
    }
});
// router.get('/socioeconomics/:id', auth, async(req, res) => {

//     let match = { created_by: req.params.id }
//     try {
//         const data = await Socioeconomic.find(match);
//         if (!data || data.length === 0) {
//             return res.status(204).send("Not able to find socioeconomic data");
//         }
//         res.status(200).send(data);
//     } catch (e) {
//         console.log(e);
//         res.status(400).send(e + "");
//     }

// });

module.exports = router;