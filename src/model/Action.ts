import sql from 'mssql';
import { sqlConfig } from '../db/connSQL';
import { UDT_CLIE_DatoBancario, UDT_CLIE_Individual, UDT_CLIE_Solicitud, UDT_CONT_Direcciones, UDT_CONT_Empresa, UDT_CONT_FirmaElectronica, UDT_CONT_Identificaciones, UDT_CONT_Negocios, UDT_CONT_Oficinas, UDT_CONT_Persona, UDT_CONT_Telefonos, UDT_SPLD_DatosCliente, UTD_CLIE_Clientes, cleanTable } from '../utils/TablesSql';
import { DocumentCollection } from './DocumentCollection';


export default class Action extends DocumentCollection {

    _name: string;
    _data: any;
    _created_by: string;
    _status: string;
    _errors: any[];
    _isOk: boolean;

    
    constructor( obj = { } as any){
        super();
        this._id = obj._id || Date.now().toString();
        this._rev = obj._rev;
        this._couchdb_type = 'ACTION';
        this._name = obj.name;
        this._data = obj.data;
        this._created_by = obj.created_by;
        this._status = obj.status || 'Pending';
        this._errors = obj.errors || [];
        this._isOk = obj.isOk || false;
    }

    static async getClientHFById(externalId:number) {
        try {
            let pool = await sql.connect(sqlConfig);
            let result = await pool
                .request()
                .input("idCliente", sql.Int, externalId)
                .execute("MOV_ObtenerDatosPersona");

            return result.recordsets;
        } catch (err) {
            console.log(err)
        }
    }
    static async createClientHF(data:any, value:any) {
        try {
            const pool = await sql.connect(sqlConfig);

            const cleanAllTables = () => {
                cleanTable(UDT_CONT_Empresa);
                cleanTable(UDT_CONT_Direcciones);
                cleanTable(UDT_CONT_Oficinas);
                cleanTable(UDT_CONT_Persona);
                cleanTable(UDT_CONT_Telefonos);
                cleanTable(UDT_CONT_Identificaciones);
                cleanTable(UDT_CONT_Negocios);
                cleanTable(UTD_CLIE_Clientes);
                cleanTable(UDT_CLIE_Individual);
                cleanTable(UDT_CLIE_Solicitud);
                cleanTable(UDT_CLIE_DatoBancario);
                cleanTable(UDT_SPLD_DatosCliente);
                cleanTable(UDT_CONT_FirmaElectronica);
            }
            
            UDT_CONT_Persona.rows.length = 0;
            UDT_CONT_Identificaciones.rows.length = 0;
            UDT_CONT_Telefonos.rows.length = 0;
            UDT_CONT_Negocios.rows.length = 0;
            UTD_CLIE_Clientes.rows.length = 0;
            UDT_CLIE_Individual.rows.length = 0;
            UDT_CLIE_Solicitud.rows.length = 0;
            UDT_CLIE_DatoBancario.rows.length = 0;
            UDT_SPLD_DatosCliente.rows.length = 0;
            UDT_CONT_Empresa.rows.length = 0;
            UDT_CONT_Direcciones.rows.length = 0;
            UDT_CONT_Oficinas.rows.length = 0;
            UDT_CONT_FirmaElectronica.rows.length = 0;
            UDT_CONT_Telefonos.rows.length = 0;

            UDT_CONT_Empresa.rows.add(
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

            UDT_CONT_Direcciones.rows.add(
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

            UDT_CONT_Oficinas.rows.add(
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

            UDT_CONT_Telefonos.rows.add(
                data["TELEFONO"][0].id,
                data["TELEFONO"][0].idcel_telefono,
                '',
                data["TELEFONO"][0].tipo_telefono,
                data["TELEFONO"][0].compania,
                data["TELEFONO"][0].sms
            )

            const empresa: any = await pool.request()
                .input('tablaEmpresa', UDT_CONT_Empresa)
                .input('tablaDirecciones', UDT_CONT_Direcciones)
                .input('tablaOficinas', UDT_CONT_Oficinas)
                .input('tablaTelefonos', UDT_CONT_Telefonos)
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

        UDT_CONT_Persona.rows.length = 0;
        UDT_CONT_Identificaciones.rows.length = 0;
        UDT_CONT_Telefonos.rows.length = 0;
        UDT_CONT_Negocios.rows.length = 0;
        UTD_CLIE_Clientes.rows.length = 0;
        UDT_CLIE_Individual.rows.length = 0;
        UDT_CLIE_Solicitud.rows.length = 0;
        UDT_CLIE_DatoBancario.rows.length = 0;
        UDT_SPLD_DatosCliente.rows.length = 0;
        UDT_CONT_FirmaElectronica.rows.length = 0;
            //#region CREATE CLIENT
        UDT_CONT_Persona.rows.add(data["PERSONA"][0].id, null, null,
                null, null, null, null, null, null,
                null, null, null, null, null, null,
                null, null, null,null);

        UDT_CONT_Identificaciones.rows.add( // NO SE USA
                data['IDENTIFICACIONES'][0].id,//id prospera
                data['IDENTIFICACIONES'][0].id_entidad,
                'PROSPERA',
                data['IDENTIFICACIONES'][0].id_numero,
                0,
                1
            );

        UDT_CONT_Telefonos.rows.add(
                data["TELEFONO"][0].id,
                data["TELEFONO"][0].idcel_telefono,
                data["TELEFONO"][0].extension,
                data["TELEFONO"][0].tipo_telefono,
                data["TELEFONO"][0].compania,
                data["TELEFONO"][0].sms
            );

        UDT_CONT_Negocios.rows.add(
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

        UTD_CLIE_Clientes.rows.add(
                data["CLIENTE"][0].id_cliente,
                null,
                null,
                null,
                data["CLIENTE"][0].id_oficina,
                data["CLIENTE"][0].id_oficial_credito,
                '0000000000', // En desuso
                null);

        UDT_CLIE_Individual.rows.add(
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

        UDT_CLIE_Solicitud.rows.add(0, null, null, null, null, null, null);

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

        UDT_SPLD_DatosCliente.rows.add(
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

        UDT_CONT_FirmaElectronica.rows.add(
                data["EFIRMA"][0].id_firma_electronica,
                data["PERSONA"][0].id,
                data["EFIRMA"][0].fiel
            );

            const result = await pool.request()
                .input('info_persona',UDT_CONT_Persona)
                .input('info_identificaciones',UDT_CONT_Identificaciones)
                .input('info_telefonos',UDT_CONT_Telefonos)
                .input('info_empleos',UDT_CONT_Negocios)
                .input('info_cliente',UTD_CLIE_Clientes)
                .input('info_individual',UDT_CLIE_Individual)
                .input('info_solicitud',UDT_CLIE_Solicitud)
                .input('info_dato_bancario',UDT_CLIE_DatoBancario)
                .input('info_datos_pld',UDT_SPLD_DatosCliente)
                .input('info_firma_electronica',UDT_CONT_FirmaElectronica)
                .input('id_opcion', sql.Int, 0)
                .input('uid', sql.Int, 0)
                .execute('MOV_insertarInformacionClienteV2')
            // .execute('MOV_Prueba')

            console.log(result.recordsets)
            cleanAllTables();
            return result.recordsets;
            //#endregion

        } catch (error:any) {
            console.log(error);
            throw new Error(error)
        }
    }
    
    static async getActionHF() {
        try {
            const pool = await sql.connect(sqlConfig);
            const result = await pool
                .request()
                .query("SELECT * FROM MOVI_Acciones WHERE estatus = 'PENDIENTE'");

            return result.recordset;
        } catch (error:any) {
            console.log(error);
            throw new Error(error.message)
        }
    }
    static async updateActionHF(id_action: string, status: string) {
        try {
            const pool = await sql.connect(sqlConfig);
            const result = await pool
                .request()
                .query(`UPDATE MOVI_Acciones SET estatus = '${status}' WHERE id = '${id_action}'`);

            return result.recordset;
        } catch (error:any) {
            console.log(error);
            return new Error(error.message)
        }
    }
    static pushError(errors: any[],typeDataOK:any,typeDataCompare:any,valueOK:string,property:string)
    {
        errors.push({
            property: property,
            ExpectedDataType: typeDataOK,
            givenDataType: typeDataCompare,
            example: valueOK
        });
    }

    static async validateModel(model:any,data:any)
    {
        //Valida la estructura del modelo vs el que viene en la data
        let errors: any[] = [];
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

                    if (typeDataOK != typeDataCompare){
                        this.pushError(errors,typeDataOK,typeDataCompare,valueOK,`${item}.${key}`);
                    }
                })
            }

            if (typeDataOKEx == "array" && typeDataCoEx == "array" && typeof valueOKExample[0] == 'object') {

                    const keyItemArray = Object.keys(valueOKExample[0]);
                    keyItemArray.forEach((key) => {
                        const valueOK = valueOKExample[0][key];
                        let typeDataOK = typeof valueOK == "object" && Array.isArray(valueOK) ? "array" : typeof valueOK;
                        let valueCompare = undefined;
                        let typeDataCompare:any = undefined;
                        valueCompareExample.forEach((obj:any, idx:number) => {
                            // Si es un objeto
                            if(typeof valueOK == "object"){
                                const keyItemArrayObj = Object.keys(valueOK);
                                if(valueCompareExample[idx][key] === undefined )
                                    this.pushError(errors,typeDataOK,typeDataCompare,valueOK,`${item}[${idx}].${key}`);
                                else
                                {
                                    keyItemArrayObj.forEach((keyObj) => {
                                        const valueOKObj = valueOK[keyObj];
                                        const valueCompareObj = valueCompareExample[idx][key] === undefined ? undefined : valueCompareExample[idx][key][keyObj] ;
                                        const typeDataOKObj = typeof valueOKObj == "object" && Array.isArray(valueOKObj) ? "array" : typeof valueOKObj;
                                        const typeDataCompareObj = typeof valueCompareObj == "object" && Array.isArray(valueCompareObj) ? "array" : typeof valueCompareObj;

                                        if (typeDataOKObj != typeDataCompareObj){
                                            this.pushError(errors,typeDataOKObj,typeDataCompareObj,valueOKObj,`${item}[${idx}].${key}.${keyObj}`);
                                        }
                                    })
                                }
                            }
                            // Si es un valor o array
                            else{
                                valueCompare = valueCompareExample[idx][key];
                                typeDataCompare = typeof valueCompare == "object" && Array.isArray(valueCompare) ? "array" : typeof valueCompare;
                                if (typeDataOK != typeDataCompare || !typeDataCompare){
                                    this.pushError(errors,typeDataOK,typeDataCompare,valueOK,`${item}[${idx}].${key}`);
                                }
                            }


                        })
                        if(valueCompareExample.length == 0 && (typeDataOK != typeDataCompare || !typeDataCompare))
                            this.pushError(errors,typeDataOK,typeDataCompare,valueOK,`${item}[0].${key}`);
                    })

            }
            if (typeDataOKEx != typeDataCoEx || !typeDataCoEx){
                this.pushError(errors,typeDataOKEx,typeDataCoEx,valueOKExample,item);
            }
        });
        return errors;
    }

    static async validateDataLoan(data:any, info:string) {
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
        errors = await this.validateModel(dataExample, data)
        let action_type;
        if (data.renovation) {
            action_type = 'RENOVATION LOAN';
        } else if (data.id_solicitud === 0 && !data.renovation) {
            action_type = 'CREATE LOAN';
        } else {
            action_type = 'UPDATE LOAN';
        }
        return { status: errors.length == 0 ? 'OK': 'ERROR', info, errors };
    }
    static async validateDataDropMemberLoan(data:any,info:string)
    {
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
        errors = await this.validateModel(dataExample, data)
        return {status: errors.length == 0 ? 'OK': 'ERROR', info, errors};
    }

    static async validateDataAddMemberLoan(data:any, info:string)
    {
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
        errors = await this.validateModel(dataExample, data)
        return {status: errors.length == 0 ? 'OK': 'ERROR', info, errors};
    }
    static async validateDataClient(data:any) {
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
                    ext_number: "ext",
                    int_number: "int",
                    street_reference: "reference",
                    road:[
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
                    ext_number: "ext",
                    int_number: "int",
                    street_reference: "reference",
                    road:[
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
                business_phone: "1234567890"
            },
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
            ocupation: [
                28,
                "PROMOTORA DE VENTAS (VENTAS POR CATALOGO)"
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
        }
        let errors = [];
        errors = await this.validateModel(dataExample,data)
        let action_type;
        action_type = 'CREATE_UPDATE_CLIENT';
        const info = {
            client_id: data.id_cliente,
            loan_id: data.id_solicitud,
            action_type: action_type
        }
        return { status: errors.length == 0 ? 'OK': 'ERROR', info, errors };
    }

    static async generarErrorRSP(error:any,info:any){
        let errors = [error];
        return { status:'ERROR',info, errors };
    }
    static async validateAction(id_action:string,type = "VALIDATE") {
        let response =
            {
                status:"FAIL",
                message: "The transaction was done successfully",
                action: null
            };
        try {
            const act = new Action();
            const action:any = await act.findOne({ _id: id_action });

            if (!action){
                response.message = 'Action not found';
                return response;
            }

            if (action._status !== 'Pending' && type == 'EXEC'){
                response.message = 'Action is not pending, current status is "'+action.status+'"';
                return response;
            }

            response.status = "OK";
            response.action = action;
            return response;
        } catch (error:any) {
            response.message = error.message;
            return response;
        }
    }
    
    static async saveValidation(result:any,action:any)
    {
        if (action.status === 'Pending')
        {
            if (result.errors.length == 0)
            {
                action.isOk = true
                action.errors = result.errors;
            }
            else
            {
                action.errors = result.errors;
                action.isOk = false;
            }
        }
        await new Action(action).save();
        return result;
    }


}