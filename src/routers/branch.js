const express = require('express');
const router = new express.Router();
const Employee = require("../model/employee");
const Branch = require("../model/branch");
const auth = require('../middleware/auth');

router.post('/branches', auth, async(req, res) => {
    try{
        const data = req.body;
        const branch = new Branch(data);

        await branch.save();
        res.status(201).send(branch);

    } catch(err){
        res.status(400).send(err);
    }
})

router.get('/branches', auth, async(req, res) => {

    const match = {}

    try{
        if (req.query.id){
            match._id = req.query.id
        }

        const branch = await Branch.find(match).sort({_id: 1});
        if(!branch || branch.length == 0){
            throw new Error('No records found');
        }

        // console.log(branch[0].enabled);
        
        res.status(200).send(branch);

    } catch(err){
        res.status(400).send(err);
    }
});

router.get('/activeBranches', auth, async(req, res) => {

    try{

        const branch = await Branch.find({enabled: true}).sort({_id: 1});
        if(!branch || branch.length == 0){
            throw new Error('No records found');
        }
        
        res.status(200).send(branch);

    } catch(err){
        res.status(400).send(err);
    }
});


//Sincronizamos el cátalogo del HF
router.get('/branches/hf', auth, async(req, res) => {    
    try{

        await Branch.deleteMany({});
        const branches = await Branch.getAllBranchesHF();
        const finalResult = [];

        for(let i =0 ; i < branches.length ; i++){
            finalResult.push({
                _id: branches[i].id,
                nombre: branches[i].nombre,
                colonia: [branches[i].id_colonia, branches[i].nombre_colonia],
                municipio: [branches[i].id_municipio, branches[i].nombre_municipio],
                estado: [branches[i].id_estado, branches[i].nombre_estado],
                pais: [branches[i].id_pais, branches[i].nombre_pais],
                direccion: branches[i].direccion,
                codigo_postal: branches[i].codigo_postal
            })
        }

        await Branch.insertMany(finalResult);
        res.status(200).send('Sincronización éxitosa');

    } catch(e){
        console.log(e + '');
        res.status(400).send(e + '');
    }

});

router.patch('/branches/:id', auth, async(req, res) => {
    try{
        const _id = req.params.id;
        const data = req.body;
        const actualizaciones =Object.keys(req.body);

        const branch = await Branch.findOne({_id});
        actualizaciones.forEach((valor) => (branch[valor] = data[valor]));
        await branch.save();
        
        res.status(200).send(branch);

    } catch(err){
        console.log(e)
        res.status(400).send(e + '')
    }
});

router.get('/oficialOfBranch/:idBranch', auth, async(req, res) => {
    try{

        const idBranch = req.params.idBranch;

        const oficial = await Branch.getOficialCredito(idBranch);

        res.status(200).send(oficial);

    } catch(e){
        console.log(e + '');
        res.status(400).send(e + '');
    }
});

module.exports = router;