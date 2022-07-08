const express = require('express')
const router = new express.Router;
const Hierarchy = require('../model/hierarchy')
const Employee = require("../model/employee");
const auth = require("../middleware/auth")

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