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
        
    ],
    workstation: {
        type: String,
        trim: true
    },
    name_employee: {
        type: String,
        trim: true
    }
})



const Hierarchy = mongoose.model('Hierarchy', hierarchySchema)
module.exports = Hierarchy