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
    ttl = now - createdTime;
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
  res.send(req.user);
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
  const camposPermitidos = ["name", "email", "password", "lastname", "cart"];

  if (!isComparaArreglosJSON(actualizaciones, camposPermitidos)) {
    return res
      .status(400)
      .send({ error: "Body includes invalid properties..." });
  }

  try {
    actualizaciones.forEach((valor) => (req.user[valor] = req.body[valor]));

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

    return res.send(req.user);
  } catch (e) {
    res.status(400).send(e);
  }
});

router.post("/users/login", async (req, res) => {
  // Enviar peticion Login, generar un nuevo token

  try {
    const user = await User.findUserByCredentials(
      req.body.email,
      req.body.password
    );

    const token = await user.generateAuthToken();

    res.send({ user: user, token });
  } catch (error) {
    console.log(error);
    res.status(400).send(error);
  }
});

router.post("/users/logout", auth, async (req, res) => {
  // Enviar peticion de Logout, elimina el token actual

  try {
    req.user.tokens = req.user.tokens.filter((token) => {
      return token.token !== req.currentToken;
    });

    await req.user.save();
    res.send();
  } catch (error) {
    console.log(error);
    res.status(500).send();
  }
});

router.post("/users/logoutall", auth, async (req, res) => {
  // Envia peticion de Logout de todos los tokens generados, elimina todos los tokens

  try {
    req.user.tokens = [];
    await req.user.save();
    res.send();
  } catch (error) {
    res.status(500).send();
  }
});

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
router.post(
  "/users/me/avatar",
  auth,
  upload.single("avatar"),
  async (req, res) => {
    const buffer = await sharp(req.file.buffer)
      .resize({ width: 250, height: 250 })
      .png()
      .toBuffer();

    req.user.selfi = buffer;

    await req.user.save();

    res.send();
  },
  (error, req, res, next) => {
    // handle error while loading upload
    res.status(400).send({ error: error.message });
  }
);

// DELETE elminar el avatar del usuario autenticado
router.delete("/users/me/avatar", auth, async (req, res) => {
  req.user.avatar = undefined;
  await req.user.save();

  res.send();
});

// GET obtener el avatar de cualquier usuario (sin estar logeado)
router.get("/users/:id/avatar", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user || !user.avatar) {
      throw new Error();
    }

    res.set("Content-Type", "image/png"); // respues en modo imagen desde el server
    res.send(user.avatar); // send -> campo buffer
  } catch (error) {
    res.status(404).send();
  }
});

const isComparaArreglosJSON = (origen, destino) => {
  const resultadoLogico = origen.every((actual) => destino.includes(actual));
  return resultadoLogico;
};

module.exports = router;
