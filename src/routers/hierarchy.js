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
                "hierarchy_name": "SUPERADMIN",
                "workstation": "SUPERADMIN",
                "isroot": true,
                "parent": "N/A"
            },
            {
                _id: mongoose.Types.ObjectId('628d5ddb2eb899da313db551'),
                "hierarchy_name": "DIRECTOR COMERCIAL - ORIENTE",
                "workstation": "DIRECTOR COMERCIAL",
                "isroot": false,
                "parent": [
                  {
                    "id_Parent":"628d5ddb2eb899da313db550",
                    "name_Parent":"SUPERADMIN"
                  }
                ]
              },
              {
                _id: mongoose.Types.ObjectId('628d5ddb2eb899da313db552'),
                "hierarchy_name": "SUBDIRECTOR - ORIENTE",
                "workstation": "SUBDIRECTOR COMERCIAL",
                "isroot": false,
                "parent": [
                  {
                    "id_Parent":"628d5ddb2eb899da313db551",
                    "name_Parent":"DIRECTOR COMERCIAL - ORIENTE"
                  }
                ]
              },
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


router.get('/createHierarchies/hf', auth, async(req, res) => {

    try{
        await HierarchyHF.deleteMany();
        const DataHF = await Hierarchy.getAllHierarchies();
        // console.log((DataHF.recordsets[0]).length);

        const hierarchies = DataHF.recordsets[0];
        const employees = DataHF.recordsets[1];

        //Coemnzamos a ordenar los datos para insertar las jerarquías
        const rowData = [];
        let id_puesto;
        let id_empleado_padre;
        let etiqueta = '';
        let root = false;
        let nombre_puestoPadre = '';
        let id_puestoPadre = '';

        employees.forEach((employee, index) => {

            let puesto = hierarchies.filter(element => element.id === employee.id_puesto);
            puesto.length != 0 ? etiqueta = puesto[0].etiqueta : etiqueta = 'Sin puesto';
            etiqueta === 'DIRECTOR GENERAL' ? root = true : root = false;

            //Buscamos el empleado padre para obtener el id de su puesto
            let patern = employees.filter(element => element.id === employee.id_empleado_padre);
            //Obtenemos el id_puesto del empleado padre, si no tiene empleado padre, por default lo dejamos como hijo del DIRECTOR GENERAL
            patern.length != 0 ? id_empleado_padre = patern[0].id_puesto : id_empleado_padre = 41;
            //Buscamos el puesto del empleado padre
            let puestopadre = hierarchies.filter(element => element.id === id_empleado_padre);

            if(puestopadre.length != 0 ){
                nombre_puesto = puestopadre[0].etiqueta
                id_puestoPadre = puestopadre[0].id
            }else{
                nombre_puesto = 'No está registrado su puesto padre';
                id_puestoPadre = 0;
            }

            rowData.push({
                external_id: puesto[0].id,
                hierarchy_name: puesto[0].descripcion,
                workstation: etiqueta,
                // nombres: employee.persona_nombre_completo,
                external_idEmployee : employee.id,
                padre: employee.id_empleado_padre,
                is_root: root,
                parent: [
                    {
                        id_Parent: id_puestoPadre,
                        name_Parent: nombre_puesto
                    }
                ]
            })
        })

        await HierarchyHF.insertMany(rowData);

        res.status(200).send('Creados');

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