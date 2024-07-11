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
const connSQL_1 = require("../db/connSQL");
const mssql_1 = __importDefault(require("mssql"));
const crypto_1 = __importDefault(require("crypto"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const Nano = __importStar(require("nano"));
let nano = Nano.default(`${process.env.COUCHDB_PROTOCOL}://${process.env.COUCHDB_USER}:${process.env.COUCHDB_PASS}@${process.env.COUCHDB_HOST}:${process.env.COUCHDB_PORT}`);
class User {
    constructor() {
    }
    static findUserByCredentialsHF(user, password) {
        return __awaiter(this, void 0, void 0, function* () {
            const pool = yield mssql_1.default.connect(connSQL_1.sqlConfig);
            let userFindRes = yield pool
                .request()
                .input("id", mssql_1.default.VarChar, user)
                .query("select * from ADMI_Usuarios WHERE ADMI_Usuarios.correo = @id");
            if (!userFindRes.rowsAffected[0]) {
                userFindRes = yield pool
                    .request()
                    .input("id", mssql_1.default.VarChar, user)
                    .query("select * from ADMI_Usuarios WHERE ADMI_Usuarios.login = @id");
            }
            if (!userFindRes.rowsAffected[0]) {
                throw new Error("Bad credentials HF");
            }
            const userCredentials = userFindRes.recordset[0];
            let hash = crypto_1.default
                .createHash("md5")
                .update(password)
                .digest("hex")
                .toLocaleUpperCase();
            const passMd5 = userCredentials.pass.trim().replaceAll("-", "");
            if (!(passMd5 === hash)) {
                throw new Error("bad credentials...");
            }
            const loanOfficerRes = yield mssql_1.default.query `SELECT 
        Plantilla.id_persona as id_oficial
        ,Persona.nombre as name
        ,Persona.apellido_paterno as lastname
        ,Persona.apellido_materno as second_lastname
        ,Oficina.nombre as nombre_oficina
        ,Plantilla.id_padre as id_padre
        ,Plantilla.id_oficina
        ,CATA_NivelPuesto.id AS id_nivel_puesto
        ,COALESCE(CATA_NivelPuesto.etiqueta,'') AS nivel_puesto
        FROM COMM_PlantillaSucursal Plantilla
        INNER JOIN CORP_Empleado Empleado
        ON Empleado.id=Plantilla.id_empleado
        AND Empleado.activo=1
        INNER JOIN CATA_Puesto Puesto
        ON Puesto.id=Empleado.id_puesto
        INNER JOIN CATA_RolSucursal rol
        ON rol.id=Plantilla.id_rol_sucursal
        AND rol.activo=1
        INNER JOIN CONT_Personas Persona
        ON Persona.id=Plantilla.id_persona
        INNER JOIN CORP_OficinasFinancieras Oficina
        On Oficina.id= Plantilla.id_oficina
        LEFT JOIN CATA_NivelPuesto ON Empleado.id_nivel_puesto = CATA_NivelPuesto.id
        AND CATA_NivelPuesto.activo = 1
        WHERE rol.codigo IN ('PROM','COORD')
        AND Plantilla.estatus='ACTIVO'
        AND Plantilla.activo=1
        AND Persona.id=${userCredentials.id_persona}`;
            if (!loanOfficerRes.recordsets.length) {
                throw new Error("No loan officer associated...");
            }
            const loanOfficerData = loanOfficerRes.recordset[0];
            const userReponse = {
                login: userCredentials.login.trim(),
                email: `${userCredentials.correo}`,
                loan_officer: userCredentials.id_persona,
                name: loanOfficerData.name,
                lastname: loanOfficerData.lastname,
                second_lastname: loanOfficerData.second_lastname,
                branch: [loanOfficerData.id_oficina, loanOfficerData.nombre_oficina],
                officer_rank: [loanOfficerData.id_nivel_puesto, loanOfficerData.nivel_puesto]
            };
            return userReponse;
        });
    }
    static generateAuthTokenHf(user) {
        return __awaiter(this, void 0, void 0, function* () {
            /// adds 24 hours of token expiration
            let sync_info = {};
            const sync_expiration = new Date();
            sync_expiration.setHours(sync_expiration.getHours() + 24);
            sync_info = {
                local_target: "local-db",
                remote_target: "cnsrv-promotor",
                sync_expiration,
            };
            const jwt_secret_key = process.env.JWT_SECRET_KEY ? process.env.JWT_SECRET_KEY : '';
            const token = jsonwebtoken_1.default.sign({ user, sync_info }, jwt_secret_key);
            const db = nano.use(process.env.COUCHDB_NAME);
            const data = {
                _id: Date.now().toString(),
                couchdb_type: "TOKEN",
                token
            };
            yield db.insert(data);
            return token;
        });
    }
}
exports.default = User;
