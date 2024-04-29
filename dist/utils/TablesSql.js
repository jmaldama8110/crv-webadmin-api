"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanTable = exports.UDT_SPLD_DatosCliente = exports.UDT_SolicitudDetalle = exports.UDT_Solicitud = exports.UDT_OTOR_TuHogarConConserva = exports.UDT_OTOR_GarantiaPrendaria = exports.UDT_CONT_Telefonos = exports.UDT_CONT_Persona = exports.UDT_CONT_Oficinas = exports.UDT_CONT_Negocios = exports.UDT_CONT_IFE = exports.UDT_CONT_Identificaciones = exports.UDT_CONT_FirmaElectronica = exports.UDT_CONT_Empresa = exports.UDT_CONT_DireccionContacto = exports.UDT_CONT_Direcciones = exports.UDT_CONT_CURP = exports.UDT_CLIE_TuHogarConConservaCoacreditado = exports.UDT_CLIE_DetalleSeguro = exports.UDT_CLIE_ReferenciasPersonales = exports.UDT_CLIE_DatoBancario = exports.UDT_CLIE_Solicitud = exports.UDT_CLIE_Individual = exports.UTD_CLIE_Clientes = exports.GrupoSolidario = exports.Direccion = exports.Cliente = void 0;
const mssql_1 = __importDefault(require("mssql"));
exports.Cliente = new mssql_1.default.Table();
exports.Direccion = new mssql_1.default.Table();
exports.GrupoSolidario = new mssql_1.default.Table();
exports.UTD_CLIE_Clientes = new mssql_1.default.Table();
exports.UDT_CLIE_Individual = new mssql_1.default.Table();
exports.UDT_CLIE_Solicitud = new mssql_1.default.Table();
exports.UDT_CLIE_DatoBancario = new mssql_1.default.Table();
exports.UDT_CLIE_ReferenciasPersonales = new mssql_1.default.Table();
exports.UDT_CLIE_DetalleSeguro = new mssql_1.default.Table();
exports.UDT_CLIE_TuHogarConConservaCoacreditado = new mssql_1.default.Table();
exports.UDT_CONT_CURP = new mssql_1.default.Table();
exports.UDT_CONT_Direcciones = new mssql_1.default.Table();
exports.UDT_CONT_DireccionContacto = new mssql_1.default.Table();
exports.UDT_CONT_Empresa = new mssql_1.default.Table();
exports.UDT_CONT_FirmaElectronica = new mssql_1.default.Table();
exports.UDT_CONT_Identificaciones = new mssql_1.default.Table();
exports.UDT_CONT_IFE = new mssql_1.default.Table();
exports.UDT_CONT_Negocios = new mssql_1.default.Table();
exports.UDT_CONT_Oficinas = new mssql_1.default.Table();
exports.UDT_CONT_Persona = new mssql_1.default.Table();
exports.UDT_CONT_Telefonos = new mssql_1.default.Table();
exports.UDT_OTOR_GarantiaPrendaria = new mssql_1.default.Table();
exports.UDT_OTOR_TuHogarConConserva = new mssql_1.default.Table();
exports.UDT_Solicitud = new mssql_1.default.Table();
exports.UDT_SolicitudDetalle = new mssql_1.default.Table();
exports.UDT_SPLD_DatosCliente = new mssql_1.default.Table();
exports.UDT_CONT_Oficinas.columns.add('id', mssql_1.default.Int, { nullable: true });
exports.UDT_CONT_Oficinas.columns.add('id_empresa', mssql_1.default.Int, { nullable: true });
exports.UDT_CONT_Oficinas.columns.add('id_direccion', mssql_1.default.Int, { nullable: true });
exports.UDT_CONT_Oficinas.columns.add('matriz', mssql_1.default.Bit, { nullable: true });
exports.UDT_CONT_Oficinas.columns.add('nombre_oficina', mssql_1.default.VarChar(150), { nullable: true });
exports.UDT_CONT_Oficinas.columns.add('funcion_oficina', mssql_1.default.VarChar(50), { nullable: true });
exports.UDT_CONT_Oficinas.columns.add('email_sucursal', mssql_1.default.VarChar(100), { nullable: true });
exports.UDT_CONT_Oficinas.columns.add('horario', mssql_1.default.VarChar(100), { nullable: true });
exports.UDT_CONT_Oficinas.columns.add('tipo_local', mssql_1.default.VarChar(80), { nullable: true });
exports.UDT_CONT_Oficinas.columns.add('dias_laborales', mssql_1.default.VarChar(100), { nullable: true });
exports.UDT_CONT_Oficinas.columns.add('descripcion', mssql_1.default.Text, { nullable: true });
//#region UDT_CONT_Persona
exports.UDT_CONT_Persona.columns.add('id', mssql_1.default.Int, { nullable: true });
exports.UDT_CONT_Persona.columns.add('nombre', mssql_1.default.VarChar(50), { nullable: true });
exports.UDT_CONT_Persona.columns.add('apellido_paterno', mssql_1.default.VarChar(30), { nullable: true });
exports.UDT_CONT_Persona.columns.add('apellido_materno', mssql_1.default.VarChar(30), { nullable: true });
exports.UDT_CONT_Persona.columns.add('fecha_nacimiento', mssql_1.default.DateTime, { nullable: true });
exports.UDT_CONT_Persona.columns.add('id_sexo', mssql_1.default.Int, { nullable: true });
exports.UDT_CONT_Persona.columns.add('id_escolaridad', mssql_1.default.Int, { nullable: true });
exports.UDT_CONT_Persona.columns.add('id_estado_civil', mssql_1.default.Int, { nullable: true });
exports.UDT_CONT_Persona.columns.add('entidad_nacimiento', mssql_1.default.VarChar(50), { nullable: true });
exports.UDT_CONT_Persona.columns.add('regimen', mssql_1.default.VarChar(20), { nullable: true });
exports.UDT_CONT_Persona.columns.add('id_oficina', mssql_1.default.Int, { nullable: true });
exports.UDT_CONT_Persona.columns.add('curp_fisica', mssql_1.default.Bit, { nullable: true });
exports.UDT_CONT_Persona.columns.add('datos_personales_diferentes_curp', mssql_1.default.Bit, { nullable: true });
exports.UDT_CONT_Persona.columns.add('id_entidad_nacimiento', mssql_1.default.Int, { nullable: true });
exports.UDT_CONT_Persona.columns.add('id_nacionalidad', mssql_1.default.Int, { nullable: true });
exports.UDT_CONT_Persona.columns.add('id_pais_nacimiento', mssql_1.default.Int, { nullable: true });
exports.UDT_CONT_Persona.columns.add('es_pep', mssql_1.default.Int, { nullable: true });
exports.UDT_CONT_Persona.columns.add('es_persona_prohibida', mssql_1.default.Int, { nullable: true });
exports.UDT_CONT_Persona.columns.add('fechaN', mssql_1.default.VarChar(100), { nullable: true });
//#endregion
//#region UDT_CONT_Identificaciones
exports.UDT_CONT_Identificaciones.columns.add('id', mssql_1.default.Int, { nullable: true });
exports.UDT_CONT_Identificaciones.columns.add('id_entidad', mssql_1.default.Int);
exports.UDT_CONT_Identificaciones.columns.add('tipo_identificacion', mssql_1.default.VarChar(25), { nullable: true });
exports.UDT_CONT_Identificaciones.columns.add('id_numero', mssql_1.default.VarChar(50), { nullable: true });
exports.UDT_CONT_Identificaciones.columns.add('id_direccion', mssql_1.default.Int, { nullable: true });
exports.UDT_CONT_Identificaciones.columns.add('tipo_entidad', mssql_1.default.Int, { nullable: true });
//#endregion
//#region UDT_CONT_Telefonos
exports.UDT_CONT_Telefonos.columns.add('id', mssql_1.default.Int, { nullable: true });
exports.UDT_CONT_Telefonos.columns.add('idcel_telefono', mssql_1.default.Char(20), { nullable: true });
exports.UDT_CONT_Telefonos.columns.add('extension', mssql_1.default.Char(10), { nullable: true });
exports.UDT_CONT_Telefonos.columns.add('tipo_telefono', mssql_1.default.Char(12), { nullable: true });
exports.UDT_CONT_Telefonos.columns.add('compania', mssql_1.default.VarChar(20), { nullable: true });
exports.UDT_CONT_Telefonos.columns.add('sms', mssql_1.default.Bit);
//#endregion
//#region UDT_CONT_Negocios
exports.UDT_CONT_Negocios.columns.add('id', mssql_1.default.Int, { nullable: true });
exports.UDT_CONT_Negocios.columns.add('id_persona', mssql_1.default.Int, { nullable: true });
exports.UDT_CONT_Negocios.columns.add('id_oficina', mssql_1.default.Int, { nullable: true });
exports.UDT_CONT_Negocios.columns.add('nombre_oficina', mssql_1.default.Char(50), { nullable: true });
exports.UDT_CONT_Negocios.columns.add('nombre_puesto', mssql_1.default.Char(50), { nullable: true });
exports.UDT_CONT_Negocios.columns.add('departamento', mssql_1.default.Char(50), { nullable: true });
exports.UDT_CONT_Negocios.columns.add('id_empresa', mssql_1.default.Int, { nullable: true });
exports.UDT_CONT_Negocios.columns.add('numero_empleados', mssql_1.default.Int, { nullable: true });
exports.UDT_CONT_Negocios.columns.add('registro_egresos_ingreso', mssql_1.default.Bit, { nullable: true });
exports.UDT_CONT_Negocios.columns.add('revolvencia_negocio', mssql_1.default.Char(10), { nullable: true });
exports.UDT_CONT_Negocios.columns.add('ventas_totales_cantidad', mssql_1.default.Money, { nullable: true });
exports.UDT_CONT_Negocios.columns.add('ventas_totales_unidad', mssql_1.default.Money, { nullable: true });
exports.UDT_CONT_Negocios.columns.add('id_actividad_economica', mssql_1.default.Int, { nullable: true });
exports.UDT_CONT_Negocios.columns.add('tiempo_actividad_inicio', mssql_1.default.Date, { nullable: true });
exports.UDT_CONT_Negocios.columns.add('tiempo_actividad_final', mssql_1.default.Date, { nullable: true });
exports.UDT_CONT_Negocios.columns.add('longitud_negocio', mssql_1.default.VarChar(100), { nullable: true });
exports.UDT_CONT_Negocios.columns.add('latitud_negocio', mssql_1.default.VarChar(100), { nullable: true });
//#endregion
//#region UTD_CLIE_Clientes
exports.UTD_CLIE_Clientes.columns.add('id', mssql_1.default.Int, { nullable: true });
exports.UTD_CLIE_Clientes.columns.add('ciclo', mssql_1.default.Int, { nullable: true });
exports.UTD_CLIE_Clientes.columns.add('estatus', mssql_1.default.Char(15), { nullable: true });
exports.UTD_CLIE_Clientes.columns.add('sub_estatus', mssql_1.default.Char(25), { nullable: true });
exports.UTD_CLIE_Clientes.columns.add('id_oficina', mssql_1.default.Int, { nullable: true });
exports.UTD_CLIE_Clientes.columns.add('id_oficial_credito', mssql_1.default.Int, { nullable: true });
exports.UTD_CLIE_Clientes.columns.add('folio_solicitud_credito', mssql_1.default.Char(10), { nullable: true });
exports.UTD_CLIE_Clientes.columns.add('documentacion_revisada', mssql_1.default.Int, { nullable: true });
//#endregion
//#region UDT_CLIE_Individual
exports.UDT_CLIE_Individual.columns.add('id_cliente', mssql_1.default.Int, { nullable: true });
exports.UDT_CLIE_Individual.columns.add('id_persona', mssql_1.default.Int, { nullable: true });
exports.UDT_CLIE_Individual.columns.add('econ_ocupacion', mssql_1.default.VarChar(50), { nullable: true });
exports.UDT_CLIE_Individual.columns.add('econ_id_actividad_economica', mssql_1.default.Int, { nullable: true });
exports.UDT_CLIE_Individual.columns.add('econ_id_destino_credito', mssql_1.default.Int, { nullable: true });
exports.UDT_CLIE_Individual.columns.add('econ_id_ubicacion_negocio', mssql_1.default.Int, { nullable: true });
exports.UDT_CLIE_Individual.columns.add('econ_id_rol_hogar', mssql_1.default.Int, { nullable: true });
exports.UDT_CLIE_Individual.columns.add('econ_id_empresa', mssql_1.default.Int, { nullable: true });
exports.UDT_CLIE_Individual.columns.add('econ_cantidad_mensual', mssql_1.default.Money, { nullable: true });
exports.UDT_CLIE_Individual.columns.add('econ_sueldo_conyugue', mssql_1.default.Money, { nullable: true });
exports.UDT_CLIE_Individual.columns.add('econ_otros_ingresos', mssql_1.default.Money, { nullable: true });
exports.UDT_CLIE_Individual.columns.add('econ_otros_gastos', mssql_1.default.Money, { nullable: true });
exports.UDT_CLIE_Individual.columns.add('econ_familiares_extranjeros', mssql_1.default.Bit, { nullable: true });
exports.UDT_CLIE_Individual.columns.add('econ_parentesco', mssql_1.default.VarChar(20), { nullable: true });
exports.UDT_CLIE_Individual.columns.add('econ_envia_dinero', mssql_1.default.Bit, { nullable: true });
exports.UDT_CLIE_Individual.columns.add('econ_dependientes_economicos', mssql_1.default.Int, { nullable: true });
exports.UDT_CLIE_Individual.columns.add('econ_pago_casa', mssql_1.default.Money, { nullable: true });
exports.UDT_CLIE_Individual.columns.add('econ_gastos_vivienda', mssql_1.default.Money, { nullable: true });
exports.UDT_CLIE_Individual.columns.add('econ_gastos_familiares', mssql_1.default.Money, { nullable: true });
exports.UDT_CLIE_Individual.columns.add('econ_gastos_transporte', mssql_1.default.Money, { nullable: true });
exports.UDT_CLIE_Individual.columns.add('credito_anteriormente', mssql_1.default.Bit, { nullable: true });
exports.UDT_CLIE_Individual.columns.add('mejorado_ingreso', mssql_1.default.Bit, { nullable: true });
exports.UDT_CLIE_Individual.columns.add('lengua_indigena', mssql_1.default.Bit, { nullable: true });
exports.UDT_CLIE_Individual.columns.add('habilidad_diferente', mssql_1.default.Bit, { nullable: true });
exports.UDT_CLIE_Individual.columns.add('utiliza_internet', mssql_1.default.Bit, { nullable: true });
exports.UDT_CLIE_Individual.columns.add('utiliza_redes_sociales', mssql_1.default.Bit, { nullable: true });
exports.UDT_CLIE_Individual.columns.add('id_actividad_economica', mssql_1.default.Int, { nullable: true });
exports.UDT_CLIE_Individual.columns.add('id_ocupacion', mssql_1.default.Int, { nullable: true });
exports.UDT_CLIE_Individual.columns.add('id_profesion', mssql_1.default.Int, { nullable: true });
exports.UDT_CLIE_Individual.columns.add('id_tipo_red_social', mssql_1.default.Int, { nullable: true });
exports.UDT_CLIE_Individual.columns.add('usuario_red_social', mssql_1.default.VarChar(30), { nullable: true });
exports.UDT_CLIE_Individual.columns.add('econ_renta', mssql_1.default.Money, { nullable: true });
exports.UDT_CLIE_Individual.columns.add('vivienda_piso', mssql_1.default.Bit, { nullable: true });
exports.UDT_CLIE_Individual.columns.add('vivienda_techo_losa', mssql_1.default.Bit, { nullable: true });
exports.UDT_CLIE_Individual.columns.add('vivienda_bano', mssql_1.default.Bit, { nullable: true });
exports.UDT_CLIE_Individual.columns.add('vivienda_letrina', mssql_1.default.Bit, { nullable: true });
exports.UDT_CLIE_Individual.columns.add('vivienda_block', mssql_1.default.Bit, { nullable: true });
exports.UDT_CLIE_Individual.columns.add('longitud_titular', mssql_1.default.VarChar(100), { nullable: true });
exports.UDT_CLIE_Individual.columns.add('latitud_titular', mssql_1.default.VarChar(100), { nullable: true });
//#endregion
//#region UDT_CLIE_Solicitud
exports.UDT_CLIE_Solicitud.columns.add('id_solicitud', mssql_1.default.Int, { nullable: true });
exports.UDT_CLIE_Solicitud.columns.add('id_cliente', mssql_1.default.Int, { nullable: true });
exports.UDT_CLIE_Solicitud.columns.add('id_oficial_credito', mssql_1.default.Int, { nullable: true });
exports.UDT_CLIE_Solicitud.columns.add('id_oficina', mssql_1.default.Int, { nullable: true });
exports.UDT_CLIE_Solicitud.columns.add('estatus', mssql_1.default.Char(15), { nullable: true });
exports.UDT_CLIE_Solicitud.columns.add('sub_estatus', mssql_1.default.Char(25), { nullable: true });
exports.UDT_CLIE_Solicitud.columns.add('id_solicitud_nueva', mssql_1.default.Int, { nullable: true });
//#endregion
//#region UDT_CLIE_DatoBancario
exports.UDT_CLIE_DatoBancario.columns.add('id', mssql_1.default.Int, { nullable: true });
exports.UDT_CLIE_DatoBancario.columns.add('id_cliente', mssql_1.default.Int, { nullable: true });
exports.UDT_CLIE_DatoBancario.columns.add('id_banco', mssql_1.default.Int, { nullable: true });
exports.UDT_CLIE_DatoBancario.columns.add('clave_banco', mssql_1.default.VarChar(50), { nullable: true });
exports.UDT_CLIE_DatoBancario.columns.add('nombre_banco', mssql_1.default.VarChar(100), { nullable: true });
exports.UDT_CLIE_DatoBancario.columns.add('id_tipo_cuenta', mssql_1.default.Int, { nullable: true });
exports.UDT_CLIE_DatoBancario.columns.add('clave_tipo_cuenta', mssql_1.default.VarChar(100), { nullable: true });
exports.UDT_CLIE_DatoBancario.columns.add('nombre_tipo_cuenta', mssql_1.default.VarChar(100), { nullable: true });
exports.UDT_CLIE_DatoBancario.columns.add('numero_cuenta', mssql_1.default.VarChar(50), { nullable: true });
exports.UDT_CLIE_DatoBancario.columns.add('principal', mssql_1.default.Bit, { nullable: true });
exports.UDT_CLIE_DatoBancario.columns.add('activo', mssql_1.default.Bit, { nullable: true });
//#endregion
//#region UDT_SPLD_DatosCliente
//#region UDT_CONT_Empresa
exports.UDT_CONT_Empresa.columns.add('id', mssql_1.default.Int, { nullable: true });
exports.UDT_CONT_Empresa.columns.add('nombre_comercial', mssql_1.default.VarChar(80), { nullable: true });
exports.UDT_CONT_Empresa.columns.add('rfc', mssql_1.default.VarChar(13), { nullable: true });
exports.UDT_CONT_Empresa.columns.add('razon_social', mssql_1.default.VarChar(100), { nullable: true });
exports.UDT_CONT_Empresa.columns.add('figura_juridica', mssql_1.default.Int, { nullable: true });
exports.UDT_CONT_Empresa.columns.add('id_actividad_economica', mssql_1.default.Int, { nullable: true });
exports.UDT_CONT_Empresa.columns.add('pagina_web', mssql_1.default.VarChar(30), { nullable: true });
exports.UDT_CONT_Empresa.columns.add('econ_ventas_totales_cantidad', mssql_1.default.Money, { nullable: true });
exports.UDT_CONT_Empresa.columns.add('econ_ventas_totales_unidad', mssql_1.default.VarChar(20), { nullable: true });
exports.UDT_CONT_Empresa.columns.add('econ_revolvencia_negocio', mssql_1.default.Char(10), { nullable: true });
exports.UDT_CONT_Empresa.columns.add('econ_numero_empleados', mssql_1.default.Int, { nullable: true });
exports.UDT_CONT_Empresa.columns.add('tiempo_actividad_inicio', mssql_1.default.Date, { nullable: true });
exports.UDT_CONT_Empresa.columns.add('tiempo_actividad_final', mssql_1.default.Date, { nullable: true });
exports.UDT_CONT_Empresa.columns.add('giro', mssql_1.default.VarChar(30), { nullable: true });
exports.UDT_CONT_Empresa.columns.add('econ_registro_egresos_ingresos', mssql_1.default.Bit, { nullable: true });
exports.UDT_CONT_Empresa.columns.add('acta_constitutiva', mssql_1.default.Text, { nullable: true });
//#endregion
exports.UDT_SPLD_DatosCliente.columns.add('id', mssql_1.default.Int, { nullable: true });
exports.UDT_SPLD_DatosCliente.columns.add('id_cliente', mssql_1.default.Int, { nullable: true });
exports.UDT_SPLD_DatosCliente.columns.add('desempenia_funcion_publica', mssql_1.default.Bit, { nullable: true });
exports.UDT_SPLD_DatosCliente.columns.add('desempenia_funcion_publica_cargo', mssql_1.default.VarChar(100), { nullable: true });
exports.UDT_SPLD_DatosCliente.columns.add('desempenia_funcion_publica_dependencia', mssql_1.default.VarChar(100), { nullable: true });
exports.UDT_SPLD_DatosCliente.columns.add('familiar_desempenia_funcion_publica', mssql_1.default.Bit, { nullable: true });
exports.UDT_SPLD_DatosCliente.columns.add('familiar_desempenia_funcion_publica_cargo', mssql_1.default.VarChar(100), { nullable: true });
exports.UDT_SPLD_DatosCliente.columns.add('familiar_desempenia_funcion_publica_dependencia', mssql_1.default.VarChar(100), { nullable: true });
exports.UDT_SPLD_DatosCliente.columns.add('familiar_desempenia_funcion_publica_nombre', mssql_1.default.VarChar(255), { nullable: true });
exports.UDT_SPLD_DatosCliente.columns.add('familiar_desempenia_funcion_publica_paterno', mssql_1.default.VarChar(255), { nullable: true });
exports.UDT_SPLD_DatosCliente.columns.add('familiar_desempenia_funcion_publica_materno', mssql_1.default.VarChar(255), { nullable: true });
exports.UDT_SPLD_DatosCliente.columns.add('familiar_desempenia_funcion_publica_parentesco', mssql_1.default.VarChar(50), { nullable: true });
exports.UDT_SPLD_DatosCliente.columns.add('id_instrumento_monetario', mssql_1.default.Int, { nullable: true });
//#endregion
//#region UDT_CONT_FirmaElectronica
exports.UDT_CONT_FirmaElectronica.columns.add('id_firma_electronica', mssql_1.default.Int, { nullable: true });
exports.UDT_CONT_FirmaElectronica.columns.add('id_persona', mssql_1.default.Int, { nullable: true });
exports.UDT_CONT_FirmaElectronica.columns.add('fiel', mssql_1.default.VarChar(200), { nullable: true });
//#endregion
//#region UDT_Solicitud
exports.UDT_Solicitud.columns.add('id', mssql_1.default.Int, { nullable: true });
exports.UDT_Solicitud.columns.add('id_cliente', mssql_1.default.Int, { nullable: true });
exports.UDT_Solicitud.columns.add('id_oficial', mssql_1.default.Int, { nullable: true });
exports.UDT_Solicitud.columns.add('id_producto', mssql_1.default.Int, { nullable: true });
exports.UDT_Solicitud.columns.add('id_disposicion', mssql_1.default.Int, { nullable: true });
exports.UDT_Solicitud.columns.add('monto_solicitado', mssql_1.default.Money, { nullable: true });
exports.UDT_Solicitud.columns.add('monto_autorizado', mssql_1.default.Money, { nullable: true });
exports.UDT_Solicitud.columns.add('periodicidad', mssql_1.default.VarChar(20), { nullable: true });
exports.UDT_Solicitud.columns.add('plazo', mssql_1.default.Int, { nullable: true });
exports.UDT_Solicitud.columns.add('estatus', mssql_1.default.Char(30), { nullable: true });
exports.UDT_Solicitud.columns.add('sub_estatus', mssql_1.default.Char(25), { nullable: true });
exports.UDT_Solicitud.columns.add('fecha_primer_pago', mssql_1.default.Date, { nullable: true });
exports.UDT_Solicitud.columns.add('fecha_entrega', mssql_1.default.Date, { nullable: true });
exports.UDT_Solicitud.columns.add('medio_desembolso', mssql_1.default.Char(3), { nullable: true });
exports.UDT_Solicitud.columns.add('garantia_liquida', mssql_1.default.Int, { nullable: true });
exports.UDT_Solicitud.columns.add('fecha_creacion', mssql_1.default.Date, { nullable: true });
exports.UDT_Solicitud.columns.add('id_oficina', mssql_1.default.Int, { nullable: true });
exports.UDT_Solicitud.columns.add('garantia_liquida_financiable', mssql_1.default.Bit, { nullable: true });
exports.UDT_Solicitud.columns.add('id_producto_maestro', mssql_1.default.Int, { nullable: true });
exports.UDT_Solicitud.columns.add('tasa_anual', mssql_1.default.Decimal(18, 2), { nullable: true });
exports.UDT_Solicitud.columns.add('seguro_financiado', mssql_1.default.Bit, { nullable: true });
//#endregion
//#region Cliente
exports.Cliente.columns.add('id', mssql_1.default.Int, { nullable: true });
exports.Cliente.columns.add('ciclo', mssql_1.default.Int, { nullable: true });
exports.Cliente.columns.add('estatus', mssql_1.default.Char(20), { nullable: true });
exports.Cliente.columns.add('sub_estatus', mssql_1.default.Char(25), { nullable: true });
exports.Cliente.columns.add('id_oficial_credito', mssql_1.default.Int, { nullable: true });
exports.Cliente.columns.add('id_oficina', mssql_1.default.Int, { nullable: true });
exports.Cliente.columns.add('tipo_cliente', mssql_1.default.Int, { nullable: true });
//#endregion
//#region GrupoSolidario
exports.GrupoSolidario.columns.add('id_cliente', mssql_1.default.Int, { nullable: true });
exports.GrupoSolidario.columns.add('nombre', mssql_1.default.VarChar(150), { nullable: true });
exports.GrupoSolidario.columns.add('id_direccion', mssql_1.default.Int, { nullable: true });
exports.GrupoSolidario.columns.add('reunion_dia', mssql_1.default.Char(10), { nullable: true });
exports.GrupoSolidario.columns.add('reunion_hora', mssql_1.default.Char(10), { nullable: true });
//#endregion
//#region Direccion
exports.Direccion.columns.add('id', mssql_1.default.Int, { nullable: true });
exports.Direccion.columns.add('calle', mssql_1.default.VarChar(150), { nullable: true });
exports.Direccion.columns.add('pais', mssql_1.default.Int, { nullable: true });
exports.Direccion.columns.add('estado', mssql_1.default.Int, { nullable: true });
exports.Direccion.columns.add('municipio', mssql_1.default.Int, { nullable: true });
exports.Direccion.columns.add('localidad', mssql_1.default.Int, { nullable: true });
exports.Direccion.columns.add('colonia', mssql_1.default.Int, { nullable: true });
exports.Direccion.columns.add('referencia', mssql_1.default.VarChar(150), { nullable: true });
exports.Direccion.columns.add('numero_exterior', mssql_1.default.VarChar(15), { nullable: true });
exports.Direccion.columns.add('numero_interior', mssql_1.default.VarChar(15), { nullable: true });
exports.Direccion.columns.add('vialidad', mssql_1.default.Int, { nullable: true });
//#endregion
//#region UDT_SolicitudDetalle
exports.UDT_SolicitudDetalle.columns.add('id_individual', mssql_1.default.Int, { nullable: true });
exports.UDT_SolicitudDetalle.columns.add('id_solicitud', mssql_1.default.Int, { nullable: true });
exports.UDT_SolicitudDetalle.columns.add('id_persona', mssql_1.default.Int, { nullable: true });
exports.UDT_SolicitudDetalle.columns.add('nombre', mssql_1.default.VarChar(200), { nullable: true });
exports.UDT_SolicitudDetalle.columns.add('apellido_paterno', mssql_1.default.VarChar(200), { nullable: true });
exports.UDT_SolicitudDetalle.columns.add('apellido_materno', mssql_1.default.VarChar(200), { nullable: true });
exports.UDT_SolicitudDetalle.columns.add('estatus', mssql_1.default.Char(30), { nullable: true });
exports.UDT_SolicitudDetalle.columns.add('sub_estatus', mssql_1.default.Char(25), { nullable: true });
exports.UDT_SolicitudDetalle.columns.add('cargo', mssql_1.default.VarChar(15), { nullable: true });
exports.UDT_SolicitudDetalle.columns.add('monto_solicitado', mssql_1.default.Money, { nullable: true });
exports.UDT_SolicitudDetalle.columns.add('monto_sugerido', mssql_1.default.Money, { nullable: true });
exports.UDT_SolicitudDetalle.columns.add('monto_autorizado', mssql_1.default.Money, { nullable: true });
exports.UDT_SolicitudDetalle.columns.add('econ_id_actividad_economica', mssql_1.default.Int, { nullable: true });
exports.UDT_SolicitudDetalle.columns.add('curp_fisica', mssql_1.default.Int, { nullable: true });
exports.UDT_SolicitudDetalle.columns.add('motivo', mssql_1.default.Int, { nullable: true });
exports.UDT_SolicitudDetalle.columns.add('id_cata_medio_desembolso', mssql_1.default.Int, { nullable: true });
exports.UDT_SolicitudDetalle.columns.add('monto_garantia_financiable', mssql_1.default.Decimal(18, 2), { nullable: true });
//#endregion
//#region UDT_CLIE_DetalleSeguro
exports.UDT_CLIE_DetalleSeguro.columns.add('id', mssql_1.default.Int, { nullable: true });
exports.UDT_CLIE_DetalleSeguro.columns.add('id_solicitud', mssql_1.default.Int, { nullable: true });
exports.UDT_CLIE_DetalleSeguro.columns.add('id_individual', mssql_1.default.Int, { nullable: true });
exports.UDT_CLIE_DetalleSeguro.columns.add('id_seguro', mssql_1.default.Int, { nullable: true });
exports.UDT_CLIE_DetalleSeguro.columns.add('id_seguro_asignacion', mssql_1.default.Int, { nullable: true });
exports.UDT_CLIE_DetalleSeguro.columns.add('nombre_socia', mssql_1.default.VarChar(500), { nullable: true });
exports.UDT_CLIE_DetalleSeguro.columns.add('nombre_beneficiario', mssql_1.default.VarChar(500), { nullable: true });
exports.UDT_CLIE_DetalleSeguro.columns.add('parentesco', mssql_1.default.VarChar(200), { nullable: true });
exports.UDT_CLIE_DetalleSeguro.columns.add('porcentaje', mssql_1.default.Money, { nullable: true });
exports.UDT_CLIE_DetalleSeguro.columns.add('costo_seguro', mssql_1.default.Money, { nullable: true });
exports.UDT_CLIE_DetalleSeguro.columns.add('incluye_saldo_deudor', mssql_1.default.Bit, { nullable: true });
exports.UDT_CLIE_DetalleSeguro.columns.add('aplica_seguro_financiado', mssql_1.default.Bit, { nullable: true });
exports.UDT_CLIE_DetalleSeguro.columns.add('activo', mssql_1.default.Bit, { nullable: true });
//#endregion
//#region UDT_CLIE_ReferenciasPersonales
exports.UDT_CLIE_ReferenciasPersonales.columns.add('id', mssql_1.default.Int, { nullable: true });
exports.UDT_CLIE_ReferenciasPersonales.columns.add('id_referencia', mssql_1.default.Int, { nullable: true });
exports.UDT_CLIE_ReferenciasPersonales.columns.add('id_cliente', mssql_1.default.Int, { nullable: true });
exports.UDT_CLIE_ReferenciasPersonales.columns.add('id_empleado', mssql_1.default.Int, { nullable: true });
exports.UDT_CLIE_ReferenciasPersonales.columns.add('parentesco', mssql_1.default.Char(20), { nullable: true });
exports.UDT_CLIE_ReferenciasPersonales.columns.add('tipo_relacion', mssql_1.default.Char(20), { nullable: true });
exports.UDT_CLIE_ReferenciasPersonales.columns.add('tipo', mssql_1.default.Char(7), { nullable: true });
exports.UDT_CLIE_ReferenciasPersonales.columns.add('eliminado', mssql_1.default.Bit, { nullable: true });
//#endregion
//#region UDT_OTOR_GarantiaPrendaria
exports.UDT_OTOR_GarantiaPrendaria.columns.add('id', mssql_1.default.Int, { nullable: true });
exports.UDT_OTOR_GarantiaPrendaria.columns.add('id_cliente', mssql_1.default.Int, { nullable: true });
exports.UDT_OTOR_GarantiaPrendaria.columns.add('id_contrato', mssql_1.default.Int, { nullable: true });
exports.UDT_OTOR_GarantiaPrendaria.columns.add('id_solicitud_prestamo', mssql_1.default.Int, { nullable: true });
exports.UDT_OTOR_GarantiaPrendaria.columns.add('tipo_garantia', mssql_1.default.VarChar(12), { nullable: true });
exports.UDT_OTOR_GarantiaPrendaria.columns.add('subtipo_garantia', mssql_1.default.VarChar(12), { nullable: true });
exports.UDT_OTOR_GarantiaPrendaria.columns.add('descripcion', mssql_1.default.Text, { nullable: true });
exports.UDT_OTOR_GarantiaPrendaria.columns.add('valor_estimado', mssql_1.default.Money, { nullable: true });
exports.UDT_OTOR_GarantiaPrendaria.columns.add('id_archivo', mssql_1.default.Int, { nullable: true });
exports.UDT_OTOR_GarantiaPrendaria.columns.add('archivo', mssql_1.default.Text, { nullable: true });
exports.UDT_OTOR_GarantiaPrendaria.columns.add('extension', mssql_1.default.VarChar(12), { nullable: true });
//#endregion
//#region UDT_OTOR_TuHogarConConserva
exports.UDT_OTOR_TuHogarConConserva.columns.add('id', mssql_1.default.Int, { nullable: true });
exports.UDT_OTOR_TuHogarConConserva.columns.add('id_solicitud_prestamo', mssql_1.default.Int, { nullable: true });
exports.UDT_OTOR_TuHogarConConserva.columns.add('domicilio_actual', mssql_1.default.Bit, { nullable: true });
exports.UDT_OTOR_TuHogarConConserva.columns.add('latitud', mssql_1.default.VarChar(100), { nullable: true });
exports.UDT_OTOR_TuHogarConConserva.columns.add('longitud', mssql_1.default.VarChar(100), { nullable: true });
exports.UDT_OTOR_TuHogarConConserva.columns.add('id_tipo_obra_financiar', mssql_1.default.Int, { nullable: true });
exports.UDT_OTOR_TuHogarConConserva.columns.add('tipo_mejora', mssql_1.default.VarChar(700), { nullable: true });
exports.UDT_OTOR_TuHogarConConserva.columns.add('total_score', mssql_1.default.Int, { nullable: true });
exports.UDT_OTOR_TuHogarConConserva.columns.add('id_color_semaforo_fico_score', mssql_1.default.Int, { nullable: true });
exports.UDT_OTOR_TuHogarConConserva.columns.add('id_origen_ingresos', mssql_1.default.Int, { nullable: true });
exports.UDT_OTOR_TuHogarConConserva.columns.add('activo', mssql_1.default.Bit, { nullable: true });
//#endregion
//#region Columns UDT_CLIE_TuHogarConConservaCoacreditado
exports.UDT_CLIE_TuHogarConConservaCoacreditado.columns.add('id', mssql_1.default.Int, { nullable: true });
exports.UDT_CLIE_TuHogarConConservaCoacreditado.columns.add('id_tuhogar_conserva', mssql_1.default.Int, { nullable: true });
exports.UDT_CLIE_TuHogarConConservaCoacreditado.columns.add('id_coacreditado', mssql_1.default.Int, { nullable: true });
exports.UDT_CLIE_TuHogarConConservaCoacreditado.columns.add('total_score_coacreditado', mssql_1.default.Int, { nullable: true });
exports.UDT_CLIE_TuHogarConConservaCoacreditado.columns.add('id_color_semaforo_fico_score_coacreditado', mssql_1.default.Int, { nullable: true });
exports.UDT_CLIE_TuHogarConConservaCoacreditado.columns.add('activo', mssql_1.default.Bit, { nullable: true });
//#endregion
//#region Columns UDT_CONT_DireccionContacto
exports.UDT_CONT_DireccionContacto.columns.add('id', mssql_1.default.Int, { nullable: true });
exports.UDT_CONT_DireccionContacto.columns.add('tipo', mssql_1.default.Char(12), { nullable: true });
exports.UDT_CONT_DireccionContacto.columns.add('id_pais', mssql_1.default.Int, { nullable: true });
exports.UDT_CONT_DireccionContacto.columns.add('id_estado', mssql_1.default.Int, { nullable: true });
exports.UDT_CONT_DireccionContacto.columns.add('id_municipio', mssql_1.default.Int, { nullable: true });
exports.UDT_CONT_DireccionContacto.columns.add('id_localidad', mssql_1.default.Int, { nullable: true });
exports.UDT_CONT_DireccionContacto.columns.add('id_asentamiento', mssql_1.default.Int, { nullable: true });
exports.UDT_CONT_DireccionContacto.columns.add('direccion', mssql_1.default.VarChar(150), { nullable: true });
exports.UDT_CONT_DireccionContacto.columns.add('numero_exterior', mssql_1.default.VarChar(15), { nullable: true });
exports.UDT_CONT_DireccionContacto.columns.add('numero_interior', mssql_1.default.VarChar(15), { nullable: true });
exports.UDT_CONT_DireccionContacto.columns.add('referencia', mssql_1.default.VarChar(150), { nullable: true });
exports.UDT_CONT_DireccionContacto.columns.add('casa_situacion', mssql_1.default.Int, { nullable: true });
exports.UDT_CONT_DireccionContacto.columns.add('tiempo_habitado_inicio', mssql_1.default.DateTime, { nullable: true });
exports.UDT_CONT_DireccionContacto.columns.add('tiempo_habitado_final', mssql_1.default.DateTime, { nullable: true });
exports.UDT_CONT_DireccionContacto.columns.add('correo_electronico', mssql_1.default.VarChar(150), { nullable: true });
exports.UDT_CONT_DireccionContacto.columns.add('num_interior', mssql_1.default.Int, { nullable: true });
exports.UDT_CONT_DireccionContacto.columns.add('num_exterior', mssql_1.default.Int, { nullable: true });
exports.UDT_CONT_DireccionContacto.columns.add('id_vialidad', mssql_1.default.Int, { nullable: true });
exports.UDT_CONT_DireccionContacto.columns.add('domicilio_actual', mssql_1.default.Int, { nullable: true });
//#endregion
//region UDT_CONT_Direcciones
exports.UDT_CONT_Direcciones.columns.add('id', mssql_1.default.Int, { nullable: true });
exports.UDT_CONT_Direcciones.columns.add('tipo', mssql_1.default.Char(12), { nullable: true });
exports.UDT_CONT_Direcciones.columns.add('id_pais', mssql_1.default.Int, { nullable: true });
exports.UDT_CONT_Direcciones.columns.add('id_estado', mssql_1.default.Int, { nullable: true });
exports.UDT_CONT_Direcciones.columns.add('id_municipio', mssql_1.default.Int, { nullable: true });
exports.UDT_CONT_Direcciones.columns.add('id_localidad', mssql_1.default.Int, { nullable: true });
exports.UDT_CONT_Direcciones.columns.add('id_asentamiento', mssql_1.default.Int, { nullable: true });
exports.UDT_CONT_Direcciones.columns.add('direccion', mssql_1.default.VarChar(150), { nullable: true });
exports.UDT_CONT_Direcciones.columns.add('numero_exterior', mssql_1.default.VarChar(15), { nullable: true });
exports.UDT_CONT_Direcciones.columns.add('numero_interior', mssql_1.default.VarChar(15), { nullable: true });
exports.UDT_CONT_Direcciones.columns.add('referencia', mssql_1.default.VarChar(150), { nullable: true });
exports.UDT_CONT_Direcciones.columns.add('casa_situacion', mssql_1.default.Int, { nullable: true });
exports.UDT_CONT_Direcciones.columns.add('tiempo_habitado_inicio', mssql_1.default.DateTime, { nullable: true });
exports.UDT_CONT_Direcciones.columns.add('tiempo_habitado_final', mssql_1.default.DateTime, { nullable: true });
exports.UDT_CONT_Direcciones.columns.add('correo_electronico', mssql_1.default.VarChar(150), { nullable: true });
exports.UDT_CONT_Direcciones.columns.add('num_interior', mssql_1.default.Int, { nullable: true });
exports.UDT_CONT_Direcciones.columns.add('num_exterior', mssql_1.default.Int, { nullable: true });
exports.UDT_CONT_Direcciones.columns.add('id_vialidad', mssql_1.default.Int, { nullable: true });
//#endregion
//#region UDT_CONT_CURP
exports.UDT_CONT_CURP.columns.add('id', mssql_1.default.Int, { nullable: true });
exports.UDT_CONT_CURP.columns.add('id_identificacion_oficial', mssql_1.default.Int, { nullable: true });
exports.UDT_CONT_CURP.columns.add('path_archivo', mssql_1.default.Text, { nullable: true });
exports.UDT_CONT_CURP.columns.add('xml_datos', mssql_1.default.Text, { nullable: true });
exports.UDT_CONT_CURP.columns.add('archivo_guardado', mssql_1.default.Bit, { nullable: true });
exports.UDT_CONT_CURP.columns.add('tipo_archivo', mssql_1.default.Char(3), { nullable: true });
//#endregion
//#region UDT_CONT_IFE
exports.UDT_CONT_IFE.columns.add('id', mssql_1.default.Int, { nullable: true });
exports.UDT_CONT_IFE.columns.add('id_identificacion_oficial', mssql_1.default.VarChar(18), { nullable: true });
exports.UDT_CONT_IFE.columns.add('numero_emision', mssql_1.default.Char(2), { nullable: true });
exports.UDT_CONT_IFE.columns.add('numero_vertical_ocr', mssql_1.default.VarChar(13), { nullable: true });
//#endregion
const cleanTable = (table) => {
    for (const element of table.rows) {
        table.rows.pop();
    }
    table.rows.pop();
};
exports.cleanTable = cleanTable;
