const mongoose = require('mongoose')
const { sqlConfig } = require("../db/connSQL");
const sql = require("mssql");
const tbl = require('./../utils/TablesSQL')

const loanappSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Products',
        required: true
     },
    loan_app_code: {
        type: String,
        required: true  
    },
    status: [],
    apply_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    apply_at: { type: Date, required: true },
    approved_at: { type: Date, required: false },
    approved_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false},
    apply_amount: { type: String,required: true },
    approved_amount: { type: String,required: false },
    term: { type: Number, required: true },
    frequency: [],
    schedule: [{
        number: { type: Number, required: true},
        balance: { type: Number, required: true},
        principal: { type: Number, required: true},
        interest: { type: Number, required: true},
        tax: { type: Number, required: true},
        insurance: { type: Number, required: true},
        due_date: { type: Date, required: false}
    }],
    id_loan: {type: Number},
    id_oficial : {type: Number}
}, { timestamps: true })

loanappSchema.statics.createLoanFromHF = async(data) => {
    try {
        const { idUsuario, idOficina } = data;

        const pool = await sql.connect(sqlConfig);
        const result = await pool.request()
            .input('idUsuario', sql.Int, idUsuario) // Creado por
            .input('idOficina', sql.Int, idOficina)
            .input('idOficialCredito', sql.Int, 0)
            .input('idTipoCliente', sql.Int, 2) //1 -> Grupo, 2 -> Individual
            .input('idServicioFinanciero', sql.Int, 1) // Es el unico que existe
            .input('cantidad', sql.Int, 1) // Numero de solicitudes a hacer
            .execute('MOV_InsertarSolicitudServicioFinanciero');

        return result.recordset;
    } catch (err) {
        throw new Error(err)
    }
}

loanappSchema.statics.assignClientLoanFromHF = async(data) => {
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
        console.log(error);
        throw new Error(error)
    }
}

loanappSchema.statics.assignMontoloanHF = async(data) => {
    try {
        const pool = await sql.connect(sqlConfig);

        // const productHF = await pool.request()
        // .input('tasa_anual', sql.Decimal(18, 4), data['SOLICITUD'][0].tasa_anual)
        // .input('periodicidad', sql.VarChar(50), data['SOLICITUD'][0].periodicidad)
        // .input('periodos', sql.Int, data['SOLICITUD'][0].plazo)
        // .input('id_producto_maestro', sql.Int, data['SOLICITUD'][0].id_producto_maestro)
        // .output('id_producto', sql.Int)
        // .execute('MOV_CATA_CrearProducto');
        // console.log('id_productoo: ', productHF.output.id_producto)
        // return productHF.output;

        tbl.UDT_Solicitud.rows.add(
            data['SOLICITUD'][0].id,
            data['CLIENTE'][0].id,
            data['SOLICITUD'][0].id_oficial, // OFICIAL CREDITO debe ser el id de la persona oficial
            data['SOLICITUD'][0].id_producto_maestro, // id del producto
            data['SOLICITUD'][0].id_disposicion, // se obtiene del procedimiento asignarDisposicion
            data['SOLICITUD'][0].monto_solicitado, // Ej. 10000.00 (debe estar entre la politicas)
            data['SOLICITUD'][0].monto_autorizado, // Monto_autorizado TODO: MANDAR EN 0 DESDE MÓVIL
            data['SOLICITUD'][0].periodicidad, // Meses/Quincena (Se obtiene de configuracionMaestro)
            data['SOLICITUD'][0].plazo, // 1, 2, 3, 6, 12, 24, etc.
            'TRAMITE', // ESTATUS
            'NUEVO TRAMITE', // SUB_ESTATUS
            data['SOLICITUD'][0].fecha_primer_pago, // Ej. 2022-07-20
            data['SOLICITUD'][0].fecha_entrega, // Ej. 2022-07-20
            data['SOLICITUD'][0].medio_desembolso, // ORP -> Orden de pago / cheque
            data['SOLICITUD'][0].garantia_liquida, // Ej. 10 Se obtiene de configuracionMaestro
            '2022-07-07', // FECHA DE CREACION
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
            '', // CARGO
            data['SOLICITUD'][0].monto_solicitado,
            data['SOLICITUD'][0].monto_sugerido, // TODO: Se establece cuando sea POR AUTORIZAR (WEB ADMIN)
            data['SOLICITUD'][0].monto_autorizado, // 0 -> desde Móvil, >0 desde WEB ADMIN 
            0, // econ_id_actividad_economica // TODO: ver si lo ocupa el procedimiento
            0, // CURP Fisica
            0, // motivo
            data['SOLICITUD'][0].id_medio_desembolso, //1->CHEQUE, 2->ORDEN DE PAGO, 3->TARJETA DE PAGO
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
            0
        );

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
            // .execute('MOV_Prueba')
        //.execute('MOV_Prueba');
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
        // console.log(result.recordsets)

        return result.recordsets;
        // .execute('MOV_Prueba')
    } catch (err) {
        console.log(err)
        throw new Error(err);
    }
}

const Loan = mongoose.model('Loanapp', loanappSchema)

module.exports = Loan