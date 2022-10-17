const express = require('express');
const router = new express.Router();
const User = require('../model/user');
const Client = require('../model/client');
const auth = require ('../middleware/auth');
const Identityimg = require('../model/identityimg');


router.get('/users', auth, async(req, res) =>{

    const match = {}
    
    try{

        if (req.query.id){
            match._id = req.query.id
        }

        const users = await User.find(match)
                                // .populate('veridoc',{frontImage: 1, backImage:1, faceImage: 1});
        if(!users || users.length == 0){
            throw new Error('Not able to find the user(s)');
        }

        for(let i = 0; i < users.length; i++) {
            // console.log(users.length)
            const dataUser = users[i];

            if(dataUser.client_id != undefined && dataUser.veridoc != undefined){
                // console.log('es cliente')
                await dataUser.populate('veridoc',{frontImage: 1, backImage:1, faceImage: 1, _id:1}).execPopulate();
            }
            
        }
        
        res.status(200).send(users);

    } catch(e){
        console.log(e + '');
        res.status(400).send(e + '');
    }
});

router.patch("/user/:id", auth, async (req, res) => {
    // PATCH (actualiza) usuario
    try {

        const _id = req.params.id;

        const update = req.body;
        const actualizaciones = Object.keys(update);

        const user = await User.findById({_id});

        // return res.send(user)
        if(!user){
            return res.status(204).send();
        }
        
        if(update.password != undefined){
            update.password = await User.passwordHashing(update.password);
        }
    
        actualizaciones.forEach((valor) => (user[valor] = update[valor]));
        await user.save();
  
      
        //   //Actualizar si es empleado, función de la web
        //   if(req.body.employee_id != undefined || req.body.employee_id != ""){
        //     const _id = req.user.employee_id;
        //     const employee = await Employee.findOne({_id});
        //     if(employee != null){
        //       actualizaciones.forEach((valor) => (employee[valor] = update[valor]));
        //       await employee.save();
        //     }
        //   }
  
        res.status(200).send(user);
    } catch (e) {
      res.status(400).send(e + '');
    }
  });

module.exports = router;