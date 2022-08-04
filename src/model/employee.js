const mongoose = require('mongoose')
const mongoose_delete = require('mongoose-delete');
const validador = require('validator')
const { sqlConfig } = require("../db/connSQL");
const sql = require("mssql");

const employeeSchema = new mongoose.Schema({
    name: {
        type: String,
        trim:true,
        uppercase: true,
        required: true
    },
    lastname: {
        type: String,
        trim: true,
        uppercase: true,
        required: true
    },
    second_lastname: {
        type: String,
        trim: true,
        uppercase: true,
        required: true
    },
    email:{
        type: String,
        unique: true,
        required: true,
        trim: true,
        validate(value){
            if( ! (validador.isEmail(value)) ){
                throw new Error('Correo electronico no valido..')
            }   
        }
    },
    dob: {
        type: Date,
        required: false
    },
    hierarchy_id: {
        type: mongoose.Types.ObjectId,
        required: false,
    },
    // hierarchy_id: {},
    workstation: {//No es requerido, sólo sirve al momento de enviar la respuesta
        type: String,
        trim: true
    },
}, { timestamps: true })

employeeSchema.methods.toJSON = function(){

    const employee = this
    const employeePublic = employee.toObject()
    delete employeePublic.__v
    // delete employeePublic.deleted
    delete employeePublic.createdAt
    delete employeePublic.updatedAt
    delete employeePublic.deletedAt
    // delete employeePublic.dob

    return employeePublic

}

employeeSchema.statics.getAllEmployees = async(id) => {
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

employeeSchema.statics.getOficialCredito = async(idOffice) => {
    try {
        const pool = await sql.connect(sqlConfig);
        const result = await pool.request()
            .input('id_sucursal', sql.Int, idOffice)
            .input('id_zona', sql.Int, 0)
            .input('id_coordinador', sql.Int, 0)
            .input('codigo', sql.VarChar, 'PROM')
            .input('operacion', sql.VarChar, 'CLIENTE')
            .input('id_sesion', sql.Int, 1)
            .execute('COMM_ObtenerPlantillaPuesto');
        
        return result.recordset;

    } catch (err) {
        throw new Error(err);
    }
}

employeeSchema.statics.getAllBranches = async(chunk) => {
    try{
        //Checar con el extractor (api movil)
        const request = new sql.Request();

        try {
            let pool = await sql.connect(sqlConfig);
            let result = await pool
                .request()
                .execute("MOV_ObtenerCatalogoOficinasFinancieras");
            return result;
        } catch (err) {
            console.log(err)
            return err;
        }


    } catch(e){
        console.log(e)
        return e;
    }
}

employeeSchema.plugin(mongoose_delete, { deletedAt: true, deletedBy : true, overrideMethods: 'all'});


const Employee = mongoose.model('Employee', employeeSchema)
module.exports = Employee