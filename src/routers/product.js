const express = require("express")
const router = new express.Router();
const Product = require("../model/product")
const auth = require("../middleware/auth");
const authorize = require("../middleware/authorize");
const nano = require('../db/connCouch');

function mapIdentifierForFrequency (frequencyType) {
    switch( frequencyType){
        case 'Semanal':
            return 'Sl';
        case 'Catorcenal':
            return 'Cl';
        case 'Quincenal': 
            return 'Ql';
        case 'Mensual':
            return 'Ml'
        default:
            return undefined;
    }
}
function mapIdentifierForTerm (frequencyType) {
    switch( frequencyType){
        case 'Semanal':
            return 'S';
        case 'Catorcenal':
            return 'C';
        case 'Quincenal': 
            return 'Q';
        case 'Mensual':
            return 'M'
        default:
            return undefined;
    }
}
function mapValueForTerm (frequencyType) {
    switch( frequencyType){
        case 'Semanal':
            return 'Semana(s)';
        case 'Catorcenal':
            return 'Catorcena(s)';
        case 'Quincenal': 
            return 'Quicena(s)';
        case 'Mensual':
            return 'Mes(es)'
        default:
            return undefined;
    }
}
function mapYearPeriodForTerm (frequencyType) {
    switch( frequencyType){
        case 'Semanal':
            return '52';
        case 'Catorcenal':
            return '26';
        case 'Quincenal': 
            return '24';
        case 'Mensual':
            return '12'
        default:
            return undefined;
    }
}


router.get('/products/sync', authorize, async(req, res) => {

    try {
        const db = nano.use(process.env.COUCHDB_NAME);
        const product = await Product.getProductsWeb();
        if (!product || product.length === 0) {
            throw new Error("Not able to find the product(s)");
        }
        const productsDestroy = await db.find({ selector: { couchdb_type: { "$eq": 'PRODUCT' } }, limit: 100000 });

        const docsEliminate = productsDestroy.docs.map(doc => ({ _deleted: true, _id: doc._id, _rev: doc._rev }))
        await db.bulk({ docs: docsEliminate })

        const rowData = [];
        const creationDatetime = Date.now().toString();

        product.forEach((data) => {

            /// el dato de SQL viene en una lista separada por comas. Una vez split, hay que limpiar la cadena devuelta
            const freqTypes = data.periodicidades.split(",").map( x => x.trim() );
                      
            rowData.push(
                {
                    default_frecuency: [
                        mapIdentifierForFrequency(freqTypes[0]),
                        freqTypes[0]
                    ],
                    deleted: false,
                    default_mobile_product: false,
                    enabled: true,
                    product_type: "1",
                    product_name: data.nombre,
                    external_id: data.id,
                    min_amount: data.valor_minimo.toString(),
                    max_amount: data.valor_maximo.toString(),
                    default_amount: data.valor_minimo.toString(),
                    step_amount: "1000",
                    min_term: data.periodo_min,
                    max_term: data.periodo_max,
                    default_term: data.periodo_min,
                    min_rate: data.tasa_anual_min.toString(),
                    max_rate: data.tasa_anual_max.toString(),
                    rate: data.tasa_anual_min.toString(),
                    tax: data.impuesto.toString(),
                    years_type: data.tipo_ano,
                    allowed_term_type:
                    freqTypes.map(
                        ( w,increment )=> ({
                                    _id: increment,
                                    identifier: mapIdentifierForTerm(w),
                                    value: mapValueForTerm(w),
                                    year_periods: mapYearPeriodForTerm(w)
                               
                    }))
                    ,
                    allowed_frequency: 
                    freqTypes.map(
                        ( w,increment )=> ({
                                _id: increment,
                                identifier: mapIdentifierForFrequency(w),
                                value: w
                    })),
                    liquid_guarantee: data.garantia_liquida.toString(),
                    GL_financeable: data.garantia_liquida_financiable,
                    requires_insurance: data.requiere_seguro,
                    logo: '',
                    avatar: '',
                    createdAt: creationDatetime,
                    updatedAt: creationDatetime,
                    couchdb_type: 'PRODUCT'
                }
            )
        });
        await db.bulk({ docs: rowData });
        res.send(rowData);

    } catch (e) {
        res.status(400).send(e + '');
    }

});



router.get('/productByBranch/:id', auth, async(req, res) => {
    try{

        const id = req.params.id;

        const result = await Product.getProductsByBranchId(id);

        res.status(200).send(result.recordset);

    } catch(e){
        console.log(e);
        res.status(400).send(e + '');
    }
});

module.exports = router;
