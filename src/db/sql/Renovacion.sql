------------------------ PROCEDIMENTO PARA RENOVACION DE GRUPOS ----------------------
USE HBMFS
GO

DECLARE @id_oficina INT = 16
DECLARE @id_oficial_credito INT = 284300
DECLARE @id_solicitud_actual INT = 227209
DECLARE @id_solicitud_nueva INT = 234104
DECLARE @id_cliente INT = 307386


-- 1 BUSCAR CLIENTE POR NOMBRE (TOMAR EL PRESTAMO ACTIVO DE PREFERENCIA)
EXEC CLIE_ObtenerClientesYSolicitudesPorOficina 'HEDOLAS', @id_oficina,1,50
-- 2 ELIGIR CLIENTE POR ID
EXEC CLIE_ObtenerSolicitudClienteServicioFinanciero_V2 @id_solicitud_actual, @id_oficina

-- 3 VERIFICAR QUE EL OFICIAL DE CREDITO SE ENCUENTRE ACTIVO
-- (MATCH ID OFICIAL)
EXEC COMM_ObtenerPlantillaPuesto @id_oficina, 0,0, 'PROM', 'CLIENTE', 1


-- 4 VERIFICAR QUE EL GRUPO NO EXCEDA EL NÚMERO MAXIMO DE INTRGRANTES
EXEC CLIE_getSociasPorDepurarGrupoSolidario @id_cliente, @id_solicitud_actual, 4 -- IF result > 0 return
-- 5 OBTENER LISTA DE INTEGRANTES (DUDA EN ID_SOLICITUD_PRESTAMO LINE:963)
EXEC CLIE_getSociasPorDepurarGrupoSolidario @id_cliente, @id_solicitud_actual, 1

-- 6 CREAR NUEVA SOLICITUD DE PRESTAMO
-- OBTENER @id_oficial_credito DE PASO 2
-- El 3er parametro es el id_session (Al insertar la nueva solicitud se toma para el campo "creado por")
-- returna el idSession
EXEC ADMI_getSessionByUID 'B63E8D10-66EB-4919-99E9-C223A36AB587' -- SE PUEDE OMITIR ESTE PASO
EXEC MOV_InsertSolicitudGrupoSolidarioCredito @id_solicitud_actual, @id_solicitud_actual,0, @id_oficial_credito, @id_oficina -- MODIFICAR EL PROCEDIMIENTO PARA SALTAR CIRCULO DE CREDITO // HECHO
-- result: id_cliente: 307386, id_solicitud: 234104, 'HEDOLAS', 'TRAMITE', 'NUEVO TRAMITE'

-- SE OBTINEN LOS DATOS DE LA NUEVA SOLICITUD
exec CLIE_ObtenerSolicitudClienteServicioFinanciero_V2 @id_solicitud_nueva, @id_oficina

-- VERIFICAR QUE id_riesgo_pld DE CADA INTEGRANTE SEA IGUAL A 0 ( SI ES IGUAL A CERO FALTAN DATOS PERSONALES)
-- ASIGNAR EL MONTO INDIVIDUAL Y QUE LA SUMA TOTAL NO SEA MAYOR A PERMITIDO POR EL PRODUCTO
-- ASIGNAR LOS  TRES CARGOS NECESARIOS PARA EL GRUPO Presidenta(e), Secretaria(o), Tesorera(o)

-- GUARDA LA INFOMRMACION (NUEVO TRAMITE, LISTO PARA TRAMITE)
EXEC MOV_registrarActualizarSolicitudCliente

-- MANDAR LOS DATOS COREESPONDIENTES COMO SIEMPRE SEA HECHO CON EL API