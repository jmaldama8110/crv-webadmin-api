const { sqlConfig } = require("../db/connSQL");
const tbl = require('../utils/TablesSQL');
const sql = require("mssql");
const { getDates, getId } = require('./createPerson')
const ClientCollection = require('./../model/clientCollection');
const GroupCollection = require('../model/groupCollection');
const LoanAppCollection = require('./../model/loanAppCollection');
const LoanAppGroupCollection = require('./../model/loanAppGroup');
const UserCollection = require('./../model/userCollection');
const ProductCollection = require('./../model/productCollection');
const Client = new ClientCollection();
const Group = new GroupCollection();
const LoanApp = new LoanAppCollection();
const LoanAppGroup = new LoanAppGroupCollection();
const User = new UserCollection();
const Product = new ProductCollection();

async function createLoanFromHF(data) {
    try {
        const { idUsuario, idOficina, num } = data;

        const pool = await sql.connect(sqlConfig);
        const result = await pool.request()
            .input('idUsuario', sql.Int, idUsuario) // Creado por
            .input('idOficina', sql.Int, idOficina)
            .input('idOficialCredito', sql.Int, 0)
            .input('idTipoCliente', sql.Int, 2) //1 -> Grupo, 2 -> Individual
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
            data['CLIENTE'][0].id,
            data['SOLICITUD'][0].id_oficial, // OFICIAL CREDITO debe ser el id de la persona oficial
            0, // id del producto
            data['SOLICITUD'][0].id_disposicion, // se obtiene del procedimiento asignarDisposicion
            data['SOLICITUD'][0].monto_solicitado, // Ej. 10000.00 (debe estar entre la politicas)
            data['SOLICITUD'][0].monto_autorizado, // Monto_autorizado TODO: MANDAR EN 0 DESDE MÓVIL
            data['SOLICITUD'][0].periodicidad, // Meses/Quincena (Se obtiene de configuracionMaestro)
            data['SOLICITUD'][0].plazo, // 1, 2, 3, 6, 12, 24, etc.
            'TRAMITE',// ESTATUS
            'NUEVO TRAMITE',  // SUB_ESTATUS
            data['SOLICITUD'][0].fecha_primer_pago, // Ej. 2022-07-20
            data['SOLICITUD'][0].fecha_entrega, // Ej. 2022-07-20
            data['SOLICITUD'][0].medio_desembolso, // ORP -> Orden de pago / cheque
            data['SOLICITUD'][0].garantia_liquida, // Ej. 10 Se obtiene de configuracionMaestro
            data['SOLICITUD'][0].creacion, // FECHA DE CREACION
            data['SOLICITUD'][0].id_oficina, // 1 por defecto
            data['SOLICITUD'][0].garantia_liquida_financiable, // 0/1 False/True
            data['SOLICITUD'][0].id_producto_maestro, // Ej. 4
            data['SOLICITUD'][0].tasa_anual, // Se calcula dependiendo del plazo
            0
        );

        tbl.Cliente.rows.add(
            data['CLIENTE'][0].id,
            data['CLIENTE'][0].ciclo, // se obtiene del cliente
            '', // estatus (MANDAR VACIO)
            '', // SUB_ESTATUS (MANDAR VACIO)
            data['SOLICITUD'][0].id_oficial,
            data['SOLICITUD'][0].id_oficina,
            data['CLIENTE'][0].tipo_cliente // 0 TODO: Ver si se requiere en el procedimiento
        );

        //tabla GrupoSolidario (SE MANDA VACIO)
        //tabla Direccion (SE MANDA VACIO)

        tbl.UDT_SolicitudDetalle.rows.add(
            data['CLIENTE'][0].id,
            data['SOLICITUD'][0].id,
            data['CLIENTE'][0].id_persona,
            '', // Nombre
            '', // Apellido paterno
            '', // Apellido Materno
            'TRAMITE', // ESTATUS
            'LISTO PARA TRAMITE', // SUB_ESTATUS LISTO PARA TRAMITE
            '', // CARGO || ''
            data['SOLICITUD'][0].monto_solicitado,
            data['SOLICITUD'][0].monto_autorizado, // TODO: Se establece cuando sea POR AUTORIZAR (WEB ADMIN)
            data['SOLICITUD'][0].monto_autorizado, // 0 -> desde Móvil, >0 desde WEB ADMIN
            0, // econ_id_actividad_economica // TODO: ver si lo ocupa el procedimiento
            0, // CURP Fisica
            0, // motivo
            data['SOLICITUD'][0].medio_desembolso === "ORP" ? 2 : 1, //1->CHEQUE, 2->ORDEN DE PAGO, 3->TARJETA DE PAGO
            0.00 // monto_garantia_financiable
        );

        tbl.UDT_CLIE_DetalleSeguro.rows.add(
            data['SEGURO'][0].id,
            data['SOLICITUD'][0].id,
            data['CLIENTE'][0].id,
            0,
            data['SEGURO'][0].id_seguro_asignacion, // a
            '', // nombre socia
            data['SEGURO'][0].nombre_beneficiario, // Ej. OMAR MELENDEZ
            data['SEGURO'][0].parentesco, // Ej. AMIGO,PRIMO, ETC.
            data['SEGURO'][0].porcentaje, // Ej. 100.00
            data['SEGURO'][0].costo_seguro, // 1560
            data['SEGURO'][0].incluye_saldo_deudor,
            0,
            0
        );
        // console.log('tbl1: ',tbl.UDT_Solicitud.rows)
        // console.log('tbl2: ', tbl.UDT_SolicitudDetalle.rows)

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
        console.log(err.message)
        throw new Error(err);
    }
}

async function getDisposicionByOffice(idOffice) {
    try{
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
    try{
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

const validateFrecuency = (value) =>{
    if(value === "S"){
        return "SEMANAL"
    }
    if(value === "Q"){
        return "QUINCENAL"
    }
    if(value === "M"){
        return "MENSUAL"
    }
    return " ";
}

async function createLoanHF(data) {
    // try {
        const { id_loan, fecha_primer_pago,  fecha_entrega, id_oficial} = data;
        let loan;
        loan = await LoanApp.findOne({ _id: id_loan });
        if (!loan){
            loan = await LoanAppGroup.findOne({ _id: id_loan })
        }else{
            console.log('Loan not found'); return
        };
        // if (!loan) return new Error('Loan not found');
    // console.log(loan)
        if (loan.status[0] != 1) { console.log('This loan is ready for processing...'); return };

        //CREAR O ACTUALIZAR
        const action = 1;
        // Buscamos el usuario que hizo la solicitud
        let client
        client = await Client.findOne({ _id: loan.apply_by });
        // console.log(client);
        if(!client){
            client = await Group.findOne({ _id: loan.apply_by })
        }else{
            console.log('Client of loan not found'); return
        };
        const client_id = parseInt(client.id_cliente);
        const person_id = parseInt(client.id_persona);
        const official_id = parseInt(id_oficial);

        //Buscamos el producto que solicitó
        const product = await Product.findOne({ _id: loan.product });
        if (!product) { console.log('Product not found'); return };
        const product_id = product.external_id;

        //Validamos si el Cliente existe en HF
        const clientHF = await Client.findClientByExternalId(client_id);
        //TODO Comprobar que tienen la misma persona
        if (!clientHF) { console.log('The client is not registered in the HF system'); return};

        const id_branch = client.branch[0];
        let idLoanHF = loan.id_loan;

        if(loan.id_loan == 0) {
            // Crear la solicitud
            const LoanHFCreated = await createLoanFromHF({ idUsuario: 0, idOficina: id_branch, num: 1 });

            let idLoanHF = LoanHFCreated[0].idSolicitud
            if (!idLoanHF) { console.log('Failed to create loan in HF'); return };

            // Asignamos Cliente a Solicitud
            const dataAssign = {
                id_solicitud_prestamo: idLoanHF,
                id_cliente: client_id,
                etiqueta_opcion: "ALTA",
                tipo_baja: "",
                id_motivo: 0,
                uid: 0
            }
            const asignClientLoan = await assignClientLoanFromHF(dataAssign);
            if(!asignClientLoan) { console.log('Failed to assign client to loan'); return };

            // Actualizar el id de loan con el de hf
            loan['id_loan'] = idLoanHF;
            // await new LoanAppCollection(loan).save();
        }

        // Asignamos Monto a la solicitud
        const disposition = await getDisposicionByOffice(id_branch);
        if(!disposition) { console.log('Failed to get disposition'); return };

        const seguro = await getSeguroProducto(product_id);
        if(!seguro) { console.log('Failed to get insurance'); return};


        const dataMount = {
            SOLICITUD: [
                {
                    id: idLoanHF,
                    id_oficial: official_id != undefined ? official_id : 346928,
                    id_disposicion: disposition[0] ? disposition[0].IdDisposición : 26,
                    monto_solicitado: loan.apply_amount,
                    monto_autorizado: data.approved_amount || 0,
                    periodicidad: loan.frequency ? validateFrecuency(loan.frequency[0]).toUpperCase() : product.allowed_frequency[0].value.toUpperCase(),
                    plazo: loan.term ? loan.term : product.min_term,
                    fecha_primer_pago: getDates(fecha_primer_pago),
                    fecha_entrega: getDates(fecha_entrega),
                    medio_desembolso: "ORP",//Orden De Pago TODO: CAMBIAR DEPENDIENDO EL CLINTE
                    garantia_liquida: product.liquid_guarantee,
                    id_oficina: id_branch != undefined ? id_branch : 1,
                    garantia_liquida_financiable: product.GL_financeable === false ? 0 : 1,
                    id_producto: action === 1 ? 0 : loan.id_producto,
                    id_producto_maestro: product_id,
                    tasa_anual: product.rate ? product.rate : 0, //Checar cómo calcular esto, preguntar de que depende la tasa anual de cada loan
                    creacion: getDates(loan.apply_at)
                }
            ],
            CLIENTE: loan.members.map((member) => {
                return {
                    id: member.id_cliente,
                    id_persona: member.person_id != NaN ? member.person_id : 0,
                    tipo_cliente: loan.members.lenght > 1 ? 1 : 2 ,
                    id_oficina: id_branch
                }
            }),
            // [ // TODO MEMBERS HACER UN MAP
            //     {
            //         id: client_id,
            //         id_persona: person_id == NaN ? person_id : 0,
            //         tipo_cliente: 2,//2 -> INDIVIDUAL, 1 -> Grupal
            //         ciclo: 0
            //         //id_oficina TODO FALTA EL id_oficina
            //     }
            // ],
            SEGURO: [
                {
                    id: 0,
                    id_seguro_asignacion: seguro[0].id_seguro_asignacion || 55,
                    nombre_beneficiario: "OMAR MELENDEZ", // TODO FALTAN DATOS DINAMICOS
                    parentesco: "CONOCIDO",
                    porcentaje: 100.00,
                    costo_seguro: 0.00,
                    incluye_saldo_deudor: seguro[0] ? seguro[0].incluye_saldo_deudor === true ? 1 : 0 : 1
                }
            ],
            REFERENCIA: [] //TODO FALTA INSERTAR
        }
    console.log(dataMount)
        console.log('id Loan: ', idLoanHF)

        const MountAssigned = await assignMontoloanHF(dataMount);
        if(!MountAssigned) throw new Error('Failed to assign mount');

        return MountAssigned[0][0];
    // } catch (error) {
    //     throw new Error(error)
    // }
}


module.exports = { createLoanFromHF, assignClientLoanFromHF, assignMontoloanHF, createLoanHF };