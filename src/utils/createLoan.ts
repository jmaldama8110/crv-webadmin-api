import sql from 'mssql';
import { sqlConfig } from '../db/connSQL';
import { LoanAppGroup } from '../model/LoanAppGroup';
import { Client } from '../model/Client';
import { LoanApp } from '../model/LoanApp';
import { Group } from '../model/Group';
import { Functions } from './Functions';
import { getDates, getId } from './createPerson';
import { UDT_Solicitud, Cliente, GrupoSolidario, Direccion, UDT_SolicitudDetalle, UDT_CLIE_DetalleSeguro, UDT_CLIE_ReferenciasPersonales, UDT_OTOR_GarantiaPrendaria, UDT_OTOR_TuHogarConConserva, UDT_CLIE_TuHogarConConservaCoacreditado, cleanTable } from './TablesSql';

let loanAppGroup = new LoanAppGroup();
let ClientDoc = new Client();
let loanApp = new LoanApp();
let groupDoc = new Group();
const Funct = new Functions();

const frecuencysCouchtoHF = {
    'S': 'SEMANAL',
    'Q': 'QUINCENAL',
    'M': 'MENSUAL',
    'C': 'CATORCENAL'
}

const frecuencyHFToCouch = {
    "Semanal": ["S", "Semana(s)"]
}


export async function createLoanHF(data:any) {
    try {
        const { id_loan } = data;

        let typeClient;
        let loan:any;
        loan = await loanAppGroup.findOne({ _id: id_loan });
        typeClient = 1;
        if (loan == undefined) {
            loan = await loanApp.findOne({ _id: id_loan });
            typeClient = 2;
        }
        if (loan === undefined) return new Error('Loan not found');

        const isNewLoan = loan.id_solicitud == 0;
        const idBranch = loan.branch[0];


        const client:any = typeClient == 1 ? 
                            await groupDoc.findOne({ _id: loan.apply_by }) : 
                            await ClientDoc.findOne({ _id: loan.apply_by });
        if (!client) return new Error('Failed to find');

        // CREAR LA SOLICITUD, SI ES SOLICITUD NUEVA
        if (isNewLoan) {
            console.log('NUEVA SOLICITUD');
            const dataCreate = { idUsuario: 0, idOficina: idBranch, num: 1, typeClient: typeClient, idLoan: id_loan }

            const LoanHFCreated = await createLoanFromHF(dataCreate);
            if (!LoanHFCreated) return new Error('Failed to create loan in HF');

            loan.id_solicitud = LoanHFCreated[0].idSolicitud;
            if (typeClient == 1 && loan.id_cliente == 0) {
                loan.id_cliente = LoanHFCreated[0].idCliente;
                // loan.group.id = 0;
            }

        } else if (loan.renovation) { // TODOelse if revobacion
            console.log('RENOVACIÓN');

            let idOfficer = loan.loan_officer ? loan.loan_officer : 0;
            const idLoanRenovation = await loanRenovation(loan.id_cliente, loan.id_solicitud, idOfficer, idBranch, id_loan);
            if (!idLoanRenovation) return new Error('Renovation loan');
            console.log('idRenovation:', idLoanRenovation)
            loan.id_solicitud = idLoanRenovation;
            loan.renovation = false;
        } else {
            console.log('ACTUALIZACIÓN');
            loan.id_cliente = client.id_cliente;
        }

        const disposition = await getDisposicionByOffice(idBranch);
        if (!disposition) return new Error('Failed to get disposition');

        const seguro = await getSeguroProducto(loan.product.external_id);// parseInt(loan.product.external_id)
        if (!seguro) return new Error('Failed to get insurance');

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
                    fecha_primer_pago: loan.first_repay_date != '' ? getDates(loan.first_repay_date) : '1999-01-01T00:00:00.000Z', //2023-02-02T00:00:00.000Z
                    fecha_entrega: loan.disbursment_date != '' ? getDates(loan.disbursment_date) : '1999-01-01T00:00:00.000Z',
                    medio_desembolso: loan.disbursment_mean || "ORP",
                    garantia_liquida: loan.product.liquid_guarantee || loan.liquid_guarantee,
                    id_oficina: idBranch != undefined ? idBranch : 1,
                    garantia_liquida_financiable: loan.product.GL_financeable === false ? 0 : 1,
                    id_producto: isNewLoan ? 0 : loan.id_producto, // Se crea cuando pasa a por autorizar
                    id_producto_maestro: loan.product.external_id,
                    tasa_anual: loan.product.rate ? loan.product.rate : 0,
                    creacion: new Date(Date.now()).toISOString(), // getDates(loan.apply_at) NO SE USA, new Data().toString()
                    ciclo: loan.loan_cycle,//TODO typeClient == 1 ? loan.group.cicle : loan.members[0].cicle,
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

            INTEGRANTES: loan.members.map((member:any) => {
                return {
                    id_individual: member.id_cliente,
                    id_persona: member.id_member, //Persona
                    estatus: member.estatus,
                    sub_estatus: member.sub_estatus,
                    cargo: member.position ? member.position : '',
                    monto_solicitado: member.apply_amount,
                    monto_sugerido: member.suggested_amount || 0,
                    monto_autorizado: member.approved_amount || 0,
                    econ_id_actividad_economica: 0, // TODO Se toma de los datos del cliente
                    curp_fisica: 0,
                    motivo: Funct.validateInt(Array.isArray(member.dropout_reason) ? member.dropout_reason[0] : 0),
                    id_cata_medio_desembolso: member.disbursment_mean ? member.disbursment_mean : 2, // 1-> Cheque, 2->Orden de pago
                    monto_garantia_financiable: member.monto_garantia_financiable ? member.monto_garantia_financiable : 0,
                }
            }),
            SEGURO: loan.members.map((member:any) => {
                return {
                    id: isNewLoan ? member.insurance.id : 0,
                    id_individual: member.id_cliente, // integrante del grupo
                    id_seguro_asignacion: seguro[0].id_seguro_asignacion,
                    id_seguro: seguro[0].id_seguro || 0,
                    nombre_beneficiario: member.insurance.beneficiary,
                    parentesco: member.insurance.relationship,
                    porcentaje: member.insurance.percentage || 100,
                    costo_seguro: 0, // TODO FALTA CALCULAR
                    incluye_saldo_deudor: seguro[0].incluye_saldo_deudor
                }
            }),
            REFERENCIA: []
        }

        if (isNewLoan) {
            for (let idx = 0; idx < dataMount['INTEGRANTES'].length; idx++) {
                // Asignamos Cliente a Solicitud
                const id_cliente = dataMount['INTEGRANTES'][idx].id_individual;

                const dataAssign = {
                    id_solicitud_prestamo: loan.id_solicitud,
                    id_cliente: id_cliente,
                    etiqueta_opcion: "ALTA", // BAJA
                    tipo_baja: "", // CASTIGADO/CANCELACION/RECHAZADO
                    id_motivo: 0, //CATA_
                    uid: 0
                }

                const asignClientLoan = await assignClientLoanFromHF(dataAssign);
                console.log(asignClientLoan);
            }
        };

        const MountAssigned:any = await assignMontoloanHF(dataMount);
        if (!MountAssigned) return new Error('Failed to assign mount');

        const detailLoan:any = await loanApp.getDetailLoan(loan.id_solicitud, idBranch);
        if (!detailLoan) return new Error('Failed to in Loan');

        // Actualizar ids en Couch con los creados en HF
        if (typeClient == 1) {
            loan.id_producto = detailLoan[0][0].id_producto;
            if (isNewLoan) {
                client.id_cliente = detailLoan[1][0].id;
                client.address.id = detailLoan[2].length > 0 ? detailLoan[2][0].id_direccion : 0 ;
                await new Group(client).save();
            }
        }

        try{
            for (let idx = 0; idx < detailLoan[4].length; idx++) {
                loan.members[idx].insurance.id = detailLoan[5][idx].id
            }
        }
        catch(error){}

        typeClient === 1 ? await new LoanAppGroup(loan).save() : await new LoanApp(loan).save();

        console.log(MountAssigned[0][0]);
        return MountAssigned[0][0];

    } catch (error:any) {
        console.log(error);
        return new Error(error.stack);
    }
}

async function createLoanFromHF(data:any) {
    try {
        console.log(data);
        const { idUsuario, idOficina, num, typeClient, idLoan } = data;
        // typeClient 2-> individual
        // typeClient 1 -> grupo
        const pool = await sql.connect(sqlConfig);
        const result = await pool.request()
            .input('idUsuario', sql.Int, idUsuario) // Creado por
            .input('idOficina', sql.Int, idOficina)
            .input('idOficialCredito', sql.Int, 0)
            .input('idTipoCliente', sql.Int, typeClient) //1 -> Grupo, 2 -> Individual
            .input('idServicioFinanciero', sql.Int, num) // Es el unico que existe
            .input('cantidad', sql.Int, 1) // Numero de solicitudes a hacer
            .input('intIdLoan', sql.BigInt, idLoan) // id_loan Couch
            .execute('MOV_InsertarSolicitudServicioFinanciero');

        return result.recordset;
    } catch (err:any) {
        throw new Error(err)
    }
}


async function getDisposicionByOffice(idOffice:number) {
    try {
        const pool = await sql.connect(sqlConfig);

        const result:any = await pool.request()
            .input('idTipoCliente', sql.Int, 0)
            .input('idServicioFinanciero', sql.Int, 1)
            .input('idOficina', sql.Int, idOffice)
            .input('idLocalidad', sql.Int, 0)
            .input('todasCurp', sql.Int, 1)
            .input('ciclo', sql.Int, 0)
            .input('montoSolicitado', sql.Int, 0)
            .input('montoMaximoSolicitado', sql.Int, 0)
            .execute('FUND_ASIGNAR_DISPOSICION')

        return result.recordsets[0];
    }
    catch (error:any) {
        throw new Error(error)
    }
}

async function getSeguroProducto(idProductoMaestro:number) {
    try {
        const pool = await sql.connect(sqlConfig);

        const result = await pool.request()
            .input('id_producto', sql.Int, idProductoMaestro)
            .input('etiqueta_opcion', sql.VarChar, 'OBTENER_SEGURO_PRODUCTO')
            .execute('CLIE_ObtenerListaSegurosProducto')

        return result.recordset;
    }
    catch (error:any) {
        throw new Error(error)
    }
}

async function loanRenovation(idClient: number, idLoan: number, idOfficer:number, idOffice: number, idLoanCouch: string) {
    try {
        const pool = await sql.connect(sqlConfig);
        const result = await pool.request()
            .input('idCliente', sql.Int, idClient)
            .input('idSolicitud', sql.Int, idLoan)
            .input('idUsuario', sql.Int, 0)
            .input('idOficial', sql.Int, idOfficer)
            .input('idOficinaActual', sql.Int, idOffice)
            .input('intIdLoan', sql.BigInt, idLoanCouch) // id_loan Couch
            .execute('MOV_InsertSolicitudGrupoSolidarioCredito');

        return result.recordset[0].id_solicitud;
    } catch (error:any) {
        console.log(error.message);
    }
}

async function assignClientLoanFromHF(data:any) {
    try {
        const {
            id_solicitud_prestamo,
            id_cliente,
            etiqueta_opcion,
            tipo_baja,
            id_motivo,
            uid
        } = data;

        const pool = await sql.connect(sqlConfig);

        return new Promise((resolve, reject) => {
            pool.request()
                .input("id_solicitud_prestamo", sql.Int, id_solicitud_prestamo)
                .input("id_cliente", sql.Int, id_cliente)
                .input("etiqueta_opcion", sql.VarChar(50), etiqueta_opcion) // ALTA/BAJA
                .input("tipo_baja", sql.VarChar(50), tipo_baja)
                .input("id_motivo", sql.Int, id_motivo)
                .input("uid", sql.Int, uid) // 0
                .execute('MOV_AsignacionCreditoCliente')
                .then((result) => {
                    resolve(result.recordset);
                }).catch((err) => {
                    reject(new Error(err));
                });
        });
    } catch (err:any) {
        console.log('Assign Client to Loan: ', err.message);
        throw new Error(err)
    }
}

async function assignMontoloanHF(data:any) {
    try {
        const pool = await sql.connect(sqlConfig);
        UDT_Solicitud.rows.length = 0;
        Cliente.rows.length = 0;
        GrupoSolidario.rows.length = 0;
        Direccion.rows.length = 0;
        UDT_SolicitudDetalle.rows.length = 0;
        UDT_CLIE_DetalleSeguro.rows.length = 0;
        UDT_CLIE_ReferenciasPersonales.rows.length = 0;
        UDT_OTOR_GarantiaPrendaria.rows.length = 0;
        UDT_OTOR_TuHogarConConserva.rows.length = 0;
        UDT_CLIE_TuHogarConConservaCoacreditado.rows.length = 0;
        UDT_Solicitud.rows.add(
            data['SOLICITUD'][0].id,
            data['SOLICITUD'][0].id_cliente,
            data['SOLICITUD'][0].id_oficial, // OFICIAL CREDITO debe ser el id de la persona oficial
            0, // id del producto // TODO: Se crea cuando pasa a por autorizar
            data['SOLICITUD'][0].id_disposicion, // se obtiene del procedimiento asignarDisposicion
            data['SOLICITUD'][0].monto_solicitado, // Ej. 10000.00 (debe estar entre la politicas)
            data['SOLICITUD'][0].monto_autorizado, // Monto_autorizado TODO: MANDAR EN 0 DESDE MÓVIL
            data['SOLICITUD'][0].periodicidad, // Meses/Quincena (Se obtiene de configuracionMaestro)
            data['SOLICITUD'][0].plazo, // 1, 2, 3, 6, 12, 24, etc.
            data['SOLICITUD'][0].estatus ? data['SOLICITUD'][0].estatus : 'TRAMITE',// ESTATUS
            data['SOLICITUD'][0].sub_estatus ? data['SOLICITUD'][0].sub_estatus : 'NUEVO TRAMITE',// SUB_ESTATUS -> "POR AUTORIZAR"
            data['SOLICITUD'][0].fecha_primer_pago, // Ej. 2022-07-20
            data['SOLICITUD'][0].fecha_entrega, // Ej. 2022-07-20
            data['SOLICITUD'][0].medio_desembolso.trim(), // ORP -> Orden de pago / cheque
            parseInt(data['SOLICITUD'][0].garantia_liquida), // Ej. 10 Se obtiene de configuracionMaestro
            data['SOLICITUD'][0].creacion, // FECHA DE CREACION
            data['SOLICITUD'][0].id_oficina, // 1 por defecto
            data['SOLICITUD'][0].garantia_liquida_financiable, // 0/1 False/True
            data['SOLICITUD'][0].id_producto_maestro, // Ej. 4
            data['SOLICITUD'][0].tasa_anual, // Se calcula dependiendo del plazo
            0
        );

        // console.log(tbl.UDT_Solicitud);

        Cliente.rows.add(
            data['SOLICITUD'][0].id_cliente,
            data['SOLICITUD'][0].ciclo, // se obtiene del cliente
            '', // estatus (MANDAR VACIO)
            '', // SUB_ESTATUS (MANDAR VACIO)
            data['SOLICITUD'][0].id_oficial,
            data['SOLICITUD'][0].id_oficina,
            data['SOLICITUD'][0].tipo_cliente // 0 TODO: Ver si se requiere en el procedimiento
        );

        if (data['SOLICITUD'][0].tipo_cliente == 1) {
            GrupoSolidario.rows.add(
                data['GRUPO'].id,//data['SOLICITUD'][0].id_cliente,
                // data['GRUPO'].name,
                data['GRUPO'].name, // name_group
                data['GRUPO'].address[0].id > 0 ? data['GRUPO'].address[0].id : 0, // Falta
                data['GRUPO'].weekday_meet,
                data['GRUPO'].hour_meet
            );

            Direccion.rows.add(
                data['GRUPO'].address[0].id > 0 ? data['GRUPO'].address[0].id : 0, // falta guardar id
                data['GRUPO'].address[0].address_line1, // address_line2
                getId(data['GRUPO'].address[0].country[0]), //Hace falta || 1
                getId(data['GRUPO'].address[0].province[0]),
                getId(data['GRUPO'].address[0].municipality[0]),
                getId(data['GRUPO'].address[0].city[0]),
                getId(data['GRUPO'].address[0].colony[0]),
                data['GRUPO'].address[0].street_reference, // FALTA
                data['GRUPO'].address[0].ext_number, // numero_exterior
                data['GRUPO'].address[0].int_number, // numero_interior
                data['GRUPO'].address[0].road // road_type
            );
        }

        // TODO Los Montos_solicitados, Medio_desembolso deben ser de los clientes, en la tabla de solicitud se pone el monto total(suma de todos los clientes)
        for (let idx = 0; idx < data['INTEGRANTES'].length; idx++) {
            UDT_SolicitudDetalle.rows.add(
                data['INTEGRANTES'][idx].id_individual,
                0,//data['SOLICITUD'][0].id,
                data['INTEGRANTES'][idx].id_persona,
                '', // Nombre
                '', // Apellido paterno
                '', // Apellido Materno
                data['INTEGRANTES'][idx].estatus,//'TRAMITE', // ESTATUS
                data['INTEGRANTES'][idx].sub_estatus,//'LISTO PARA TRAMITE', // SUB_ESTATUS (LISTO PARA TRAMITE)
                data['INTEGRANTES'][idx].cargo, // CARGO || ''
                data['INTEGRANTES'][idx].monto_solicitado,
                data['INTEGRANTES'][idx].monto_sugerido, // TODO: Se establece cuando sea POR AUTORIZAR (WEB ADMIN)
                data['INTEGRANTES'][idx].monto_autorizado,
                data['INTEGRANTES'][idx].econ_id_actividad_economica, // econ_id_actividad_economica // TODO: ver si lo ocupa el procedimiento
                0, // CURP Fisica
                data['INTEGRANTES'][idx].motivo, // motivo
                data['INTEGRANTES'][idx].id_cata_medio_desembolso, //1->CHEQUE, 2->ORDEN DE PAGO, 3->TARJETA DE PAGO
                0.00 // monto_garantia_financiable
            );
        }

        for (let idx = 0; idx < data['SEGURO'].length; idx++) {
            UDT_CLIE_DetalleSeguro.rows.add(
                data['SEGURO'][idx].id,
                data['SOLICITUD'][0].id,
                data['SEGURO'][idx].id_individual, // TODO id_invidual de quien hace la solicitud del prestamo
                data['SEGURO'][idx].id_seguro,
                data['SEGURO'][0].id_seguro_asignacion, // a
                '', // nombre socia
                data['SEGURO'][idx].nombre_beneficiario, // Ej. OMAR MELENDEZ
                data['SEGURO'][idx].parentesco, // Ej. AMIGO,PRIMO, ETC.
                data['SEGURO'][idx].porcentaje, // Ej. 100.00
                data['SEGURO'][idx].costo_seguro, // 1560
                data['SEGURO'][idx].incluye_saldo_deudor,
                0,
                0
            );
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

        const result = await pool.request()
            .input('tablaSolicitud', UDT_Solicitud)
            .input('tablaCliente', Cliente)
            .input('tablaGrupo', GrupoSolidario)
            .input('tablaDireccion', Direccion)
            .input('tablaPrestamoMonto', UDT_SolicitudDetalle)
            .input('seguro', UDT_CLIE_DetalleSeguro)
            .input('referencias_personales', UDT_CLIE_ReferenciasPersonales) // Se toma de la tabla CONT_Personas, si no se encuentra se tendra que dar de alta
            .input('garantias_prendarias', UDT_OTOR_GarantiaPrendaria)
            .input('tabla_TuHogarConConserva', UDT_OTOR_TuHogarConConserva)
            .input('tabla_TuHogarConConservaCoacreditado', UDT_CLIE_TuHogarConConservaCoacreditado)
            .input('idUsuario', sql.Int, 0) // PERSONA QUIEN CREA LA SOLICITUD (EMPLEADO)
            .execute('MOV_registrarActualizarSolicitudCliente');
        // .execute('MOV_TEST');

        // console.log('result ', result);
        const cleanAllTables = () => {
            cleanTable(UDT_Solicitud);
            cleanTable(Cliente);
            cleanTable(GrupoSolidario);
            cleanTable(Direccion);
            cleanTable(UDT_SolicitudDetalle);
            cleanTable(UDT_CLIE_DetalleSeguro);
            cleanTable(UDT_CLIE_ReferenciasPersonales);
            cleanTable(UDT_OTOR_GarantiaPrendaria);
            cleanTable(UDT_OTOR_TuHogarConConserva);
            cleanTable(UDT_CLIE_TuHogarConConservaCoacreditado);
        }
        cleanAllTables();

        return result.recordsets;
    } catch (err:any) {
        console.log(err)
        console.log(err.message)
        throw new Error(err);
    }
}
