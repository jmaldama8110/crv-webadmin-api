const mongoose = require('mongoose')
const mongoose_delete = require('mongoose-delete');
const validador = require('validator')

const clientSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
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
    curp: {
        type: String,
        required: false,
        trim: true
    },
    ine_folio: {
        type: String,
        trim: true,
        required: false
    },
    dob: {//Fecha de nacimiento
        type: Date,
        required: false
    },
    segmento: {
        type: String,
        required:false,
        trim: false
    },
    loan_cicle: { //Cuántos creditos ha tenido el cliente
        type: Number,
        required: false
    },
    client_type:{
        type: String,
        required: false
    },
    branch : { //Sucursal
        type: String,
        required: false
    },
    is_new: {
        type: Boolean,
        required: false
    },
    bussiness_data: [{//datos socieconómicos
        /*
        total_sale:{
            type: String,
            trim:true
        },
        spouse_salary:{
            type: String,
            trim:true
        },
        other_work:{
            type: String,
            trim:true
        },
        money_from_abroad:{//dinero del extranjero
            type: String,
            trim:true
        },
        other_income:{//otros ingresos
            type: String,
            trim:true
        },
        family_expenses:{
            type: String,
            trim:true
        },
        business_expenses:{
            type: String,
            trim:true
        },
        acounts_payable:{//cuentas por pagar
            type: String,
            trim:true
        },
        credit_card:{
            type: String,
            trim:true
        },
        economic_dependents:{
            type: String,
            trim:true
        },
        montly_income:{
            type: String,
            trim:true
        },
        total_business_income:{//ingreso total del negocio
            type: String,
            trim:true
        },
        total_amount_income:{
            type: String,
            trim:true
        },
        house_payment:{//pago casa 
            type: String,
            trim:true
        },
        family_spending:{
            type: String,
            trim:true
        },
        transportation_expense:{
            type: String,
            trim:true
        },
        housing_expense:{
            type: String,
            trim:true
        },
        other_expenses:{
            type: String,
            trim:true
        },
        total_amount_expenses:{//monto total gastos
            type: String,
            trim:true
        }
        */
    }],
    gender: {
        type: String,
        required: false
    },
    scolarship: {
        type: String,
        required: false
    },
    address: [{
        address_type:{//dirección de casa/ofina/negocio
            type: String,
            trim:true
        },
        federal_entity:{//entidad federativa
            type: String,
            trim:true
        },
        municipality:{
            type: String,
            trim:true
        },
        locality:{
            type: String,
            trim:true
        },
        settlement:{//asentamiento
            type: String,
            trim:true
        }
    }],
    phones: [{
        phone: {
            type: String,
            required: false
            // unique:true
        },
        phone_type: {
            type: String,
            required: false
        },
        phone_propierty: {
            type: Boolean,
            required: false
        },
    }],
    credit_circuit_data: [//arreglo por fechas(por checar)

    ],
    external_id:{//El id del otro sistema
        type: String,
        trim:true
    }
}, { timestamps: true })


clientSchema.methods.toJSON = function(){
    const client = this

    const clientPublic = client.toObject()
    // delete clientPublic._id
    // delete clientPublic.user_id
    delete clientPublic.deleted

    return clientPublic
}

clientSchema.statics.passwordHashing = async (password) => {
    return bcrypt.hash(password,8)
}

clientSchema.plugin(mongoose_delete, { deletedAt: true, deletedBy : true, overrideMethods: 'all'});

const Client = mongoose.model('Client', clientSchema)
module.exports = Client