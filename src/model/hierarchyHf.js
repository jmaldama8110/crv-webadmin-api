const mongoose = require('mongoose');
const mongoose_delete = require('mongoose-delete');
const { sqlConfig } = require("../db/connSQL");
const sql = require("mssql");

// Cambiar nombre por hierarchy
const hierarchyHfSchema = new mongoose.Schema({
    hierarchy_name: {
        type: String,
        required: true,
    },
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
    external_id:  {
        type: String,
        trim: true
    },
    external_idEmployee:  {
        type: String,
        trim: true
    },
    name_employee: {
        type: String,
        trim: true
    }
})

hierarchyHfSchema.statics.getAllHierarchies= async(id) => {
    try {
        let pool = await sql.connect(sqlConfig);
        let result = await pool
            .request()
            .execute("MOV_ObtenerDatosDelPersonal");
        return result;
        // console.log(result)
    } catch (err) {
        console.log(err)
        return err;
    }
};

hierarchyHfSchema.plugin(mongoose_delete, { 
    deletedAt: true, 
    deletedBy : true, 
    overrideMethods: 'all'}
);

const HierarchyHf = mongoose.model('HF_Hierarchy', hierarchyHfSchema)
module.exports = HierarchyHf