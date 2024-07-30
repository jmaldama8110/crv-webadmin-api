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
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentCollection = void 0;
const Nano = __importStar(require("nano"));
let nano = Nano.default(`${process.env.COUCHDB_PROTOCOL}://${process.env.COUCHDB_USER}:${process.env.COUCHDB_PASS}@${process.env.COUCHDB_HOST}:${process.env.COUCHDB_PORT}`);
class DocumentCollection {
    constructor(obj = {}) {
        this._id = obj._id || Date.now().toString(),
            this._rev = obj._rev;
        this.branch = obj.branch;
        this.created_at = new Date(Date.now()).toISOString();
        this.updated_at = obj.updated_at || new Date(Date.now()).toISOString();
    }
    getDataPrivate() {
        return Object.assign({}, this);
    }
    getDataPublic() {
        return Object.assign({}, this);
    }
    save() {
        const branchName = this.branch ? `-${this.branch[1].replace(/ /g, '').toLowerCase()}` : "";
        const db = nano.use(process.env.COUCHDB_NAME ? `${process.env.COUCHDB_NAME}${branchName}` : '');
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            const data = this.getDataPrivate();
            db.insert(data)
                .then((doc) => {
                this._rev = doc.rev;
                resolve(doc);
            })
                .catch((err) => reject(err));
        }));
    }
    findOne(data) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                try {
                    const branchName = this.branch ? `-${this.branch[1].replace(/ /g, '').toLowerCase()}` : "";
                    const db = nano.use(process.env.COUCHDB_NAME ? `${process.env.COUCHDB_NAME}${branchName}` : '');
                    const localDocument = yield db.get(data._id);
                    resolve(localDocument);
                }
                catch (error) {
                    reject(error);
                }
            }));
        });
    }
    find(data) {
        return __awaiter(this, void 0, void 0, function* () {
            let selector = { couchdb_type: { "$eq": this.couchdb_type } };
            for (const [key, value] of Object.entries(data)) {
                selector = Object.assign(selector, { [key]: { "$eq": value } });
            }
            ;
            // console.log({selector})
            const branchName = this.branch ? `-${this.branch[1].replace(/ /g, '').toLowerCase()}` : "";
            const db = nano.use(process.env.COUCHDB_NAME ? `${process.env.COUCHDB_NAME}${branchName}` : '');
            // const codeFounds = await db.find({ selector: selector });
            const codeFounds = yield db.find({ selector });
            // console.log(codeFounds.docs)
            return codeFounds.docs;
        });
    }
    delete() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const branchName = this.branch ? `-${this.branch[1].replace(/ /g, '').toLowerCase()}` : "";
                const db = nano.use(process.env.COUCHDB_NAME ? `${process.env.COUCHDB_NAME}${branchName}` : '');
                const result = yield db.destroy(this._id, this._rev);
                return result;
            }
            catch (error) {
                throw new Error(error);
            }
        });
    }
}
exports.DocumentCollection = DocumentCollection;
