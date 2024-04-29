"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmailRouter = void 0;
const express_1 = __importDefault(require("express"));
const axios_1 = __importDefault(require("axios"));
const authorize_1 = require("../middleware/authorize");
const mail_1 = __importDefault(require("@sendgrid/mail"));
const router = express_1.default.Router();
exports.sendEmailRouter = router;
router.post('/sendemail', authorize_1.authorize, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const sendGridApiKey = process.env.SENDGRID_API_KEY ? process.env.SENDGRID_API_KEY : '';
    const sendGridApiUrl = process.env.SENDGRID_BASE_URL ? process.env.SENDGRID_BASE_URL : '';
    mail_1.default.setApiKey(sendGridApiKey);
    try {
        if (!req.query.toEmail || !req.query.templateId || !req.query.fromEmail) {
            throw new Error('Missing some query param: toEmail, fromEmail, templateId');
        }
        const api = axios_1.default.create({
            method: "post",
            url: "/v3/mail/send",
            baseURL: sendGridApiUrl,
            headers: {
                "content-type": "application/json",
                Authorization: `Bearer ${sendGridApiKey}`,
            }
        });
        const apiRes = yield api.post('/v3/mail/send', {
            "from": { "email": req.query.fromEmail },
            "personalizations": [
                {
                    "to": [{ "email": req.query.toEmail }, { "email": req.query.fromEmail }],
                    "dynamic_template_data": Object.assign({}, req.body)
                }
            ],
            "template_id": req.query.templateId
        });
        res.send('Ok');
    }
    catch (e) {
        console.log(e.message);
        res.status(400).send(e.message);
    }
}));
