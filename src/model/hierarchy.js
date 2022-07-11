const mongoose = require('mongoose');
const mongoose_delete = require('mongoose-delete');

// Cambiar nombre por hierarchy
const hierarchySchema = new mongoose.Schema({
    hierarchy_name: {
        type: String,
        required: true,
    },
    // department:{ //Area
    //     type: String,
    //     required: true,
    // },
    workstation: {
        type: String,
        trim: true,
        required: true,
    },
    isroot: {
        type: Boolean,
        default: false
    },
    parent: [//2 valores => 1- Id, 2- Padre 
        
    ],
    name_employee: {
        type: String,
        trim: true
    }
})

hierarchySchema.plugin(mongoose_delete, { deletedAt: true, deletedBy : true, overrideMethods: 'all'});

const Hierarchy = mongoose.model('Hierarchy', hierarchySchema)
module.exports = Hierarchy