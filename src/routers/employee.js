const express = require("express");
const router =  new express.Router();
const User = require("../model/user");
const Employee = require("../model/employee");
const Hierarchy = require("../model/hierarchy");
const auth = require("../middleware/auth");
const mongoose = require('mongoose')

router.post("/employees", auth, async(req, res) =>{

    try{
        const registro = Object.keys(req.body)
        if(!comparar(registro)){
            return res.status(400).send({ error: "Body includes invalid properties..." });
        }

        const data = req.body;

        const existEmployee = await Employee.findOne({email: data.email});
        if(existEmployee){
            throw new Error("The email is already linked to a registered employeed")
        }

        const existUser = await User.findOne({email: data.email});
        if(existUser){
            throw new Error("The email is already linked to a to a user account")
        }

        if(data.name != undefined){
            data.name = removeAccents(data.name)
        }
        if(data.lastname != undefined){
            data.lastname = removeAccents(data.lastname)
        }
        if(data.second_lastname != undefined){
            data.second_lastname = removeAccents(data.second_lastname)
        }

        const employee = new Employee({
            name: data.name,
            lastname: data.lastname,
            second_lastname: data.second_lastname,
            email: data.email,
            dob: data.dob,
            hierarchy_id: data.hierarchy_id
        });

        data.password = await User.passwordHashing(data.password)
        await employee.save().then( async (response)=>{
            // console.log('Employee created...');
            const user = new User({
                employee_id: response._id,
                name: response.name,
                lastname: response.lastname,
                second_lastname: response.second_lastname,
                email: response.email,
                password: data.password
              });

              await user.save().then((resp) => {
                return res.status(201).send(resp);
              })
              .catch(async(e) =>{
                await Employee.findOneAndDelete({ _id: response._id })
                console.log("EmployeeDeleted");
                throw new Error(e);
              })

        }).catch(async(e) =>{
            console.log(e + '')
            res.status(400).send(e + '');
        });

    } catch(e){
        res.status(400).send(e + '')
    }

});

router.get("/employees", auth, async(req, res) =>{

    const match = {}

    try{
        if(req.query.id){
            match._id = req.query.id;
        }
    
        const employee = await Employee.find(match);
        if (!employee || employee.length === 0) {
            throw new Error("Not able to find the employee");
        }

        for(let i=0; i < employee.length; i++){
            const _id = employee[i].hierarchy_id;
            const workstation = await Hierarchy.findOne({_id});
            if(workstation){
                employee[i].workstation = workstation.hierarchy_name;
            } else{
                employee[i].workstation = 'Sin puesto asignado';
            }
        }
        
        // console.log(employee)
        res.status(200).send(employee);
    } catch(e){
        res.status(400).send(e + '');
    }

});

router.get('/employees/hf', auth, async(req, res) => {

    try{

        const employees = await Employee.getAllEmployees();
        console.log((employees.recordsets[1]).length);

        res.status(200).send(employees.recordsets[1]);

    } catch (e){
        // console.log(e + '')
        res.status(400).send(e + '');
    }

})

router.patch("/employees/:id", auth, async(req, res) => {

    
    try{
        const update = req.body;
        const actualizar = Object.keys(update);
        if(!comparar(actualizar)){
            return res.status(400).send({ error: "Body includes invalid properties..." });
        }
        //Si modificó el nombre cambiarlo a mayúsculas y sin acentos
        if(update.name != undefined){
            update.name = removeAccents(update.name)
        }
        if(update.lastname != undefined){
            update.lastname = removeAccents(update.lastname)
        }
        if(update.second_lastname != undefined){
            update.second_lastname = removeAccents(update.second_lastname)
        }

        const _id = req.params.id;
        const data = update;

        const employee = await Employee.findOne({_id});
        if(!employee){
            throw new Error("Not able to find the employee")
        }
       
        const user = await User.findOne({ employee_id: mongoose.Types.ObjectId(_id) });
        // console.log('Buscando el ',user);
        if(user != null){
            actualizar.forEach((valor) => (user[valor] = data[valor]));
            await user.save()
            .then((result) =>{
                
            })
            .catch((e) =>{
                throw new Error("Error updating user")
            })
        }

        actualizar.forEach((valor) => (employee[valor] = data[valor]));
        await employee.save();

        res.status(200).send(employee);
        

    }catch(e) {
       res.status(400).send(e + '');
    }

});

router.delete("/employees/:id", auth, async(req, res) =>{

    try{
        const _id = req.params.id;

        const employee = await Employee.findOne({_id});
        if(!employee){
            throw new Error("Not able to find the employee");
        }

        
        const user = await User.findOne({employee_id: employee._id});
        if(user != null){
            const userDeleted = await user.delete()
            if(!userDeleted){
                throw new Error("Error deleting user");
            }
        }
        
        const employeeDeleted = await employee.delete()
        if(!employeeDeleted){
            throw new Error("Error deleting employee");
        }
        
        res.status(200).send({
            user,
            message: 'Employee successfully disabled'
        });

    }catch(e) {
       res.status(400).send(e + '');
    }

});

router.post("/employees/restore/:id", auth,async(req,res) =>{
    
    try{
        const _id = req.params.id;

        const employee = await Employee.findOneDeleted({_id});
        if(!employee){
            throw new Error("Not able to find the employee");
        }

        const user = await User.findOneDeleted({employee_id: employee._id});
        if(user != null){
            const userRestore = await user.restore()
            if(!userRestore){
                throw new Error("Error restoring user");
            }
        }

        const employeeRestore = await employee.restore();
        if(!employeeRestore){
            throw new Error("Error restoring employee");
        }
        res.status(200).send({
            user,
            message: 'Employee successfully enabled'
        });
    }catch(e) {
       res.status(400).send(e + '');
    }

})

const removeAccents = (str) => {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
}

const comparar = (entrada) =>{
    const permitido = ["name","lastname","second_lastname","email","password","dob","hierarchy_id"];
    const result = entrada.every(campo => permitido.includes(campo));
    return result;
}

module.exports = router;