"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const body_parser_1 = __importDefault(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const User_1 = require("./routers/User");
const HfServer_1 = require("./routers/HfServer");
const Actions_1 = require("./routers/Actions");
const VerifyDocument_1 = require("./routers/VerifyDocument");
const Puppeteer_1 = require("./routers/Puppeteer");
const Email_1 = require("./routers/Email");
/** Handlebars initialization */
const express_handlebars_1 = require("express-handlebars");
const hbs = (0, express_handlebars_1.create)();
const app = (0, express_1.default)();
const port = process.env.PORT || 3001;
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
app.use(User_1.userRouter);
app.use(HfServer_1.hfRouter);
app.use(Actions_1.ActionsRouter);
app.use(VerifyDocument_1.verifyDocRouter);
app.use(Puppeteer_1.puppeteerRouter);
app.use(Email_1.sendEmailRouter);
app.listen(port, () => {
    console.log('Secure server 🔑 is up and running 🚀...at ' + port);
});
