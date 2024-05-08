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
exports.userRouter = void 0;
const express_1 = __importDefault(require("express"));
const User_1 = __importDefault(require("../model/User"));
const authorize_1 = require("../middleware/authorize");
const Nano = __importStar(require("nano"));
const fs_1 = __importDefault(require("fs"));
const router = express_1.default.Router();
exports.userRouter = router;
router.post("/users/hf/login", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield User_1.default.findUserByCredentialsHF(req.body.user, req.body.password);
        const token = yield User_1.default.generateAuthTokenHf(user);
        res.status(200).send(Object.assign(Object.assign({}, user), { token }));
    }
    catch (error) {
        console.log(error);
        res.status(400).send(error.message);
    }
}));
router.post("/db_all_docs", authorize_1.authorize, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let nano = Nano.default(req.body.path);
        const db = nano.use(req.body.db_name);
        const today = new Date().toISOString();
        const fileName = `${req.body.db_name}-${today}.txt`;
        const doclist = yield db.list({ include_docs: true }).then((body) => {
            body.rows.forEach((doc) => {
                fs_1.default.appendFileSync(fileName, JSON.stringify(doc) + ';');
            });
        });
        res.send({ fileName });
    }
    catch (e) {
        console.log(e.message);
        res.status(400).send(e.message);
    }
}));
