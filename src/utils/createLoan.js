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
exports.validateSolicitud = exports.createLoanHF = void 0;
const mssql_1 = __importDefault(require("mssql"));
const connSQL_1 = require("../db/connSQL");
const LoanAppGroup_1 = require("../model/LoanAppGroup");
const Client_1 = require("../model/Client");
const LoanApp_1 = require("../model/LoanApp");
const Group_1 = require("../model/Group");
const Functions_1 = require("./Functions");
const createPerson_1 = require("./createPerson");
const TablesSql_1 = require("./TablesSql");
let loanAppGroup = new LoanAppGroup_1.LoanAppGroup();
let ClientDoc = new Client_1.Client();
let loanApp = new LoanApp_1.LoanApp();
let groupDoc = new Group_1.Group();
const Funct = new Functions_1.Functions();
const frecuencysCouchtoHF = {
    'S': 'SEMANAL',
    'Q': 'QUINCENAL',
    'M': 'MENSUAL',
    'C': 'CATORCENAL'
};
const frecuencyHFToCouch = {
    "Semanal": ["S", "Semana(s)"]
};
function createLoanHF(data) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { id_loan } = data;
            let typeClient;
            let loan;
            loan = yield loanAppGroup.findOne({ _id: id_loan });
            typeClient = 1;
            if (loan == undefined) {
                loan = yield loanApp.findOne({ _id: id_loan });
                typeClient = 2;
            }
            if (loan === undefined)
                return new Error('Loan not found');
            const isNewLoan = loan.id_solicitud == 0;
            const idBranch = loan.branch[0];
            const client = typeClient == 1 ?
                yield groupDoc.findOne({ _id: loan.apply_by }) :
                yield ClientDoc.findOne({ _id: loan.apply_by });
            if (!client)
                return new Error('Failed to find');
            // CREAR LA SOLICITUD, SI ES SOLICITUD NUEVA
            if (isNewLoan) {
                console.log('NUEVA SOLICITUD');
                const dataCreate = { idUsuario: 0, idOficina: idBranch, num: 1, typeClient: typeClient, idLoan: id_loan };
                const LoanHFCreated = yield createLoanFromHF(dataCreate);
                if (!LoanHFCreated)
                    return new Error('Failed to create loan in HF');
                loan.id_solicitud = LoanHFCreated[0].idSolicitud;
                if (typeClient == 1 && loan.id_cliente == 0) {
                    loan.id_cliente = LoanHFCreated[0].idCliente;
                    // loan.group.id = 0;
                }
            }
            else if (loan.renovation) { // TODOelse if revobacion
                console.log('RENOVACIÓN');
                let idOfficer = loan.loan_officer ? loan.loan_officer : 0;
                const idLoanRenovation = yield loanRenovation(loan.id_cliente, loan.id_solicitud, idOfficer, idBranch, id_loan);
                if (!idLoanRenovation)
                    return new Error('Renovation loan');
                console.log('idRenovation:', idLoanRenovation);
                loan.id_solicitud = idLoanRenovation;
                loan.renovation = false;
            }
            else {
                console.log('ACTUALIZACIÓN');
                loan.id_cliente = client.id_cliente;
            }
            //Guardar Solicitud por creación o renovación antes de validación de estatus
            typeClient === 1 ? yield new LoanAppGroup_1.LoanAppGroup(loan).save() : yield new LoanApp_1.LoanApp(loan).save();
            //Validación de estatus previo a actualización de la solicitud
            let validation_solicitud = yield validateSolicitud(loan.id_solicitud);
            if (!validation_solicitud)
                return new Error('La solicitud no puede ser modificada por que no está en estatus (TRAMITE ó PREIMPRESO) o en sub_estatus (NUEVO TRAMITE ó SOLICITUD) respectivamente.');
            const disposition = yield getDisposicionByOffice(idBranch);
            if (!disposition)
                return new Error('Failed to get disposition');
            const seguro = yield getSeguroProducto(loan.product.external_id); // parseInt(loan.product.external_id)
            if (!seguro)
                return new Error('Failed to get insurance');
            // TODO EJECUATR EL PROCEDIMIENTO CUANDO SEA ESTATUS "POR AUTORIZAR" MOV_CATA_CrearProducto
            const dataMount = {
                SOLICITUD: [
                    {
                        id: loan.id_solicitud,
                        id_cliente: loan.id_cliente,
                        id_oficial: loan.loan_officer != undefined ? loan.loan_officer : 346928,
                        id_disposicion: disposition[0] ? disposition[0].IdDisposición : 0,
                        monto_solicitado: loan.apply_amount,
                        monto_autorizado: loan.approved_total || 0,
                        estatus: loan.estatus ? loan.estatus : 'TRAMITE',
                        sub_estatus: loan.sub_estatus ? loan.sub_estatus : 'NUEVO TRAMITE',
                        periodicidad: Object.entries(frecuencysCouchtoHF)[loan.frequency[0]] || 'SEMANAL',
                        plazo: loan.term || loan.product.min_term,
                        fecha_primer_pago: loan.first_repay_date != '' ? (0, createPerson_1.getDates)(loan.first_repay_date) : '1999-01-01T00:00:00.000Z',
                        fecha_entrega: loan.disbursment_date != '' ? (0, createPerson_1.getDates)(loan.disbursment_date) : '1999-01-01T00:00:00.000Z',
                        medio_desembolso: loan.disbursment_mean || "ORP",
                        garantia_liquida: loan.product.liquid_guarantee || loan.liquid_guarantee,
                        id_oficina: idBranch != undefined ? idBranch : 1,
                        garantia_liquida_financiable: loan.product.GL_financeable === false ? 0 : 1,
                        id_producto: isNewLoan ? 0 : loan.id_producto,
                        id_producto_maestro: loan.product.external_id,
                        tasa_anual: loan.product.rate ? loan.product.rate : 0,
                        creacion: new Date(Date.now()).toISOString(),
                        ciclo: loan.loan_cycle,
                        tipo_cliente: typeClient
                    }
                ],
                GRUPO: typeClient == 1 ? {
                    id: client.id_cliente,
                    name: client.group_name,
                    weekday_meet: client.weekday_meet,
                    hour_meet: client.hour_meet,
                    address: [{
                            id: client.address.id,
                            address_line1: client.address.address_line1,
                            country: ['COUNTRY|1', 'México'],
                            province: client.address.province,
                            municipality: client.address.municipality,
                            city: client.address.city,
                            colony: client.address.colony,
                            street_reference: client.address.street_reference,
                            ext_number: client.address.numero_exterior,
                            int_number: client.address.numero_interior,
                            road: client.address.road_type[0],
                        }]
                } : {},
                INTEGRANTES: loan.members.map((member) => {
                    return {
                        id_individual: member.id_cliente,
                        id_persona: member.id_member,
                        estatus: member.estatus,
                        sub_estatus: member.sub_estatus,
                        cargo: member.position ? member.position : '',
                        monto_solicitado: member.apply_amount,
                        monto_sugerido: member.suggested_amount || 0,
                        monto_autorizado: member.approved_amount || 0,
                        econ_id_actividad_economica: 0,
                        curp_fisica: 0,
                        motivo: Funct.validateInt(Array.isArray(member.dropout_reason) ? member.dropout_reason[0] : 0),
                        id_cata_medio_desembolso: member.disbursment_mean ? member.disbursment_mean : 2,
                        monto_garantia_financiable: member.monto_garantia_financiable ? member.monto_garantia_financiable : 0,
                    };
                }),
                SEGURO: loan.members.map((member) => {
                    return {
                        id: isNewLoan ? member.insurance.id : 0,
                        id_individual: member.id_cliente,
                        id_seguro_asignacion: seguro[0].id_seguro_asignacion,
                        id_seguro: seguro[0].id_seguro || 0,
                        nombre_beneficiario: member.insurance.beneficiary,
                        parentesco: member.insurance.relationship,
                        porcentaje: member.insurance.percentage || 100,
                        costo_seguro: 0,
                        incluye_saldo_deudor: seguro[0].incluye_saldo_deudor
                    };
                }),
                REFERENCIA: []
            };
            if (isNewLoan) {
                for (let idx = 0; idx < dataMount['INTEGRANTES'].length; idx++) {
                    // Asignamos Cliente a Solicitud
                    const id_cliente = dataMount['INTEGRANTES'][idx].id_individual;
                    const dataAssign = {
                        id_solicitud_prestamo: loan.id_solicitud,
                        id_cliente: id_cliente,
                        etiqueta_opcion: "ALTA",
                        tipo_baja: "",
                        id_motivo: 0,
                        uid: 0
                    };
                    const asignClientLoan = yield assignClientLoanFromHF(dataAssign);
                    console.log(asignClientLoan);
                }
            }
            ;
            const MountAssigned = yield assignMontoloanHF(dataMount);
            if (!MountAssigned)
                return new Error('Failed to assign mount');
            const detailLoan = yield loanApp.getDetailLoan(loan.id_solicitud, idBranch);
            if (!detailLoan)
                return new Error('Failed to in Loan');
            // Actualizar ids en Couch con los creados en HF
            if (typeClient == 1) {
                loan.id_producto = detailLoan[0][0].id_producto;
                if (isNewLoan) {
                    client.id_cliente = detailLoan[1][0].id;
                    client.address.id = detailLoan[2].length > 0 ? detailLoan[2][0].id_direccion : 0;
                    yield new Group_1.Group(client).save();
                }
            }
            try {
                for (let idx = 0; idx < detailLoan[4].length; idx++) {
                    loan.members[idx].insurance.id = detailLoan[5][idx].id;
                }
            }
            catch (error) { }
            typeClient === 1 ? yield new LoanAppGroup_1.LoanAppGroup(loan).save() : yield new LoanApp_1.LoanApp(loan).save();
            console.log(MountAssigned[0][0]);
            return MountAssigned[0][0];
        }
        catch (error) {
            console.log(error);
            return new Error(error.stack);
        }
    });
}
exports.createLoanHF = createLoanHF;
function createLoanFromHF(data) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log(data);
            const { idUsuario, idOficina, num, typeClient, idLoan } = data;
            // typeClient 2-> individual
            // typeClient 1 -> grupo
            const pool = yield mssql_1.default.connect(connSQL_1.sqlConfig);
            const result = yield pool.request()
                .input('idUsuario', mssql_1.default.Int, idUsuario) // Creado por
                .input('idOficina', mssql_1.default.Int, idOficina)
                .input('idOficialCredito', mssql_1.default.Int, 0)
                .input('idTipoCliente', mssql_1.default.Int, typeClient) //1 -> Grupo, 2 -> Individual
                .input('idServicioFinanciero', mssql_1.default.Int, num) // Es el unico que existe
                .input('cantidad', mssql_1.default.Int, 1) // Numero de solicitudes a hacer
                .input('intIdLoan', mssql_1.default.BigInt, idLoan) // id_loan Couch
                .execute('MOV_InsertarSolicitudServicioFinanciero');
            return result.recordset;
        }
        catch (err) {
            throw new Error(err);
        }
    });
}
function getDisposicionByOffice(idOffice) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const pool = yield mssql_1.default.connect(connSQL_1.sqlConfig);
            const result = yield pool.request()
                .input('idTipoCliente', mssql_1.default.Int, 0)
                .input('idServicioFinanciero', mssql_1.default.Int, 1)
                .input('idOficina', mssql_1.default.Int, idOffice)
                .input('idLocalidad', mssql_1.default.Int, 0)
                .input('todasCurp', mssql_1.default.Int, 1)
                .input('ciclo', mssql_1.default.Int, 0)
                .input('montoSolicitado', mssql_1.default.Int, 0)
                .input('montoMaximoSolicitado', mssql_1.default.Int, 0)
                .execute('FUND_ASIGNAR_DISPOSICION');
            return result.recordsets[0];
        }
        catch (error) {
            throw new Error(error);
        }
    });
}
function getSeguroProducto(idProductoMaestro) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const pool = yield mssql_1.default.connect(connSQL_1.sqlConfig);
            const result = yield pool.request()
                .input('id_producto', mssql_1.default.Int, idProductoMaestro)
                .input('etiqueta_opcion', mssql_1.default.VarChar, 'OBTENER_SEGURO_PRODUCTO')
                .execute('CLIE_ObtenerListaSegurosProducto');
            return result.recordset;
        }
        catch (error) {
            throw new Error(error);
        }
    });
}
function loanRenovation(idClient, idLoan, idOfficer, idOffice, idLoanCouch) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const pool = yield mssql_1.default.connect(connSQL_1.sqlConfig);
            const result = yield pool.request()
                .input('idCliente', mssql_1.default.Int, idClient)
                .input('idSolicitud', mssql_1.default.Int, idLoan)
                .input('idUsuario', mssql_1.default.Int, 0)
                .input('idOficial', mssql_1.default.Int, idOfficer)
                .input('idOficinaActual', mssql_1.default.Int, idOffice)
                .input('intIdLoan', mssql_1.default.BigInt, idLoanCouch) // id_loan Couch
                .execute('MOV_InsertSolicitudGrupoSolidarioCredito');
            return result.recordset[0].id_solicitud;
        }
        catch (error) {
            console.log(error.message);
        }
    });
}
function assignClientLoanFromHF(data) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { id_solicitud_prestamo, id_cliente, etiqueta_opcion, tipo_baja, id_motivo, uid } = data;
            const pool = yield mssql_1.default.connect(connSQL_1.sqlConfig);
            return new Promise((resolve, reject) => {
                pool.request()
                    .input("id_solicitud_prestamo", mssql_1.default.Int, id_solicitud_prestamo)
                    .input("id_cliente", mssql_1.default.Int, id_cliente)
                    .input("etiqueta_opcion", mssql_1.default.VarChar(50), etiqueta_opcion) // ALTA/BAJA
                    .input("tipo_baja", mssql_1.default.VarChar(50), tipo_baja)
                    .input("id_motivo", mssql_1.default.Int, id_motivo)
                    .input("uid", mssql_1.default.Int, uid) // 0
                    .execute('MOV_AsignacionCreditoCliente')
                    .then((result) => {
                    resolve(result.recordset);
                }).catch((err) => {
                    reject(new Error(err));
                });
            });
        }
        catch (err) {
            console.log('Assign Client to Loan: ', err.message);
            throw new Error(err);
        }
    });
}
function assignMontoloanHF(data) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const pool = yield mssql_1.default.connect(connSQL_1.sqlConfig);
            TablesSql_1.UDT_Solicitud.rows.length = 0;
            TablesSql_1.Cliente.rows.length = 0;
            TablesSql_1.GrupoSolidario.rows.length = 0;
            TablesSql_1.Direccion.rows.length = 0;
            TablesSql_1.UDT_SolicitudDetalle.rows.length = 0;
            TablesSql_1.UDT_CLIE_DetalleSeguro.rows.length = 0;
            TablesSql_1.UDT_CLIE_ReferenciasPersonales.rows.length = 0;
            TablesSql_1.UDT_OTOR_GarantiaPrendaria.rows.length = 0;
            TablesSql_1.UDT_OTOR_TuHogarConConserva.rows.length = 0;
            TablesSql_1.UDT_CLIE_TuHogarConConservaCoacreditado.rows.length = 0;
            TablesSql_1.UDT_Solicitud.rows.add(data['SOLICITUD'][0].id, data['SOLICITUD'][0].id_cliente, data['SOLICITUD'][0].id_oficial, // OFICIAL CREDITO debe ser el id de la persona oficial
            0, // id del producto // TODO: Se crea cuando pasa a por autorizar
            data['SOLICITUD'][0].id_disposicion, // se obtiene del procedimiento asignarDisposicion
            data['SOLICITUD'][0].monto_solicitado, // Ej. 10000.00 (debe estar entre la politicas)
            data['SOLICITUD'][0].monto_autorizado, // Monto_autorizado TODO: MANDAR EN 0 DESDE MÓVIL
            data['SOLICITUD'][0].periodicidad, // Meses/Quincena (Se obtiene de configuracionMaestro)
            data['SOLICITUD'][0].plazo, // 1, 2, 3, 6, 12, 24, etc.
            data['SOLICITUD'][0].estatus ? data['SOLICITUD'][0].estatus : 'TRAMITE', // ESTATUS
            data['SOLICITUD'][0].sub_estatus ? data['SOLICITUD'][0].sub_estatus : 'NUEVO TRAMITE', // SUB_ESTATUS -> "POR AUTORIZAR"
            data['SOLICITUD'][0].fecha_primer_pago, // Ej. 2022-07-20
            data['SOLICITUD'][0].fecha_entrega, // Ej. 2022-07-20
            data['SOLICITUD'][0].medio_desembolso.trim(), // ORP -> Orden de pago / cheque
            parseInt(data['SOLICITUD'][0].garantia_liquida), // Ej. 10 Se obtiene de configuracionMaestro
            data['SOLICITUD'][0].creacion, // FECHA DE CREACION
            data['SOLICITUD'][0].id_oficina, // 1 por defecto
            data['SOLICITUD'][0].garantia_liquida_financiable, // 0/1 False/True
            data['SOLICITUD'][0].id_producto_maestro, // Ej. 4
            data['SOLICITUD'][0].tasa_anual, // Se calcula dependiendo del plazo
            0);
            // console.log(tbl.UDT_Solicitud);
            TablesSql_1.Cliente.rows.add(data['SOLICITUD'][0].id_cliente, data['SOLICITUD'][0].ciclo, // se obtiene del cliente
            '', // estatus (MANDAR VACIO)
            '', // SUB_ESTATUS (MANDAR VACIO)
            data['SOLICITUD'][0].id_oficial, data['SOLICITUD'][0].id_oficina, data['SOLICITUD'][0].tipo_cliente // 0 TODO: Ver si se requiere en el procedimiento
            );
            if (data['SOLICITUD'][0].tipo_cliente == 1) {
                TablesSql_1.GrupoSolidario.rows.add(data['GRUPO'].id, //data['SOLICITUD'][0].id_cliente,
                // data['GRUPO'].name,
                data['GRUPO'].name, // name_group
                data['GRUPO'].address[0].id > 0 ? data['GRUPO'].address[0].id : 0, // Falta
                data['GRUPO'].weekday_meet, data['GRUPO'].hour_meet);
                TablesSql_1.Direccion.rows.add(data['GRUPO'].address[0].id > 0 ? data['GRUPO'].address[0].id : 0, // falta guardar id
                data['GRUPO'].address[0].address_line1, // address_line2
                (0, createPerson_1.getId)(data['GRUPO'].address[0].country[0]), //Hace falta || 1
                (0, createPerson_1.getId)(data['GRUPO'].address[0].province[0]), (0, createPerson_1.getId)(data['GRUPO'].address[0].municipality[0]), (0, createPerson_1.getId)(data['GRUPO'].address[0].city[0]), (0, createPerson_1.getId)(data['GRUPO'].address[0].colony[0]), data['GRUPO'].address[0].street_reference, // FALTA
                data['GRUPO'].address[0].ext_number, // numero_exterior
                data['GRUPO'].address[0].int_number, // numero_interior
                data['GRUPO'].address[0].road // road_type
                );
            }
            // TODO Los Montos_solicitados, Medio_desembolso deben ser de los clientes, en la tabla de solicitud se pone el monto total(suma de todos los clientes)
            for (let idx = 0; idx < data['INTEGRANTES'].length; idx++) {
                TablesSql_1.UDT_SolicitudDetalle.rows.add(data['INTEGRANTES'][idx].id_individual, 0, //data['SOLICITUD'][0].id,
                data['INTEGRANTES'][idx].id_persona, '', // Nombre
                '', // Apellido paterno
                '', // Apellido Materno
                data['INTEGRANTES'][idx].estatus, //'TRAMITE', // ESTATUS
                data['INTEGRANTES'][idx].sub_estatus, //'LISTO PARA TRAMITE', // SUB_ESTATUS (LISTO PARA TRAMITE)
                data['INTEGRANTES'][idx].cargo, // CARGO || ''
                data['INTEGRANTES'][idx].monto_solicitado, data['INTEGRANTES'][idx].monto_sugerido, // TODO: Se establece cuando sea POR AUTORIZAR (WEB ADMIN)
                data['INTEGRANTES'][idx].monto_autorizado, data['INTEGRANTES'][idx].econ_id_actividad_economica, // econ_id_actividad_economica // TODO: ver si lo ocupa el procedimiento
                0, // CURP Fisica
                data['INTEGRANTES'][idx].motivo, // motivo
                data['INTEGRANTES'][idx].id_cata_medio_desembolso, //1->CHEQUE, 2->ORDEN DE PAGO, 3->TARJETA DE PAGO
                0.00 // monto_garantia_financiable
                );
            }
            for (let idx = 0; idx < data['SEGURO'].length; idx++) {
                TablesSql_1.UDT_CLIE_DetalleSeguro.rows.add(data['SEGURO'][idx].id, data['SOLICITUD'][0].id, data['SEGURO'][idx].id_individual, // TODO id_invidual de quien hace la solicitud del prestamo
                data['SEGURO'][idx].id_seguro, data['SEGURO'][0].id_seguro_asignacion, // a
                '', // nombre socia
                data['SEGURO'][idx].nombre_beneficiario, // Ej. OMAR MELENDEZ
                data['SEGURO'][idx].parentesco, // Ej. AMIGO,PRIMO, ETC.
                data['SEGURO'][idx].porcentaje, // Ej. 100.00
                data['SEGURO'][idx].costo_seguro, // 1560
                data['SEGURO'][idx].incluye_saldo_deudor, 0, 0);
            }
            // PARA EL TIPO DE PRESTAMO ESPECIAL ES NECESARIO 1 AVAL Y 2 REFERENCIAS
            // for (const idx in data['REFERENCIA']) {
            //     tbl.UDT_CLIE_ReferenciasPersonales.rows.add(
            //         data['REFERENCIA'][idx].id, // 0 -> Solicitud nueva, >0 -> solicitud Existente
            //         data['REFERENCIA'][idx].id_persona, // id_persona que esta en vwCONT_Personas
            //         data['CLIENTE'][0].id,
            //         0, // id_empleado
            //         data['REFERENCIA'][idx].parentesco, // Ej. AMIGO, PRIMO, ETC.
            //         data['REFERENCIA'][idx].tipo_relacion, // AVAL/REFERENCIA/COACREDITADO
            //         'PERSONA', // TIPO (SIEMPRE VA COMO PERSONA)
            //         data['SEGURO'][0].eliminado // Eliminado
            //     );
            // }
            //TABLA GARANTIA PRENDARIA (SE MANDA VACIA PARA CREDITO ESPECIAL)
            //TABLA TU HOGAR CON CONSERVA (SE MANDA VACIA PARA CREDITO ESPECIAL)
            //TABLA COACREDITADO (SE MANDA VACIA PARA CREDITO ESPECIAL)
            // return {
            //     solicitud: tbl.UDT_Solicitud.rows,
            //     cliente : tbl.Cliente.rows,
            //     soliDetale: tbl.UDT_SolicitudDetalle.rows,
            //     detalleSeguro: tbl.UDT_CLIE_DetalleSeguro.rows
            // };
            const result = yield pool.request()
                .input('tablaSolicitud', TablesSql_1.UDT_Solicitud)
                .input('tablaCliente', TablesSql_1.Cliente)
                .input('tablaGrupo', TablesSql_1.GrupoSolidario)
                .input('tablaDireccion', TablesSql_1.Direccion)
                .input('tablaPrestamoMonto', TablesSql_1.UDT_SolicitudDetalle)
                .input('seguro', TablesSql_1.UDT_CLIE_DetalleSeguro)
                .input('referencias_personales', TablesSql_1.UDT_CLIE_ReferenciasPersonales) // Se toma de la tabla CONT_Personas, si no se encuentra se tendra que dar de alta
                .input('garantias_prendarias', TablesSql_1.UDT_OTOR_GarantiaPrendaria)
                .input('tabla_TuHogarConConserva', TablesSql_1.UDT_OTOR_TuHogarConConserva)
                .input('tabla_TuHogarConConservaCoacreditado', TablesSql_1.UDT_CLIE_TuHogarConConservaCoacreditado)
                .input('idUsuario', mssql_1.default.Int, 0) // PERSONA QUIEN CREA LA SOLICITUD (EMPLEADO)
                .execute('MOV_registrarActualizarSolicitudCliente');
            // .execute('MOV_TEST');
            // console.log('result ', result);
            const cleanAllTables = () => {
                (0, TablesSql_1.cleanTable)(TablesSql_1.UDT_Solicitud);
                (0, TablesSql_1.cleanTable)(TablesSql_1.Cliente);
                (0, TablesSql_1.cleanTable)(TablesSql_1.GrupoSolidario);
                (0, TablesSql_1.cleanTable)(TablesSql_1.Direccion);
                (0, TablesSql_1.cleanTable)(TablesSql_1.UDT_SolicitudDetalle);
                (0, TablesSql_1.cleanTable)(TablesSql_1.UDT_CLIE_DetalleSeguro);
                (0, TablesSql_1.cleanTable)(TablesSql_1.UDT_CLIE_ReferenciasPersonales);
                (0, TablesSql_1.cleanTable)(TablesSql_1.UDT_OTOR_GarantiaPrendaria);
                (0, TablesSql_1.cleanTable)(TablesSql_1.UDT_OTOR_TuHogarConConserva);
                (0, TablesSql_1.cleanTable)(TablesSql_1.UDT_CLIE_TuHogarConConservaCoacreditado);
            };
            cleanAllTables();
            return result.recordsets;
        }
        catch (err) {
            console.log(err);
            console.log(err.message);
            throw new Error(err);
        }
    });
}
function validateSolicitud(id) {
    return __awaiter(this, void 0, void 0, function* () {
        const pool = yield mssql_1.default.connect(connSQL_1.sqlConfig);
        let result = yield pool.request()
            .input("id", mssql_1.default.Int(), id)
            .query("SELECT LTRIM(RTRIM(estatus)) AS estatus,LTRIM(RTRIM(sub_estatus)) AS sub_estatus FROM OTOR_SolicitudPrestamos WHERE id = @id");
        if (result.recordset.length > 0) {
            if ((result.recordset[0].estatus == 'PREIMPRESO' && result.recordset[0].sub_estatus == 'SOLICITUD') ||
                (result.recordset[0].estatus == 'TRAMITE' && result.recordset[0].sub_estatus == 'NUEVO TRAMITE'))
                return true;
        }
        return false;
    });
}
exports.validateSolicitud = validateSolicitud;
