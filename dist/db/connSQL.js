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
exports.connectionSQL = exports.sqlConfig = void 0;
const mssql_1 = __importDefault(require("mssql"));
const sqlConfig = {
    user: process.env.SQL_SERVER_USERNAME,
    password: process.env.SQL_SERVER_PASSWORD,
    database: process.env.SQL_SERVER_DATABASE,
    server: process.env.SQL_SERVER_NAME ? process.env.SQL_SERVER_NAME : '',
    port: process.env.SQL_SERVER_PORT ? parseInt(process.env.SQL_SERVER_PORT) : 0,
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 3000000,
    },
    options: {
        encrypt: false,
        trustServerCertificate: true, // change to true for local dev / self-signed certs
    },
};
exports.sqlConfig = sqlConfig;
function connectionSQL() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const pool = yield mssql_1.default.connect(sqlConfig);
            console.log('SQL Connected correctly!...');
            return pool;
        }
        catch (err) {
            console.error(err);
        }
    });
}
exports.connectionSQL = connectionSQL;
