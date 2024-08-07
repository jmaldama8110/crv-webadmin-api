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
const mssql_1 = __importDefault(require("mssql"));
const connSQL_1 = require("../db/connSQL");
const TablesSql_1 = require("../utils/TablesSql");
const DocumentCollection_1 = require("./DocumentCollection");
class Action extends DocumentCollection_1.DocumentCollection {
    constructor(obj = {}) {
        super({ branch: obj.branch });
        this._id = obj._id || Date.now().toString();
        this._rev = obj._rev;
        this.couchdb_type = 'ACTION';
        this.name = obj.name;
        this.data = obj.data;
        this.created_by = obj.created_by;
        this.status = obj.status || 'Pending';
        this.errors = obj.errors || [];
        this.isOk = obj.isOk || false;
    }
    getClientHFById(externalId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let pool = yield mssql_1.default.connect(connSQL_1.sqlConfig);
                let result = yield pool
                    .request()
                    .input("idCliente", mssql_1.default.Int, externalId)
                    .execute("MOV_ObtenerDatosPersona");
                return result.recordsets;
            }
            catch (err) {
                console.log(err);
            }
        });
    }
    createClientHF(data, value) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const pool = yield mssql_1.default.connect(connSQL_1.sqlConfig);
                const cleanAllTables = () => {
                    (0, TablesSql_1.cleanTable)(TablesSql_1.UDT_CONT_Empresa);
                    (0, TablesSql_1.cleanTable)(TablesSql_1.UDT_CONT_Direcciones);
                    (0, TablesSql_1.cleanTable)(TablesSql_1.UDT_CONT_Oficinas);
                    (0, TablesSql_1.cleanTable)(TablesSql_1.UDT_CONT_Persona);
                    (0, TablesSql_1.cleanTable)(TablesSql_1.UDT_CONT_Telefonos);
                    (0, TablesSql_1.cleanTable)(TablesSql_1.UDT_CONT_Identificaciones);
                    (0, TablesSql_1.cleanTable)(TablesSql_1.UDT_CONT_Negocios);
                    (0, TablesSql_1.cleanTable)(TablesSql_1.UTD_CLIE_Clientes);
                    (0, TablesSql_1.cleanTable)(TablesSql_1.UDT_CLIE_Individual);
                    (0, TablesSql_1.cleanTable)(TablesSql_1.UDT_CLIE_Solicitud);
                    (0, TablesSql_1.cleanTable)(TablesSql_1.UDT_CLIE_DatoBancario);
                    (0, TablesSql_1.cleanTable)(TablesSql_1.UDT_SPLD_DatosCliente);
                    (0, TablesSql_1.cleanTable)(TablesSql_1.UDT_CONT_FirmaElectronica);
                };
                TablesSql_1.UDT_CONT_Persona.rows.length = 0;
                TablesSql_1.UDT_CONT_Identificaciones.rows.length = 0;
                TablesSql_1.UDT_CONT_Telefonos.rows.length = 0;
                TablesSql_1.UDT_CONT_Negocios.rows.length = 0;
                TablesSql_1.UTD_CLIE_Clientes.rows.length = 0;
                TablesSql_1.UDT_CLIE_Individual.rows.length = 0;
                TablesSql_1.UDT_CLIE_Solicitud.rows.length = 0;
                TablesSql_1.UDT_CLIE_DatoBancario.rows.length = 0;
                TablesSql_1.UDT_SPLD_DatosCliente.rows.length = 0;
                TablesSql_1.UDT_CONT_Empresa.rows.length = 0;
                TablesSql_1.UDT_CONT_Direcciones.rows.length = 0;
                TablesSql_1.UDT_CONT_Oficinas.rows.length = 0;
                TablesSql_1.UDT_CONT_FirmaElectronica.rows.length = 0;
                TablesSql_1.UDT_CONT_Telefonos.rows.length = 0;
                TablesSql_1.UDT_CONT_Empresa.rows.add(data["NEGOCIO"][0].id, data["NEGOCIO"][0].nombre, data["NEGOCIO"][0].rfc, '', 0, data["NEGOCIO"][0].id_actividad_economica, '', data["NEGOCIO"][0].ventas_totales_cantidad, data["NEGOCIO"][0].ventas_totales_unidad.toString(), data["NEGOCIO"][0].revolvencia, data["NEGOCIO"][0].numero_empleados, data["NEGOCIO"][0].tiempo_actividad_incio, data["NEGOCIO"][0].tiempo_actividad_final, '', data["NEGOCIO"][0].econ_registro_egresos_ingresos, // 0/1
                '');
                TablesSql_1.UDT_CONT_Direcciones.rows.add(data["NEGOCIO"][0].id_dir, '', data["NEGOCIO"][0].id_pais, data["NEGOCIO"][0].id_estado, data["NEGOCIO"][0].id_municipio, data["NEGOCIO"][0].id_ciudad, data["NEGOCIO"][0].id_colonia, data["NEGOCIO"][0].calle, //direccion
                data["NEGOCIO"][0].letra_exterior, data["NEGOCIO"][0].letra_interior, data["NEGOCIO"][0].referencia, data["NEGOCIO"][0].casa_situacion, data["NEGOCIO"][0].tiempo_actividad_incio, data["NEGOCIO"][0].tiempo_actividad_final, data["NEGOCIO"][0].correo_electronico, data["NEGOCIO"][0].num_exterior, data["NEGOCIO"][0].num_interior, data["NEGOCIO"][0].id_vialidad);
                TablesSql_1.UDT_CONT_Oficinas.rows.add(data["NEGOCIO"][0].id_oficina_empresa, //id_oficina
                data["NEGOCIO"][0].id_empresa, //id_empresa
                data["NEGOCIO"][0].id_dir, //id_direccion
                0, data["NEGOCIO"][0].nombre_oficina, '', '', '', '', '', '');
                TablesSql_1.UDT_CONT_Telefonos.rows.add(data["TELEFONO"][0].id, data["TELEFONO"][0].idcel_telefono, '', data["TELEFONO"][0].tipo_telefono, data["TELEFONO"][0].compania, data["TELEFONO"][0].sms);
                const empresa = yield pool.request()
                    .input('tablaEmpresa', TablesSql_1.UDT_CONT_Empresa)
                    .input('tablaDirecciones', TablesSql_1.UDT_CONT_Direcciones)
                    .input('tablaOficinas', TablesSql_1.UDT_CONT_Oficinas)
                    .input('tablaTelefonos', TablesSql_1.UDT_CONT_Telefonos)
                    .input('id_opcion', mssql_1.default.Int, value) // 1-Insertar/2-Actualizar
                    .input('id_sesion', mssql_1.default.Int, 0)
                    .execute('MOV_AdministrarEmpresa'); //Sirve para crear el negocio
                cleanAllTables();
                let id_empresa = 0;
                let id_direccion = 0; //direccion de empresa/Negocio
                let id_oficina = 0;
                let id_telefono = 0;
                if (value === 1) {
                    id_empresa = empresa.recordsets[0][0].id_resultado;
                    id_direccion = empresa.recordsets[0][1].id_resultado; //direccion de empresa/Negocio
                    id_oficina = empresa.recordsets[0][2].id_resultado;
                    id_telefono = empresa.recordsets[0][3].id_resultado;
                }
                else { //Si es actualizar llenarlos con valores de mongo
                    id_empresa = data["NEGOCIO"][0].id_empresa;
                    id_direccion = 0;
                    id_oficina = data["NEGOCIO"][0].id_oficina_empresa;
                    id_telefono = 0;
                }
                // return {
                //     id_empresa,
                //     id_direccion,
                //     id_oficina,
                //     id_telefono
                // };
                TablesSql_1.UDT_CONT_Persona.rows.length = 0;
                TablesSql_1.UDT_CONT_Identificaciones.rows.length = 0;
                TablesSql_1.UDT_CONT_Telefonos.rows.length = 0;
                TablesSql_1.UDT_CONT_Negocios.rows.length = 0;
                TablesSql_1.UTD_CLIE_Clientes.rows.length = 0;
                TablesSql_1.UDT_CLIE_Individual.rows.length = 0;
                TablesSql_1.UDT_CLIE_Solicitud.rows.length = 0;
                TablesSql_1.UDT_CLIE_DatoBancario.rows.length = 0;
                TablesSql_1.UDT_SPLD_DatosCliente.rows.length = 0;
                TablesSql_1.UDT_CONT_FirmaElectronica.rows.length = 0;
                //#region CREATE CLIENT
                TablesSql_1.UDT_CONT_Persona.rows.add(data["PERSONA"][0].id, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null);
                TablesSql_1.UDT_CONT_Identificaciones.rows.add(// NO SE USA
                data['IDENTIFICACIONES'][0].id, //id prospera
                data['IDENTIFICACIONES'][0].id_entidad, 'PROSPERA', data['IDENTIFICACIONES'][0].id_numero, 0, 1);
                TablesSql_1.UDT_CONT_Telefonos.rows.add(data["TELEFONO"][0].id, data["TELEFONO"][0].idcel_telefono, data["TELEFONO"][0].extension, data["TELEFONO"][0].tipo_telefono, data["TELEFONO"][0].compania, data["TELEFONO"][0].sms);
                TablesSql_1.UDT_CONT_Negocios.rows.add(data["NEGOCIO"][0].id, data["PERSONA"][0].id, id_oficina, data["NEGOCIO"][0].nombre_oficina, data["NEGOCIO"][0].nombre_puesto, data["NEGOCIO"][0].departamento, id_empresa, data["NEGOCIO"][0].numero_empleados, data["NEGOCIO"][0].registro_egresos, data["NEGOCIO"][0].revolvencia, data["NEGOCIO"][0].ventas_totales_cantidad, data["NEGOCIO"][0].ventas_totales_unidad, data["NEGOCIO"][0].id_actividad_economica, data["NEGOCIO"][0].tiempo_actividad_incio, data["NEGOCIO"][0].tiempo_actividad_final, '', '');
                TablesSql_1.UTD_CLIE_Clientes.rows.add(data["CLIENTE"][0].id_cliente, null, null, null, data["CLIENTE"][0].id_oficina, data["CLIENTE"][0].id_oficial_credito, '0000000000', // En desuso
                null);
                TablesSql_1.UDT_CLIE_Individual.rows.add(data["INDIVIDUAL"][0].id_cliente, //id cliente
                data["INDIVIDUAL"][0].id_persona, //id persona
                data["INDIVIDUAL"][0].econ_ocupacion, // CATA_ocupacionPLD (enviar la etiqueta ej. EMPLEADA) YA NO SE USA
                data["INDIVIDUAL"][0].econ_id_actividad_economica, // CATA_ActividadEconomica (los que tengan FINAFIM)
                data["INDIVIDUAL"][0].econ_id_destino_credito, // CATA_destinoCredito
                data["INDIVIDUAL"][0].econ_id_ubicacion_negocio, // CATA_ubicacionNegocio
                data["INDIVIDUAL"][0].econ_id_rol_hogar, // CATA_rolHogar
                id_empresa, data["INDIVIDUAL"][0].econ_cantidad_mensual, // Ej. 2000.0
                data["INDIVIDUAL"][0].econ_sueldo_conyugue, data["INDIVIDUAL"][0].econ_otros_ingresos, data["INDIVIDUAL"][0].econ_otros_gastos, data["INDIVIDUAL"][0].econ_familiares_extranjeros, data["INDIVIDUAL"][0].econ_parentesco, data["INDIVIDUAL"][0].envia_dinero, // 0/1 (NO/SI)
                data["INDIVIDUAL"][0].econ_dependientes_economicos, data["INDIVIDUAL"][0].econ_pago_casa, data["INDIVIDUAL"][0].econ_gastos_vivienda, data["INDIVIDUAL"][0].econ_gastos_familiares, data["INDIVIDUAL"][0].econ_gastos_transporte, data["INDIVIDUAL"][0].credito_anteriormente, // 0/1 (NO/SI)
                data["INDIVIDUAL"][0].mejorado_ingreso, // 0/1 (NO/SI)
                data["INDIVIDUAL"][0].lengua_indigena, // 0/1 (NO/SI)
                data["INDIVIDUAL"][0].habilidad_diferente, // 0/1 (NO/SI)
                data["INDIVIDUAL"][0].utiliza_internet, // 0/1 (NO/SI)
                data["INDIVIDUAL"][0].utiliza_redes_sociales, // 0/1 (NO/SI)
                data["INDIVIDUAL"][0].id_actividad_economica, // 0/1 (NO/SI)
                data["INDIVIDUAL"][0].id_ocupacion, // CATA_ocupacionPLD
                data["INDIVIDUAL"][0].id_profesion, 1, '', 0, 0, 0, 0, 0, 0, '', '');
                TablesSql_1.UDT_CLIE_Solicitud.rows.add(0, null, null, null, null, null, null);
                // tbl.UDT_CLIE_DatoBancario.rows.add(0, null,
                //     null,
                //     null,
                //     null,
                //     null,
                //     null,
                //     null,
                //     null,
                //     null,
                //     null
                // );
                // tbl.UDT_CLIE_DatoBancario.rows.add(0, null,
                //     data["BANCARIO"][0].id_banco,
                //     data["BANCARIO"][0].clave_banco,
                //     data["BANCARIO"][0].nombre_banco,
                //     data["BANCARIO"][0].id_tipo_cuenta,
                //     data["BANCARIO"][0].clave_tipo_cuenta,
                //     data["BANCARIO"][0].nombre_tipo_cuenta,
                //     data["BANCARIO"][0].numero_cuenta,
                //     data["BANCARIO"][0].principal,
                //     data["BANCARIO"][0].activo);
                TablesSql_1.UDT_SPLD_DatosCliente.rows.add(0, //No mandar nada
                data["PLD"][0].id_cliente, //id del cliente
                data["PLD"][0].desempenia_funcion_publica, data["PLD"][0].desempenia_funcion_publica_cargo, data["PLD"][0].desempenia_funcion_publica_dependencia, data["PLD"][0].familiar_desempenia_funcion_publica, data["PLD"][0].familiar_desempenia_funcion_publica_cargo, data["PLD"][0].familiar_desempenia_funcion_publica_dependencia, data["PLD"][0].familiar_desempenia_funcion_publica_nombre, data["PLD"][0].familiar_desempenia_funcion_publica_paterno, data["PLD"][0].familiar_desempenia_funcion_publica_materno, data["PLD"][0].familiar_desempenia_funcion_publica_parentesco, data["PLD"][0].id_instrumento_monetario);
                TablesSql_1.UDT_CONT_FirmaElectronica.rows.add(data["EFIRMA"][0].id_firma_electronica, data["PERSONA"][0].id, data["EFIRMA"][0].fiel);
                const result = yield pool.request()
                    .input('info_persona', TablesSql_1.UDT_CONT_Persona)
                    .input('info_identificaciones', TablesSql_1.UDT_CONT_Identificaciones)
                    .input('info_telefonos', TablesSql_1.UDT_CONT_Telefonos)
                    .input('info_empleos', TablesSql_1.UDT_CONT_Negocios)
                    .input('info_cliente', TablesSql_1.UTD_CLIE_Clientes)
                    .input('info_individual', TablesSql_1.UDT_CLIE_Individual)
                    .input('info_solicitud', TablesSql_1.UDT_CLIE_Solicitud)
                    .input('info_dato_bancario', TablesSql_1.UDT_CLIE_DatoBancario)
                    .input('info_datos_pld', TablesSql_1.UDT_SPLD_DatosCliente)
                    .input('info_firma_electronica', TablesSql_1.UDT_CONT_FirmaElectronica)
                    .input('id_opcion', mssql_1.default.Int, 0)
                    .input('uid', mssql_1.default.Int, 0)
                    .execute('MOV_insertarInformacionClienteV2');
                // .execute('MOV_Prueba')
                console.log(result.recordsets);
                cleanAllTables();
                return result.recordsets;
                //#endregion
            }
            catch (error) {
                console.log(error);
                throw new Error(error);
            }
        });
    }
    getActionHF() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const pool = yield mssql_1.default.connect(connSQL_1.sqlConfig);
                const result = yield pool
                    .request()
                    .query("SELECT * FROM MOVI_Acciones WHERE estatus = 'PENDIENTE'");
                return result.recordset;
            }
            catch (error) {
                console.log(error);
                throw new Error(error.message);
            }
        });
    }
    updateActionHF(id_action, status) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const pool = yield mssql_1.default.connect(connSQL_1.sqlConfig);
                const result = yield pool
                    .request()
                    .query(`UPDATE MOVI_Acciones SET estatus = '${status}' WHERE id = '${id_action}'`);
                return result.recordset;
            }
            catch (error) {
                console.log(error);
                return new Error(error.message);
            }
        });
    }
    pushError(errors, typeDataOK, typeDataCompare, valueOK, property) {
        errors.push({
            property: property,
            ExpectedDataType: typeDataOK,
            givenDataType: typeDataCompare,
            example: valueOK
        });
    }
    validateModel(model, data) {
        return __awaiter(this, void 0, void 0, function* () {
            //Valida la estructura del modelo vs el que viene en la data
            let errors = [];
            const keys = Object.keys(model);
            keys.forEach((item) => {
                const valueOKExample = model[item];
                const valueCompareExample = data[item];
                const typeDataOKEx = typeof valueOKExample == "object" && Array.isArray(valueOKExample) ? "array" : typeof valueOKExample;
                const typeDataCoEx = typeof valueCompareExample == "object" && Array.isArray(valueCompareExample) ? "array" : typeof valueCompareExample;
                if (typeDataOKEx == "object" && typeDataCoEx == "object") {
                    const keyItemArray = Object.keys(valueOKExample);
                    keyItemArray.forEach((key) => {
                        const valueOK = valueOKExample[key];
                        const valueCompare = valueCompareExample[key];
                        const typeDataOK = typeof valueOK == "object" && Array.isArray(valueOK) ? "array" : typeof valueOK;
                        const typeDataCompare = typeof valueCompare == "object" && Array.isArray(valueCompare) ? "array" : typeof valueCompare;
                        if (typeDataOK != typeDataCompare) {
                            this.pushError(errors, typeDataOK, typeDataCompare, valueOK, `${item}.${key}`);
                        }
                    });
                }
                if (typeDataOKEx == "array" && typeDataCoEx == "array" && typeof valueOKExample[0] == 'object') {
                    const keyItemArray = Object.keys(valueOKExample[0]);
                    keyItemArray.forEach((key) => {
                        const valueOK = valueOKExample[0][key];
                        let typeDataOK = typeof valueOK == "object" && Array.isArray(valueOK) ? "array" : typeof valueOK;
                        let valueCompare = undefined;
                        let typeDataCompare = undefined;
                        valueCompareExample.forEach((obj, idx) => {
                            // Si es un objeto
                            if (typeof valueOK == "object") {
                                const keyItemArrayObj = Object.keys(valueOK);
                                if (valueCompareExample[idx][key] === undefined)
                                    this.pushError(errors, typeDataOK, typeDataCompare, valueOK, `${item}[${idx}].${key}`);
                                else {
                                    keyItemArrayObj.forEach((keyObj) => {
                                        const valueOKObj = valueOK[keyObj];
                                        const valueCompareObj = valueCompareExample[idx][key] === undefined ? undefined : valueCompareExample[idx][key][keyObj];
                                        const typeDataOKObj = typeof valueOKObj == "object" && Array.isArray(valueOKObj) ? "array" : typeof valueOKObj;
                                        const typeDataCompareObj = typeof valueCompareObj == "object" && Array.isArray(valueCompareObj) ? "array" : typeof valueCompareObj;
                                        if (typeDataOKObj != typeDataCompareObj) {
                                            this.pushError(errors, typeDataOKObj, typeDataCompareObj, valueOKObj, `${item}[${idx}].${key}.${keyObj}`);
                                        }
                                    });
                                }
                            }
                            // Si es un valor o array
                            else {
                                valueCompare = valueCompareExample[idx][key];
                                typeDataCompare = typeof valueCompare == "object" && Array.isArray(valueCompare) ? "array" : typeof valueCompare;
                                if (typeDataOK != typeDataCompare || !typeDataCompare) {
                                    this.pushError(errors, typeDataOK, typeDataCompare, valueOK, `${item}[${idx}].${key}`);
                                }
                            }
                        });
                        if (valueCompareExample.length == 0 && (typeDataOK != typeDataCompare || !typeDataCompare))
                            this.pushError(errors, typeDataOK, typeDataCompare, valueOK, `${item}[0].${key}`);
                    });
                }
                if (typeDataOKEx != typeDataCoEx || !typeDataCoEx) {
                    this.pushError(errors, typeDataOKEx, typeDataCoEx, valueOKExample, item);
                }
            });
            return errors;
        });
    }
    validateDataLoan(data, info) {
        return __awaiter(this, void 0, void 0, function* () {
            ///// VALIDAR QUE LOS DATOS PARA LA SOLICITUD QUE SE GENERARA EN EL HF ES CORRECTA
            const dataExample = {
                apply_by: "1677107583323",
                id_solicitud: 236699,
                id_cliente: 333531,
                loan_officer: 84432,
                branch: [
                    1,
                    "ORIENTE"
                ],
                id_producto: 0,
                id_disposicion: 26,
                apply_amount: 62000,
                approved_total: 62000,
                term: 12,
                estatus: "TRAMITE",
                sub_estatus: "NUEVO TRAMITE",
                renovation: false,
                frequency: [
                    "C",
                    "Catorcena(s)"
                ],
                first_repay_date: "",
                disbursment_date: "",
                disbursment_mean: "ORP",
                liquid_guarantee: 10,
                product: {
                    external_id: 3,
                    min_amount: 10000,
                    max_amount: 160000,
                    step_amount: 1000,
                    min_term: 4,
                    max_term: 36,
                    product_name: "CONSERVA TE ACTIVA",
                    term_types: [
                        {
                            _id: "63dbd8de41c0dca6f71775b8",
                            identifier: "S",
                            value: "Semana(s)",
                            year_periods: "52.1429"
                        },
                        {
                            _id: "63dbd8de41c0dca6f71775b9",
                            identifier: "C",
                            value: "Catorcena(s)",
                            year_periods: "26"
                        },
                        {
                            _id: "63dbd8de41c0dca6f71775ba",
                            identifier: "M",
                            value: "Mes(es)",
                            year_periods: "12"
                        }
                    ],
                    rate: "95.22",
                    tax: "16",
                    GL_financeable: false,
                    liquid_guarantee: 10
                },
                created_by: "lmijangos@grupoconserva.mx",
                status: [
                    1,
                    "NUEVO TRAMITE"
                ],
                dropout: [],
                members: [
                    {
                        id_member: 136525,
                        id_cliente: 133913,
                        fullname: "ERICA NAJARRO SANCHEZ",
                        estatus: "ACEPTADO",
                        sub_estatus: "PRESTAMO ACTIVO",
                        position: "",
                        apply_amount: 31000,
                        approved_amount: 31000,
                        previous_amount: 31000,
                        loan_cycle: 6,
                        disbursment_mean: 2,
                        insurance: {
                            beneficiary: "RAMON NAJARRO SANCHEZ",
                            relationship: "HIJO",
                            percentage: 100,
                            id: 1152395
                        }
                    },
                    {
                        id_member: 321397,
                        id_cliente: 333813,
                        fullname: "SONIA ISABEL NAVARRO DOMINGUEZ",
                        estatus: "ACEPTADO",
                        sub_estatus: "PRESTAMO ACTIVO",
                        position: "Presidenta(e)",
                        apply_amount: 31000,
                        approved_amount: 31000,
                        previous_amount: 31000,
                        loan_cycle: 5,
                        disbursment_mean: 2,
                        insurance: {
                            beneficiary: "ALFREDO DE JESUS GONZALEZ NAVARRO",
                            relationship: "HIJO",
                            percentage: 100,
                            id: 1152396
                        }
                    }
                ]
            };
            let errors = [];
            errors = yield this.validateModel(dataExample, data);
            let action_type;
            if (data.renovation) {
                action_type = 'RENOVATION LOAN';
            }
            else if (data.id_solicitud === 0 && !data.renovation) {
                action_type = 'CREATE LOAN';
            }
            else {
                action_type = 'UPDATE LOAN';
            }
            return { status: errors.length == 0 ? 'OK' : 'ERROR', info, errors };
        });
    }
    validateDataDropMemberLoan(data, info) {
        return __awaiter(this, void 0, void 0, function* () {
            ///// VALIDAR QUE LOS DATOS PARA ELIMINAR PERSONAS DE LA SOLICITUD SEA VALIDA
            const dataExample = {
                dropouts: [
                    {
                        member_id: "3",
                        id_cliente: 353266,
                        fullname: "JENNIFER JATZIRI CASTRO MENDOZA",
                        reasonType: "CANCELACION",
                        dropoutReason: [
                            2,
                            "CONFLICTOS INTERNOS DEL GRUPO"
                        ],
                        updated_at: "2023-03-28T22:46:44.961Z"
                    }
                ]
            };
            let errors = [];
            errors = yield this.validateModel(dataExample, data);
            return { status: errors.length == 0 ? 'OK' : 'ERROR', info, errors };
        });
    }
    validateDataAddMemberLoan(data, info) {
        return __awaiter(this, void 0, void 0, function* () {
            ///// VALIDAR QUE LOS DATOS PARA AGREGAR PERSONAS DE LA SOLICITUD SEA VALIDA
            const dataExample = {
                newmembers: [
                    {
                        member_id: "3",
                        id_cliente: 353266,
                        fullname: "JENNIFER JATZIRI CASTRO MENDOZA",
                        reasonType: "CANCELACION",
                        dropoutReason: [
                            2,
                            "CONFLICTOS INTERNOS DEL GRUPO"
                        ],
                        updated_at: "2023-03-28T22:46:44.961Z"
                    }
                ]
            };
            let errors = [];
            errors = yield this.validateModel(dataExample, data);
            return { status: errors.length == 0 ? 'OK' : 'ERROR', info, errors };
        });
    }
    validateDataClient(data) {
        return __awaiter(this, void 0, void 0, function* () {
            ///// VALIDAR QUE LOS DATOS de CLIENTE
            const dataExample = {
                _id: "1679723948863",
                _rev: "1-2f83cbfb8a5e9950d00940d1cf8a55d7",
                address: [
                    {
                        type: "DOMICILIO",
                        address_line1: "CALLE 25",
                        country: [
                            "COUNTRY|1",
                            "México"
                        ],
                        province: [
                            "PROVINCE|5",
                            "Chiapas"
                        ],
                        municipality: [
                            "MUNICIPALITY|33",
                            "Reforma"
                        ],
                        city: [
                            "CITY|1970",
                            "carlos salinas de gortari"
                        ],
                        colony: [
                            "NEIGHBORHOOD|113",
                            "carlos salinas de gortari"
                        ],
                        ext_number: 10,
                        int_number: 10,
                        exterior_number: "AA",
                        interior_number: "BB",
                        ownership_type: [1, "PROPIA"],
                        street_reference: "reference",
                        road: [
                            5,
                            "Calle"
                        ]
                    },
                    {
                        _id: "1679723842324",
                        type: "DOMICILIO",
                        address_line1: "CALLE 25",
                        country: [
                            "COUNTRY|1",
                            "México"
                        ],
                        province: [
                            "PROVINCE|5",
                            "Chiapas"
                        ],
                        municipality: [
                            "MUNICIPALITY|33",
                            "Reforma"
                        ],
                        city: [
                            "CITY|1970",
                            "carlos salinas de gortari"
                        ],
                        colony: [
                            "NEIGHBORHOOD|113",
                            "carlos salinas de gortari"
                        ],
                        post_code: "29500",
                        ext_number: 10,
                        int_number: 10,
                        exterior_number: "AA",
                        interior_number: "BB",
                        ownership_type: [1, "PROPIA"],
                        street_reference: "reference",
                        road: [
                            5,
                            "Calle"
                        ]
                    }
                ],
                branch: [
                    1,
                    "ORIENTE"
                ],
                business_data: {
                    ocupation: [
                        28,
                        "PROMOTORA DE VENTAS (VENTAS POR CATALOGO)"
                    ],
                    economic_activity: [
                        1,
                        "AGRICULTURA"
                    ],
                    profession: [
                        48,
                        "Diseñador de Productos Industriales y Comerciales"
                    ],
                    business_start_date: "2021-01-19T23:58:00-06:00",
                    business_name: "NEGOCIO 1",
                    business_owned: false,
                    business_phone: "1234567890",
                    bis_location: [1, "CASA DEL CLIENTE"],
                    number_employees: 0,
                    loan_destination: [1, 'COMPRAR O REMODELAR'],
                    income_sales_total: 0,
                    income_partner: 0,
                    income_job: 0,
                    income_remittances: 0,
                    income_other: 0,
                    income_total: 0,
                    expense_family: 0,
                    expense_rent: 0,
                    expense_business: 0,
                    expense_debt: 0,
                    expense_credit_cards: 0,
                    expense_total: 0,
                    keeps_accounting_records: false,
                    has_previous_experience: false
                },
                household_floor: false,
                household_roof: false,
                household_toilet: false,
                household_latrine: false,
                household_brick: false,
                economic_dependants: 0,
                internet_access: false,
                prefered_social: [1, "NINGUNA"],
                rol_hogar: [1, "JEFE DE FAMILIA"],
                user_social: '',
                has_disable: false,
                speaks_dialect: false,
                has_improved_income: false,
                client_type: [
                    2,
                    "INDIVIDUAL"
                ],
                coordinates: [
                    0,
                    0
                ],
                couchdb_type: "CLIENT",
                country_of_birth: [
                    "COUNTRY|1",
                    "México"
                ],
                curp: "OEAF771012HMCRGR09",
                data_company: [
                    {}
                ],
                data_efirma: [
                    {}
                ],
                dob: "1977-10-12",
                education_level: [
                    10,
                    "Posgrado"
                ],
                id_cliente: 0,
                id_persona: 0,
                ife_details: [
                    {
                        id_identificacion_oficial: "123456789012365",
                        numero_emision: "2",
                        numero_vertical_ocr: "1234567890"
                    }
                ],
                clave_ine: "123456789012365",
                numero_vertical: "1234567890",
                numero_emisiones: "2",
                email: "",
                lastname: "MORALES",
                loan_cycle: 0,
                marital_status: [
                    2,
                    "Casada(o)"
                ],
                name: "JUAN PLABLO",
                nationality: [
                    0,
                    ""
                ],
                phones: [
                    {
                        _id: 1,
                        type: "Móvil",
                        phone: "1234567891",
                        company: "Desconocida",
                        validated: false
                    }
                ],
                identities: [],
                province_of_birth: [
                    "PROVINCE|15",
                    "México"
                ],
                rfc: "RFCRFC",
                second_lastname: "RODRIGUEZ",
                sex: [
                    4,
                    "Hombre"
                ],
                status: [
                    1,
                    "Pendiente"
                ],
                comment: "",
                identity_pics: [],
                comprobante_domicilio_pics: []
            };
            let errors = [];
            errors = yield this.validateModel(dataExample, data);
            let action_type;
            action_type = 'CREATE_UPDATE_CLIENT';
            const info = {
                client_id: data.id_cliente,
                loan_id: data.id_solicitud,
                action_type: action_type
            };
            return { status: errors.length == 0 ? 'OK' : 'ERROR', info, errors };
        });
    }
    generarErrorRSP(error, info) {
        return __awaiter(this, void 0, void 0, function* () {
            let errors = [error];
            return { status: 'ERROR', info, errors };
        });
    }
    validateAction(id_action, type = "VALIDATE") {
        return __awaiter(this, void 0, void 0, function* () {
            let response = {
                status: "FAIL",
                message: "The transaction was done successfully",
                action: null
            };
            try {
                const act = new Action({ branch: this.branch });
                const action = yield act.findOne({ _id: id_action });
                if (!action) {
                    response.message = 'Action not found';
                    return response;
                }
                if (action.status !== 'Pending' && type == 'EXEC') {
                    response.message = 'Action is not pending, current status is "' + action.status + '"';
                    return response;
                }
                response.status = "OK";
                response.action = action;
                return response;
            }
            catch (error) {
                response.message = error.message;
                return response;
            }
        });
    }
    saveValidation(result, action) {
        return __awaiter(this, void 0, void 0, function* () {
            if (action.status === 'Pending') {
                if (result.errors.length == 0) {
                    action.isOk = true;
                    action.errors = result.errors;
                }
                else {
                    action.errors = result.errors;
                    action.isOk = false;
                }
            }
            yield new Action(action).save();
            return result;
        });
    }
}
exports.default = Action;
