const express = require('express')
const router = new express.Router;
const Hierarchy = require('../model/hierarchy')
const Employee = require("../model/employee");
const auth = require("../middleware/auth")

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
    }catch(e){
        console.log(e + '')
        res.status(400).send(e + '');

    }
})

module.exports = router;