const mongoose = require("mongoose")
const mongoose_delete = require('mongoose-delete');
const { sqlConfig } = require("../db/connSQL");
const sql = require("mssql");


const productSchema = new mongoose.Schema({
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
    short_name: {
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
    default_term: {
        type: Number,
        required: true,
    },
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
    default_frecuency: [],
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
    years_type: {
        type: String,
    },
    // year_days: {
    //     type: String,
    // },
    min_rate: {
        type: String,
        trim: true
    },
    max_rate: {
        type: String,
        trim: true
    },
    rate: {
        type: String,
        required: true,
        trim: true
    },
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
        type: Boolean
    },
    enabled:{
        type: Boolean
    },
    external_id: {
        type: Number
    },
    requires_insurance: {
        type: Boolean
    },
    liquid_guarantee: {
        type: String,
        trim: true
    },
    GL_financeable: {
        type: Boolean
    },
    tax: {
        type: String,
        trim: true
    }
}, { timestamps: true })

productSchema.methods.toJSON = function() {
    const product  = this

    const productPublic  = product.toObject()

    delete productPublic.createdAt
    delete productPublic.updatedAt
    delete productPublic.__v

    return productPublic
}

productSchema.statics.getAllProducts = async(id) => {
    try {
        let pool = await sql.connect(sqlConfig);
        let result = await pool
            .request()
            .execute("MOV_ObtenerInformacionProductos");
        return result;
    } catch (err) {
        console.log(err)
        return err;
    }
};

productSchema.statics.getProductsByBranchId = async(id) =>{
    try{
        let pool = await sql.connect(sqlConfig);
        const result = pool.request()
        .input('id_producto', sql.Int, 0)
        .input('id_fondeador', sql.Int, 0)
        .input('id_disposicion', sql.Int, 0)
        .input('id_servicio_financiero', sql.Int, 1)
        .input('id_tipo_cliente', sql.Int, 0)
        .input('id_oficina', sql.Int, id)
        .input('id_periodicidad', sql.Int, 0)
        .input('id_tipo_contrato', sql.Int, 0)
        .input('visible', sql.Bit, 1)
        .input('producto_maestro', sql.Bit, 1)
        .execute('CATA_ObtenerProducto')

        return result;

    } catch (err) {
        console.log(err)
        return err;
    }
}

productSchema.plugin(mongoose_delete, { deletedAt: true, deletedBy : true, overrideMethods: 'all'});

const Product = mongoose.model('Products',productSchema)

module.exports = Product