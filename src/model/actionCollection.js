const DocumentCollection = require('./documentCollection');
const { sqlConfig } = require("../db/connSQL");
const sql = require("mssql");
const tbl = require('../utils/TablesSQL');
class ActionCollection extends DocumentCollection {
    constructor(obj = {}) {
        super()
        this._id = obj._id || Date.now().toString(),
            this._rev = obj._rev,
            this._couchdb_type = 'ACTION',
            this._name = obj.name,
            this._data = obj.data,
            this._created_by = obj.created_by,
            this._status = obj.status || 'Pending'
        this._errors = obj.errors || [],
            this._isOk = obj.isOk || false
    }

    async getClientHFById(externalId) {
        try {
            let pool = await sql.connect(sqlConfig);
            let result = await pool
                .request()
                .input("idCliente", sql.Int, externalId)
                .execute("MOV_ObtenerDatosPersona");

            return result.recordsets;
        } catch (err) {
            console.log(err)
            // throw new Error(err)
        }
    }

    async createClientHF(data, value) {
        try {
            const pool = await sql.connect(sqlConfig);

            const cleanAllTables = () => {
                tbl.cleanTable(tbl.UDT_CONT_Empresa);
                tbl.cleanTable(tbl.UDT_CONT_Direcciones);
                tbl.cleanTable(tbl.UDT_CONT_Oficinas);
                tbl.cleanTable(tbl.UDT_CONT_Persona);
                tbl.cleanTable(tbl.UDT_CONT_Telefonos);
                tbl.cleanTable(tbl.UDT_CONT_Identificaciones);
                tbl.cleanTable(tbl.UDT_CONT_Negocios);
                tbl.cleanTable(tbl.UTD_CLIE_Clientes);
                tbl.cleanTable(tbl.UDT_CLIE_Individual);
                tbl.cleanTable(tbl.UDT_CLIE_Solicitud);
                tbl.cleanTable(tbl.UDT_CLIE_DatoBancario);
                tbl.cleanTable(tbl.UDT_SPLD_DatosCliente);
                tbl.cleanTable(tbl.UDT_CONT_FirmaElectronica);
            }

            tbl.UDT_CONT_Empresa.rows.add(
                data["NEGOCIO"][0].id,
                data["NEGOCIO"][0].nombre,
                data["NEGOCIO"][0].rfc,
                '',
                0,
                data["NEGOCIO"][0].id_actividad_economica,
                '',
                data["NEGOCIO"][0].ventas_totales_cantidad,
                data["NEGOCIO"][0].ventas_totales_unidad.toString(),
                data["NEGOCIO"][0].revolvencia,
                data["NEGOCIO"][0].numero_empleados,
                data["NEGOCIO"][0].tiempo_actividad_incio,
                data["NEGOCIO"][0].tiempo_actividad_final,
                '',
                data["NEGOCIO"][0].econ_registro_egresos_ingresos, // 0/1
                ''
            );

            tbl.UDT_CONT_Direcciones.rows.add(
                data["NEGOCIO"][0].id_dir,
                '',
                data["NEGOCIO"][0].id_pais,
                data["NEGOCIO"][0].id_estado,
                data["NEGOCIO"][0].id_municipio,
                data["NEGOCIO"][0].id_ciudad,
                data["NEGOCIO"][0].id_colonia,
                data["NEGOCIO"][0].calle, //direccion
                data["NEGOCIO"][0].letra_exterior,
                data["NEGOCIO"][0].letra_interior,
                data["NEGOCIO"][0].referencia,
                data["NEGOCIO"][0].casa_situacion,
                data["NEGOCIO"][0].tiempo_actividad_incio,
                data["NEGOCIO"][0].tiempo_actividad_final,
                data["NEGOCIO"][0].correo_electronico,
                data["NEGOCIO"][0].num_exterior,
                data["NEGOCIO"][0].num_interior,
                data["NEGOCIO"][0].id_vialidad
            );

            tbl.UDT_CONT_Oficinas.rows.add(
                data["NEGOCIO"][0].id_oficina_empresa,//id_oficina
                data["NEGOCIO"][0].id_empresa, //id_empresa
                data["NEGOCIO"][0].id_dir, //id_direccion
                0,
                data["NEGOCIO"][0].nombre_oficina,
                '',
                '',
                '',
                '',
                '',
                ''
            );

            tbl.UDT_CONT_Telefonos.rows.add(
                data["TELEFONO"][0].id,
                data["TELEFONO"][0].idcel_telefono,
                '',
                data["TELEFONO"][0].tipo_telefono,
                data["TELEFONO"][0].compania,
                data["TELEFONO"][0].sms
            )

            const empresa = await pool.request()
                .input('tablaEmpresa', tbl.UDT_CONT_Empresa)
                .input('tablaDirecciones', tbl.UDT_CONT_Direcciones)
                .input('tablaOficinas', tbl.UDT_CONT_Oficinas)
                .input('tablaTelefonos', tbl.UDT_CONT_Telefonos)
                .input('id_opcion', sql.Int, value) // 1-Insertar/2-Actualizar
                .input('id_sesion', sql.Int, 0)
                .execute('MOV_AdministrarEmpresa')//Sirve para crear el negocio
            cleanAllTables();
            let id_empresa = 0;
            let id_direccion = 0;//direccion de empresa/Negocio
            let id_oficina = 0;
            let id_telefono = 0;

            if (value === 1) {
                id_empresa = empresa.recordsets[0][0].id_resultado;
                id_direccion = empresa.recordsets[0][1].id_resultado;//direccion de empresa/Negocio
                id_oficina = empresa.recordsets[0][2].id_resultado;
                id_telefono = empresa.recordsets[0][3].id_resultado;
            } else { //Si es actualizar llenarlos con valores de mongo
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


            //#region CREATE CLIENT
            tbl.UDT_CONT_Persona.rows.add(data["PERSONA"][0].id, null, null,
                null, null, null, null, null, null,
                null, null, null, null, null, null,
                null, null, null);

            tbl.UDT_CONT_Identificaciones.rows.add( // NO SE USA
                data['IDENTIFICACIONES'][0].id,//id prospera
                data['IDENTIFICACIONES'][0].id_entidad,
                'PROSPERA',
                data['IDENTIFICACIONES'][0].id_numero,
                0,
                1
            );

            tbl.UDT_CONT_Telefonos.rows.add(
                data["TELEFONO"][0].id,
                data["TELEFONO"][0].idcel_telefono,
                data["TELEFONO"][0].extension,
                data["TELEFONO"][0].tipo_telefono,
                data["TELEFONO"][0].compania,
                data["TELEFONO"][0].sms
            );

            tbl.UDT_CONT_Negocios.rows.add(
                data["NEGOCIO"][0].id,
                data["PERSONA"][0].id,
                id_oficina,
                data["NEGOCIO"][0].nombre_oficina,
                data["NEGOCIO"][0].nombre_puesto,
                data["NEGOCIO"][0].departamento,
                id_empresa,
                data["NEGOCIO"][0].numero_empleados,
                data["NEGOCIO"][0].registro_egresos,
                data["NEGOCIO"][0].revolvencia,
                data["NEGOCIO"][0].ventas_totales_cantidad,
                data["NEGOCIO"][0].ventas_totales_unidad,
                data["NEGOCIO"][0].id_actividad_economica,
                data["NEGOCIO"][0].tiempo_actividad_incio,
                data["NEGOCIO"][0].tiempo_actividad_final,
                '',
                ''
            );

            tbl.UTD_CLIE_Clientes.rows.add(
                data["CLIENTE"][0].id_cliente,
                null,
                null,
                null,
                data["CLIENTE"][0].id_oficina,
                data["CLIENTE"][0].id_oficial_credito,
                '0000000000', // En desuso
                null);

            tbl.UDT_CLIE_Individual.rows.add(
                data["INDIVIDUAL"][0].id_cliente,//id cliente
                data["INDIVIDUAL"][0].id_persona,//id persona
                data["INDIVIDUAL"][0].econ_ocupacion, // CATA_ocupacionPLD (enviar la etiqueta ej. EMPLEADA) YA NO SE USA
                data["INDIVIDUAL"][0].econ_id_actividad_economica, // CATA_ActividadEconomica (los que tengan FINAFIM)
                data["INDIVIDUAL"][0].econ_id_destino_credito, // CATA_destinoCredito
                data["INDIVIDUAL"][0].econ_id_ubicacion_negocio, // CATA_ubicacionNegocio
                data["INDIVIDUAL"][0].econ_id_rol_hogar, // CATA_rolHogar
                id_empresa,
                data["INDIVIDUAL"][0].econ_cantidad_mensual, // Ej. 2000.0
                data["INDIVIDUAL"][0].econ_sueldo_conyugue,
                data["INDIVIDUAL"][0].econ_otros_ingresos,
                data["INDIVIDUAL"][0].econ_otros_gastos,
                data["INDIVIDUAL"][0].econ_familiares_extranjeros,
                data["INDIVIDUAL"][0].econ_parentesco,
                data["INDIVIDUAL"][0].envia_dinero, // 0/1 (NO/SI)
                data["INDIVIDUAL"][0].econ_dependientes_economicos,
                data["INDIVIDUAL"][0].econ_pago_casa,
                data["INDIVIDUAL"][0].econ_gastos_vivienda,
                data["INDIVIDUAL"][0].econ_gastos_familiares,
                data["INDIVIDUAL"][0].econ_gastos_transporte,
                data["INDIVIDUAL"][0].credito_anteriormente, // 0/1 (NO/SI)
                data["INDIVIDUAL"][0].mejorado_ingreso, // 0/1 (NO/SI)
                data["INDIVIDUAL"][0].lengua_indigena, // 0/1 (NO/SI)
                data["INDIVIDUAL"][0].habilidad_diferente, // 0/1 (NO/SI)
                data["INDIVIDUAL"][0].utiliza_internet, // 0/1 (NO/SI)
                data["INDIVIDUAL"][0].utiliza_redes_sociales, // 0/1 (NO/SI)
                data["INDIVIDUAL"][0].id_actividad_economica, // 0/1 (NO/SI)
                data["INDIVIDUAL"][0].id_ocupacion, // CATA_ocupacionPLD
                data["INDIVIDUAL"][0].id_profesion,
                1,
                '',
                0,
                0,
                0,
                0,
                0,
                0,
                '',
                ''
            );

            tbl.UDT_CLIE_Solicitud.rows.add(0, null, null, null, null, null, null);

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

            tbl.UDT_SPLD_DatosCliente.rows.add(
                0, //No mandar nada
                data["PLD"][0].id_cliente,//id del cliente
                data["PLD"][0].desempenia_funcion_publica,
                data["PLD"][0].desempenia_funcion_publica_cargo,
                data["PLD"][0].desempenia_funcion_publica_dependencia,
                data["PLD"][0].familiar_desempenia_funcion_publica,
                data["PLD"][0].familiar_desempenia_funcion_publica_cargo,
                data["PLD"][0].familiar_desempenia_funcion_publica_dependencia,
                data["PLD"][0].familiar_desempenia_funcion_publica_nombre,
                data["PLD"][0].familiar_desempenia_funcion_publica_paterno,
                data["PLD"][0].familiar_desempenia_funcion_publica_materno,
                data["PLD"][0].familiar_desempenia_funcion_publica_parentesco,
                data["PLD"][0].id_instrumento_monetario);

            tbl.UDT_CONT_FirmaElectronica.rows.add(
                data["EFIRMA"][0].id_firma_electronica,
                data["PERSONA"][0].id,
                data["EFIRMA"][0].fiel
            );

            const result = await pool.request()
                .input('info_persona', tbl.UDT_CONT_Persona)
                .input('info_identificaciones', tbl.UDT_CONT_Identificaciones)
                .input('info_telefonos', tbl.UDT_CONT_Telefonos)
                .input('info_empleos', tbl.UDT_CONT_Negocios)
                .input('info_cliente', tbl.UTD_CLIE_Clientes)
                .input('info_individual', tbl.UDT_CLIE_Individual)
                .input('info_solicitud', tbl.UDT_CLIE_Solicitud)
                .input('info_dato_bancario', tbl.UDT_CLIE_DatoBancario)
                .input('info_datos_pld', tbl.UDT_SPLD_DatosCliente)
                .input('info_firma_electronica', tbl.UDT_CONT_FirmaElectronica)
                .input('id_opcion', sql.Int, 0)
                .input('uid', sql.Int, 0)
                .execute('MOV_insertarInformacionClienteV2')
            // .execute('MOV_Prueba')

            console.log(result.recordsets)
            cleanAllTables();
            return result.recordsets;

            //#endregion


        } catch (error) {
            console.log(error);
            throw new Error(error)
        }
    }

    async getActionHF() {
        try {
            const pool = await sql.connect(sqlConfig);
            const result = await pool
                .request()
                .query("SELECT * FROM MOVI_Acciones WHERE estatus = 'PENDIENTE'");

            return result.recordset;
        } catch (error) {
            console.log(error);
            throw new Error(error.message)
        }
    }

    async updateActionHF(id_action, status) {
        try {
            const pool = await sql.connect(sqlConfig);
            const result = await pool
                .request()
                .query(`UPDATE MOVI_Acciones SET estatus = '${status}' WHERE id = '${id_action}'`);

            return result.recordset;
        } catch (error) {
            console.log(error);
            return new Error(error.message)
        }
    }

    validateDataLoan(data) {
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
            first_replay_at: "",
            disburset_at: "",
            disbursment_mean: "ORP",
            liquid_guarantee: 10,
            product: {
                external_id: 3,
                min_amount: "10000",
                max_amount: 160000,
                step_amount: "1000",
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
        }
        let errors = [];

        const keys = Object.keys(dataExample);
        keys.forEach((item) => {
            const valueOKExample = dataExample[item];
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

                    if (typeDataOK != typeDataCompare) errors.push({
                        property: `${item}.${key}`,
                        ExpectedDataType: typeDataOK,
                        givenDataType: typeDataCompare,
                        example: valueOK
                    })
                })
            }

            if (typeDataOKEx == "array" && typeDataCoEx == "array" && typeof valueOKExample[1] == 'object') {
                valueOKExample.forEach((obj, idx) => {
                    const keyItemArray = Object.keys(obj);
                    keyItemArray.forEach((key) => {
                        if (valueCompareExample.lenght < idx) {
                            const valueOK = obj[key] || '';
                            const valueCompare = valueCompareExample[idx][key] ? valueCompareExample[idx][key] : undefined;

                            // console.log(typeof valueCompare == "object" && Array.isArray(valueCompare) ? "array" : typeof valueCompare)
                            let typeDataOK = typeof valueOK == "object" && Array.isArray(valueOK) ? "array" : typeof valueOK;
                            let typeDataCompare = typeof valueCompare == "object" && Array.isArray(valueCompare) ? "array" : typeof valueCompare || null;
                            if (!typeDataCompare) console.log('pasa')
                            // if (!typeDataCompare)

                            if (typeDataOK != typeDataCompare || !typeDataCompare) erros.push({
                                property: `address[${idx}].${key}`,
                                ExpectedDataType: typeDataOK,
                                givenDataType: typeDataCompare,
                                example: valueOK
                            })
                        }

                    })
                })
            }

            if (typeDataOKEx != typeDataCoEx || !typeDataCoEx)
                errors.push({
                    property: item,
                    ExpectedDataType: typeDataOKEx,
                    givenDataType: typeDataCoEx,
                    example: valueOKExample
                });
        });
        let action_type;
        if (data.renovation) {
            action_type = 'RENOVATION LOAN';
        } else if (data.id_solicitud === 0 && !data.renovation) {
            action_type = 'CREATE LOAN';
        } else {
            action_type = 'UPDATE LOAN';
        }

        const info = {
            client_id: data.id_cliente,
            loan_id: data.id_solicitud,
            action_type: action_type
        }
        return { info, errors };
    }
}

module.exports = ActionCollection;