const mongoose = require('mongoose')
const mongoose_delete = require('mongoose-delete');
const validador = require('validator')

const clientSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        uppercase: true
    },
    lastname: {
        type: String,
        trim: true,
        uppercase: true
    },
    second_lastname: {
        type: String,
        trim: true,
        uppercase: true
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
    dob: {
        type: Date,
        required: false
    },
    segmento: {
        type: String,
        required:false,
        trim: false
    },
    loan_cycle: { //Cuántos creditos ha tenido el cliente
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
    gender: {
        type: String,
        required: false
    },
    scolarship: {
        type: String,
        required: false
    },
    address: [],
    phones: [{
        phone: {
            type: String,
            trim: true,
        },
        phone_type: {
            type: String,
            trim: true,
        },
        phone_propierty: {
            type: Boolean,
            required: false
        }
    }],
    credit_circuit_data: [],//arreglo por fechas(por checar)
    external_id:{
        type: String,
        trim:true
    },
    //TODO:Campos nuevos
    tributary_regime: {
        type: String,
        trim:true
    },
    rfc:{
        type: String,
        trim:true
    },
    nationality:{
        type: String,
        trim:true
    },
    province_of_birth: {
        type: String,
        trim:true
    },
    country_of_birth: {
        type: String,
        trim:true
    },
    ocupation: {
        type: String,
        trim:true
    },
    marital_status: {
        type: String,
        trim:true
    },
    identification_type: {// INE/PASAPORTE/CEDULA/CARTILLA MILITAR/LICENCIA
        type: String,
        trim:true
    },
    guarantor:[{//Revisar si queda en objetos con los campos definidos o deja vacío el array
        name: {
            type: String,
            trim: true,
            uppercase: true
        },
        lastname: {
            type: String,
            trim: true,
            uppercase: true
        },
        second_lastname: {
            type: String,
            trim: true,
            uppercase: true
        },
        dob: {
            type: Date,
            required: false
        },
        gender: {
            type: String,
            required: false
        },
        nationality: {
            type: String,
            trim:true
        },
        province_of_birth: {
            type: String,
            trim:true
        },
        country_of_birth: {
            type: String,
            trim:true
        },
        rfc: {
            type: String,
            trim:true
        },
        curp: {
            type: String,
            trim:true
        },
        ocupation: {
            type: String,
            trim:true
        },
        e_signature: {
            type: String,
            trim:true
        },
        marital_status: {
            type: String,
            trim:true
        },
        phones: [{
            phone: {
                type: String,
                trim: true,
            },
            phone_type: {
                type: String,
                trim: true,
            }
        }],
        email:{
            type: String,
            trim: true,
            validate(value){
                if( ! (validador.isEmail(value)) ){
                    throw new Error('Correo electronico no válido..')
                }   
            }
        },
        identification_type: {
            type: String,
            trim:true
        },
        identification_number: {
            type: String,
            trim:true
        },
        company_works_at: {
            type: String,
            trim:true
        },
        address: [],
        person_resides_in: {
            type: String,
            trim:true
        },
    }],
    business_data:[{
        business_name: {
            type: String,
            trim:true
        },
        economic_activity: {
            type: String,
            trim:true
        },
        sector: {
            type: String,
            trim:true
        },
        business_since: {
            type: String,
            trim:true
        },
        premise_type: {
            type: String,
            trim:true
        },
        phones: [{
            phone: {
                type: String,
                trim: true,
            },
            phone_type: {
                type: String,
                trim: true,
            }
        }],
        previous_business_activity: {
            type: String,
            trim: true,
            required: false
        },
        address: []
    }],
    beneficiaries:[{
        name: {
            type: String,
            trim: true,
            uppercase: true
        },
        lastname: {
            type: String,
            trim: true,
            uppercase: true
        },
        second_lastname: {
            type: String,
            trim: true,
            uppercase: true
        },
        dob: {
            type: Date,
            required: false
        },
        relationship:  {
            type: String,
            trim: true
        },
        phones: [{
            phone: {
                type: String,
                trim: true,
            },
            phone_type: {
                type: String,
                trim: true,
            }
        }],
        percentage:  { //Verificar que del total de beneficiarios sume 100%
            type: String,
            trim: true,
            uppercase: true
        },
    }],
    personal_references: [],
    guarantee: []
}, { timestamps: true })


clientSchema.methods.toJSON = function(){
    const client = this

    const clientPublic = client.toObject()
    delete clientPublic.deleted

    return clientPublic
}

clientSchema.statics.passwordHashing = async (password) => {
    return bcrypt.hash(password,8)
}

clientSchema.plugin(mongoose_delete, { deletedAt: true, deletedBy : true, overrideMethods: 'all'});

const Client = mongoose.model('Client', clientSchema)
module.exports = Client

