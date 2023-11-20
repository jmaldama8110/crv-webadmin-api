const DocumentCollection = require('./documentCollection')
const { sqlConfig } = require("../db/connSQL");
const sql = require("mssql");

class ProductCollection extends DocumentCollection {
    constructor(obj = {}) {
        super()
        this._id = obj._id || Date.now().toString(),
        this._rev = obj._rev,
        this._couchdb_type = 'PRODUCT',
        this._product_type = obj.product_type,
        this._product_name = obj.product_name,
        this._short_name = obj.short_name,
        this._step_amount = obj.step_amount,
        this._min_amount = obj.min_amount,
        this._max_amount = obj.max_amount,
        this._default_amount = obj.default_amount,
        this._min_term = obj.min_term,
        this._max_term = obj.max_term,
        this._default_term = obj.default_term,
        this._allowed_frequency = obj.allowed_frequency || [],
        this._default_frecuency = obj.default_frecuency || [],
        this._allowed_term_type = obj.allowed_term_type || [],
        this._years_type = obj.years_type,
        this._min_rate = obj.years_type,
        this._max_rate = obj.max_rate,
        this._rate = obj.rate,
        this._logo = obj.logo,
        this._avatar = obj.avatar,
        this._description = obj.description,
        this._default_mobile_product = obj.default_mobile_product,
        this._enabled = obj.enabled,
        this._external_id = obj.external_id,
        this._requires_insurance = obj.requires_insurance,
        this._liquid_guarantee = obj.liquid_guarantee,
        this._GL_financeable = obj.GL_financeable,
        this._tax = obj.tax
    }

    // toJSON() {
    //     const product = this

    //     const productPublic = product.toObject()

    //     delete productPublic.createdAt
    //     delete productPublic.updatedAt
    //     delete productPublic.__v

    //     return productPublic
    // }

    static async getAllProducts(id) {
        try {
            let pool = await sql.connect(sqlConfig);
            let result = await pool
                .request()
                .execute("MOV_ObtenerInformacionProductos");

            return result;

        } catch (err) {
            throw new Error(err)
        }
    };

    static async getProductsWeb() {
        const pool = await sql.connect(sqlConfig);
        let result = await pool
            .request()
            .execute('MOV_ProductsForWeb');
        return result.recordset;

    }

    static async getProductsByBranchId(id) {
        try {
            const pool = await sql.connect(sqlConfig);
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
            throw new Error(err);
        }
    }
}

module.exports = ProductCollection;