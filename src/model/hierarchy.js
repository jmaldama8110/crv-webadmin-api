const mongoose = require('mongoose')

// Cambiar nombre por hierarchy
const hierarchySchema = new mongoose.Schema({
    hierarchy_name: {
        type: String,
        required: true,
    },
    department:{ //Area
        type: String,
        required: true,
    },
    isroot: {
        type: Boolean,
        default: false
    },
    parent: [//2 valores => 1- Id, 2- Padre 
    //PREGUNTAR SI ACA SE DEBE AGREGAR TODOS LOS ID DE LOS PADRES, ES DECIR TODOS LOS QUE ESTAN ARRIBA DE EL, PARA QUE CUANDO EL EMPLEADO INICIE SESION SE HAGA LA CONSULTA Y SE LE TRAIGA TODAS LAS JERARQUIAS A LAS QUE ESTA ASOCIADO SU ID
        
    ],
    workstation: {
        type: String,
        trim: true
    },
    id_employee: {//No se si este sea necesario, ya que el empleado tiene el id de la jerarquía que ocupa
        type: String,
        trim: true
    }
})



const Hierarchy = mongoose.model('Hierarchy', hierarchySchema)
module.exports = Hierarchy