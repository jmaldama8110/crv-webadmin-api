const mongoose = require('mongoose')

// Cambiar nombre por hierarchy
const positionSchema = new mongoose.Schema({
    position_name: {
        type: String,
        required: true,
    },
    department:{ //Area 
        type: String,
        required: true,
    },
    isroot: {
        type: Boolean,
        required: true
    },
    parent: [//2 valores => 1- Id, 2- Padre
        
    ]
})



const Position = mongoose.model('Position', positionSchema)
module.exports = Position