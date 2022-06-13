const mongoose = require("mongoose")
const mongoose_delete = require('mongoose-delete');


const productSchema = new mongoose.Schema({
    // agregar todos los campos requeridos conforme lo vimos le sabado
    product_type: { // TNC, VIV
        type: String,
        required: true,
        trim: true
    },
    product_name: { // Tu negocio conserva
        type: String,
        required: true,
        trim: true
    },
    step_amount: {
        type: String,
        trim: true
    },
    min_amount: { // 30,000
        type: String,
        required: true,
        trim: true
    },
    max_amount: { // 150,000
        type: String,
        required: true,
        trim: true
    },
    default_amount: {
        type: String,
        trim: true
    },
    min_term: { // 2
        type: Number,
        required: true,
    },
    max_term: { // 12 
        type: Number,
        required: true,
    },
    default_term: [],
    allowed_frequency: [{// B
        identifier:{
            type: String,
            required: true,
            trim: true
        },
        value: {
            type: String,
            required: true,
            trim: true
        },
    }],
    allowed_term_type: [{ // Meses, Bimestres
        identifier: { // B
            type: String,
            required: true,
            trim: true
        },
        value: { // B
            type: String,
            required: true,
            trim: true
        },
        year_periods: { // 6
            type: String,
            required: true,
            trim: true
        },
    }],
    year_days: { // 360 | 365 | 364
        type: Number,
        required: true,
    },
    rate: {
        type: String,
        required: true,
        trim: true
    },
    loan_purpose: [{
        external_id: {
            type: String
        },
        description: {
            type: String
        }
    }],
    logo: {
        type: String,
        required: false
    },
    avatar: {
        type: String,
        required: false
    },
    description:{
        type: String,
        trim: true
    },
    default_mobile_product: {
        type: Boolean,
        default: false
    },
    enabled:{
        type: Boolean,
        default: true
    }

}, { timestamps: true })

productSchema.methods.toJSON = function(){
    const product = this

    const productPublic = product.toObject()
    
    // delete userPublic._id;
    // delete productPublic.logo
    // delete productPublic.avatar
    delete productPublic.deleted

    return productPublic

}

productSchema.plugin(mongoose_delete, { deletedAt: true, deletedBy : true, overrideMethods: 'all'});

const Product = mongoose.model('Products',productSchema)

module.exports = Product