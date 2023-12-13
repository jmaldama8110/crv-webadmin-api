"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const body_parser_1 = __importDefault(require("body-parser"));
const Nano = __importStar(require("nano"));
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
/** Handlebars initialization */
const express_handlebars_1 = require("express-handlebars");
// import { calculateAge, timeToDate } from "./utils/dateTime";
const hbs = (0, express_handlebars_1.create)();
const serverHost = `${process.env.WEB_SERVER_HOST}`;
const app = (0, express_1.default)();
const port = process.env.PORT || 3407;
app.use(body_parser_1.default.json());
app.use(body_parser_1.default.urlencoded({ extended: true }));
app.use((0, cors_1.default)({
    origin: '*',
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}));
app.use(express_1.default.static("public"));
app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');
app.set('views', './views');
app.listen(port, () => {
    console.log('Secure server 🔑 is up and running 🚀...at ' + port);
});
let nano = Nano.default(`${process.env.COUCHDB_PROTOCOL}://${process.env.COUCHDB_USER}:${process.env.COUCHDB_PASS}@${process.env.COUCHDB_HOST}:${process.env.COUCHDB_PORT}`);
// app.get('/pdf/hfr', async(req, res) =>{
//   try{
//     if( !req.query.patientId ){
//       throw new Error('patientId query param missing')
//     }
//     const db = nano.use(process.env.COUCHDB_NAME!);
//     const data:any = await db.get(req.query.patientId as string);
//     const dateStr = data.dob.split('-');
//     let age = 0;
//     if( dateStr.length === 3 ) {
//       const newDate = new Date( `${dateStr[2]}-${dateStr[1]}-${dateStr[0]}`)
//       age = calculateAge(newDate, new Date() )  
//     }
//     const diagnostic = data.diagnostic.map( (i:any) => ({ created_at: timeToDate(parseInt(i.created_at)), note: i.note, created_by: i.created_by}))
//     const htmlData = await hbs.render('views/hfr.handlebars', {
//         serverHost,
//         name: `${data.name} ${data.lastname} ${data.second_lastname}`,
//         rec_no: data.rec_no,
//         gender: data.gender,
//         dob: data.dob,
//         age,
//         address: data.address,
//         phone: data.phone,
//         service: data.service,
//         blood_type: data.blood_type,
//         relative: data.relative,
//         diagnostic
//      });
//     const result = await renderPDf(htmlData); 
//     res.send({...result } );
//   }
//   catch(error:any){
//     console.log(error);
//     res.status(400).send(error.message);
//   }
// })
// app.get('/pdf/nm', async(req, res) =>{
//   try{
//     if( !req.query.patientId ){
//       throw new Error('patientId query param missing')
//     }
//     const db = nano.use(process.env.COUCHDB_NAME!);
//     const data:any = await db.get(req.query.patientId as string);
//     const dateStr = data.dob.split('-');
//     let age = 0;
//     if( dateStr.length === 3 ) {
//       const newDate = new Date( `${dateStr[2]}-${dateStr[1]}-${dateStr[0]}`)
//       age = calculateAge(newDate, new Date() )  
//     }
//     let notes = !req.query.noteId ? 
//                 data.notes : 
//                 [ data.notes.find( (i:any) => i.created_at === req.query.noteId )]
//     const htmlData = await hbs.render('views/nm.handlebars', {
//         serverHost,
//         name: `${data.name} ${data.lastname} ${data.second_lastname}`,
//         rec_no: data.rec_no,
//         age,
//         service: data.service,
//         notes: notes.map( (i:any) => ({ created_at: timeToDate(parseInt(i.created_at)), note: i.note, created_by: i.created_by}))
//      });
//     const result = await renderPDf(htmlData); 
//     res.send({...result } );
//   }
//   catch(error:any){
//     console.log(error);
//     res.status(400).send(error.message);
//   }
// })
// app.get('/html/test', async(req, res) =>{
//   try{
//     if( !req.query.patientId ){
//       throw new Error('patientId query param missing')
//     }
//     const db = nano.use(process.env.COUCHDB_NAME!);
//     const data:any = await db.get(req.query.patientId as string);
//     const dateStr = data.dob.split('-');
//     let age = 0;
//     if( dateStr.length === 3 ) {
//       const newDate = new Date( `${dateStr[2]}-${dateStr[1]}-${dateStr[0]}`)
//       age = calculateAge(newDate, new Date() )  
//     }
//     let notes = !req.query.noteId ? 
//                 data.notes : 
//                 [ data.notes.find( (i:any) => i.created_at === req.query.noteId )]
//     const htmlData = await hbs.render('views/nm.handlebars', {
//         serverHost,
//         name: `${data.name} ${data.lastname} ${data.second_lastname}`,
//         rec_no: data.rec_no,
//         gender: data.gender,
//         dob: data.dob,
//         age,
//         address: data.address,
//         phone: data.phone,
//         service: data.service,
//         blood_type: data.blood_type,
//         relative: data.relative,
//         notes: notes.map( (i:any) => ({ created_at: timeToDate(parseInt(i.created_at)), note: i.note, created_by: i.created_by}))
//      });
//      res.send(htmlData);
//   }
//   catch(error:any){
//     res.status(400).send(error.message);
//   }
// })
// app.post('/sendmail', async (req, res) => {
//   const sendGridApiKey = process.env.SENDGRID_API_KEY as string;
//   const sendGridApiUrl = process.env.SENDGRID_BASE_URL as string;
//   sgMail.setApiKey( sendGridApiKey);
//   try{
//     if( !req.query.toEmail || !req.query.templateId || !req.query.fromEmail){
//       throw new Error('Missing some query param: toEmail, fromEmail, templateId')
//     }
//     const api = axios.create( {
//       method: "post",
//       url: "/v3/mail/send",
//       baseURL: sendGridApiUrl,
//       headers: {
//         "content-type": "application/json",
//         Authorization: `Bearer ${sendGridApiKey}`,
//       }
//     });
//     const apiRes = await api.post('/v3/mail/send',{
//       "from": { "email": req.query.fromEmail },
//       "personalizations": [
//       {
//         "to": [ { "email": req.query.toEmail } ],
//         "dynamic_template_data": {
//             ...req.body
//         }
//       }
//       ],
//       "template_id": req.query.templateId
//     });
//     res.send('Ok');
//   }
//   catch(e:any) {
//     console.log(e);
//     res.status(400).send(e.message);
//   }
// });
// async function renderPDf( htmlData:any ) {
//   const serverEnv = process.env.SERVER_ENV || 'development'
//   const browser = (serverEnv === 'development') ? await puppeteer.launch({ headless: 'new'}) : 
//                                                 await puppeteer.launch({headless: "new",executablePath: '/usr/bin/chromium-browser', args: ['--no-sandbox', '--disable-setuid-sandbox']});
//   const page = await browser.newPage();
//   await page.setContent(htmlData, { waitUntil: ['domcontentloaded', 'load', "networkidle0"] });
//   //To reflect CSS used for screens instead of print
//   await page.emulateMediaType('print');
//   const fileNamePathPdf = `./public/pdfs/pdf_${Date.now().toString()}.pdf`
//   const pdf = await page.pdf({
//     path: fileNamePathPdf,
//     margin: { top: '20px', right: '30px', bottom: '20px', left: '30px' },
//     printBackground: true,
//     format: 'Letter',
//   });
//   // Close the browser instance
//   await browser.close();
//   // fs.unlinkSync(fileNamePathPdf);
//   // res.send(pdf.toString('base64'));
//   return { downloadPath: `${serverHost}/${fileNamePathPdf.replace('./public/','')}` }
// }
