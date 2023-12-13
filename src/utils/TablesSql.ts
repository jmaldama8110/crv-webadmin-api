import SQL from 'mssql';

export const Cliente = new SQL.Table();
export const Direccion = new SQL.Table();
export const GrupoSolidario = new SQL.Table();
export const UTD_CLIE_Clientes = new SQL.Table();
export const UDT_CLIE_Individual = new SQL.Table();
export const UDT_CLIE_Solicitud = new SQL.Table();
export const UDT_CLIE_DatoBancario = new SQL.Table();
export const UDT_CLIE_ReferenciasPersonales = new SQL.Table();
export const UDT_CLIE_DetalleSeguro = new SQL.Table();
export const UDT_CLIE_TuHogarConConservaCoacreditado = new SQL.Table();
export const UDT_CONT_CURP = new SQL.Table();
export const UDT_CONT_Direcciones = new SQL.Table();
export const UDT_CONT_DireccionContacto = new SQL.Table();
export const UDT_CONT_Empresa = new SQL.Table();
export const UDT_CONT_FirmaElectronica = new SQL.Table();
export const UDT_CONT_Identificaciones = new SQL.Table();
export const UDT_CONT_IFE = new SQL.Table();
export const UDT_CONT_Negocios = new SQL.Table();
export const UDT_CONT_Oficinas = new SQL.Table();
export const UDT_CONT_Persona = new SQL.Table();
export const UDT_CONT_Telefonos = new SQL.Table();
export const UDT_OTOR_GarantiaPrendaria = new SQL.Table();
export const UDT_OTOR_TuHogarConConserva = new SQL.Table();
export const UDT_Solicitud = new SQL.Table();
export const UDT_SolicitudDetalle = new SQL.Table();
export const UDT_SPLD_DatosCliente = new SQL.Table();

UDT_CONT_Oficinas.columns.add('id', SQL.Int, { nullable: true });
UDT_CONT_Oficinas.columns.add('id_empresa', SQL.Int, { nullable: true });
UDT_CONT_Oficinas.columns.add('id_direccion', SQL.Int, { nullable: true });
UDT_CONT_Oficinas.columns.add('matriz', SQL.Bit, { nullable: true });
UDT_CONT_Oficinas.columns.add('nombre_oficina', SQL.VarChar(150), { nullable: true });
UDT_CONT_Oficinas.columns.add('funcion_oficina', SQL.VarChar(50), { nullable: true });
UDT_CONT_Oficinas.columns.add('email_sucursal', SQL.VarChar(100), { nullable: true });
UDT_CONT_Oficinas.columns.add('horario', SQL.VarChar(100), { nullable: true });
UDT_CONT_Oficinas.columns.add('tipo_local', SQL.VarChar(80), { nullable: true });
UDT_CONT_Oficinas.columns.add('dias_laborales', SQL.VarChar(100), { nullable: true });
UDT_CONT_Oficinas.columns.add('descripcion', SQL.Text, { nullable: true });

//#region UDT_CONT_Persona
UDT_CONT_Persona.columns.add('id', SQL.Int, { nullable: true });
UDT_CONT_Persona.columns.add('nombre', SQL.VarChar(50), { nullable: true });
UDT_CONT_Persona.columns.add('apellido_paterno', SQL.VarChar(30), { nullable: true });
UDT_CONT_Persona.columns.add('apellido_materno', SQL.VarChar(30), { nullable: true });
UDT_CONT_Persona.columns.add('fecha_nacimiento', SQL.DateTime, { nullable: true });
UDT_CONT_Persona.columns.add('id_sexo', SQL.Int, { nullable: true });
UDT_CONT_Persona.columns.add('id_escolaridad', SQL.Int, { nullable: true });
UDT_CONT_Persona.columns.add('id_estado_civil', SQL.Int, { nullable: true });
UDT_CONT_Persona.columns.add('entidad_nacimiento', SQL.VarChar(50), { nullable: true });
UDT_CONT_Persona.columns.add('regimen', SQL.VarChar(20), { nullable: true });
UDT_CONT_Persona.columns.add('id_oficina', SQL.Int, { nullable: true });
UDT_CONT_Persona.columns.add('curp_fisica', SQL.Bit, { nullable: true });
UDT_CONT_Persona.columns.add('datos_personales_diferentes_curp', SQL.Bit, { nullable: true });
UDT_CONT_Persona.columns.add('id_entidad_nacimiento', SQL.Int, { nullable: true });
UDT_CONT_Persona.columns.add('id_nacionalidad', SQL.Int, { nullable: true });
UDT_CONT_Persona.columns.add('id_pais_nacimiento', SQL.Int, { nullable: true });
UDT_CONT_Persona.columns.add('es_pep', SQL.Int, { nullable: true });
UDT_CONT_Persona.columns.add('es_persona_prohibida', SQL.Int, { nullable: true });
UDT_CONT_Persona.columns.add('fechaN', SQL.VarChar(100), { nullable: true });
//#endregion

//#region UDT_CONT_Identificaciones
UDT_CONT_Identificaciones.columns.add('id', SQL.Int, { nullable: true });
UDT_CONT_Identificaciones.columns.add('id_entidad', SQL.Int);
UDT_CONT_Identificaciones.columns.add('tipo_identificacion', SQL.VarChar(25), { nullable: true });
UDT_CONT_Identificaciones.columns.add('id_numero', SQL.VarChar(50), { nullable: true });
UDT_CONT_Identificaciones.columns.add('id_direccion', SQL.Int, { nullable: true });
UDT_CONT_Identificaciones.columns.add('tipo_entidad', SQL.Int, { nullable: true });
//#endregion

//#region UDT_CONT_Telefonos
UDT_CONT_Telefonos.columns.add('id', SQL.Int, { nullable: true });
UDT_CONT_Telefonos.columns.add('idcel_telefono', SQL.Char(20), { nullable: true });
UDT_CONT_Telefonos.columns.add('extension', SQL.Char(10), { nullable: true });
UDT_CONT_Telefonos.columns.add('tipo_telefono', SQL.Char(12), { nullable: true });
UDT_CONT_Telefonos.columns.add('compania', SQL.VarChar(20), { nullable: true });
UDT_CONT_Telefonos.columns.add('sms', SQL.Bit);
//#endregion

//#region UDT_CONT_Negocios
UDT_CONT_Negocios.columns.add('id', SQL.Int, { nullable: true });
UDT_CONT_Negocios.columns.add('id_persona', SQL.Int, { nullable: true });
UDT_CONT_Negocios.columns.add('id_oficina', SQL.Int, { nullable: true });
UDT_CONT_Negocios.columns.add('nombre_oficina', SQL.Char(50), { nullable: true });
UDT_CONT_Negocios.columns.add('nombre_puesto', SQL.Char(50), { nullable: true });
UDT_CONT_Negocios.columns.add('departamento', SQL.Char(50), { nullable: true });
UDT_CONT_Negocios.columns.add('id_empresa', SQL.Int, { nullable: true });
UDT_CONT_Negocios.columns.add('numero_empleados', SQL.Int, { nullable: true });
UDT_CONT_Negocios.columns.add('registro_egresos_ingreso', SQL.Bit, { nullable: true });
UDT_CONT_Negocios.columns.add('revolvencia_negocio', SQL.Char(10), { nullable: true });
UDT_CONT_Negocios.columns.add('ventas_totales_cantidad', SQL.Money, { nullable: true });
UDT_CONT_Negocios.columns.add('ventas_totales_unidad', SQL.Money, { nullable: true });
UDT_CONT_Negocios.columns.add('id_actividad_economica', SQL.Int, { nullable: true });
UDT_CONT_Negocios.columns.add('tiempo_actividad_inicio', SQL.Date, { nullable: true });
UDT_CONT_Negocios.columns.add('tiempo_actividad_final', SQL.Date, { nullable: true });
UDT_CONT_Negocios.columns.add('longitud_negocio', SQL.VarChar(100), { nullable: true });
UDT_CONT_Negocios.columns.add('latitud_negocio', SQL.VarChar(100), { nullable: true });

//#endregion

//#region UTD_CLIE_Clientes
UTD_CLIE_Clientes.columns.add('id', SQL.Int, { nullable: true });
UTD_CLIE_Clientes.columns.add('ciclo', SQL.Int, { nullable: true });
UTD_CLIE_Clientes.columns.add('estatus', SQL.Char(15), { nullable: true });
UTD_CLIE_Clientes.columns.add('sub_estatus', SQL.Char(25), { nullable: true });
UTD_CLIE_Clientes.columns.add('id_oficina', SQL.Int, { nullable: true });
UTD_CLIE_Clientes.columns.add('id_oficial_credito', SQL.Int, { nullable: true });
UTD_CLIE_Clientes.columns.add('folio_solicitud_credito', SQL.Char(10), { nullable: true });
UTD_CLIE_Clientes.columns.add('documentacion_revisada', SQL.Int, { nullable: true });
//#endregion

//#region UDT_CLIE_Individual
UDT_CLIE_Individual.columns.add('id_cliente', SQL.Int, { nullable: true });
UDT_CLIE_Individual.columns.add('id_persona', SQL.Int, { nullable: true });
UDT_CLIE_Individual.columns.add('econ_ocupacion', SQL.VarChar(50), { nullable: true });
UDT_CLIE_Individual.columns.add('econ_id_actividad_economica', SQL.Int, { nullable: true });
UDT_CLIE_Individual.columns.add('econ_id_destino_credito', SQL.Int, { nullable: true });
UDT_CLIE_Individual.columns.add('econ_id_ubicacion_negocio', SQL.Int, { nullable: true });
UDT_CLIE_Individual.columns.add('econ_id_rol_hogar', SQL.Int, { nullable: true });
UDT_CLIE_Individual.columns.add('econ_id_empresa', SQL.Int, { nullable: true });
UDT_CLIE_Individual.columns.add('econ_cantidad_mensual', SQL.Money, { nullable: true });
UDT_CLIE_Individual.columns.add('econ_sueldo_conyugue', SQL.Money, { nullable: true });
UDT_CLIE_Individual.columns.add('econ_otros_ingresos', SQL.Money, { nullable: true });
UDT_CLIE_Individual.columns.add('econ_otros_gastos', SQL.Money, { nullable: true });
UDT_CLIE_Individual.columns.add('econ_familiares_extranjeros', SQL.Bit, { nullable: true });
UDT_CLIE_Individual.columns.add('econ_parentesco', SQL.VarChar(20), { nullable: true });
UDT_CLIE_Individual.columns.add('econ_envia_dinero', SQL.Bit, { nullable: true });
UDT_CLIE_Individual.columns.add('econ_dependientes_economicos', SQL.Int, { nullable: true });
UDT_CLIE_Individual.columns.add('econ_pago_casa', SQL.Money, { nullable: true });
UDT_CLIE_Individual.columns.add('econ_gastos_vivienda', SQL.Money, { nullable: true });
UDT_CLIE_Individual.columns.add('econ_gastos_familiares', SQL.Money, { nullable: true });
UDT_CLIE_Individual.columns.add('econ_gastos_transporte', SQL.Money, { nullable: true });
UDT_CLIE_Individual.columns.add('credito_anteriormente', SQL.Bit, { nullable: true });
UDT_CLIE_Individual.columns.add('mejorado_ingreso', SQL.Bit, { nullable: true });
UDT_CLIE_Individual.columns.add('lengua_indigena', SQL.Bit, { nullable: true });
UDT_CLIE_Individual.columns.add('habilidad_diferente', SQL.Bit, { nullable: true });
UDT_CLIE_Individual.columns.add('utiliza_internet', SQL.Bit, { nullable: true });
UDT_CLIE_Individual.columns.add('utiliza_redes_sociales', SQL.Bit, { nullable: true });
UDT_CLIE_Individual.columns.add('id_actividad_economica', SQL.Int, { nullable: true });
UDT_CLIE_Individual.columns.add('id_ocupacion', SQL.Int, { nullable: true });
UDT_CLIE_Individual.columns.add('id_profesion', SQL.Int, { nullable: true });
UDT_CLIE_Individual.columns.add('id_tipo_red_social', SQL.Int, { nullable: true });
UDT_CLIE_Individual.columns.add('usuario_red_social', SQL.VarChar(30), { nullable: true });
UDT_CLIE_Individual.columns.add('econ_renta', SQL.Money, { nullable: true });
UDT_CLIE_Individual.columns.add('vivienda_piso', SQL.Bit, { nullable: true });
UDT_CLIE_Individual.columns.add('vivienda_techo_losa', SQL.Bit, { nullable: true });
UDT_CLIE_Individual.columns.add('vivienda_bano', SQL.Bit, { nullable: true });
UDT_CLIE_Individual.columns.add('vivienda_letrina', SQL.Bit, { nullable: true });
UDT_CLIE_Individual.columns.add('vivienda_block', SQL.Bit, { nullable: true });
UDT_CLIE_Individual.columns.add('longitud_titular', SQL.VarChar(100), { nullable: true });
UDT_CLIE_Individual.columns.add('latitud_titular', SQL.VarChar(100), { nullable: true });
//#endregion

//#region UDT_CLIE_Solicitud
UDT_CLIE_Solicitud.columns.add('id_solicitud', SQL.Int, { nullable: true });
UDT_CLIE_Solicitud.columns.add('id_cliente', SQL.Int, { nullable: true });
UDT_CLIE_Solicitud.columns.add('id_oficial_credito', SQL.Int, { nullable: true });
UDT_CLIE_Solicitud.columns.add('id_oficina', SQL.Int, { nullable: true });
UDT_CLIE_Solicitud.columns.add('estatus', SQL.Char(15), { nullable: true });
UDT_CLIE_Solicitud.columns.add('sub_estatus', SQL.Char(25), { nullable: true });
UDT_CLIE_Solicitud.columns.add('id_solicitud_nueva', SQL.Int, { nullable: true });
//#endregion

//#region UDT_CLIE_DatoBancario
UDT_CLIE_DatoBancario.columns.add('id', SQL.Int, { nullable: true });
UDT_CLIE_DatoBancario.columns.add('id_cliente', SQL.Int, { nullable: true });
UDT_CLIE_DatoBancario.columns.add('id_banco', SQL.Int, { nullable: true });
UDT_CLIE_DatoBancario.columns.add('clave_banco', SQL.VarChar(50), { nullable: true });
UDT_CLIE_DatoBancario.columns.add('nombre_banco', SQL.VarChar(100), { nullable: true });
UDT_CLIE_DatoBancario.columns.add('id_tipo_cuenta', SQL.Int, { nullable: true });
UDT_CLIE_DatoBancario.columns.add('clave_tipo_cuenta', SQL.VarChar(100), { nullable: true });
UDT_CLIE_DatoBancario.columns.add('nombre_tipo_cuenta', SQL.VarChar(100), { nullable: true });
UDT_CLIE_DatoBancario.columns.add('numero_cuenta', SQL.VarChar(50), { nullable: true });
UDT_CLIE_DatoBancario.columns.add('principal', SQL.Bit, { nullable: true });
UDT_CLIE_DatoBancario.columns.add('activo', SQL.Bit, { nullable: true });
//#endregion

//#region UDT_SPLD_DatosCliente

//#region UDT_CONT_Empresa

UDT_CONT_Empresa.columns.add('id', SQL.Int, { nullable: true });
UDT_CONT_Empresa.columns.add('nombre_comercial', SQL.VarChar(80), { nullable: true });
UDT_CONT_Empresa.columns.add('rfc', SQL.VarChar(13), { nullable: true });
UDT_CONT_Empresa.columns.add('razon_social', SQL.VarChar(100), { nullable: true });
UDT_CONT_Empresa.columns.add('figura_juridica', SQL.Int, { nullable: true });
UDT_CONT_Empresa.columns.add('id_actividad_economica', SQL.Int, { nullable: true });
UDT_CONT_Empresa.columns.add('pagina_web', SQL.VarChar(30), { nullable: true });
UDT_CONT_Empresa.columns.add('econ_ventas_totales_cantidad', SQL.Money, { nullable: true });
UDT_CONT_Empresa.columns.add('econ_ventas_totales_unidad', SQL.VarChar(20), { nullable: true });
UDT_CONT_Empresa.columns.add('econ_revolvencia_negocio', SQL.Char(10), { nullable: true });
UDT_CONT_Empresa.columns.add('econ_numero_empleados', SQL.Int, { nullable: true });
UDT_CONT_Empresa.columns.add('tiempo_actividad_inicio', SQL.Date, { nullable: true });
UDT_CONT_Empresa.columns.add('tiempo_actividad_final', SQL.Date, { nullable: true });
UDT_CONT_Empresa.columns.add('giro', SQL.VarChar(30), { nullable: true });
UDT_CONT_Empresa.columns.add('econ_registro_egresos_ingresos', SQL.Bit, { nullable: true });
UDT_CONT_Empresa.columns.add('acta_constitutiva', SQL.Text, { nullable: true });

//#endregion
UDT_SPLD_DatosCliente.columns.add('id', SQL.Int, { nullable: true });
UDT_SPLD_DatosCliente.columns.add('id_cliente', SQL.Int, { nullable: true });
UDT_SPLD_DatosCliente.columns.add('desempenia_funcion_publica', SQL.Bit, { nullable: true });
UDT_SPLD_DatosCliente.columns.add('desempenia_funcion_publica_cargo', SQL.VarChar(100), { nullable: true });
UDT_SPLD_DatosCliente.columns.add('desempenia_funcion_publica_dependencia', SQL.VarChar(100), { nullable: true });
UDT_SPLD_DatosCliente.columns.add('familiar_desempenia_funcion_publica', SQL.Bit, { nullable: true })
UDT_SPLD_DatosCliente.columns.add('familiar_desempenia_funcion_publica_cargo', SQL.VarChar(100), { nullable: true });
UDT_SPLD_DatosCliente.columns.add('familiar_desempenia_funcion_publica_dependencia', SQL.VarChar(100), { nullable: true });
UDT_SPLD_DatosCliente.columns.add('familiar_desempenia_funcion_publica_nombre', SQL.VarChar(255), { nullable: true });
UDT_SPLD_DatosCliente.columns.add('familiar_desempenia_funcion_publica_paterno', SQL.VarChar(255), { nullable: true });
UDT_SPLD_DatosCliente.columns.add('familiar_desempenia_funcion_publica_materno', SQL.VarChar(255), { nullable: true });
UDT_SPLD_DatosCliente.columns.add('familiar_desempenia_funcion_publica_parentesco', SQL.VarChar(50), { nullable: true });
UDT_SPLD_DatosCliente.columns.add('id_instrumento_monetario', SQL.Int, { nullable: true });
//#endregion

//#region UDT_CONT_FirmaElectronica
UDT_CONT_FirmaElectronica.columns.add('id_firma_electronica', SQL.Int, { nullable: true });
UDT_CONT_FirmaElectronica.columns.add('id_persona', SQL.Int, { nullable: true });
UDT_CONT_FirmaElectronica.columns.add('fiel', SQL.VarChar(200), { nullable: true });
//#endregion

//#region UDT_Solicitud
UDT_Solicitud.columns.add('id', SQL.Int, { nullable: true });
UDT_Solicitud.columns.add('id_cliente', SQL.Int, { nullable: true });
UDT_Solicitud.columns.add('id_oficial', SQL.Int, { nullable: true });
UDT_Solicitud.columns.add('id_producto', SQL.Int, { nullable: true });
UDT_Solicitud.columns.add('id_disposicion', SQL.Int, { nullable: true });
UDT_Solicitud.columns.add('monto_solicitado', SQL.Money, { nullable: true });
UDT_Solicitud.columns.add('monto_autorizado', SQL.Money, { nullable: true });
UDT_Solicitud.columns.add('periodicidad', SQL.VarChar(20), { nullable: true });
UDT_Solicitud.columns.add('plazo', SQL.Int, { nullable: true });
UDT_Solicitud.columns.add('estatus', SQL.Char(30), { nullable: true });
UDT_Solicitud.columns.add('sub_estatus', SQL.Char(25), { nullable: true });
UDT_Solicitud.columns.add('fecha_primer_pago', SQL.Date, { nullable: true });
UDT_Solicitud.columns.add('fecha_entrega', SQL.Date, { nullable: true });
UDT_Solicitud.columns.add('medio_desembolso', SQL.Char(3), { nullable: true });
UDT_Solicitud.columns.add('garantia_liquida', SQL.Int, { nullable: true });
UDT_Solicitud.columns.add('fecha_creacion', SQL.Date, { nullable: true });
UDT_Solicitud.columns.add('id_oficina', SQL.Int, { nullable: true });
UDT_Solicitud.columns.add('garantia_liquida_financiable', SQL.Bit, { nullable: true });
UDT_Solicitud.columns.add('id_producto_maestro', SQL.Int, { nullable: true });
UDT_Solicitud.columns.add('tasa_anual', SQL.Decimal(18, 2), { nullable: true });
UDT_Solicitud.columns.add('seguro_financiado', SQL.Bit, { nullable: true });
//#endregion

//#region Cliente
Cliente.columns.add('id', SQL.Int, { nullable: true });
Cliente.columns.add('ciclo', SQL.Int, { nullable: true });
Cliente.columns.add('estatus', SQL.Char(20), { nullable: true });
Cliente.columns.add('sub_estatus', SQL.Char(25), { nullable: true });
Cliente.columns.add('id_oficial_credito', SQL.Int, { nullable: true });
Cliente.columns.add('id_oficina', SQL.Int, { nullable: true });
Cliente.columns.add('tipo_cliente', SQL.Int, { nullable: true });
//#endregion

//#region GrupoSolidario
GrupoSolidario.columns.add('id_cliente', SQL.Int, { nullable: true });
GrupoSolidario.columns.add('nombre', SQL.VarChar(150), { nullable: true });
GrupoSolidario.columns.add('id_direccion', SQL.Int, { nullable: true });
GrupoSolidario.columns.add('reunion_dia', SQL.Char(10), { nullable: true });
GrupoSolidario.columns.add('reunion_hora', SQL.Char(10), { nullable: true });
//#endregion


//#region Direccion
Direccion.columns.add('id', SQL.Int, { nullable: true });
Direccion.columns.add('calle', SQL.VarChar(150), { nullable: true });
Direccion.columns.add('pais', SQL.Int, { nullable: true });
Direccion.columns.add('estado', SQL.Int, { nullable: true });
Direccion.columns.add('municipio', SQL.Int, { nullable: true });
Direccion.columns.add('localidad', SQL.Int, { nullable: true });
Direccion.columns.add('colonia', SQL.Int, { nullable: true });
Direccion.columns.add('referencia', SQL.VarChar(150), { nullable: true });
Direccion.columns.add('numero_exterior', SQL.VarChar(15), { nullable: true });
Direccion.columns.add('numero_interior', SQL.VarChar(15), { nullable: true });
Direccion.columns.add('vialidad', SQL.Int, { nullable: true });
//#endregion

//#region UDT_SolicitudDetalle
UDT_SolicitudDetalle.columns.add('id_individual', SQL.Int, { nullable: true });
UDT_SolicitudDetalle.columns.add('id_solicitud', SQL.Int, { nullable: true });
UDT_SolicitudDetalle.columns.add('id_persona', SQL.Int, { nullable: true });
UDT_SolicitudDetalle.columns.add('nombre', SQL.VarChar(200), { nullable: true });
UDT_SolicitudDetalle.columns.add('apellido_paterno', SQL.VarChar(200), { nullable: true });
UDT_SolicitudDetalle.columns.add('apellido_materno', SQL.VarChar(200), { nullable: true });
UDT_SolicitudDetalle.columns.add('estatus', SQL.Char(30), { nullable: true });
UDT_SolicitudDetalle.columns.add('sub_estatus', SQL.Char(25), { nullable: true });
UDT_SolicitudDetalle.columns.add('cargo', SQL.VarChar(15), { nullable: true });
UDT_SolicitudDetalle.columns.add('monto_solicitado', SQL.Money, { nullable: true });
UDT_SolicitudDetalle.columns.add('monto_sugerido', SQL.Money, { nullable: true });
UDT_SolicitudDetalle.columns.add('monto_autorizado', SQL.Money, { nullable: true });
UDT_SolicitudDetalle.columns.add('econ_id_actividad_economica', SQL.Int, { nullable: true });
UDT_SolicitudDetalle.columns.add('curp_fisica', SQL.Int, { nullable: true });
UDT_SolicitudDetalle.columns.add('motivo', SQL.Int, { nullable: true });
UDT_SolicitudDetalle.columns.add('id_cata_medio_desembolso', SQL.Int, { nullable: true });
UDT_SolicitudDetalle.columns.add('monto_garantia_financiable', SQL.Decimal(18, 2), { nullable: true });
//#endregion

//#region UDT_CLIE_DetalleSeguro
UDT_CLIE_DetalleSeguro.columns.add('id', SQL.Int, { nullable: true });
UDT_CLIE_DetalleSeguro.columns.add('id_solicitud', SQL.Int, { nullable: true });
UDT_CLIE_DetalleSeguro.columns.add('id_individual', SQL.Int, { nullable: true });
UDT_CLIE_DetalleSeguro.columns.add('id_seguro', SQL.Int, { nullable: true });
UDT_CLIE_DetalleSeguro.columns.add('id_seguro_asignacion', SQL.Int, { nullable: true });
UDT_CLIE_DetalleSeguro.columns.add('nombre_socia', SQL.VarChar(500), { nullable: true });
UDT_CLIE_DetalleSeguro.columns.add('nombre_beneficiario', SQL.VarChar(500), { nullable: true });
UDT_CLIE_DetalleSeguro.columns.add('parentesco', SQL.VarChar(200), { nullable: true });
UDT_CLIE_DetalleSeguro.columns.add('porcentaje', SQL.Money, { nullable: true });
UDT_CLIE_DetalleSeguro.columns.add('costo_seguro', SQL.Money, { nullable: true });
UDT_CLIE_DetalleSeguro.columns.add('incluye_saldo_deudor', SQL.Bit, { nullable: true });
UDT_CLIE_DetalleSeguro.columns.add('aplica_seguro_financiado', SQL.Bit, { nullable: true });
UDT_CLIE_DetalleSeguro.columns.add('activo', SQL.Bit, { nullable: true });
//#endregion

//#region UDT_CLIE_ReferenciasPersonales
UDT_CLIE_ReferenciasPersonales.columns.add('id', SQL.Int, { nullable: true });
UDT_CLIE_ReferenciasPersonales.columns.add('id_referencia', SQL.Int, { nullable: true });
UDT_CLIE_ReferenciasPersonales.columns.add('id_cliente', SQL.Int, { nullable: true });
UDT_CLIE_ReferenciasPersonales.columns.add('id_empleado', SQL.Int, { nullable: true });
UDT_CLIE_ReferenciasPersonales.columns.add('parentesco', SQL.Char(20), { nullable: true });
UDT_CLIE_ReferenciasPersonales.columns.add('tipo_relacion', SQL.Char(20), { nullable: true });
UDT_CLIE_ReferenciasPersonales.columns.add('tipo', SQL.Char(7), { nullable: true });
UDT_CLIE_ReferenciasPersonales.columns.add('eliminado', SQL.Bit, { nullable: true });
//#endregion

//#region UDT_OTOR_GarantiaPrendaria
UDT_OTOR_GarantiaPrendaria.columns.add('id', SQL.Int, { nullable: true });
UDT_OTOR_GarantiaPrendaria.columns.add('id_cliente', SQL.Int, { nullable: true });
UDT_OTOR_GarantiaPrendaria.columns.add('id_contrato', SQL.Int, { nullable: true });
UDT_OTOR_GarantiaPrendaria.columns.add('id_solicitud_prestamo', SQL.Int, { nullable: true });
UDT_OTOR_GarantiaPrendaria.columns.add('tipo_garantia', SQL.VarChar(12), { nullable: true });
UDT_OTOR_GarantiaPrendaria.columns.add('subtipo_garantia', SQL.VarChar(12), { nullable: true });
UDT_OTOR_GarantiaPrendaria.columns.add('descripcion', SQL.Text, { nullable: true });
UDT_OTOR_GarantiaPrendaria.columns.add('valor_estimado', SQL.Money, { nullable: true });
UDT_OTOR_GarantiaPrendaria.columns.add('id_archivo', SQL.Int, { nullable: true });
UDT_OTOR_GarantiaPrendaria.columns.add('archivo', SQL.Text, { nullable: true });
UDT_OTOR_GarantiaPrendaria.columns.add('extension', SQL.VarChar(12), { nullable: true });
//#endregion

//#region UDT_OTOR_TuHogarConConserva
UDT_OTOR_TuHogarConConserva.columns.add('id', SQL.Int, { nullable: true });
UDT_OTOR_TuHogarConConserva.columns.add('id_solicitud_prestamo', SQL.Int, { nullable: true });
UDT_OTOR_TuHogarConConserva.columns.add('domicilio_actual', SQL.Bit, { nullable: true });
UDT_OTOR_TuHogarConConserva.columns.add('latitud', SQL.VarChar(100), { nullable: true });
UDT_OTOR_TuHogarConConserva.columns.add('longitud', SQL.VarChar(100), { nullable: true });
UDT_OTOR_TuHogarConConserva.columns.add('id_tipo_obra_financiar', SQL.Int, { nullable: true });
UDT_OTOR_TuHogarConConserva.columns.add('tipo_mejora', SQL.VarChar(700), { nullable: true });
UDT_OTOR_TuHogarConConserva.columns.add('total_score', SQL.Int, { nullable: true });
UDT_OTOR_TuHogarConConserva.columns.add('id_color_semaforo_fico_score', SQL.Int, { nullable: true });
UDT_OTOR_TuHogarConConserva.columns.add('id_origen_ingresos', SQL.Int, { nullable: true });
UDT_OTOR_TuHogarConConserva.columns.add('activo', SQL.Bit, { nullable: true });
//#endregion

//#region Columns UDT_CLIE_TuHogarConConservaCoacreditado
UDT_CLIE_TuHogarConConservaCoacreditado.columns.add('id', SQL.Int, { nullable: true });
UDT_CLIE_TuHogarConConservaCoacreditado.columns.add('id_tuhogar_conserva', SQL.Int, { nullable: true });
UDT_CLIE_TuHogarConConservaCoacreditado.columns.add('id_coacreditado', SQL.Int, { nullable: true });
UDT_CLIE_TuHogarConConservaCoacreditado.columns.add('total_score_coacreditado', SQL.Int, { nullable: true });
UDT_CLIE_TuHogarConConservaCoacreditado.columns.add('id_color_semaforo_fico_score_coacreditado', SQL.Int, { nullable: true });
UDT_CLIE_TuHogarConConservaCoacreditado.columns.add('activo', SQL.Bit, { nullable: true });
//#endregion

//#region Columns UDT_CONT_DireccionContacto
UDT_CONT_DireccionContacto.columns.add('id', SQL.Int, { nullable: true });
UDT_CONT_DireccionContacto.columns.add('tipo', SQL.Char(12), { nullable: true });
UDT_CONT_DireccionContacto.columns.add('id_pais', SQL.Int, { nullable: true });
UDT_CONT_DireccionContacto.columns.add('id_estado', SQL.Int, { nullable: true });
UDT_CONT_DireccionContacto.columns.add('id_municipio', SQL.Int, { nullable: true });
UDT_CONT_DireccionContacto.columns.add('id_localidad', SQL.Int, { nullable: true });
UDT_CONT_DireccionContacto.columns.add('id_asentamiento', SQL.Int, { nullable: true });
UDT_CONT_DireccionContacto.columns.add('direccion', SQL.VarChar(150), { nullable: true });
UDT_CONT_DireccionContacto.columns.add('numero_exterior', SQL.VarChar(15), { nullable: true });
UDT_CONT_DireccionContacto.columns.add('numero_interior', SQL.VarChar(15), { nullable: true });
UDT_CONT_DireccionContacto.columns.add('referencia', SQL.VarChar(150), { nullable: true });
UDT_CONT_DireccionContacto.columns.add('casa_situacion', SQL.Int, { nullable: true });
UDT_CONT_DireccionContacto.columns.add('tiempo_habitado_inicio', SQL.DateTime, { nullable: true });
UDT_CONT_DireccionContacto.columns.add('tiempo_habitado_final', SQL.DateTime, { nullable: true });
UDT_CONT_DireccionContacto.columns.add('correo_electronico', SQL.VarChar(150), { nullable: true });
UDT_CONT_DireccionContacto.columns.add('num_interior', SQL.Int, { nullable: true });
UDT_CONT_DireccionContacto.columns.add('num_exterior', SQL.Int, { nullable: true });
UDT_CONT_DireccionContacto.columns.add('id_vialidad', SQL.Int, { nullable: true });
UDT_CONT_DireccionContacto.columns.add('domicilio_actual', SQL.Int, { nullable: true });
//#endregion
//region UDT_CONT_Direcciones
UDT_CONT_Direcciones.columns.add('id', SQL.Int, { nullable: true });
UDT_CONT_Direcciones.columns.add('tipo', SQL.Char(12), { nullable: true });
UDT_CONT_Direcciones.columns.add('id_pais', SQL.Int, { nullable: true });
UDT_CONT_Direcciones.columns.add('id_estado', SQL.Int, { nullable: true });
UDT_CONT_Direcciones.columns.add('id_municipio', SQL.Int, { nullable: true });
UDT_CONT_Direcciones.columns.add('id_localidad', SQL.Int, { nullable: true });
UDT_CONT_Direcciones.columns.add('id_asentamiento', SQL.Int, { nullable: true });
UDT_CONT_Direcciones.columns.add('direccion', SQL.VarChar(150), { nullable: true });
UDT_CONT_Direcciones.columns.add('numero_exterior', SQL.VarChar(15), { nullable: true });
UDT_CONT_Direcciones.columns.add('numero_interior', SQL.VarChar(15), { nullable: true });
UDT_CONT_Direcciones.columns.add('referencia', SQL.VarChar(150), { nullable: true });
UDT_CONT_Direcciones.columns.add('casa_situacion', SQL.Int, { nullable: true });
UDT_CONT_Direcciones.columns.add('tiempo_habitado_inicio', SQL.DateTime, { nullable: true });
UDT_CONT_Direcciones.columns.add('tiempo_habitado_final', SQL.DateTime, { nullable: true });
UDT_CONT_Direcciones.columns.add('correo_electronico', SQL.VarChar(150), { nullable: true });
UDT_CONT_Direcciones.columns.add('num_interior', SQL.Int, { nullable: true });
UDT_CONT_Direcciones.columns.add('num_exterior', SQL.Int, { nullable: true });
UDT_CONT_Direcciones.columns.add('id_vialidad', SQL.Int, { nullable: true });
//#endregion

//#region UDT_CONT_CURP
UDT_CONT_CURP.columns.add('id', SQL.Int, { nullable: true });
UDT_CONT_CURP.columns.add('id_identificacion_oficial', SQL.Int, { nullable: true });
UDT_CONT_CURP.columns.add('path_archivo', SQL.Text, { nullable: true });
UDT_CONT_CURP.columns.add('xml_datos', SQL.Text, { nullable: true });
UDT_CONT_CURP.columns.add('archivo_guardado', SQL.Bit, { nullable: true });
UDT_CONT_CURP.columns.add('tipo_archivo', SQL.Char(3), { nullable: true });
//#endregion

//#region UDT_CONT_IFE
UDT_CONT_IFE.columns.add('id', SQL.Int, { nullable: true });
UDT_CONT_IFE.columns.add('id_identificacion_oficial', SQL.VarChar(18), { nullable: true });
UDT_CONT_IFE.columns.add('numero_emision', SQL.Char(2), { nullable: true });
UDT_CONT_IFE.columns.add('numero_vertical_ocr', SQL.VarChar(13), { nullable: true });
//#endregion

export const cleanTable = (table: SQL.Table) => {
    for (const element of table.rows) {
        table.rows.pop()
    }
    table.rows.pop()
}
