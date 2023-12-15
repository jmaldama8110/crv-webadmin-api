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
exports.verifyDocRouter = void 0;
const express_1 = __importDefault(require("express"));
const authorize_1 = require("../middleware/authorize");
const axios_1 = __importDefault(require("axios"));
const url_1 = __importDefault(require("url"));
const router = express_1.default.Router();
exports.verifyDocRouter = router;
router.post("/verify", authorize_1.authorize, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.query.clientId)
            throw new Error('Missing param clientId');
        if (!req.body.frontImage) {
            throw new Error('frontImage base64 property is missing at the request body');
        }
        if (!req.body.backImage) {
            throw new Error('backImage base64 property is missing at the request body');
        }
        if (!req.body.faceImage) {
            throw new Error('faceImage Image base64 property is missing at the request body');
        }
        const veridocToken = yield getVeridocToken();
        const api = axios_1.default.create({
            method: "post",
            url: "/id/v2/verify",
            baseURL: process.env.VERIDOC_URL,
            headers: {
                "content-type": "application/json",
                Authorization: `Bearer ${veridocToken}`,
            },
        });
        const veridocRes = yield api.post("/id/v2/verify", {
            id: req.query.clientId,
            frontImage: req.body.frontImage,
            backImage: req.body.backImage,
            faceImage: req.body.faceImage,
        });
        res.send(veridocRes.data);
    }
    catch (error) {
        res.status(404).send('No coincidences found with supplied Id');
    }
}));
router.post('/verify/status', authorize_1.authorize, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.query.uuid)
            throw new Error('Missing param uuid');
        const veridocToken = yield getVeridocToken();
        const api = axios_1.default.create({
            method: "post",
            url: "/id/v2/status",
            baseURL: process.env.VERIDOC_URL,
            headers: {
                "content-type": "application/json",
                Authorization: `Bearer ${veridocToken}`,
            },
        });
        const veridocRes = yield api.post("/id/v2/status", {
            uuid: req.query.uuid,
        });
        res.send(veridocRes.data);
    }
    catch (e) {
        res.status(404).send('Ocurrio un error!');
    }
}));
router.post('/verify/results', authorize_1.authorize, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.query.uuid || !req.query.includeImages)
            throw new Error('Missing param uuid or includeImages');
        const veridocToken = yield getVeridocToken();
        const api = axios_1.default.create({
            method: "post",
            url: "/id/v2/results",
            baseURL: process.env.VERIDOC_URL,
            headers: {
                "content-type": "application/json",
                Authorization: `Bearer ${veridocToken}`,
            },
        });
        const veridocRes = yield api.post("/id/v2/results", {
            uuid: req.query.uuid,
            includeImages: req.query.includeImages === 'true' ? true : false
        });
        res.send(veridocRes.data);
    }
    catch (e) {
        res.status(404).send('Ocurrio un error!');
    }
}));
function getVeridocToken() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const api = axios_1.default.create({
                method: "post",
                url: "/auth/token",
                baseURL: process.env.VERIDOC_URL,
                headers: { "content-type": "application/x-www-form-urlencoded" },
            });
            const paramsUrl = {
                grant_type: "client_credentials",
                client_id: process.env.VERIDOC_CLIENT_ID,
                client_secret: process.env.VERIDOC_CLIENT_SECRET,
                audience: "veridocid",
            };
            const params = new url_1.default.URLSearchParams(paramsUrl);
            const veridocRes = yield api.post("/auth/token", params);
            const veridoc_token = veridocRes.data.access_token;
            return veridoc_token;
        }
        catch (error) {
            return "";
        }
    });
}
