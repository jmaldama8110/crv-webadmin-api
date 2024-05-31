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
exports.validateCURPDuplicada = exports.getId = exports.getDates = exports.createPersonHF = void 0;
const mssql_1 = __importDefault(require("mssql"));
const connSQL_1 = require("../db/connSQL");
const Client_1 = require("../model/Client");
const moment_1 = __importDefault(require("moment"));
const Functions_1 = require("./Functions");
const TablesSql_1 = require("./TablesSql");
const DocumentCollection_1 = require("../model/DocumentCollection");
let ClientDoc = new Client_1.Client();
const Document = new DocumentCollection_1.DocumentCollection();
const formato = 'YYYY-MM-DD';
const Funct = new Functions_1.Functions();
function createPersonHF(data) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { _id } = data;
            const clientCouch = yield ClientDoc.findOne({ _id });
            if (!clientCouch)
                return new Error('Client not Foun in couch');
            const dataSort = yield sortDataPerson(clientCouch);
            if (!dataSort)
                return new Error('data sort Error');
            let curp = (_a = dataSort['IDENTIFICACIONES'].filter((item) => item.tipo_identificacion == 'CURP')[0]) === null || _a === void 0 ? void 0 : _a.id_numero;
            let validation_curp = yield validateCURPDuplicada(curp, dataSort['DATOS_PERSONALES'][0].id);
            if (validation_curp !== "OK")
                return new Error(validation_curp);
            const pool = yield mssql_1.default.connect(connSQL_1.sqlConfig);
            TablesSql_1.UDT_CONT_DireccionContacto.rows.length = 0;
            TablesSql_1.UDT_CONT_Persona.rows.length = 0;
            TablesSql_1.UDT_CONT_Identificaciones.rows.length = 0;
            TablesSql_1.UDT_CONT_CURP.rows.length = 0;
            TablesSql_1.UDT_CONT_IFE.rows.length = 0;
            TablesSql_1.UDT_CONT_Telefonos.rows.length = 0;
            const action2 = dataSort['DATOS_PERSONALES'][0].id > 0 ? 'ACTUALIZAR_PERSONA' : 'INSERTAR_PERSONA';
            // TODO ENVIAR LOS id´s CUANDO SE TENGA QUE ACTUALIZAR DE LO CONTRARIO ENVIAR 0
            console.log(action2);
            for (const idx in dataSort['DIRECCIONES']) {
                TablesSql_1.UDT_CONT_DireccionContacto.rows.add(dataSort['DIRECCIONES'][idx].id, dataSort['DIRECCIONES'][idx].tipo || '', dataSort['DIRECCIONES'][idx].id_pais, dataSort['DIRECCIONES'][idx].id_estado, // CATA_Estado
                dataSort['DIRECCIONES'][idx].id_municipio, // CATA_municipio
                dataSort['DIRECCIONES'][idx].id_localidad, // CATA_Ciudad_Localidad
                dataSort['DIRECCIONES'][idx].id_asentamiento, dataSort['DIRECCIONES'][idx].direccion, // CONT_Direcciones
                dataSort['DIRECCIONES'][idx].numero_exterior, dataSort['DIRECCIONES'][idx].numero_interior, dataSort['DIRECCIONES'][idx].referencia, dataSort['DIRECCIONES'][idx].casa_situacion, // 0-Rentado, 1-Propio (SOLO DOMICILIO)
                dataSort['DIRECCIONES'][idx].tiempo_habitado_inicio, dataSort['DIRECCIONES'][idx].tiempo_habitado_final, dataSort['DIRECCIONES'][idx].correo_electronico, dataSort['DIRECCIONES'][idx].num_interior, dataSort['DIRECCIONES'][idx].num_exterior, dataSort['DIRECCIONES'][idx].id_vialidad, // CATA_TipoVialidad
                dataSort['DIRECCIONES'][idx].domicilio_actual // 0-Rentado, 1-Propio, 3-No Aplica (SOLO DOMICILIO -> Capturar el dato si el producto es Tu Hogar con Conserva)
                );
            }
            TablesSql_1.UDT_CONT_Persona.rows.add(dataSort['DATOS_PERSONALES'][0].id, dataSort['DATOS_PERSONALES'][0].nombre, dataSort['DATOS_PERSONALES'][0].apellido_paterno, dataSort['DATOS_PERSONALES'][0].apellido_materno, dataSort['DATOS_PERSONALES'][0].fecha_nacimiento, dataSort['DATOS_PERSONALES'][0].id_sexo, dataSort['DATOS_PERSONALES'][0].id_escolaridad, dataSort['DATOS_PERSONALES'][0].id_estado_civil, dataSort['DATOS_PERSONALES'][0].entidad_nacimiento, dataSort['DATOS_PERSONALES'][0].regimen, dataSort['DATOS_PERSONALES'][0].id_oficina, dataSort['DATOS_PERSONALES'][0].curp_fisica, // curp_fisica (SIEMPRE EN 0, NO SE USA)
            dataSort['DATOS_PERSONALES'][0].datos_personales_diferentes_curp, dataSort['DATOS_PERSONALES'][0].id_entidad_nacimiento, dataSort['DATOS_PERSONALES'][0].id_nacionalidad, dataSort['DATOS_PERSONALES'][0].id_pais_nacimiento, dataSort['DATOS_PERSONALES'][0].es_pep, dataSort['DATOS_PERSONALES'][0].es_persona_prohibida, dataSort['DATOS_PERSONALES'][0].fecha_nacimiento);
            for (const idx in dataSort['IDENTIFICACIONES']) {
                TablesSql_1.UDT_CONT_Identificaciones.rows.add(dataSort['IDENTIFICACIONES'][idx].id, // ID
                dataSort['IDENTIFICACIONES'][idx].id_entidad, //IdPersona
                dataSort['IDENTIFICACIONES'][idx].tipo_identificacion, dataSort['IDENTIFICACIONES'][idx].id_numero, // CURP -> Validar desde el Front, debe estar compuesto por 4 letras - 6 números - 6 letras - 1 letra o número - 1 número
                dataSort['IDENTIFICACIONES'][idx].id_direccion, 0 //1 -> persona, 2->Empresa
                );
            }
            //Son para CURP Fisica (NO SE USA)
            TablesSql_1.UDT_CONT_CURP.rows.add(dataSort['IDENTIFICACIONES'].filter((item) => item.tipo_identificacion == 'CURP')[0].id_curp, 0, '', '', 0, '');
            TablesSql_1.UDT_CONT_IFE.rows.add(dataSort['DATOS_IFE'][0].id, dataSort['IDENTIFICACIONES'].filter((item) => item.tipo_identificacion == 'IFE')[0].id_numero, // Clave de elector - 18 Caracteres TODO: FILTRAR EL NUMERO DEL IFE DE IDENTIFICACIONES
            dataSort['DATOS_IFE'][0].numero_emision, dataSort['DATOS_IFE'][0].numero_vertical_ocr);
            TablesSql_1.UDT_CONT_Telefonos.rows.add(dataSort['TELEFONOS'][0].id, //
            dataSort['TELEFONOS'][0].idcel_telefono, // número de Telefono
            '', // extension (No se usa)
            dataSort['TELEFONOS'][0].tipo_telefono, // Casa/Móvil/Caseta/Vecinto/Trabajo
            dataSort['TELEFONOS'][0].compania, // Telcel/Movistar/Telmex/Megacable/Axtel
            dataSort['TELEFONOS'][0].sms // 0-False, 1-True
            );
            const result = yield pool.request()
                .input('DATOSDireccion', TablesSql_1.UDT_CONT_DireccionContacto)
                .input('DATOSPersona', TablesSql_1.UDT_CONT_Persona)
                .input('DATOSIdentificacion', TablesSql_1.UDT_CONT_Identificaciones)
                .input('DATOSCurp', TablesSql_1.UDT_CONT_CURP)
                .input('DATOSIfe', TablesSql_1.UDT_CONT_IFE)
                .input('DATOSTelefono', TablesSql_1.UDT_CONT_Telefonos)
                .input('etiqueta_opcion', mssql_1.default.VarChar(50), action2) // INSERTAR_PERSONA/ACTUALIZAR_PERSONA
                .input('id_session', mssql_1.default.Int, 0) // Quien manda la informacion
                .input('_id_client', mssql_1.default.BigInt, _id.slice(0, 13))
                .execute("MOV_AdministrarInformacionPersona");
            if (result.recordsets[0][0].Resultado.trim().toUpperCase() === "VALIDATE")
                return new Error(result.recordsets[0][0].Mensaje);
            (0, TablesSql_1.cleanTable)(TablesSql_1.UDT_CONT_DireccionContacto);
            (0, TablesSql_1.cleanTable)(TablesSql_1.UDT_CONT_Persona);
            (0, TablesSql_1.cleanTable)(TablesSql_1.UDT_CONT_Identificaciones);
            (0, TablesSql_1.cleanTable)(TablesSql_1.UDT_CONT_CURP);
            (0, TablesSql_1.cleanTable)(TablesSql_1.UDT_CONT_IFE);
            (0, TablesSql_1.cleanTable)(TablesSql_1.UDT_CONT_Telefonos);
            // Actualizamos el Client de Couch con el id de Persona creado en HF
            console.log('Id Person: ', result.recordsets[0][0].id);
            clientCouch["id_persona"] = result.recordsets[0][0].id;
            yield new Client_1.Client(clientCouch).save();
            return result.recordsets;
        }
        catch (error) {
            console.log(error);
            return new Error(error.stack);
        }
    });
}
exports.createPersonHF = createPersonHF;
function sortDataPerson(client) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let person = {};
            const IS_CREATE = client.id_persona === 0;
            // const CREATE = false;
            const addresses = client.address;
            const dirDomi = yield addresses.filter((addresses) => addresses.type == 'DOMICILIO');
            const dirIfe = yield addresses.filter((addresses) => addresses.type == 'IFE');
            const dirRfc = yield addresses.filter((addresses) => addresses.type == 'RFC');
            const identities = client.identities;
            const ife = yield client.identities.filter((id) => id.tipo_id == 'IFE' && id.status.trim().toUpperCase() == "ACTIVO");
            const rfc = yield client.identities.filter((id) => id.tipo_id == 'RFC' && id.status.trim().toUpperCase() == "ACTIVO");
            const curp = yield client.identities.filter((id) => id.tipo_id == 'CURP' && id.status.trim().toUpperCase() == "ACTIVO");
            const phones = client.phones;
            const entidad_nac = dirDomi[0].province[0] ? dirDomi[0].province[0] : 'PROVINCE|5';
            // console.log({entidad_nac})
            const province = yield Document.findOne({ _id: entidad_nac, couchdb_type: 'PROVINCE' });
            if (!province) {
                console.log('Province not found');
                return;
            }
            person.DATOS_PERSONALES = [
                {
                    id: IS_CREATE ? 0 : client.id_persona,
                    nombre: client.name,
                    apellido_paterno: client.lastname ? client.lastname : "S/A",
                    apellido_materno: client.second_lastname ? client.second_lastname : "S/A",
                    fecha_nacimiento: client.dob ? (0, exports.getDates)(client.dob) : "1990-01-01",
                    id_sexo: client.sex[0] ? client.sex[0] : 4,
                    id_escolaridad: client.education_level[0] ? client.education_level[0] : 2,
                    id_estado_civil: client.marital_status[0] ? client.marital_status[0] : 1,
                    entidad_nacimiento: `${province.etiqueta}-${province.abreviatura}`,
                    regimen: "",
                    id_oficina: client.branch && client.branch[0] ? client.branch[0] : 1,
                    curp_fisica: 0,
                    datos_personales_diferentes_curp: 0,
                    id_entidad_nacimiento: client.province_of_birth[0] ? getId(client.province_of_birth[0]) : dirDomi[0].province[0] ? getId(dirDomi[0].province[0]) : 5,
                    id_nacionalidad: client.nationality[0] ? client.nationality[0] : 1,
                    id_pais_nacimiento: client.country_of_birth[0] ? getId(client.country_of_birth[0]) : 1,
                    es_pep: 0,
                    es_persona_prohibida: 0
                }
            ];
            person.IDENTIFICACIONES = [];
            person.IDENTIFICACIONES.push({
                id: IS_CREATE ? 0 : (curp.length < 1 ? 0 : Funct.validateInt(curp[0]._id)),
                id_entidad: IS_CREATE ? 0 : client.id_persona,
                tipo_identificacion: "CURP",
                id_numero: client.curp
            }, {
                id: IS_CREATE ? 0 : (ife.length < 1 ? 0 : Funct.validateInt(ife[0]._id)),
                id_entidad: IS_CREATE ? 0 : client.id_persona,
                tipo_identificacion: "IFE",
                id_numero: client.clave_ine.slice(0, 18) // ine_clave
            }, {
                id: IS_CREATE ? 0 : (rfc.length < 1 ? 0 : Funct.validateInt(rfc[0]._id)),
                id_entidad: IS_CREATE ? 0 : client.id_persona,
                tipo_identificacion: "RFC",
                id_numero: client.rfc && client.rfc != "" ? client.rfc : client.curp.slice(0, 13)
            });
            person.DIRECCIONES = [];
            person.DIRECCIONES.push({
                id: IS_CREATE ? 0 : Funct.validateInt(dirDomi[0]._id),
                tipo: 'DOMICILIO',
                id_pais: dirDomi[0].country[0] ? getId(dirDomi[0].country[0]) : 1,
                id_estado: dirDomi[0].province[0] ? getId(dirDomi[0].province[0]) : 5,
                id_municipio: dirDomi[0].municipality[0] ? getId(dirDomi[0].municipality[0]) : 946,
                id_localidad: dirDomi[0].city[0] ? getId(dirDomi[0].city[0]) : 1534,
                id_asentamiento: dirDomi[0].colony[0] ? getId(dirDomi[0].colony[0]) : 42665,
                direccion: dirDomi[0].address_line1 ? dirDomi[0].address_line1 : " ",
                referencia: dirDomi[0].address_line1 ? dirDomi[0].address_line1 : " ",
                casa_situacion: dirDomi[0].ownership_type ? dirDomi[0].ownership_type[0] : 0,
                tiempo_habitado_inicio: dirDomi[0].residence_since ? (0, exports.getDates)(dirDomi[0].residence_since) : "2022-06-22",
                tiempo_habitado_final: dirDomi[0].residence_to ? (0, exports.getDates)(dirDomi[0].residence_to) : "2022-06-20",
                correo_electronico: client.email ? client.email : '',
                numero_exterior: dirDomi[0].exterior_number ? dirDomi[0].exterior_number.toString() : "SN",
                numero_interior: dirDomi[0].interior_number ? dirDomi[0].interior_number.toString() : "SN",
                num_exterior: dirDomi[0].ext_number ? Funct.validateInt(Funct.ConvertInt(dirDomi[0].ext_number)) : 0,
                num_interior: dirDomi[0].int_number ? Funct.validateInt(Funct.ConvertInt(dirDomi[0].int_number)) : 0,
                id_vialidad: dirDomi[0].road ? dirDomi[0].road[0] : 5,
                domicilio_actual: 1
            });
            //Si no se encuentra una dirección del IFE, se le asignará el mismo del domicilio
            person.DIRECCIONES.push({
                id: IS_CREATE ? 0 : dirIfe.length >= 1 ? Funct.validateInt(dirIfe[0]._id) : 0,
                tipo: 'IFE',
                id_pais: dirIfe.length >= 1 && dirIfe[0].country[0] ? getId(dirIfe[0].country[0]) : (person.DIRECCIONES)[0].id_pais,
                id_estado: dirIfe.length >= 1 && dirIfe[0].province[0] ? getId(dirIfe[0].province[0]) : (person.DIRECCIONES)[0].id_estado,
                id_municipio: dirIfe.length >= 1 && dirIfe[0].municipality[0] ? getId(dirIfe[0].municipality[0]) : (person.DIRECCIONES)[0].id_municipio,
                id_localidad: dirIfe.length >= 1 && dirIfe[0].city[0] ? getId(dirIfe[0].city[0]) : (person.DIRECCIONES)[0].id_localidad,
                id_asentamiento: dirIfe.length >= 1 && dirIfe[0].colony[0] ? getId(dirIfe[0].colony[0]) : (person.DIRECCIONES)[0].id_asentamiento,
                direccion: dirIfe.length >= 1 ? dirIfe[0].address_line1 ? dirIfe[0].address_line1 : (person.DIRECCIONES)[0].direccion : (person.DIRECCIONES)[0].direccion,
                referencia: dirIfe.length >= 1 && dirIfe[0].street_reference ? dirIfe[0].street_reference : (person.DIRECCIONES)[0].direccion,
                casa_situacion: dirIfe.length >= 1 && dirIfe[0].ownership_type ? dirIfe[0].ownership_type[0] : (person.DIRECCIONES)[0].casa_situacion,
                tiempo_habitado_inicio: dirIfe.length >= 1 && dirIfe[0].start_date ? (0, exports.getDates)(dirIfe[0].start_date) : (person.DIRECCIONES)[0].tiempo_habitado_inicio,
                tiempo_habitado_final: dirIfe.length >= 1 && dirIfe[0].end_dat ? (0, exports.getDates)(dirIfe[0].end_date) : (person.DIRECCIONES)[0].tiempo_habitado_final,
                correo_electronico: client.email ? client.email : '',
                numero_exterior: dirIfe.length >= 1 && dirIfe[0].exterior_number ? dirIfe[0].exterior_number.toString() : "SN",
                numero_interior: dirIfe.length >= 1 && dirIfe[0].interior_number ? dirIfe[0].interior_number.toString() : "SN",
                num_exterior: dirIfe.length >= 1 && dirIfe[0].ext_number ? Funct.validateInt(Funct.ConvertInt(dirIfe[0].ext_number)) : 0,
                num_interior: dirIfe.length >= 1 && dirIfe[0].int_number ? Funct.validateInt(Funct.ConvertInt(dirIfe[0].int_number)) : 0,
                id_vialidad: dirIfe.length >= 1 && dirIfe[0].road ? dirIfe[0].road[0] : 5,
                domicilio_actual: 1
            });
            //Agregamos la dirección del RFC
            person.DIRECCIONES.push({
                id: IS_CREATE ? 0 : dirRfc.length >= 1 ? Funct.validateInt(dirRfc[0]._id) : 0,
                tipo: 'RFC',
                id_pais: dirRfc.length >= 1 && dirRfc[0].country[0] ? getId(dirRfc[0].country[0]) : (person.DIRECCIONES)[0].id_pais,
                id_estado: dirRfc.length >= 1 && dirRfc[0].province[0] ? getId(dirRfc[0].province[0]) : (person.DIRECCIONES)[0].id_estado,
                id_municipio: dirRfc.length >= 1 && dirRfc[0].municipality[0] ? getId(dirRfc[0].municipality[0]) : (person.DIRECCIONES)[0].id_municipio,
                id_localidad: dirRfc.length >= 1 && dirRfc[0].city[0] ? getId(dirRfc[0].city[0]) : (person.DIRECCIONES)[0].id_localidad,
                id_asentamiento: dirRfc.length >= 1 && dirRfc[0].colony[0] ? getId(dirRfc[0].colony[0]) : (person.DIRECCIONES)[0].id_asentamiento,
                direccion: dirRfc.length >= 1 && dirRfc[0].address_line1 ? dirRfc[0].address_line1 : (person.DIRECCIONES)[0].direccion,
                referencia: dirRfc.length >= 1 && dirRfc[0].street_reference ? dirRfc[0].street_reference : (person.DIRECCIONES)[0].direccion,
                casa_situacion: dirRfc.length >= 1 && dirRfc[0].ownership_type ? dirRfc[0].ownership_type[0] : (person.DIRECCIONES)[0].casa_situacion,
                tiempo_habitado_inicio: dirRfc.length >= 1 && dirRfc[0].start_date ? (0, exports.getDates)(dirRfc[0].start_date) : (person.DIRECCIONES)[0].tiempo_habitado_inicio,
                tiempo_habitado_final: dirRfc.length >= 1 && dirRfc[0].end_dat ? (0, exports.getDates)(dirRfc[0].end_date) : (person.DIRECCIONES)[0].tiempo_habitado_final,
                correo_electronico: client.email ? client.email : '',
                numero_exterior: dirRfc.length >= 1 && dirRfc[0].exterior_number ? dirRfc[0].exterior_number.toString() : "SN",
                numero_interior: dirRfc.length >= 1 && dirRfc[0].interior_number ? dirRfc[0].interior_number.toString() : "SN",
                num_exterior: dirRfc.length >= 1 && dirRfc[0].ext_number ? Funct.validateInt(Funct.ConvertInt(dirRfc[0].ext_number)) : 0,
                num_interior: dirRfc.length >= 1 && dirRfc[0].int_number ? Funct.validateInt(Funct.ConvertInt(dirRfc[0].int_number)) : 0,
                id_vialidad: dirRfc.length >= 1 && dirRfc[0].road ? dirRfc[0].road[0] : 5,
                domicilio_actual: 1
            });
            person.DATOS_IFE = [
                {
                    id: IS_CREATE ? 0 : Funct.validateInt((_b = (_a = client.ife_details[0]) === null || _a === void 0 ? void 0 : _a.id) !== null && _b !== void 0 ? _b : '0'),
                    numero_emision: client.numero_emisiones ? client.numero_emisiones.slice(0, 2) : "00",
                    numero_vertical_ocr: client.numero_vertical ? client.numero_vertical.slice(0, 13) : "0000000000000" // .numero_vertical
                }
            ];
            person.TELEFONOS = [];
            const phonePerson = phones[0];
            person.TELEFONOS.push({
                id: IS_CREATE ? 0 : Funct.validateInt(phonePerson._id),
                idcel_telefono: phonePerson && phonePerson.phone ? phonePerson.phone : "0000000000",
                extension: "",
                tipo_telefono: phonePerson ? phonePerson.type ? phonePerson.type : "Móvil" : "Móvil",
                compania: phonePerson ? phonePerson.company ? phonePerson.company : "Telcel" : "Telcel",
                sms: 0
            });
            return person;
        }
        catch (error) {
            console.log(error);
            return new Error(error.stack);
        }
    });
}
const getDates = (fecha) => {
    const date = moment_1.default.utc(fecha).format(formato);
    return date;
};
exports.getDates = getDates;
function getId(el) {
    return parseInt(el.split('|')[1]);
}
exports.getId = getId;
function validateCURPDuplicada(curp, id_persona) {
    return __awaiter(this, void 0, void 0, function* () {
        if ((curp !== null && curp !== void 0 ? curp : "").length == 0)
            curp = "CURPX1";
        curp = curp.trim();
        if (id_persona == 0)
            id_persona = -1;
        const pool = yield mssql_1.default.connect(connSQL_1.sqlConfig);
        let result = yield pool.request()
            .input("curp", mssql_1.default.VarChar(100), curp)
            .input("id_persona", mssql_1.default.Int(), id_persona)
            .query("SELECT COUNT(id) AS cantidad,COALESCE(MAX(id_persona),0) AS id_persona " +
            "FROM CONT_IdentificacionOficial " +
            "WHERE tipo_identificacion='CURP' AND estatus_registro='ACTIVO' AND id_numero=@curp AND id_persona<>@id_persona;");
        if (result.recordset.length > 0) {
            if (result.recordset[0].cantidad > 0)
                return "CURP " + curp + " existente en HF con id_persona " + result.recordset[0].id_persona;
        }
        return "OK";
    });
}
exports.validateCURPDuplicada = validateCURPDuplicada;
