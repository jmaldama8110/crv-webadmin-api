const express = require("express");
const router =  new express.Router();
const User = require("../model/user");
const Employee = require("../model/employee");
const Hierarchy = require("../model/hierarchy");
const auth = require("../middleware/auth");


// router.post("/employees", auth, async(req, res) =>{

//     try{

//         const registro = Object.keys(req.body)
//         console.log(registro);
//         if(!comparar(registro)){
//             return res.status(400).send({ error: "Body includes invalid properties..." });
//         }

//         req.body.password = await User.passwordHashing(req.body.password);
//         const user = new User({
//             name: req.body.name,
//             lastname: req.body.lastname,
//             second_lastname: req.body.second_lastname,
//             email: req.body.email,
//             password: req.body.password,
//             dob: req.body.dob,
//             is_employee: true,
//         });
//         await user.save()
//         .then(async(result) => {

//             // console.log("User created", result)
//             const employee = new Employee({
//                 user_id: result._id,
//                 name: req.body.name,
//                 lastname: req.body.lastname,
//                 second_lastname: req.body.second_lastname,
//                 dob: req.body.dob,
//                 position_id: req.body.position_id
//             });
    
//             await employee.save().then(()=>{
//                 console.log('Employee created...');
//                 return res.status(200).send(result);

//             }).catch(async(e) =>{
//                 await Employee.findOneAndDelete({ _id: result._id })
//                 console.log("User Deleted");
//                 throw new Error("Error creating employee");
//             });
            
//         }).catch((err) => {
//             throw new Error("Error Creating User");
//         });

//     } catch(e){
//         res.status(400).send(e + '')
//     }

// });

router.post("/employees", auth, async(req, res) =>{

    try{
        const registro = Object.keys(req.body.data)
        if(!comparar(registro)){
            return res.status(400).send({ error: "Body includes invalid properties..." });
        }

        const data = req.body.data;

        const employee = new Employee({
            name: removeAccents(data.name),
            lastname: removeAccents(data.lastname),
            second_lastname: removeAccents(data.second_lastname),
            email: data.email,
            dob: data.dob,
            position_id: data.position_id
        });

        data.password = await User.passwordHashing(data.password)
        await employee.save().then( async (response)=>{
            console.log('Employee created...');
            const user = new User({
                employee_id: response._id,
                name: response.name,
                lastname: response.lastname,
                second_lastname: response.second_lastname,
                email: response.email,
                password: data.password
              });

              await user.save().then((resp) => {
                return res.status(200).send(resp);
              })
              .catch(async(e) =>{
                await Employee.findOneAndDelete({ _id: response._id })
                console.log("EmployeeDeleted");
                throw new Error(e);
              })

        }).catch(async(e) =>{
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
            employee[i].workstation = workstation.hierarchy_name;
        }
        
        console.log(employee)
        res.status(200).send(employee);
    } catch(e){
        res.status(400).send(e + '');
    }

});

router.patch("/employees/:id", auth, async(req, res) => {

    
    try{
        const update = req.body.data;
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
        
       
        const user_id = employee.user_id;
        const user = await User.findOne({employee_id:_id});
        // console.log(user);
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
            throw new Error("Not able to find the client");
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
        res.status(200).send('ok');

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
        res.status(200).send('ok');
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