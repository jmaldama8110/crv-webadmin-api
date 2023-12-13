

import bodyParser from "body-parser";
import cors from 'cors';
import express from  'express';
require('./db/connCouch');

import { userRouter } from "./routers/User";
import { hfRouter } from './routers/HfServer';
import { verifyDocRouter } from './routers/VerifyDocument';
import { puppeteerRouter } from "./routers/Puppeteer";
import { sendEmailRouter } from "./routers/Email";
/** Handlebars initialization */
import { create } from 'express-handlebars';
const hbs = create();

const app = express();
const port = process.env.PORT || 3001

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.use(cors({
  origin: '*',
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}));

app.use(express.static("public"));
app.engine('handlebars', hbs.engine );
app.set('view engine', 'handlebars');
app.set('views', './views');

app.use(userRouter);
app.use(hfRouter);
app.use(verifyDocRouter);
app.use(puppeteerRouter);
app.use(sendEmailRouter);

app.listen(port, ()=>{
  console.log('Secure server 🔑 is up and running 🚀...at ' + port)
});