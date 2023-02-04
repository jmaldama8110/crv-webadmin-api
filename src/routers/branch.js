const express = require('express');
const router = new express.Router();
const Employee = require("../model/employee");
const Branch = require("../model/branch");
const auth = require('../middleware/auth');
const BranchCollection = require('./../model/branchCollection');


router.post('/couch/branches', async(req, res) => {
    try{
        const data = req.body;
        const branch = new BranchCollection(data);

        await branch.save();
        res.status(201).send(branch);

    } catch(err){
        res.status(400).send(err);
    }
})
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

router.get('/couch/branches', async(req, res) => {    
    try{
        const match = {}
        // if (req.query.id) match._id = req.query.id
        if (req.query.id) match._id = parseInt(req.query.id)
        const branchCollection = new BranchCollection();
        const branch = await branchCollection.find(match);

        if(!branch || branch.length == 0) throw new Error('No records found');
        
        res.status(200).send(branch.sort());

    } catch(err){
        res.status(400).send(err.message);
    }
});
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

router.get('/couch/activeBranches', async(req, res) => {
    try{
        const branchCollection = new BranchCollection();
        const branch = await branchCollection.find({enabled: true});
        if(!branch || branch.length == 0) throw new Error('No records found');
        
        res.status(200).send(branch.sort());

    } catch(err){
        res.status(400).send(err.message);
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

router.get('/branchesHF', auth, async(req, res) => {    
    try{

        const branches = await Branch.getAllBranchesHF();
        
        console.log(branches.length);
        res.status(200).send(branches);

    } catch(e){
        console.log(e + '');
        res.status(400).send(e + '');
    }

});
router.get('/branchesHF/couch', async(req, res) => {    
    try{
        // TODO OBTENER BRANCHES
        const branchCollection = new BranchCollection();
        const branches = await branchCollection.getAllBranchesHF();
        
        // console.log('Lenght: ',branches.length);
        res.status(200).send(branches);

    } catch(e){
        console.log(e + '');
        res.status(400).send(e + '');
    }

});

//Sincronizamos el cátalogo del HF
router.get('/branches/couch/hf', async(req, res) => {    
    try{
        //TODO: GUARDAR BRANCHES
        const branchCollection = new BranchCollection();
        const branches = await branchCollection.getAllBranchesHF(true);

        res.status(200).send('Done!!');

    } catch(e){
        res.status(400).send(e.message);
    }

});
router.get('/branches/hf', auth, async(req, res) => {    
    try{

        await Branch.deleteMany();
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
        res.status(200).send('Done!!');

    } catch(e){
        console.log(e + '');
        res.status(400).send(e + '');
    }

});

router.patch('/branches/couch/:id', async(req, res) => {
    try{
        const _id = req.params.id;
        const data = req.body;
        const actualizaciones =Object.keys(req.body);
        const branchCollection = new BranchCollection();
        //TODO CAMBIE LA FORMA DE BUSCAR DE _ID A ID ()
        const branch = await branchCollection.findOne({_id});
        actualizaciones.forEach((valor) => (branch[valor] = data[valor]));
        const updateBranch = new BranchCollection(branch);
        updateBranch.save();
        
        res.status(200).send(branch);

    } catch(err){
        res.status(400).send(err.message)
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

router.get('/oficialOfBranch/couch/:idBranch', async(req, res) => {
    try{
        const idBranch = req.params.idBranch;

        const oficial = await BranchCollection.getOficialCredito(idBranch);

        res.status(200).send(oficial);

    } catch(e){
        console.log(e + '');
        res.status(400).send(e + '');
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