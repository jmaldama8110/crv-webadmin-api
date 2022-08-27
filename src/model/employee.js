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
                throw new Error('Correo electronico no válido..')
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
    role: [],
    user_id: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User'
    },
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

employeeSchema.statics.getPoderNotarialByOfficeYFondo = async(idLoan, idOffice) => {
    try {
        const pool = await sql.connect(sqlConfig);

        const fondo = await pool.request()
            .input('idPrestamo', sql.Int, idLoan)
            .execute('DISB_GetFondoByPrestamo');

        const idFondeador = fondo.recordset[0].id;

        const notarial = await pool.request()
            .input('idOficinaFinanciera', sql.Int, idOffice)
            .input('idFondeador', sql.Int, idFondeador)
            .input('idSesion', sql.Int, 0)
            .execute('OTOR_ObtenerPoderNotarialPorUsuarioOficinaYFondo');

        return notarial.recordset;
    } catch (err) {
        return err;
    }
}

employeeSchema.plugin(mongoose_delete, { deletedAt: true, deletedBy : true, overrideMethods: 'all'});


const Employee = mongoose.model('Employee', employeeSchema)
module.exports = Employee