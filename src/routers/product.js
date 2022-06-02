const express = require("express")
const router = new express.Router();
const Product = require("../model/product")
const auth = require("../middleware/auth");
const mongoose = require("mongoose")



router.post("/products", auth, async(req,res) => {
    //Creamos un nuevo producto
    try{
        const actualizaciones = Object.keys(req.body.data);
        const camposPermitidos = ["product_type","product_name","min_amount","max_amount","min_term","max_term","allowed_frequency","allowed_term_type","year_days","rate","loan_purpose"];
        
        if (!isComparaArreglos(actualizaciones, camposPermitidos)) {
            return res.status(400).send({ error: "Body includes invalid properties..." });
        }

        const product = new Product(req.body.data)
        product.save().then((response)=>{
            res.status(200).send(response.product_name)
        }).catch((e) =>{
            res.status(400).send(e);
        })


    } catch(e){
        res.status(400).send(e + '')
    }
});


// GET obtener todos los conceptos Varios
router.get('/products', auth, async(req, res) => {

    const match = {};

    try {

        if (req.query.id) {
            match._id = req.query.id;
        }

        const data = await Product.find(match);
        if (!data) {
            throw new Error("Not able to find the product");
        }
        
        res.status(200).send(data);

    } catch (e) {
        res.status(400).send(e);
    }

})

router.patch('/products/:id', auth, async(req, res) => {

    try {
        // console.log(req.body.data)
        const actualizaciones = Object.keys(req.body.data);
        const camposPermitidos = ["product_type","product_name","min_amount","max_amount","min_term","max_term","allowed_frequency","allowed_term_type","year_days","rate","loan_purpose"];
        
        if (!isComparaArreglos(actualizaciones, camposPermitidos)) {
            return res.status(400).send({ error: "Body includes invalid properties..." });
        }

        const data = req.body.data;
        const _id = req.params.id;

        const product = await Product.findOne( {_id} );
        // console.log(data)
        if (!product) {
            throw new Error("Not able to find the product");
        }
        actualizaciones.forEach((valor) => (product[valor] = data[valor]));
        await product.save();

        res.status(200).send(product);
    } catch (e) {
        console.log('error' + e);
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
        res.status(200).send('ok');

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
        res.status(200).send('ok')


    } catch(e) {
        res.status(400).send(e + '')
    }

});

const isComparaArreglos = (actualizar, permitido) => {
    const result = actualizar.every((campo) => permitido.includes(campo));
    return result;
  };

module.exports = router;
