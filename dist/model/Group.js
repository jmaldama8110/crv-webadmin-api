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
exports.Group = void 0;
const mssql_1 = __importDefault(require("mssql"));
const connSQL_1 = require("../db/connSQL");
const DocumentCollection_1 = require("./DocumentCollection");
class Group extends DocumentCollection_1.DocumentCollection {
    constructor(obj = {}) {
        super();
        this._id = obj._id || Date.now().toString(),
            this._rev = obj._rev,
            this.couchdb_type = 'GROUP',
            this.id_cliente = obj.id_cliente,
            this.group_name = obj.group_name,
            this.weekday_meet = obj.weekday_meet,
            this.hour_meet = obj.hour_meet,
            this.loan_officer = obj.loan_officer,
            this.loan_cycle = obj.loan_cycle,
            this.address = obj.address,
            this.created_by = obj.created_by,
            this.branch = obj.branch,
            this.status = obj.status,
            this.coordinates = obj.coordinates;
    }
    /**
     *
     * @param {number} idGroup Id_cliente de HF
     * @returns {Array}
     */
    getGroupById(idGroup) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const pool = yield mssql_1.default.connect(connSQL_1.sqlConfig);
                const result = yield pool.request()
                    .input('id_grupo', mssql_1.default.Int, idGroup)
                    .execute('MOV_ObtenerGrupoByID');
                return result.recordset;
            }
            catch (error) {
                throw new Error(error);
            }
        });
    }
}
exports.Group = Group;
