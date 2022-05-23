const express = require("express");
const router = new express.Router();
const User = require("../model/user");
const Signup = require("../model/signup");
const auth = require("../middleware/auth");
const moment = require("moment");
const multer = require("multer"); // parar cargar imagenes
const sharp = require("sharp");


const axios = require("axios");

const {
  sendWelcomeEmail,
  sendGoodbyEmail,
  sendRecoverPasswordEmail,
  sendConfirmationEmail,
} = require("../emails/account");
const sendWelcomeSMS = require("../sms/sendsms");
const passwordGenerator = require("../utils/codegenerator");

router.post("/users/signup", async (req, res) => {
  const code = passwordGenerator(10);

  try {
    const signup = new Signup({ code, ...req.body });
    await signup.save();

    sendConfirmationEmail(req.body.email, req.body.name, code)
    res.status(201).send({
      signup: {
        name: signup.name,
        lastname: signup.lastname,
        email: signup.email,
      },
    });
  } catch (err) {
    res.status(400).send(err);
  }
});

router.post("/users/create/:signup_code", async (req, res) => {
  // crea un nuevo usuario
  try {
    const signup = await Signup.findOne({ code: req.params.signup_code });
    if (!signup) {
      throw new Error("Not able to find the confirmation code");
    }
    if (signup.code !== req.params.signup_code) {
      throw new Error("Not able to find the confirmation code");
    }
    // calculate 20 minutes of time to live for the signup code
    const createdTime = moment(signup.createdAt);
    const now = moment();
    let ttl = now - createdTime;
    if (ttl > 1200000) {
      throw new Error("Confirmation code has expired!");
    }
    const user = new User({
      name: signup.name,
      lastname: signup.lastname,
      email: signup.email,
      password: signup.password,
    });

    const token = await user.generateAuthToken();
    await user.save();
    sendWelcomeEmail(user.email, user.name)

    res.status(201).send({ user, token });
  } catch (e) {
    
    res.status(400).send(e);
  }
});

router.get("/users/me", auth, async (req, res) => {
  try{
    res.send(req.user);
  } catch (e) {
    
    res.status(400).send(e);
  }
});

router.post("/notifications", async (req, res) => {
  try {
    const noti = new Notification({ data: req.body });
    await noti.save();
  } catch (error) {
    res.status(401).send();
  }

  res.status(200).send();
});

router.patch("/users/me", auth, async (req, res) => {
  // PATCH (actualiza) usuario

  const actualizaciones = Object.keys(req.body);
  const camposPermitidos = ["name", "email", "password", "lastname"];

  if (!isComparaArreglosJSON(actualizaciones, camposPermitidos)) {
    return res
      .status(400)
      .send({ error: "Body includes invalid properties..." });
  }

  try {
    actualizaciones.forEach((valor) => (req.user[valor] = req.body[valor]));
    req.user.password = await User.passwordHashing(req.user.password);
    await req.user.save();
    res.status(200).send(req.user);
  } catch (e) {
    res.status(400).send(e);
  }
});

router.delete("/users/me", auth, async (req, res) => {
  // elimina mi usuario (quien esta logeado)

  try {
    await req.user.remove();

    // sendGoodbyEmail(req.user.email,req.user.name)

    res.send(req.user);
  } catch (e) {
    res.status(400).send(e);
  }
});

router.post("/users/login", async (req, res) => {
  // Enviar peticion Login, generar un nuevo token

  // console.log(req.body.email, req.body.password)

  try {
      const user = await User.findUserByCredentials(
      req.body.email,
      req.body.password
    );

    const token = await user.generateAuthToken();

    res.status(200).send({ user: user, token });
  } catch (error) {
    
    res.status(400).send(error + '');
  }
});

router.post("/users/logout", auth, async (req, res) => {
  // Enviar peticion de Logout, elimina el token actual

  try {
    req.user.tokens = req.user.tokens.filter((token) => {
      return token.token !== req.currentToken;
    });

    await req.user.save();
    res.status(200).send('Closed sesion...');
  } catch (error) {
    console.log(error + '');
    res.status(500).send(error);
  }
});

router.post("/users/logoutall", auth, async (req, res) => {
  // Envia peticion de Logout de todos los tokens generados, elimina todos los tokens

  try {
    req.user.tokens = [];
    await req.user.save();
    res.status(200).send('Closed sesions...');
  } catch (error) {
    res.status(500).send(error);
  }
});

router.post("/users/recoverpassword", async(req, res) => {
  //recibir el email
  const email = req.body.email;
  const code = passwordGenerator(10);

  try{
    const user = await User.findOne( {email} );
    if( !user ){
      return res.status(400).send('No se encontro');
    }

    sendRecoverPasswordEmail(email, user.name, code);

    // await User.updateOne({email}, {$set:{code, datecode: moment()}})
    await User.updateOne(
      {email}, 
      {$push:{
        recoverpassword: {
          recoverpasswordcode: code,
          codedate: moment()
      }
      }})
    .then(() =>{
      res.status(200).send({user: user.email,code: code});
    })
    .catch((e) =>  res.status(400).send(e))

  } catch (error) {
    console.log(error + '');
    res.status(500).send(error);
  }
});

router.post("/users/verifycode", async(req, res) => {

  try{
    const user = await User.findOne({ 'recoverpassword.recoverpasswordcode': req.body.code});
    
    if(!user){
      throw new Error("Code not found!!");
    }
    // Validamos el tiempo del código
    const codeTime = moment(user.datecode);
    const now = moment();
    let arrCodeRP= user.recoverpassword;
    const result = arrCodeRP.find(codedate => codedate.recoverpasswordcode === req.body.code);
    let timefinal = now - result.codedate;
    if (timefinal > 1200000) {
      throw new Error("Confirmation code has expired!");
    }
    
    res.status(200).send({user: user});

  } catch(e) {
    res.status(400).send(e + '')
  }

});

router.post("/users/newpassword", async(req,res) => {

  try{
    const user = await User.findOne({ email: req.body.email});
    
    if(!user){
      throw new Error("email not found!!");
    }
    
    req.body.password = await User.passwordHashing(req.body.password);
    await User.updateOne({email: user.email}, {$set:{password: req.body.password}})
    res.status(200).send({user: user});

  } catch(e) {
    res.status(400).send(e + '')
  }
  

})

const upload = multer({
  //dest: 'avatars', commentado para evitar que envie el archivo sea enviado a la carpeta avatars
  limits: {
    fileSize: 1000000, // 1,0 megabytes
  },
  fileFilter(req, file, cb) {
    // cb -> callback function

    if (!file.originalname.match(/\.(png|jpg|jpeg)$/)) {
      // Expresion regular-> checar regex101.com
      return cb(new Error("Not a valid image.. use only PNG, JPEG, JPG"));
    }

    cb(undefined, true);
    // cb( new Error('file type in not accepted') )
    // cb( undefined, true )
    // cb( undefined, false )
  },
});

// POST actualizar imagen avater del usuario autenticado
router.post("/users/me/avatar", auth, upload.single("avatar"), async (req, res) => {
    const buffer = await sharp(req.file.buffer)
      .resize({ width: 250, height: 250 })
      .png()
      .toBuffer();

    req.user.selfi = buffer;

    await req.user.save()
    .then(() => {
      res.status(200).send(req.user);
    })
    .catch(() => {
      res.status(400).send('Could not update');
    })

    // res.send();
  },
  (error, req, res, next) => {
    // handle error while loading upload
    res.status(400).send({ error: error.message });
  }
);

// DELETE elminar el avatar del usuario autenticado
router.delete("/users/me/avatar", auth, async (req, res) => {
  // console.log(req.user.selfi)
  req.user.selfi = undefined;
  await req.user.save()
  .then(() => {
    res.status(200).send('Removed successfully');
  })
  .catch(() => {
    res.status(400).send('Could not delete');
  })

  // res.send();
});

// GET obtener el avatar de cualquier usuario (sin estar logeado)
router.get("/users/:id/avatar", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    // console.log(user)

    if (!user || !user.selfi) {
      throw new Error();
    }

    res.set("Content-Type", "image/png"); // respues en modo imagen desde el server
    res.send(user.selfi); // send -> campo buffer
  } catch (error) {
    res.status(404).send('Error');
  }
});

const isComparaArreglosJSON = (origen, destino) => {
  const resultadoLogico = origen.every((actual) => destino.includes(actual));
  return resultadoLogico;
};

module.exports = router;
