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
exports.findDbs = exports.getHfBranches = void 0;
const mssql_1 = __importDefault(require("mssql"));
const connSQL_1 = require("../db/connSQL");
const Nano = __importStar(require("nano"));
let nano = Nano.default(`${process.env.COUCHDB_PROTOCOL}://${process.env.COUCHDB_USER}:${process.env.COUCHDB_PASS}@${process.env.COUCHDB_HOST}:${process.env.COUCHDB_PORT}`);
function getHfBranches() {
    return __awaiter(this, void 0, void 0, function* () {
        yield mssql_1.default.connect(connSQL_1.sqlConfig);
        const queryBranchesResultSet = yield mssql_1.default.query `SELECT CORP_CuotaNegocio.id_origen AS id, 
         CORP_CuotaNegocio.etiqueta AS nombre,
         CuotaNegocioPadre.id_origen AS id_zona
    FROM CORP_CuotaNegocio
    INNER JOIN CORP_CuotaNegocio CuotaNegocioPadre
    ON CORP_CuotaNegocio.id_cuota_negocio_padre = CuotaNegocioPadre.id
    WHERE CORP_CuotaNegocio.activo = 1
    AND CORP_CuotaNegocio.id_tipo_cuota_negocio = 3
    AND CORP_CuotaNegocio.id_categoria_cuota_negocio = 2`;
        const result = queryBranchesResultSet.recordset.map((i) => ({
            id: i.id,
            name: i.name
        }));
        return result;
    });
}
exports.getHfBranches = getHfBranches;
function findDbs() {
    return __awaiter(this, void 0, void 0, function* () {
        // Recupera la lista de BD de Sucursales solamente, quitando la global
        const dblist = yield nano.db.list();
        const newlist = dblist.filter((db) => (db.includes("cnsrv-promotor")))
            .filter((x) => (x != 'cnsrv-promotor'));
        return newlist;
    });
}
exports.findDbs = findDbs;
