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
exports.QueryRouter = void 0;
const express_1 = __importDefault(require("express"));
const Nano = __importStar(require("nano"));
let nano = Nano.default(`${process.env.COUCHDB_PROTOCOL}://${process.env.COUCHDB_USER}:${process.env.COUCHDB_PASS}@${process.env.COUCHDB_HOST}:${process.env.COUCHDB_PORT}`);
const router = express_1.default.Router();
exports.QueryRouter = router;
router.get('/query/data', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const dbQuery = yield nano.db.list();
        const dbsList = dbQuery.filter((db) => (db.includes("cnsrv-promotor")))
            .filter((x) => ((x != 'cnsrv-promotor' && x != 'cnsrv-promotor-')));
        let data = [];
        for (let i = 0; i < dbsList.length; i++) {
            const buff = yield getGroupsFromDb(dbsList[i]);
            data = data.concat(buff);
        }
        res.send(data);
    }
    catch (err) {
        res.send(err.message);
    }
}));
function getGroupsFromDb(dbName) {
    return __awaiter(this, void 0, void 0, function* () {
        const db = nano.use(dbName);
        const queryGroup = yield db.find({
            selector: {
                couchdb_type: "GROUP"
            }, limit: 100000
        });
        const queryLoans = yield db.find({
            selector: {
                couchdb_type: "LOANAPP_GROUP",
            }, limit: 10000
        });
        const loansData = queryLoans.docs.filter((x) => x.estatus == 'ACEPTADO' && x.sub_estatus == 'PRESTAMO ACTIVO');
        let data = [];
        data = loansData.map((k) => {
            const groupDoc = queryGroup.docs.find((w) => w._id === k._id);
            return {
                _id: k._id,
                id_cliente: k.id_cliente,
                id_solicitud: k.id_solicitud,
                nombre_grupo: groupDoc ? groupDoc.group_name : '',
                monto_solicitado: k.apply_amount,
                producto_id: k.product.external_id,
                producto_nombre: k.product.product_name,
                frecuencia: k.frequency[1],
                plazo: k.term,
                promotor: k.created_by
            };
        });
        return data;
    });
}
