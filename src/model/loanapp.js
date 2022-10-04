const mongoose = require('mongoose')
const { sqlConfig } = require("../db/connSQL");
const sql = require("mssql");
const tbl = require('./../utils/TablesSQL');
const User = require('./user');

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
    id_oficial : {type: Number},
    id_producto: {type: Number},
    id_contract: {type: Number},
    loan_detail: [],
    seguro_detail: [],
    general_checklist: [
        {
            order: {type: Number, required: true},
            title: {type: String, required: true},
            checked: {type: Boolean, default: false },
            checked_by: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
            checked_at: {type: Date}
        }
    ],
    committee_checklist: [
        {
            order: {type: Number, required: true},
            title: {type: String, required: true},
            checked: []
        }
    ]
}, { timestamps: true });

loanappSchema.methods.createGenerallChecklist = function () {
    const loan = this;

    loan.general_checklist = [
        {order:1, title: 'Autorización de consulta en Sociedad de Información Crediticia', checked: false},
        {order:2, title: 'Reporte de SIC y Score', checked: false},
        {order:3, title: 'Copias cotejadas, legibles y sin tachaduras de:  a. Identificación Oficial b. CURP c. Comprobante Domiciliario d. Cédula fiscal', checked: false},
        {order:4, title: 'Diagnóstico de necesidades y situación de la vivienda', checked: false},
        {order:5, title: 'Simulador de costos del proyecto de mejora', checked: false},
        {order:6, title: 'Formato de Evaluación Socio Económica', checked: false},
        {order:7, title: 'Formato de Relación Patrimonial', checked: false},
        {order:8, title: 'Formato de avalúo de garantías prendarias Facturas o documentos de propiedad de maquinaria y equipos, vehículos o documentos de bien inmueble', checked: false},
        {order:9, title: 'Formatos de Aval', checked: false},
        {order:10, title: 'Geo coordenadas: Titular: de Domicilio y Negocio', checked: false},
        {order:11, title: 'Formato de Verificación Ocular', checked: false},
        {order:12, title: 'Archivo Fotográfico', checked: false},
        {order:13, title: 'Formato de Acta Comité de crédito', checked: false}
    ]
}

loanappSchema.methods.activateItemGeneralChecklist = function(title, checked_by, checked_at){
    const loan = this;

    loan.general_checklist = loan.general_checklist.map((item) => 
        item.title === title
        ? {
            order: item.order,
            title: item.title,
            checked: true,
            checked_by,
            checked_at
          }
        : {
            order: item.order,
            title: item.title,
            checked: item.checked
          }   
    );
    
}

loanappSchema.methods.createCommitteeChecklist = function () {
    const loan = this;

    loan.committee_checklist = [
        {order:1, title: 'Autorización de consulta en Sociedad de Información Crediticia', checked: []},
        {order:2, title: 'Reporte de SIC y Score', checked: []},
        {order:3, title: 'Copias cotejadas, legibles y sin tachaduras de:  a. Identificación Oficial b. CURP c. Comprobante Domiciliario d. Cédula fiscal', checked: []},
        {order:4, title: 'Diagnóstico de necesidades y situación de la vivienda', checked: []},
        {order:5, title: 'Simulador de costos del proyecto de mejora', checked: []},
        {order:6, title: 'Formato de Evaluación Socio Económica', checked: []},
        {order:7, title: 'Formato de Relación Patrimonial', checked: []},
        {order:8, title: 'Formato de avalúo de garantías prendarias Facturas o documentos de propiedad de maquinaria y equipos, vehículos o documentos de bien inmueble', checkedcomittee: []},
        {order:9, title: 'Formatos de Aval', checked: []},
        {order:10, title: 'Geo coordenadas: Titular: de Domicilio y Negocio', checked: []},
        {order:11, title: 'Formato de Verificación Ocular', checked: []},
        {order:12, title: 'Archivo Fotográfico', checked: []},
        {order:13, title: 'Formato de Acta Comité de crédito', checked: []}
    ]
}

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
            '', // CARGO
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

loanappSchema.statics.toAuthorizeLoanHF = async(body, seguro, status) => {
    try {
        const pool = await sql.connect(sqlConfig);

        let id_producto = body[0][0].id_producto;
        let statusHF = 'ACEPTADO';

        if(status[0] === 3){
            statusHF = 'TRAMITE';
            console.log('crear el producto')
            const productHF = await pool.request()
            .input('tasa_anual', sql.Decimal(18, 4), body[0][0].tasa_anual)
            .input('periodicidad', sql.VarChar(50), body[0][0].periodicidad.toUpperCase())
            .input('periodos', sql.Int, body[0][0].plazo)
            .input('id_producto_maestro', sql.Int, body[0][0].id_producto_maestro)
            .output('id_producto', sql.Int)
            .execute('MOV_CATA_CrearProducto');
            console.log('id_productoo: ', productHF.output.id_producto)

            id_producto = productHF.output.id_producto
        }

        tbl.UDT_Solicitud.rows.add(
            body[0][0].id,
            body[0][0].id_cliente,
            body[0][0].id_oficial, // OFICIAL CREDITO debe ser el id de la persona oficial
            id_producto,
            body[0][0].id_disposicion, // se obtiene del procedimiento asignarDisposicion
            body[0][0].monto_total_solicitado, // Ej. 10000.00 (debe estar entre la politicas)
            body[0][0].monto_total_autorizado, // Monto_autorizado TODO: MANDAR EN 0 DESDE MÓVIL
            body[0][0].periodicidad, // Meses/Quincena (Se obtiene de configuracionMaestro)
            body[0][0].plazo, // 1, 2, 3, 6, 12, 24, etc.
            statusHF,// ESTATUS
            status[1].toUpperCase(),  // SUB_ESTATUS 
            body[0][0].fecha_primer_pago, // Ej. 2022-07-20
            body[0][0].fecha_entrega, // Ej. 2022-07-20
            body[0][0].medio_desembolso.trim(), // ORP -> Orden de pago / cheque
            body[0][0].garantia_liquida, // Ej. 10 Se obtiene de configuracionMaestro
            body[0][0].fecha_creacion, // FECHA DE CREACION
            body[0][0].id_oficina, // 1 por defecto
            body[0][0].garantia_liquida_financiable, // 0/1 False/True
            body[0][0].id_producto_maestro, // Ej. 4
            body[0][0].tasa_anual, // Se calcula dependiendo del plazo
            0
        );

        // return tbl.UDT_Solicitud.rows;

        tbl.Cliente.rows.add(
            body[1][0].id,
            body[1][0].ciclo, 
            '', // estatus (MANDAR VACIO)
            '', // SUB_ESTATUS (MANDAR VACIO)
            body[0][0].id_oficial,
            body[0][0].id_oficina,
            body[0][0].tipo_cliente // 0 TODO: Ver si se requiere en el procedimiento
        );


        tbl.UDT_SolicitudDetalle.rows.add(
            body[4][0].id_individual,
            body[0][0].id,
            body[4][0].id,
            '', // Nombre
            '', // Apellido paterno
            '', // Apellido Materno
            statusHF,// ESTATUS
            status[1].toUpperCase(),  // SUB_ESTATUS 
            '', // CARGO
            body[0][0].monto_total_solicitado,
            body[0][0].monto_total_autorizado, // TODO: Se establece cuando sea POR AUTORIZAR (WEB ADMIN)
            body[0][0].monto_total_autorizado, // 0 -> desde Móvil, >0 desde WEB ADMIN 
            0, // econ_id_actividad_economica // TODO: ver si lo ocupa el procedimiento
            0, // CURP Fisica
            0, // motivo
            body[4][0].id_cata_medio_desembolso, //1->CHEQUE, 2->ORDEN DE PAGO, 3->TARJETA DE PAGO
            0.00 // monto_garantia_financiable
        );

        let valorSeguro;

        if(body[5][0].incluye_saldo_deudor){
            valorSeguro = seguro.seguroSaldoDeudor
        }else{
            valorSeguro = seguro.seguroNormal
        }

        tbl.UDT_CLIE_DetalleSeguro.rows.add(
            body[5][0].id,
            body[5][0].id_solicitud_prestamo,
            body[5][0].id_individual,
            body[5][0].id_seguro,
            body[5][0].id_asignacion_seguro, // a
            body[5][0].nombre_socia.trim(), // nombre socia
            body[5][0].nombre_beneficiario.trim(), // Ej. OMAR MELENDEZ
            body[5][0].parentesco.trim(), // Ej. AMIGO,PRIMO, ETC.
            body[5][0].porcentaje, // Ej. 100.00
            valorSeguro, 
            body[5][0].incluye_saldo_deudor,
            0,
            body[5][0].activo
        );

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
        // console.log(result.recordsets)

        // return {
        //     solicitud: tbl.UDT_Solicitud.rows,
        //     cliente : tbl.Cliente.rows,
        //     soliDetale: tbl.UDT_SolicitudDetalle.rows,
        //     detalleSeguro: tbl.UDT_CLIE_DetalleSeguro.rows
        // };

        return result.recordsets;
    } catch (err) {
        console.log(err)
        throw new Error(err);
    }
}

loanappSchema.statics.getSeguroProducto = async(idProductoMaestro) => {
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

loanappSchema.statics.getDisposicionByOffice = async(idOffice) => {
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

loanappSchema.statics.getDetailLoan = async(idLoan, idOffice) => {
    try{
        const pool = await sql.connect(sqlConfig);

        const result = await pool.request()
        .input('id_solicitud', sql.Int, idLoan)
        .input('id_oficina', sql.Int, idOffice)
        .execute('MOV_ObtenerSolicitudClienteServicioFinanciero_V2')

        return result.recordsets;
    }
    catch (error) {
        throw new Error(error)
    }
}

loanappSchema.statics.getStatusGLByLoan = async(idLoan) => {
    try{
        const pool = await sql.connect(sqlConfig);

        const detailLoan = await pool.request()
            .input('id_solicitud', sql.Int, idLoan)
            .input('id_oficina', sql.Int, 0)
            .execute('MOV_ObtenerSolicitudClienteServicioFinanciero_V2');

        const garantia = await pool.request()
            .input('idSolicitudPrestamo', sql.Int, idLoan)
            .input('opcion', sql.Int, 0)
            .execute('CLIE_ObtenerGarantias');

        const seguro = await pool.request()
            .input('opcion', sql.VarChar, 'CONFIGURACION_SEGURO')
            .input('busqueda', sql.VarChar, '')
            .input('pagina', sql.Int, 0)
            .input('id_oficina', sql.Int, 0)
            .execute('HF_uspObtenerSeguros');
        
        const montoSolicitado = detailLoan.recordsets[0][0].monto_total_solicitado;
        const glDepositado = garantia.recordset[0].montoGarantiaDadoAEmpresa;

        // console.log(detailLoan.recordsets[4][0]);
        const porcentaje = detailLoan.recordsets[0][0].garantia_liquida / 100;
        const glFinanciable = detailLoan.recordsets[4][0].monto_garantia_financiable;
        const glObligatoria = montoSolicitado * porcentaje;
        
        const diferenciaGL = glDepositado + glFinanciable - glObligatoria;
        var periodicidad = detailLoan.recordsets[0][0].periodicidad.toUpperCase();
        const plazo = detailLoan.recordsets[0][0].plazo;
        let multiplicadorPeriodos = 0;
        const primaSemanal = seguro.recordset[0].prima_seguro;
        const primaSemanalSaldoDeudor = seguro.recordset[0].prima_semanal_saldo_deudor;
        // console.log(periodicidad);
        switch (periodicidad) {
            case 'SEMANAL': multiplicadorPeriodos = 1; break;
            case 'CATORCENAL': multiplicadorPeriodos = 2; break;
            case 'QUINCENAL': multiplicadorPeriodos = 2; break;
            case 'MENSUAL': multiplicadorPeriodos = 4; break;
            case 'BIMESTRAL': multiplicadorPeriodos = 8; break;
            case 'TRIMESTRAL': multiplicadorPeriodos = 12; break;
            case 'CUATRIMESTRAL': multiplicadorPeriodos = 16; break;
            case 'SEMESTRAL': multiplicadorPeriodos = 24; break;
            case 'ANUAL': multiplicadorPeriodos = 48; break;
            default: multiplicadorPeriodos = 0; break;
        }

        if (multiplicadorPeriodos == 0) throw new Error('Error de periodicidad');

        const montoPrimaNormal = plazo * multiplicadorPeriodos * primaSemanal;
        const montoPrimaSeguroDeudor = plazo * multiplicadorPeriodos * primaSemanalSaldoDeudor;
        
        let data = {
            plazo,
            periodicidad,
            seguroNormal: montoPrimaNormal,
            seguroSaldoDeudor: montoPrimaNormal + montoPrimaSeguroDeudor,
            'Garantía Líquida': porcentaje * 100 + '%',
            'Garantía Obligatoria': glObligatoria,
            'Depositado: ': glDepositado,
            'Financiada: ': glFinanciable,
            estatus: ''
        }

        // TODO: COMO SABER SI INCLUYE SALDO DEUDOR

        if(diferenciaGL == 0){
            data.estatus = 'G.L. COMPLETA.'
            return data;
        }else {
            if(diferenciaGL < 0) {
                data.estatus = 'FALTA G.L.'
                return data;
            } else {
                if(diferenciaGL > 0) {
                    data.estatus = 'G.L. SOBRANTE.';
                    return data;
                }
            }
        }

        
    }
    catch (error) {
        throw new Error(error)
    }
}

loanappSchema.statics.getLoanPorAutorizar = async(idOffice) => {
    try {
        const pool = await sql.connect(sqlConfig);
        const result = await pool.request()
            .input('estatus', sql.Int, 8)
            .input('idOficina', sql.Int, idOffice)
            .input('idCoordinador', sql.Int, 0)
            .input('idUsuario', sql.Int,0)
            .execute('CLIE_getPrestamos');

        return result.recordset
    } catch (error) {
        throw new Error(error);
    }
}

const Loan = mongoose.model('Loanapp', loanappSchema)

module.exports = Loan