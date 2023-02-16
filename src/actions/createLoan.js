const { sqlConfig } = require("../db/connSQL");
const tbl = require('../utils/TablesSQL');
const sql = require("mssql");
const { getDates, getId } = require('./createPerson');
const ClientCollection = require('./../model/clientCollection');
const GroupCollection = require('../model/groupCollection');
const LoanAppCollection = require('./../model/loanAppCollection');
const LoanAppGroupCollection = require('./../model/loanAppGroup');
const UserCollection = require('./../model/userCollection');
const ProductCollection = require('./../model/productCollection');
const BranchCollection = require('./../model/branchCollection');
const Client = new ClientCollection();
const Group = new GroupCollection();
const LoanApp = new LoanAppCollection();
const LoanAppGroup = new LoanAppGroupCollection();
const User = new UserCollection();
const Product = new ProductCollection();
const Branch = new BranchCollection()

async function createLoanFromHF(data) {
    try {
        console.log(data);
        const { idUsuario, idOficina, num, typeClient } = data;
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
            .execute('MOV_InsertarSolicitudServicioFinanciero');

        return result.recordset;
    } catch (err) {
        throw new Error(err)
    }
}

async function assignClientLoanFromHF(data) {
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
    } catch (err) {
        console.log('Assign Client to Loan: ', err.message);
        throw new Error(err)
    }
}

async function assignMontoloanHF(data) {
    try {
        const pool = await sql.connect(sqlConfig);

        tbl.UDT_Solicitud.rows.add(
            data['SOLICITUD'][0].id,
            data['SOLICITUD'][0].id_cliente,
            data['SOLICITUD'][0].id_oficial, // OFICIAL CREDITO debe ser el id de la persona oficial
            0, // id del producto // TODO: Se crea cuando pasa a por autorizar
            data['SOLICITUD'][0].id_disposicion, // se obtiene del procedimiento asignarDisposicion
            data['SOLICITUD'][0].monto_solicitado, // Ej. 10000.00 (debe estar entre la politicas)
            data['SOLICITUD'][0].monto_autorizado, // Monto_autorizado TODO: MANDAR EN 0 DESDE MÓVIL
            data['SOLICITUD'][0].periodicidad, // Meses/Quincena (Se obtiene de configuracionMaestro)
            data['SOLICITUD'][0].plazo, // 1, 2, 3, 6, 12, 24, etc.
            'TRAMITE',// ESTATUS
            'NUEVO TRAMITE',  // SUB_ESTATUS -> "POR AUTORIZAR"
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

        tbl.Cliente.rows.add(
            data['SOLICITUD'][0].id_cliente,
            data['SOLICITUD'][0].ciclo, // se obtiene del cliente
            '', // estatus (MANDAR VACIO)
            '', // SUB_ESTATUS (MANDAR VACIO)
            data['SOLICITUD'][0].id_oficial,
            data['SOLICITUD'][0].id_oficina,
            data['SOLICITUD'][0].tipo_cliente // 0 TODO: Ver si se requiere en el procedimiento
        );

        if (data['SOLICITUD'][0].tipo_cliente == 1) {
            tbl.GrupoSolidario.rows.add(
                data['GRUPO'].id,//data['SOLICITUD'][0].id_cliente,
                // data['GRUPO'].name,
                data['GRUPO'].name,
                data['GRUPO'].address[0].id > 0 ? data['GRUPO'].address[0].id : 0,
                data['GRUPO'].weekday_meet,
                data['GRUPO'].hour_meet
            );

            tbl.Direccion.rows.add(
                data['GRUPO'].address[0].id > 0 ? data['GRUPO'].address[0].id : 0,
                data['GRUPO'].address[0].address_line1,
                getId(data['GRUPO'].address[0].country[0]),
                getId(data['GRUPO'].address[0].province[0]),
                getId(data['GRUPO'].address[0].municipality[0]),
                getId(data['GRUPO'].address[0].city[0]),
                getId(data['GRUPO'].address[0].colony[0]),
                data['GRUPO'].address[0].street_reference,
                data['GRUPO'].address[0].ext_number,
                data['GRUPO'].address[0].int_number,
                data['GRUPO'].address[0].road
            );
        }

        // TODO Los Montos_solicitados, Medio_desembolso deben ser de los clientes, en la tabla de solicitud se pone el monto total(suma de todos los clientes)
        for (let idx = 0; idx < data['INTEGRANTES'].length; idx++) {
            tbl.UDT_SolicitudDetalle.rows.add(
                data['INTEGRANTES'][idx].id_individual,
                data['SOLICITUD'][0].id,
                data['INTEGRANTES'][idx].id_persona,
                '', // Nombre
                '', // Apellido paterno
                '', // Apellido Materno
                'TRAMITE', // ESTATUS
                'LISTO PARA TRAMITE', // SUB_ESTATUS (LISTO PARA TRAMITE)
                data['INTEGRANTES'][idx].cargo, // CARGO || ''
                data['INTEGRANTES'][idx].monto_solicitado,
                data['INTEGRANTES'][idx].monto_sugerido, // TODO: Se establece cuando sea POR AUTORIZAR (WEB ADMIN)
                data['INTEGRANTES'][idx].monto_autorizado,
                data['INTEGRANTES'][idx].econ_id_actividad_economica, // econ_id_actividad_economica // TODO: ver si lo ocupa el procedimiento
                0, // CURP Fisica
                0, // motivo
                data['INTEGRANTES'][idx].id_cata_medio_desembolso, //1->CHEQUE, 2->ORDEN DE PAGO, 3->TARJETA DE PAGO
                0.00 // monto_garantia_financiable
            );
        }

        for (let idx = 0; idx < data['SEGURO'].length; idx++) {
            tbl.UDT_CLIE_DetalleSeguro.rows.add(
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

        // console.log('tbl1: ',tbl.UDT_Solicitud.rows)
        // console.log('tbl1: ', tbl.Cliente.rows)
        // console.log('tbl2: ', tbl.UDT_SolicitudDetalle.rows)
        // console.log('tbl3: ', tbl.UDT_CLIE_DetalleSeguro.rows)
        // console.log('tbl4: ', tbl.GrupoSolidario.rows)
        // console.log('tbl4: ', tbl.GrupoSolidario.rows)

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
            .input('tablaSolicitud', tbl.UDT_Solicitud)
            .input('tablaCliente', tbl.Cliente)
            .input('tablaGrupo', tbl.GrupoSolidario)
            .input('tablaDireccion', tbl.Direccion)
            .input('tablaPrestamoMonto', tbl.UDT_SolicitudDetalle)
            .input('seguro', tbl.UDT_CLIE_DetalleSeguro)
            .input('referencias_personales', tbl.UDT_CLIE_ReferenciasPersonales) // Se toma de la tabla CONT_Personas, si no se encuentra se tendra que dar de alta
            .input('garantias_prendarias', tbl.UDT_OTOR_GarantiaPrendaria)
            .input('tabla_TuHogarConConserva', tbl.UDT_OTOR_TuHogarConConserva)
            .input('tabla_TuHogarConConservaCoacreditado', tbl.UDT_CLIE_TuHogarConConservaCoacreditado)
            .input('idUsuario', sql.Int, 0) // PERSONA QUIEN CREA LA SOLICITUD (EMPLEADO)
            .execute('MOV_registrarActualizarSolicitudCliente');
        // .execute('MOV_TEST');

        // console.log('result ', result);
        const cleanAllTables = () => {
            tbl.cleanTable(tbl.UDT_Solicitud);
            tbl.cleanTable(tbl.Cliente);
            tbl.cleanTable(tbl.GrupoSolidario);
            tbl.cleanTable(tbl.Direccion);
            tbl.cleanTable(tbl.UDT_SolicitudDetalle);
            tbl.cleanTable(tbl.UDT_CLIE_DetalleSeguro);
            tbl.cleanTable(tbl.UDT_CLIE_ReferenciasPersonales);
            tbl.cleanTable(tbl.UDT_OTOR_GarantiaPrendaria);
            tbl.cleanTable(tbl.UDT_OTOR_TuHogarConConserva);
            tbl.cleanTable(tbl.UDT_CLIE_TuHogarConConservaCoacreditado);
        }
        cleanAllTables();

        return result.recordsets;
    } catch (err) {
        console.log(err)
        console.log(err.message)
        throw new Error(err);
    }
}

async function getDisposicionByOffice(idOffice) {
    try {
        const pool = await sql.connect(sqlConfig);

        const result = await pool.request()
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
    catch (error) {
        throw new Error(error)
    }
}

async function getSeguroProducto(idProductoMaestro) {
    try {
        const pool = await sql.connect(sqlConfig);

        const result = await pool.request()
            .input('id_producto', sql.Int, idProductoMaestro)
            .input('etiqueta_opcion', sql.VarChar, 'OBTENER_SEGURO_PRODUCTO')
            .execute('CLIE_ObtenerListaSegurosProducto')

        return result.recordset;
    }
    catch (error) {
        throw new Error(error)
    }
}

const validateFrecuency = (value) => {
    if (value === "S") {
        return "SEMANAL"
    }
    if (value === "Q") {
        return "QUINCENAL"
    }
    if (value === "M") {
        return "MENSUAL"
    }
    return " ";
}

const frecuencysCouchtoHF = {
    'S': 'SEMANAL',
    'Q': 'QUINCENAL',
    'M': 'MENSUAL'
}

const frecuencyHFToCouch = {
    "Semanal": ["S", "Semana(s)"]
}

/**
 *
 * @param {String} type COUNTRY || PROVINCE ||  MUNICIPALITY || CITY || NEIGHBORHOOD
 * @param {Number} id Id HF
 * @returns {Array} ['{type}|{id}', 'name']
 */
async function findDirections(type, id) {

    const idfind = `${type}|${id}`;
    const doc = new LoanAppCollection();
    doc._couchdb_type = type;

    const docFound = await doc.findOne({ _id: idfind });


    return [idfind, docFound ? docFound.etiqueta : ''];
}

/**
* @param {Array} loan Datos del Loan de HF
* @returns {object}
*/
async function sortLoanHFtoCouch(loan) {
    let loanCouch = {
        id_solicitud: 0,
        id_cliente: "",
        loan_officer: "",
        branch: [1, "ORIENTE"],
        id_prodcuto: "",
        id_disposicion: "",
        apply_amount: "",
        approved_total: "",
        term: "",
        frequency: ["S", "Semana(s)"],
        first_repay_at: "",
        disburset_at: "",
        disbursment_mean: "",
        liquid_guarantee: 0,
        loan_cycle: "",
        created_by: "",
        status: [1, "Pendiente"],
        group: [],
        members: [],
        insurance_members: []
    };

    const nameBranch = await Branch.findOne({ id: loan[0][0].id_oficina });

    loanCouch.id_solicitud = loan[0][0].id;
    loanCouch.id_cliente = loan[0][0].id_cliente;
    loanCouch.loan_officer = loan[0][0].id_oficial;
    loanCouch.branch = [loan[0][0].id_oficina, nameBranch ? nameBranch.nombre : '']; // Buscar el nombre de la oficina en los catalogos de couch
    loanCouch.id_producto = loan[0][0].id_producto;
    loanCouch.id_disposicion = loan[0][0].id_disposicion;
    loanCouch.apply_amount = loan[0][0].monto_total_solicitado;
    loanCouch.approved_total = loan[0][0].monto_total_autorizado || 0;
    loanCouch.term = loan[0][0].plazo;
    loanCouch.frequency = frecuencyHFToCouch[loan[0][0].periodicidad];
    loanCouch.first_repay_at = loan[0][0].fecha_primer_pago;
    loanCouch.disburset_at = loan[0][0].fecha_entrega;
    loanCouch.disbursment_mean = loan[0][0].medio_desembolso;
    loanCouch.liquid_guarantee = loan[0][0].garantia_liquida;
    // loanCouch.loan_cycle = ""; // PREGUNTAR
    // loanCouch.product = ""; //TODO BUSCAR el external id en el PRODUCT Couch
    loanCouch.created_by = "promotor@grupoconserva.mx"; // PREGUNTAR
    loanCouch.status = [1, "Pendiente"];
    loanCouch.group =
        loan[2].length >= 1
            ? {
                id: loan[1][0].id,
                cicle: loan[1][0].ciclo,
                status: loan[1][0].estatus,
                sub_status: loan[1][0].sub_estatus,
                name: loan[2][0].nombre,
                weekday_meet: loan[2][0].reunion_dia,
                hour_meet: loan[2][0].reunion_hora,
                address: [
                    {
                        id: loan[2][0].id_direccion,
                        country: ['COUNTRY|1', 'México'],
                        province: await findDirections('PROVINCE', loan[3][0].estado), // PASAR AL ID TIPO COUCH
                        municipality: await findDirections('MUNICIPALITY', loan[3][0].municipio),
                        city: await findDirections('CITY', loan[3][0].localidad),
                        colony: await findDirections('NEIGHBORHOOD', loan[3][0].colonia),
                        address_line1: loan[3][0].direccion,
                        street_reference: loan[3][0].referencia,
                        road: loan[3][0].vialidad,
                        ext_number: loan[3][0].numero_exterior,
                        int_number: loan[3][0].numero_interior,
                    },
                ],
            }
            : {};
    loanCouch.members = [];

    for (let idx = 0; idx < loan[4].length; idx++) {
        const obj = {
            client_id: "",
            id_cliente: loan[4][idx].id_individual,
            id_persona: loan[4][idx].id,
            estatus: loan[4][idx].estatus.trim(),
            sub_estatus: loan[4][idx].sub_estatus.trim(),
            position: loan[4][idx].cargo.trim() == "" ? "Normal" : loan[4][idx].cargo.trim(),
            apply_amount: loan[4][idx].monto_solicitado,
            suggested_amount: loan[4][idx].monto_sugerido,
            approved_amount: loan[4][idx].monto_autorizado,
            id_activity_economic: loan[4][idx].econ_id_actividad_economica,
            previus_amount: loan[4][idx].monto_anterior, // NO SE USA PARA LA SOLICITUD
            cicle: loan[4][idx].ciclo,
            id_riesgo_pld: loan[4][idx].id_riesgo_pld,
            riesgo_pld: loan[4][idx].riesgo_pld,
            id_cata_medio_desembolso: loan[4][idx].id_cata_medio_desembolso,
            monto_garantia_financiable: loan[4][idx].monto_garantia_financiable,
            insurance: {
                id_insurance: loan[5][idx].id,
                id_individual: loan[4][idx].id_individual,
                id_seguro: loan[5][idx].id_seguro,
                id_asignacion_seguro: loan[5][idx].id_asignacion_seguro,
                fullname: loan[5][idx].nombre_beneficiario,
                relationship: loan[5][idx].parentesco,
                porcentage: loan[5][idx].porcentaje,
                costo_seguro: loan[5][idx].costo_seguro,
                incluye_saldo_deudor: loan[5][idx].incluye_saldo_deudor, // DEL PRODUCTO
                activo: loan[5][idx].activo,
            }
        };

        loanCouch.members.push(obj);
    }

    // loanCouch.members = loan[4].map((member) => {
    //     return {
    //         client_id: "",
    //         id_cliente: member.id_individual,
    //         id_persona: member.id,
    //         // name: member.nombre.trim(), // NO NECESARIO
    //         // lastname: member.apellido_paterno.trim(), // NO NECESARIO
    //         // second_lastname: member.apellido_materno.trim(), // NO NECESARIO
    //         estatus: member.estatus.trim(),
    //         sub_estatus: member.sub_estatus.trim(),
    //         position: member.cargo.trim() == "" ? "Normal" : member.cargo.trim(),
    //         apply_amount: member.monto_solicitado,
    //         suggested_amount: member.monto_sugerido,
    //         approved_amount: member.monto_autorizado,
    //         id_activity_economic: member.econ_id_actividad_economica,
    //         // CURPFisica: member.CURPFisica, //  0
    //         previus_amount: member.monto_anterior, // NO SE USA PARA LA SOLICITUD
    //         // id_solicitud_prestamo: member.id_solicitud_prestamo, // TODO: BUSCAR POR QUE SE GUARDA/ SE PUEDE TOMAR DE LA INFO DE LA SOLICITUD
    //         cicle: member.ciclo,
    //         id_riesgo_pld: member.id_riesgo_pld,
    //         riesgo_pld: member.riesgo_pld,
    //         id_cata_medio_desembolso: member.id_cata_medio_desembolso,
    //         monto_garantia_financiable: member.monto_garantia_financiable
    //     };
    // });

    // loanCouch.insurance_members = loan[5].map((insurance) => {
    //     return {
    //         id_insurance: insurance.id,
    //         // id_solicitud_prestamo: insurance.id_solicitud_prestamo, //TODO SE TOMA DE LA SOLICITUD
    //         id_individual: insurance.id_individual,
    //         id_seguro: insurance.id_seguro,
    //         id_asignacion_seguro: insurance.id_asignacion_seguro,
    //         // nombre_socia: insurance.nombre_socia, // No es necesario enviar
    //         fullname: insurance.nombre_beneficiario,
    //         relationship: insurance.parentesco,
    //         porcentage: insurance.porcentaje,
    //         costo_seguro: insurance.costo_seguro,
    //         incluye_saldo_deudor: insurance.incluye_saldo_deudor, // DEL PTODUCTO
    //         activo: insurance.activo,
    //     };
    // });

    return loanCouch;
}

// async function createLoanHF(data) {
//     // try {
//         const { id_loan, fecha_primer_pago,  fecha_entrega, id_oficial} = data;
//         let loan;
//         loan = await LoanApp.findOne({ _id: id_loan });
//         if (!loan){
//             loan = await LoanAppGroup.findOne({ _id: id_loan })
//         }else{
//             console.log('Loan not found'); return
//         };
//         // if (!loan) return new Error('Loan not found');
//     // console.log(loan)
//         if (loan.status[0] != 1) { console.log('This loan is ready for processing...'); return };

//         //CREAR O ACTUALIZAR
//         const action = 1;
//         // Buscamos el usuario que hizo la solicitud
//         let client
//         client = await Client.findOne({ _id: loan.apply_by });
//         // console.log(client);
//         if(!client){
//             client = await Group.findOne({ _id: loan.apply_by })
//         }else{
//             console.log('Client of loan not found'); return
//         };
//         const client_id = parseInt(client.id_cliente);
//         const person_id = parseInt(client.id_persona);
//         const official_id = parseInt(id_oficial);

//         //Buscamos el producto que solicitó
//         const product = await Product.findOne({ _id: loan.product });
//         if (!product) { console.log(`Product: ${loan.product} not found`); return };
//         const product_id = product.external_id;

//         //Validamos si el Cliente existe en HF
//         const clientHF = await Client.findClientByExternalId(client_id);
//         //TODO Comprobar que tienen la misma persona
//         if (!clientHF) { console.log('The client is not registered in the HF system'); return};

//         const id_branch = client.branch[0];
//         let idLoanHF = loan.id_loan;

//         if (idLoanHF == 0) {
//             // Crear la solicitud
//             console.log('Crear la solicitud');
//             const LoanHFCreated = await createLoanFromHF({ idUsuario: 0, idOficina: id_branch, num: 1 });
//             if (!LoanHFCreated) { console.log('Failed to create loan in HF'); return };

//             idLoanHF = LoanHFCreated[0].idSolicitud

//             // Asignamos Cliente a Solicitud
//             const dataAssign = {
//                 id_solicitud_prestamo: idLoanHF,
//                 id_cliente: client_id,
//                 etiqueta_opcion: "ALTA",
//                 tipo_baja: "",
//                 id_motivo: 0,
//                 uid: 0
//             }
//             const asignClientLoan = await assignClientLoanFromHF(dataAssign);
//             if(!asignClientLoan) { console.log('Failed to assign client to loan'); return };

//             // Actualizar el id de loan con el de hf
//             loan['id_loan'] = idLoanHF;
//             loan.id_soliciutd = idLoanHF;
//             await new LoanAppCollection(loan).save();
//         }

//         // Asignamos Monto a la solicitud
//         const disposition = await getDisposicionByOffice(id_branch);
//         if(!disposition) { console.log('Failed to get disposition'); return };

//         const seguro = await getSeguroProducto(product_id);
//         if(!seguro) { console.log('Failed to get insurance'); return};
//         // console.log(seguro);


//         const dataMount = {
//             SOLICITUD: [
//                 {
//                     id: idLoanHF,
//                     id_cliente: loan.id_cliente,
//                     id_oficial: official_id != undefined ? official_id : 346928,
//                     id_disposicion: disposition[0] ? disposition[0].IdDisposición : 26,
//                     monto_solicitado: loan.apply_amount,
//                     monto_autorizado: data.approved_amount || 0,
//                     periodicidad: loan.frequency ? validateFrecuency(loan.frequency[0]).toUpperCase() : product.allowed_frequency[0].value.toUpperCase(),
//                     plazo: loan.term ? loan.term : product.min_term,
//                     fecha_primer_pago: getDates(fecha_primer_pago),
//                     fecha_entrega: getDates(fecha_entrega),
//                     medio_desembolso: "ORP",//Orden De Pago TODO: CAMBIAR DEPENDIENDO EL CLINTE
//                     garantia_liquida: product.liquid_guarantee,
//                     id_oficina: id_branch != undefined ? id_branch : 1,
//                     garantia_liquida_financiable: product.GL_financeable === false ? 0 : 1,
//                     id_producto: action === 1 ? 0 : loan.id_producto,
//                     id_producto_maestro: product_id,
//                     tasa_anual: product.rate ? product.rate : 0, //Checar cómo calcular esto, preguntar de que depende la tasa anual de cada loan
//                     creacion: getDates(loan.apply_at)
//                 }
//             ],
//             CLIENTE: loan.members.map((member) => {
//                 return {
//                     id: member.id_cliente,
//                     id_persona: member.person_id != NaN ? member.person_id : 0,
//                     tipo_cliente: loan.members.lenght > 1 ? 1 : 2 ,
//                     id_oficina: id_branch
//                 }
//             }),
//             // [ // TODO MEMBERS HACER UN MAP
//             //     {
//             //         id: client_id,
//             //         id_persona: person_id == NaN ? person_id : 0,
//             //         tipo_cliente: 2,//2 -> INDIVIDUAL, 1 -> Grupal
//             //         ciclo: 0
//             //         //id_oficina TODO FALTA EL id_oficina
//             //     }
//             // ],
//             SEGURO: loan.insurance_members.map(member => {
//                 return {
//                     id: member.id_insurance,
//                     id_individual: member.id_individual,
//                     id_solicitud_prestamo: idLoanHF,
//                     id_seguro_asignacion: seguro[0].id_seguro_asignacion,
//                     id_seguro: seguro[0].id_seguro || 0,
//                     nombre_beneficiario: member.fullname,
//                     parentesco: member.relationship,
//                     porcentaje: member.porcentage,
//                     costo_seguro: 0, // FALTA CALCULAR
//                     incluye_saldo_deudor: seguro[0].incluye_saldo_deudor
//                 }
//             }),
//             // SEGURO: [
//             //     {
//             //         id: 0,
//             //         id_seguro_asignacion: seguro[0].id_seguro_asignacion || 55,
//             //         nombre_beneficiario: "OMAR MELENDEZ", // TODO FALTAN DATOS DINAMICOS
//             //         parentesco: "CONOCIDO",
//             //         porcentaje: 100.00,
//             //         costo_seguro: 0.00,
//             //         incluye_saldo_deudor: seguro[0] ? seguro[0].incluye_saldo_deudor === true ? 1 : 0 : 1
//             //     }
//             // ],
//             REFERENCIA: [] //TODO FALTA INSERTAR
//         }

//         return dataMount;
//     // console.log(dataMount)
//         // console.log('id Loan: ', idLoanHF)

//         // const MountAssigned = await assignMontoloanHF(dataMount);
//         // if(!MountAssigned) throw new Error('Failed to assign mount');

//         // return MountAssigned[0][0];
//     // } catch (error) {
//     //     throw new Error(error)
//     // }
// }
async function createLoanHF(data) {
    try {
        const { id_loan } = data;

        const loan = await LoanAppGroup.findOne({ _id: id_loan });
        if (!loan) { console.log('Loan not found'); return }

        const typeClient = loan.members.length > 1 ? 1 : 2;
        const isNewLoan = loan.id_solicitud == 0;
        const idBranch = loan.branch[0];

        // CREAR LA SOLICITUD, SI ES SOLICITUD NUEVA
        if (isNewLoan) {
            const dataCreate = { idUsuario: 0, idOficina: idBranch, num: 1, typeClient: typeClient }

            const LoanHFCreated = await createLoanFromHF(dataCreate);
            if (!LoanHFCreated) { console.log('Failed to create loan in HF'); return };

            loan.id_solicitud = LoanHFCreated[0].idSolicitud;
            if (typeClient == 1 && loan.id_cliente == 0) {
                loan.id_cliente = LoanHFCreated[0].idCliente;
                loan.group.id = 0;
            } else {
                // TODO RENOVACIÓN
                // OTOR_InsertSolicitudGrupoSolidarioCredito
            }

        } else {
            console.log(typeClient == 1 ? 'Grupo' : 'Individual')
            const client = typeClient == 1 ? await Group.findOne({ _id: loan.apply_by }) : await Client.findOne({ _id: loan.apply_by });
            if (!client) { console.log('Failed to find'); return };
            loan.id_cliente = client.id_cliente;
        }

        const disposition = await getDisposicionByOffice(idBranch);
        if (!disposition) { console.log('Failed to get disposition'); return };

        // const product = await Product.findOne({ _id: loan.product }); TODO: product.external_id
        // if (!product) { console.log('Product not found'); return };

        const seguro = await getSeguroProducto(loan.product.external_id);// parseInt(loan.product.external_id)
        if (!seguro) { console.log('Failed to get insurance'); return };

        // TODO Cambiar todos los product. a loan.product.
        // TODO EJECUATR EL PROCEDIMIENTO CUANDO SEA ESTATUS "POR AUTORIZAR" MOV_CATA_CrearProducto
        console.log(loan.frequency);
        const dataMount = {
            SOLICITUD: [
                {
                    id: loan.id_solicitud,
                    id_cliente: loan.id_cliente,
                    id_oficial: loan.loan_officer != undefined ? loan.loan_officer : 346928,
                    id_disposicion: disposition[0] ? disposition[0].IdDisposición : 0,
                    monto_solicitado: loan.apply_amount,
                    monto_autorizado: loan.approved_total || 0,
                    periodicidad: frecuencysCouchtoHF[loan.frequency[0]] || '',
                    plazo: loan.term || loan.product.min_term,
                    fecha_primer_pago: loan.first_replay_at != '' ? getDates(loan.first_replay_at) : '1999-01-01T00:00:00.000Z', //2023-02-02T00:00:00.000Z
                    fecha_entrega: loan.disburset_at != '' ? getDates(loan.disburset_at) : '1999-01-01T00:00:00.000Z',
                    medio_desembolso: loan.disbursment_mean || "ORP",//Orden De Pago TODO: CAMBIAR DEPENDIENDO EL CLINTE
                    garantia_liquida: loan.product.liquid_guarantee || loan.liquid_guarantee,
                    id_oficina: idBranch != undefined ? idBranch : 1,
                    garantia_liquida_financiable: loan.product.GL_financeable === false ? 0 : 1,
                    id_producto: isNewLoan ? 0 : loan.id_producto, // Se crea cuando pasa a por autorizar
                    id_producto_maestro: loan.product.external_id,
                    tasa_anual: loan.product.rate ? loan.product.rate : 0, //TODO Checar cómo calcular esto, preguntar de que depende la tasa anual de cada loan
                    creacion: new Date(Date.now()).toISOString(), // getDates(loan.apply_at) NO SE USA, new Data().toString()
                    ciclo: loan.loan_cycle,//TODO typeClient == 1 ? loan.group.cicle : loan.members[0].cicle,
                    tipo_cliente: typeClient
                }
            ],
            GRUPO: typeClient == 1 ? loan.group : {},

            INTEGRANTES: loan.members.map(member => {
                return {
                    id_individual: member.id_cliente,
                    id_persona: member.id_member, //Persona
                    cargo: member.position === 'Normal' ? '' : member.position,
                    monto_solicitado: member.apply_amount,
                    monto_sugerido: member.suggested_amount || 0,
                    monto_autorizado: member.approved_amount || 0,
                    econ_id_actividad_economica: 0, // TODO Se toma de los datos del cliente
                    curp_fisica: 0,
                    motivo: '',
                    id_cata_medio_desembolso: member.id_cata_medio_desembolso,
                    monto_garantia_financiable: member.monto_garantia_financiable,
                }
            }),
            SEGURO: loan.members.map(member => {
                return {
                    id: isNewLoan ? member.insurance.id : 0,
                    id_individual: member.id_cliente, // integrante del grupo
                    id_seguro_asignacion: seguro[0].id_seguro_asignacion,
                    id_seguro: seguro[0].id_seguro || 0,
                    nombre_beneficiario: member.insurance.beneficiary,
                    parentesco: member.insurance.relationship,
                    porcentaje: member.percentage || 100,
                    costo_seguro: 0, // TODO FALTA CALCULAR
                    incluye_saldo_deudor: seguro[0].incluye_saldo_deudor
                }
            }),
            REFERENCIA: [] //TODO FALTA INSERTAR
        }
        //     return dataMount;
        // } catch (error) {
        //     console.error(error)
        //     return new Error(error.message);
        // }
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
        }

        const MountAssigned = await assignMontoloanHF(dataMount);
        if (!MountAssigned) { console.log('Failed to assign mount'); return };

        const detailLoan = await LoanApp.getDetailLoan(loan.id_solicitud, idBranch);
        if (!detailLoan) { console.log('Failed to in Loan'); return };

        const sortDetailLoan = await sortLoanHFtoCouch(detailLoan);

        const keys = Object.keys(sortDetailLoan);
        keys.forEach(key => (loan[key] = sortDetailLoan[key]));

        await new LoanAppGroupCollection(loan).save();

        return MountAssigned[0][0];

    } catch (error) {
        console.error(error)
        return new Error(error.message);
    }
}


module.exports = { createLoanFromHF, assignClientLoanFromHF, assignMontoloanHF, createLoanHF, sortLoanHFtoCouch };