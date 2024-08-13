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
const mssql_1 = __importDefault(require("mssql"));
const connSQL_1 = require("../db/connSQL");
const authorize_1 = require("../middleware/authorize");
const Nano = __importStar(require("nano"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
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
        if (!req.body.path || !req.body.db_name) {
            throw new Error("path,db_name params are mising...");
        }
        let nano = Nano.default(req.body.path);
        const db = nano.use(req.body.db_name);
        const today = Date.now().toString();
        const fileName = `${req.body.db_name}-${today}.txt`;
        const doclist = yield db.list({ include_docs: true });
        const allDocs = doclist.rows.map((row) => {
            delete row.doc._rev;
            return Object.assign({}, row.doc);
        });
        const filePath = path_1.default.join(__dirname, fileName);
        fs_1.default.appendFileSync(filePath, JSON.stringify(allDocs));
        res.send({ fileName });
    }
    catch (e) {
        console.log(e.message);
        res.status(400).send(e.message);
    }
}));
router.post('/db_restore', authorize_1.authorize, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.body.fileName || !req.body.target || !req.body.db_name) {
            throw new Error('No fileName or target or db_name parameter provided in body request');
        }
        const filePath = path_1.default.join(__dirname, req.body.fileName);
        console.log(filePath);
        const data = JSON.parse(fs_1.default.readFileSync(filePath, "utf8"));
        let nano = Nano.default(req.body.target);
        const db = nano.use(req.body.db_name);
        yield db.bulk({ docs: data });
        res.send({ count: data.length });
    }
    catch (e) {
        console.log(e);
        res.status(400).send(e.message);
    }
}));
router.post('/db_catalog_restore', authorize_1.authorize, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.body.catalogKeyword || !req.body.target || !req.body.db_name) {
            throw new Error('catalogKeyword, target and db_name params not provided in body');
        }
        yield updateSingleCatalogFromHF(req.body.catalogKeyword, 10000, req.body.target, req.body.db_name, true);
        res.status(201).send('Done!');
    }
    catch (error) {
        console.log(error + '');
        res.status(400).send(error + '');
    }
}));
router.post('/db_special_catalog_restore', authorize_1.authorize, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.body.catalogKeyword || // CATA_pais, en la BD HF
            !req.body.shortname || // nombre del couchdb_type para este catalogo especial
            !req.body.target || // target Couchdb instance
            !req.body.db_name) { // couchdb name
            throw new Error('catalogKeyword, target and db_name params not provided in body');
        }
        yield updateSingleCatalogFromHFByRelationship(req.body.catalogKeyword, 1000, req.body.shortname, req.body.target, req.body.db_name);
        res.status(201).send('Done!');
    }
    catch (error) {
        console.log(error + '');
        res.status(400).send(error + '');
    }
}));
function updateSingleCatalogFromHF(name, chunk, target, dbName, filterActive) {
    return __awaiter(this, void 0, void 0, function* () {
        let nano = Nano.default(`${target}`);
        const db = nano.use(dbName ? dbName : '');
        yield db.createIndex({ index: { fields: ["couchdb_type", "name"] } });
        const docsDestroy = yield db.find({ selector: { couchdb_type: "CATALOG", name }, limit: 100000 });
        if (docsDestroy.docs.length > 0) {
            const docsEliminate = docsDestroy.docs.map(doc => {
                const { _id, _rev } = doc;
                return { _deleted: true, _id, _rev };
            });
            db.bulk({ docs: docsEliminate })
                .then((body) => { console.log('DELETE', name); })
                .catch((error) => console.log(error));
        }
        mssql_1.default.connect(connSQL_1.sqlConfig, (err) => {
            const request = new mssql_1.default.Request();
            request.stream = true; //Activarlo al trabajar con varias filas
            if (filterActive) {
                request.query(`select * from ${name} where estatus_registro = \'ACTIVO\'`);
            }
            else {
                request.query(`select * from ${name}`);
            }
            let rowData = [];
            request.on('row', row => {
                rowData.push(Object.assign({ name, couchdb_type: 'CATALOG' }, row));
                if (rowData.length >= chunk) {
                    request.pause(); //Pausar la insercción
                    db.bulk({ docs: rowData })
                        .then((body) => { })
                        .catch((error) => { throw new Error(error); });
                    rowData = [];
                    request.resume(); //continuar la insercción
                }
            });
            request.on("error", (err) => {
                console.log(err);
            });
            request.on("done", (result) => {
                db.bulk({ docs: rowData })
                    .then((body) => { })
                    .catch((error) => console.log(error));
                rowData = [];
                request.resume();
                console.log("Catalog Done!", name, "!!", result);
            });
        });
    });
}
function updateSingleCatalogFromHFByRelationship(name, chunk, shortname, target, dbName, relationship_name, relationship) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let nano = Nano.default(`${target}`);
            const db = nano.use(dbName ? dbName : '');
            yield db.createIndex({ index: { fields: ["couchdb_type"] } });
            const docsDestroy = yield db.find({ selector: { couchdb_type: shortname }, limit: 100000 });
            if (docsDestroy.docs.length > 0) {
                const docsEliminate = docsDestroy.docs.map(doc => {
                    const { _id, _rev } = doc;
                    return { _deleted: true, _id, _rev };
                });
                db.bulk({ docs: docsEliminate })
                    .then((body) => { })
                    .catch((error) => console.log(error));
            }
            mssql_1.default.connect(connSQL_1.sqlConfig, (err) => {
                const request = new mssql_1.default.Request();
                request.stream = true; //Activarlo al trabajar con varias filas
                request.query(`select * from ${name}`);
                let rowData = [];
                request.on('row', row => {
                    // relationship
                    const codigo_postal = row.codigo_postal;
                    let dataRow = relationship ? {
                        _id: `${shortname.toUpperCase()}|${(row.id).toString()}`,
                        codigo_postal,
                        couchdb_type: shortname,
                        etiqueta: row.etiqueta,
                        [relationship]: `${relationship_name}|${(row[`id_${relationship}`]).toString()}`,
                    } : {
                        _id: `${shortname.toUpperCase()}|${(row.id).toString()}`,
                        // name: shortname,
                        couchdb_type: shortname,
                        etiqueta: row.etiqueta
                    };
                    // if(relationship) dataRow.[relationship] = `${relationship_name}|${(row[`id_${relationship}`]).toString()}`;
                    // if(row.codigo_postal || row.abreviatura || row.codigo) console.log(row.codigo_postal, row.abreviatura, row.codigo)
                    if (row.codigo_postal)
                        dataRow.codigo_postal = row.codigo_postal;
                    if (row.codigo)
                        dataRow.codigo = row.codigo;
                    if (row.abreviatura)
                        dataRow.abreviatura = row.abreviatura;
                    rowData.push(dataRow);
                    // rowData.push(relationship ? codigo_postal ?  {
                    //     _id:`${shortname.toUpperCase()}|${(row.id).toString()}`,
                    //     codigo_postal,
                    //     couchdb_type: shortname,
                    //     etiqueta: row.etiqueta,
                    //     [relationship]: `${relationship_name}|${(row[`id_${relationship}`]).toString()}`,
                    // } : {
                    //     _id:`${shortname.toUpperCase()}|${(row.id).toString()}`,
                    //     couchdb_type: shortname,
                    //     etiqueta: row.etiqueta,
                    //     [relationship]: `${relationship_name}|${(row[`id_${relationship}`]).toString()}`,
                    // } : {
                    //     _id:`${shortname.toUpperCase()}|${(row.id).toString()}`,
                    //     // name: shortname,
                    //     couchdb_type: shortname,
                    //     etiqueta: row.etiqueta
                    // });
                    if (rowData.length >= chunk) {
                        request.pause(); //Pausar la insercción
                        db.bulk({ docs: rowData })
                            .then((body) => { })
                            .catch((error) => { throw new Error(error); });
                        rowData = [];
                        request.resume(); //continuar la insercción
                    }
                });
                request.on("error", (err) => {
                    console.log(err);
                });
                request.on("done", (result) => {
                    db.bulk({ docs: rowData })
                        .then((body) => { })
                        .catch((error) => console.log(error));
                    rowData = [];
                    request.resume();
                    console.log("Dones Catalog Special", name, "!!", result);
                });
            });
        }
        catch (e) {
            console.log(e);
            throw new Error(e);
        }
    });
}
