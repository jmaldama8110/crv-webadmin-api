const express = require("express")
const router = new express.Router();
const Product = require("../model/product")
const auth = require("../middleware/auth");
const multer = require("multer"); // parar cargar imagenes
const sharp = require("sharp");

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
router.post("/products", auth, async(req,res) => {
    //Creamos un nuevo producto
    try{
        const newProduct = req.body.data;
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

        product.save().then((response)=>{
            res.status(200).send(response.product_name)
        }).catch((e) => {
            res.status(400).send(e + '');
        })

    } catch(e){
        console.log(e)
        res.status(400).send(e + '')
    }
});


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
        
        // console.log(data)
        res.status(200).send(data);

    } catch (e) {
        res.status(400).send(e);
    }

})

router.patch('/products/:id', auth, async(req, res) => {

    try {
        // console.log(req.body.data)
        const data = req.body.data;
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

const isComparaArreglos = (actualizar) => {
    const permitido = ["deleted","product_type","product_name","step_amount","min_amount","max_amount","default_amount","min_term","max_term","default_term","allowed_frequency","allowed_term_type","year_days","rate","loan_purpose","logo","avatar","description","default_mobile_product", "enabled"];
    const result = actualizar.every((campo) => permitido.includes(campo));
    return result;
  };

module.exports = router;
