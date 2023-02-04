const express = require("express")
const router = new express.Router();
const Product = require("../model/product")
const auth = require("../middleware/auth");
const multer = require("multer"); // parar cargar imagenes
const sharp = require("sharp");

const ProductCollection = require("../model/productCollection");

const upload = multer({
    limits: {
      fileSize: 1000000, // 1,0 megabytes z
    },
    fileFilter(req, file, cb) {
      // cb -> callback function
        if (!file.originalname.match(/\.(png|jpg|jpeg)$/)) {
        // Expresion regular-> checar regex101.com
        return cb(new Error("Not a valid image.. use only PNG, JPEG, JPG"));
      }
  
      cb(undefined, true);
    },
});

const convertToBuffer = async(img) => {
    return await sharp(img.buffer)
    .resize({ width: 250, height: 250 })
    .png()
    .toBuffer();

    // return buffer;
}

const images = upload.fields([{ name: 'logo', maxCount: 1 }, { name: 'avatar', maxCount: 1 }])

router.post("/couch/products", async(req,res) => {
    try{
        //Creamos un nuevo producto
        const newProduct = req.body;
        const registro = Object.keys(newProduct);
        
        if (!isComparaArreglos(registro)) throw new Error('Body includes invalid properties...');

        const product = new ProductCollection(newProduct);

        await product.save();

        res.status(201).send(product);

    } catch(e){
        res.status(400).send(e.message);
    }
});
router.post("/products", auth, async(req,res) => {
    //Creamos un nuevo producto
    try{
        const newProduct = req.body;
        const registro = Object.keys(newProduct);
        
        if (!isComparaArreglos(registro)) {
            return res.status(400).send({ error: "Body includes invalid properties..." });
        }
        // console.log(req.files);

        const product = new Product(newProduct);

        // if(req.files != undefined){
        //     console.log('Trae archivos')
        //     if(req.files.logo != undefined){
        //         console.log('trae logo');
        //         const logo = req.files.logo;
        //         const bufferlogo = await convertToBuffer(logo[0]);
        //         product.logo = bufferlogo;
        //     }
        //     if(req.files.avatar != undefined){
        //         console.log('trae avatar');
        //         const avatar = req.files.avatar;
        //         const bufferavatar = await convertToBuffer(avatar[0]);
        //         product.avatar = bufferavatar;
        //     }
        // }

        // console.log(newProduct)

        await product.save();

        res.status(201).send(product);

    } catch(e){
        console.log(e)
        res.status(400).send(e + '')
    }
});

router.get('/couch/products', async(req, res) => {    
    try {
        const match = {};

        if(req.query.id) match._id = req.query.id;
        const productCollection = new ProductCollection();
        const product = await productCollection.find(match);

        if (!product || product.length === 0) throw new Error("Not able to find the product(s)");
        //TODO QUITAR EL ID Y DATOS PRIVADOS DE LA RESPUESTA(getDataPublic())
        res.status(200).send(product);

    } catch (e) {
        res.status(400).send(e.message);
    }

});
router.get('/products', auth, async(req, res) => {

    const match = {};

    try {

        if(req.query.id){
            match._id = req.query.id
        }

        const product = await Product.find(match);
        if (!product || product.length === 0) {
            throw new Error("Not able to find the product(s)");
        }
        
        res.status(200).send(product);

    } catch (e) {
        res.status(400).send(e + '');
    }

});

//TODO NO SE OCUPA
router.get('/productsWebSite', async(req, res) => {

    const match = {};

    try {
        const product = await Product.getProductsWeb();
        if (!product || product.length === 0) {
            throw new Error("Not able to find the product(s)");
        }

        const rowData = [];

        product.forEach((item) => {
            const periodicidades = item.periodicidades.split(",");
            // console.log(periodicidades);

            rowData.push(
                {
                    external_id: item.id,
                    default_mobile_product: false,
                    enabled: item.estatus === "Activo" ? true : false,
                    product_type: item.tipo_credito,
                    product_name: item.nombre,
                    min_amount: item.valor_minimo,
                    max_amount: item.valor_maximo,
                    default_amount: item.valor_minimo,
                    allowed_term_type: periodicidades,
                    min_term: item.periodo_min,
                    max_term: item.periodo_max,
                    default_term: item.periodo_min,
                    min_rate: item.tasa_anual_min,
                    max_rate: item.tasa_anual_max,
                    rate: item.tasa_anual_min,
                    requires_insurance: item.requiere_seguro,
                    liquid_guarantee: item.garantia_liquida,
                    GL_financeable: item.garantia_liquida_financiable,
                    tax: item.impuesto,
                    years_type: item.tipo_ano
                }
            )
        });

        res.status(200).send(rowData);
        // res.status(200).send(product);

    } catch (e) {
        res.status(400).send(e + '');
    }

});

router.get('/couch/products/hf', async(req, res) => {
    try{
        const products = await ProductCollection.getAllProducts();
        const result = (products.recordsets[0]).filter(configuracion => configuracion.configuracion === "MONTOS_OTORGADOS");

        const rowData = [];

        result.forEach((item) => {
            const periodicidades = item.periodicidades.split(",");
            rowData.push(
                {
                    external_id: item.id,
                    default_mobile_product: false,
                    enabled: item.estatus === "Activo" ? true : false,
                    product_type: item.tipo_credito,
                    product_name: item.nombre,
                    min_amount: item.valor_minimo,
                    max_amount: item.valor_maximo,
                    default_amount: item.valor_minimo,
                    allowed_term_type: periodicidades,
                    min_term: item.periodo_min,
                    max_term: item.periodo_max,
                    default_term: item.periodo_min,
                    min_rate: item.tasa_anual_min,
                    max_rate: item.tasa_anual_max,
                    rate: item.tasa_anual_min,
                    requires_insurance: item.requiere_seguro,
                    liquid_guarantee: item.garantia_liquida,
                    GL_financeable: item.garantia_liquida_financiable,
                    tax: item.impuesto,
                    years_type: item.tipo_ano
                }
            )
        });

        res.status(200).send(rowData);

    } catch (e){
        console.log(e)
        res.status(400).send(e.message);
    }

});
router.get('/products/hf', auth, async(req, res) => {

    try{

        const products = await Product.getAllProducts();
        // console.log(products.recordsets[0]);
        
        // const result = products.recordsets[0];
        const result = (products.recordsets[0]).filter(configuracion => configuracion.configuracion === "MONTOS_OTORGADOS");
        // console.log(result);

        const rowData = [];

        result.forEach((item) => {
            const periodicidades = item.periodicidades.split(",");
            // console.log(periodicidades);

            rowData.push(
                {
                    external_id: item.id,
                    default_mobile_product: false,
                    enabled: item.estatus === "Activo" ? true : false,
                    product_type: item.tipo_credito,
                    product_name: item.nombre,
                    min_amount: item.valor_minimo,
                    max_amount: item.valor_maximo,
                    default_amount: item.valor_minimo,
                    allowed_term_type: periodicidades,
                    min_term: item.periodo_min,
                    max_term: item.periodo_max,
                    default_term: item.periodo_min,
                    min_rate: item.tasa_anual_min,
                    max_rate: item.tasa_anual_max,
                    rate: item.tasa_anual_min,
                    requires_insurance: item.requiere_seguro,
                    liquid_guarantee: item.garantia_liquida,
                    GL_financeable: item.garantia_liquida_financiable,
                    tax: item.impuesto,
                    years_type: item.tipo_ano
                }
            )
        });

        // console.log(result);
        res.status(200).send(rowData);

    } catch (e){
        console.log(e)
        res.status(400).send(e + '');
    }

});

router.get('/couch/productByBranch/:id', async(req, res) => {
    try{
        const id = req.params.id;
        const result = await ProductCollection.getProductsByBranchId(id);

        res.status(200).send(result.recordset);

    } catch(e){
        console.log(e);
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

//TODO FALTA
router.patch('/couch/products/:id', async(req, res) => {
    try {
        const data = req.body;
        const _id = req.params.id;
        const actualizaciones = Object.keys(data);
        
        if (!isComparaArreglos(actualizaciones)) throw new Error('Body includes invalid properties...');
        const productCollection = new ProductCollection();
        const product = await productCollection.findOne( {_id} );

        if (!product) throw new Error("Not able to find the product");
        //TODO DUDA
        if(data.default_mobile_product != undefined && data.default_mobile_product === true){
            const default_mobile = await Product.findOne({"default_mobile_product": true})
            if(default_mobile != null){
                if(default_mobile._id != _id){//id diferentes cambiar a falso el que estaba por defecto
                    await Product.updateOne({_id: default_mobile._id},{"default_mobile_product": false})
                }
            }
        }
        actualizaciones.forEach((valor) => (product[valor] = data[valor]));
        const productUpdate = new ProductCollection(product)
        productUpdate.save();

        // await product.save();

        res.status(200).send(product);
    } catch (e) {
        res.status(400).send(e.message);
    }

});
router.patch('/products/:id', auth, async(req, res) => {

    try {
        const data = req.body;
        // console.log(data);
        // return res.send(data);
        const _id = req.params.id;
        const actualizaciones = Object.keys(data);
        
        if (!isComparaArreglos(actualizaciones)) {
            return res.status(400).send({ error: "Body includes invalid properties..." });
        }
        
        // if(req.files.logo != undefined){
        //     const logo = req.files.logo;
        //     const bufferlogo = await convertToBuffer(logo[0]);
        //     data.logo = bufferlogo;
        // }
        // if(req.files.avatar != undefined){
        //     const avatar = req.files.avatar;
        //     const bufferavatar = await convertToBuffer(avatar[0]);
        //     data.avatar = bufferavatar;
        // }    

        const product = await Product.findOne( {_id} );
        if (!product) {
            throw new Error("Not able to find the product");
        }
        if(data.default_mobile_product != undefined && data.default_mobile_product === true){
            const default_mobile = await Product.findOne({"default_mobile_product": true})
            if(default_mobile != null){
                if(default_mobile._id != _id){//id diferentes cambiar a falso el que estaba por defecto
                    await Product.updateOne({_id: default_mobile._id},{"default_mobile_product": false})
                }
            }
        }
        actualizaciones.forEach((valor) => (product[valor] = data[valor]));
        // await Product.findByIdAndUpdate(_id,data)
        await product.save();

        res.status(200).send(product);
    } catch (e) {
        console.log('error' + e + '');
        res.status(400).send(JSON.stringify(e + ''));
    }

});

router.delete('/products/:id', auth, async(req, res) => {

    try{
        const _id = req.params.id;

        const product = await Product.findOne({_id})

        if(!product){
            throw new Error("Not able to find the product");
        }

        await product.delete();
        
        res.status(200).send({
            deleted: product.deleted,
            message: `'${product.product_name}' product has been successfully enabled`
        });

    } catch(e){
        res.status(400).send(e + '')
    }
});

router.post('/products/restore/:id',auth,async(req, res) => {

    const _id = req.params.id;

    try{

        const product = await Product.findOneDeleted({_id})
        if(!product){
            throw new Error("Not able to find the product");
        }

        product.restore();
        
        res.status(200).send({
            deleted: product.deleted,
            message: `'${product.product_name}' product has been successfully enabled`
        });


    } catch(e) {
        res.status(400).send(e + '')
    }

});

const isComparaArreglos = (actualizar) => {
    const permitido = ["deleted","product_type","product_name","short_name","step_amount","min_amount","max_amount","default_amount","min_term","max_term","default_term","allowed_frequency", "default_frecuency","allowed_term_type","year_days","min_rate", "max_rate", "rate","logo","avatar","description","default_mobile_product", "enabled", "years_type", "requires_insurance", "liquid_guarantee", "GL_financeable", "tax", "external_id"];
    const result = actualizar.every((campo) => permitido.includes(campo));
    return result;
};

module.exports = router;
