const express = require('express')
const router = new express.Router;
const Hierarchy = require('../model/hierarchy')
const HierarchyHF = require('../model/hierarchyHf');
const Employee = require("../model/employee");
const auth = require("../middleware/auth");
const mongoose = require("mongoose");

router.post("/hierarchySuperAdmin", async(req, res) => {
    try{
        const data = [
            {
                _id: mongoose.Types.ObjectId('628d5ddb2eb899da313db550'),
                "hierarchy_name": "DIRECTOR GENERAL",
                "workstation": "DIRECTOR GENERAL",
                "isroot": true,
                "parent": ["NA"]
            },
            {
                _id: mongoose.Types.ObjectId('628d5ddb2eb899da313db551'),
                "hierarchy_name": "DIRECTOR COMERCIAL",
                "workstation": "DIRECTOR COMERCIAL",
                "isroot": false,
                "parent": [
                    {
                        "id_Parent": "628d5ddb2eb899da313db550",
                        "name_Parent": "DIRECTOR GENERAL"
                    }
                ]
            },
            {
                _id: mongoose.Types.ObjectId('628d5ddb2eb899da313db552'),
                "hierarchy_name": "SUBDIRECTOR COMERCIAL",
                "workstation": "SUBDIRECTOR COMERCIAL",
                "isroot": false,
                "parent": [
                    {
                        "id_Parent": "628d5ddb2eb899da313db551",
                        "name_Parent": "DIRECTOR COMERCIAL"
                    }
                ]
            },
            {
                _id: mongoose.Types.ObjectId('628d5ddb2eb899da313db553'),
                "hierarchy_name": "GERENTE REGIONAL",
                "workstation": "GERENTE REGIONAL",
                "isroot": false,
                "parent": [
                    {
                        "id_Parent": "628d5ddb2eb899da313db552",
                        "name_Parent": "SUBDIRECTOR COMERCIAL"
                    }
                ]
            },
            {
                _id: mongoose.Types.ObjectId('628d5ddb2eb899da313db554'),
                "hierarchy_name": "GERENTE DE SUCURSAL",
                "workstation": "GERENTE DE SUCURSAL",
                "isroot": false,
                "parent": [
                    {
                        "id_Parent": "628d5ddb2eb899da313db553",
                        "name_Parent": "GERENTE REGIONAL"
                    }
                ]
            },
            {
                _id: mongoose.Types.ObjectId('628d5ddb2eb899da313db555'),
                "hierarchy_name": "COORDINADOR",
                "workstation": "COORDINADOR",
                "isroot": false,
                "parent": [
                    {
                        "id_Parent": "628d5ddb2eb899da313db554",
                        "name_Parent": "GERENTE DE SUCURSAL"
                    }
                ]
            },
            {
                
                _id: mongoose.Types.ObjectId('628d5ddb2eb899da313db556'),
                "hierarchy_name": "OFICIAL",
                "workstation": "OFICIAL",
                "isroot": false,
                "parent": [
                    {
                        "id_Parent": "628d5ddb2eb899da313db555",
                        "name_Parent": "COORDINADOR"
                    }
                ]
            }
        ];

        await Hierarchy.deleteMany();
        const hierarchies = await Hierarchy.insertMany(data);

        res.status(201).send(hierarchies);


    } catch(e) {
        console.log(e + '');
        res.status(400).send(e + '')
    }
});

router.post("/hierarchies",auth, async(req, res) => {
    try{
        const data = req.body;

        if(!comparar(Object.keys(req.body))){
            throw new Error('Body includes invalid properties...');
        }

        const hierarchy = new Hierarchy({...data});

        const result = await hierarchy.save();

        res.status(201).send(result)


    } catch(e) {
        console.log(e + '');
        res.status(400).send(e + '')
    }
});

router.get("/hierarchies",auth,async(req,res) => {

    const match = {}
    const disponible = 'Vacante disponible';

    try{

        if(req.query.id){
            match._id = req.query.id;
        }
        
        const hierarchy = await Hierarchy.find(match);
        if (!hierarchy || hierarchy.length === 0) {
            throw new Error("Nothing found");
        }

        for(let i = 0; i < hierarchy.length; i++) {
            const hierarchy_id = hierarchy[i]._id;
            const employee = await Employee.findOne({hierarchy_id});
            if(employee != null) {
                hierarchy[i].name_employee = employee.name + ' ' + employee.lastname;
                // console.log(hierarchy_id,' con vacate: ' + employee.name, )
            }
            else{
                hierarchy[i].name_employee = disponible;
                // console.log(hierarchy_id, 'Sin vacate')
            }
        }
        
        res.status(200).send(hierarchy);
    } catch(e){
        console.log(e + '')
        res.status(400).send(e + '');

    }
});

router.get("/newhierarchies",auth,async(req,res) => {

    const match = {}

    try{

        const hierarchy = await Hierarchy.find(match);
        if (!hierarchy || hierarchy.length === 0) {
            throw new Error("Nothing found");
        }

        const puestos = JSON.parse(JSON.stringify(hierarchy))

        for(let i = 0; i < puestos.length; i++) {
            const p = puestos[i];
            const employee = await Employee.find({ hierarchy_id: p._id});
            // console.log(employee);
            p.employee = [];
            p.employee.push(employee);
            // p.nuevo = "jajjajjajajja"
        }
        
        res.status(200).send(puestos);

    } catch(e){
        console.log(e + '')
        res.status(400).send(e + '');

    }
});

router.get('/hierarchies/hf', auth, async(req, res) => {

    try{
        await HierarchyHF.deleteMany();
        const DataHF = await Hierarchy.getAllHierarchies();
        // console.log((DataHF.recordsets[0]).length);

        const hierarchies = DataHF.recordsets[0];

        res.status(200).send(hierarchies);

    } catch (e){
        // console.log(e + '')
        res.status(400).send(e + '');
    }

})

router.get("/availableHierarchies",auth, async(req, res) => {

    try{

        const positionsOccupied = [];
        const positions = [];

        const employees = await Employee.find();
        for(let i =0; i< employees.length; i++){
            positionsOccupied.push(employees[i].hierarchy_id)
        }

        const hierarchies = await Hierarchy.find();
        for(let i =0; i< hierarchies.length; i++){
            positions.push(hierarchies[i]._id)
        }

        const availables = filtrar(positions, positionsOccupied);
        // console.log(availables.length)
        // if(availables.length === 0){
        //     throw new Error("No positions available")
        // }

        const result = [];


        for (let i = 0; i < availables.length; i++){
            result.push(await Hierarchy.findOne({ _id: availables[i] }));
        }

        res.status(200).send(result);
        
    } catch(e){
        res.status(404).send(e + '');
    }

})

router.patch("/hierarchies/:id",auth, async(req, res) => {
    try{

        const _id = req.params.id;
        const data = req.body;
        const update = Object.keys(req.body);
        if(!comparar(update)){
            throw new Error('Body includes invalid properties...');
        }

        const hierarchy = await Hierarchy.findOne({_id});

        if(!hierarchy){
            throw new Error ("Not able to find the hierarchy");
        }
        update.forEach((campo) => {
            hierarchy[campo] = data[campo];
        });

        await hierarchy.save();
        res.status(200).send(hierarchy)

    } catch(e){
        res.status(400).send(e+ '');
    }
});

router.delete("/hierarchies/:id", async(req, res)=> {
    try{
        const _id = req.params.id;

        const hierarchy = await Hierarchy.findOne({_id});
        if(!hierarchy){
            throw new Error("Not able to find the hierarchy");
        }

        const hierarchyDeleted = await hierarchy.delete();
        if(!hierarchyDeleted){
            throw new Error("Error deleting hierarchy");
        }

        res.status(200).send({
            name: hierarchy.hierarchy_name,
            workstation: hierarchy.hierarchy_name,
            message: 'Hierarchy successfully disabled'
        });

    }catch(e) {
       res.status(400).send(e + '');
    }
});

router.post("/hierarchies/restore/:id", auth,async(req,res) =>{
    
    try{
        const _id = req.params.id;

        const hierarchy = await Hierarchy.findOneDeleted({_id});
        if(!hierarchy){
            throw new Error("Not able to find the hierarchy");
        }

        const hierarchyRestore = await hierarchy.restore()
        if(!hierarchyRestore){
            throw new Error("Error restore hierarchy");
        }
        res.status(200).send({
            name: hierarchy.hierarchy_name,
            workstation: hierarchy.hierarchy_name,
            message: 'Hierarchy successfully enabled'
        });

    }catch(e) {
       res.status(400).send(e + '');
    }

})

const comparar = (entrada) => {
    const validos = ["_id","hierarchy_name", "workstation", "isroot", "parent"];
    const res = entrada.every(campo => (validos.includes(campo)));
    return res;
}

const filtrar = (disponibles, ocupados) => {

    for (let i = 0; i < ocupados.length; i++) {
        disponibles = disponibles.filter( val => val.toString()  !== ocupados[i].toString() );
    } 
    
    return disponibles;

}

module.exports = router;