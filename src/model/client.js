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
    loan_cycle: { //Cuántos creditos ha tenido el cliente
        type: Number,
        required: false
    },
    client_type:[],
    branch : [],
    sex: [],
    scolarship: [],
    address: [],
    phones: [{
        phone: {
            type: String,
            trim: true
        },
        phone_type: {
            type: String,
            trim: true
        },
        phone_propierty: {
            type: Boolean,
            required: false
        }
    }],
    external_id:{
        type: String,
        trim:true
    },
    //TODO:Campos nuevos
    tributary_regime: [],
    rfc:{
        type: String,
        trim:true
    },
    nationality:[],
    province_of_birth: [],
    country_of_birth: [],
    ocupation: [],
    marital_status: [],
    identification_type: [],// INE/PASAPORTE/CEDULA/CARTILLA MILITAR/LICENCIA
    guarantor:[{
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
        sex: [],
        nationality:[],
        province_of_birth: [],
        country_of_birth: [],
        rfc: {
            type: String,
            trim:true
        },
        curp: {
            type: String,
            trim:true
        },
        ocupation: [],
        e_signature: {
            type: String,
            trim:true
        },
        marital_status: [],
        phones: [{
            phone: {
                type: String,
                trim: true
            },
            phone_type: {
                type: String,
                trim: true
            }
        }],
        email:{
            type: String,
            trim: true,
        },
        identification_type: [],
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
        economic_activity: [],
        sector: [],
        business_since: {
            type: String,
            trim:true
        },
        store_type: [],
        phones: [{
            phone: {
                type: String,
                trim: true
            },
            phone_type: {
                type: String,
                trim: true
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
        relationship:  [],
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
        address: []
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

