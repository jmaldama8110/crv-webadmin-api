const mongoose = require('mongoose')
const mongoose_delete = require('mongoose-delete');
const validador = require('validator')

const employeeSchema = new mongoose.Schema({
    // user_id: {
    //     type: String,
    //     required: true,
    // },
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
    dob: {//Fecha de nacimiento
        type: Date,
        required: false
    },
    hierarchy_id: {
        type: String,
        required: false,
    },
    workstation: {//No es requerido, sólo sirve al momento de enviar la respuesta
        type: String,
        trim: true
    },
}, { timestamps: true })

employeeSchema.methods.toJSON = function(){

    const employee = this
    const employeePublic = employee.toObject()
    // delete employeePublic._id
    // delete employeePublic.user_id
    delete employeePublic.__v
    delete employeePublic.deleted

    return employeePublic

}

employeeSchema.plugin(mongoose_delete, { deletedAt: true, deletedBy : true, overrideMethods: 'all'});


const Employee = mongoose.model('Employee', employeeSchema)
module.exports = Employee