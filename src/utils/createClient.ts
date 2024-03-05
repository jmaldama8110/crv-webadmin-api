import sql from 'mssql';
import { sqlConfig } from '../db/connSQL';
import { Client } from "../model/Client";
import { Functions } from './Functions';
import { UDT_CLIE_DatoBancario, UDT_CLIE_Individual, UDT_CLIE_Solicitud, UDT_CONT_Direcciones, UDT_CONT_Empresa, UDT_CONT_FirmaElectronica, UDT_CONT_Identificaciones, UDT_CONT_Negocios, UDT_CONT_Oficinas, UDT_CONT_Persona, UDT_CONT_Telefonos, UDT_SPLD_DatosCliente, UTD_CLIE_Clientes, cleanTable } from './TablesSql';
import { getDates, getId } from './createPerson';

let ClientDoc = new Client();
const Funct = new Functions();

export async function createClientHF(data:any) {
    try {
        const { _id } = data;
        const clientCouch:any = await ClientDoc.findOne({ _id });
        if (!clientCouch) return new Error('Client not found in Couch');
        if((clientCouch.id_persona ?? 0) == 0)
            return new Error('Model Client does not have id_persona or it is 0');
        const dataSort = await sortDataClient(clientCouch);
        if(!dataSort) return new Error('Error sort data client');

        const pool = await sql.connect(sqlConfig);
        const value = dataSort["CLIENTE"][0].id_cliente == 0 ? 1 : 2;
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
        UDT_CONT_Empresa.rows.length = 0;
        UDT_CONT_Direcciones.rows.length = 0;
        UDT_CONT_Oficinas.rows.length = 0;
        UDT_CONT_Telefonos.rows.length = 0;
        UDT_CONT_Empresa.rows.add(
            dataSort["NEGOCIO"][0].id,
            dataSort["NEGOCIO"][0].nombre.slice(0,80),
            dataSort["NEGOCIO"][0].rfc.slice(0,13),
            '',
            0,
            dataSort["NEGOCIO"][0].id_actividad_economica,
            '',
            dataSort["NEGOCIO"][0].ventas_totales_cantidad,
            dataSort["NEGOCIO"][0].ventas_totales_unidad.toString(),
            dataSort["NEGOCIO"][0].revolvencia,
            dataSort["NEGOCIO"][0].numero_empleados,
            dataSort["NEGOCIO"][0].tiempo_actividad_incio,
            dataSort["NEGOCIO"][0].tiempo_actividad_final,
            '',
            dataSort["NEGOCIO"][0].econ_registro_egresos_ingresos, // 0/1
            ''
        );

        UDT_CONT_Direcciones.rows.add(
            dataSort["NEGOCIO"][0].id_dir,
            '',
            dataSort["NEGOCIO"][0].id_pais,
            dataSort["NEGOCIO"][0].id_estado,
            dataSort["NEGOCIO"][0].id_municipio,
            dataSort["NEGOCIO"][0].id_ciudad,
            dataSort["NEGOCIO"][0].id_colonia,
            dataSort["NEGOCIO"][0].calle, //direccion
            dataSort["NEGOCIO"][0].letra_exterior,
            dataSort["NEGOCIO"][0].letra_interior,
            dataSort["NEGOCIO"][0].referencia,
            dataSort["NEGOCIO"][0].casa_situacion,
            dataSort["NEGOCIO"][0].tiempo_actividad_incio,
            dataSort["NEGOCIO"][0].tiempo_actividad_final,
            dataSort["NEGOCIO"][0].correo_electronico,
            dataSort["NEGOCIO"][0].num_interior,
            dataSort["NEGOCIO"][0].num_exterior,
            dataSort["NEGOCIO"][0].id_vialidad
        );

        UDT_CONT_Oficinas.rows.add(
            dataSort["NEGOCIO"][0].id_oficina_empresa,//id_oficina
            dataSort["NEGOCIO"][0].id_empresa, //id_empresa
            dataSort["NEGOCIO"][0].id_dir, //id_direccion
            0,
            dataSort["NEGOCIO"][0].nombre_oficina,
            '',
            '',
            '',
            '',
            '',
            ''
        );

        UDT_CONT_Telefonos.rows.add(
            dataSort["TELEFONO"][0].id,
            dataSort["TELEFONO"][0].idcel_telefono,
            '',
            dataSort["TELEFONO"][0].tipo_telefono,
            dataSort["TELEFONO"][0].compania,
            dataSort["TELEFONO"][0].sms
        )

        const empresa:any = await pool.request()
            .input('tablaEmpresa', UDT_CONT_Empresa)
            .input('tablaDirecciones', UDT_CONT_Direcciones)
            .input('tablaOficinas', UDT_CONT_Oficinas)
            .input('tablaTelefonos', UDT_CONT_Telefonos)
            .input('id_opcion', sql.Int, value) // 1-Insertar/2-Actualizar
            .input('id_sesion', sql.Int, 0)
            .execute('MOV_AdministrarEmpresa')//Sirve para crear el negocio
        cleanAllTables();
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
            id_empresa = dataSort["NEGOCIO"][0].id_empresa;
            id_direccion = 0;
            id_oficina = dataSort["NEGOCIO"][0].id_oficina_empresa;
            id_telefono = 0;
        }
        // return {
        //     id_empresa,
        //     id_direccion,
        //     id_oficina,
        //     id_telefono
        // };
        // console.log({ id_empresa, id_direccion, id_oficina, id_telefono })

        //#region CREATE CLIENT
        UDT_CONT_Persona.rows.add(dataSort["PERSONA"][0].id, null, null,
            null, null, null, null, null, null,
            null, null, null, null, null, null,
            null, null, null, null);

        UDT_CONT_Identificaciones.rows.add( // NO SE USA
            dataSort['IDENTIFICACIONES'][0].id,//id prospera
            dataSort['IDENTIFICACIONES'][0].id_entidad,
            'PROSPERA',
            dataSort['IDENTIFICACIONES'][0].id_numero,
            0,
            1
        );
        // console.log('IDEN: ', tbl.UDT_CONT_Identificaciones)
        UDT_CONT_Telefonos.rows.add(
            dataSort["TELEFONO"][0].id,
            dataSort["TELEFONO"][0].idcel_telefono,
            dataSort["TELEFONO"][0].extension,
            dataSort["TELEFONO"][0].tipo_telefono,
            dataSort["TELEFONO"][0].compania,
            dataSort["TELEFONO"][0].sms
        );

        UDT_CONT_Negocios.rows.add(
            Funct.validateInt(clientCouch.data_company[0]["id_empleado"]),
            dataSort["PERSONA"][0].id,
            id_oficina,
            dataSort["NEGOCIO"][0].nombre_oficina.slice(0,50), /// obligatorio menos de 50
            dataSort["NEGOCIO"][0].nombre_puesto,
            dataSort["NEGOCIO"][0].departamento,
            id_empresa,
            dataSort["NEGOCIO"][0].numero_empleados,
            dataSort["NEGOCIO"][0].registro_egresos,
            dataSort["NEGOCIO"][0].revolvencia,
            dataSort["NEGOCIO"][0].ventas_totales_cantidad,
            dataSort["NEGOCIO"][0].ventas_totales_unidad,
            dataSort["NEGOCIO"][0].id_actividad_economica,
            dataSort["NEGOCIO"][0].tiempo_actividad_incio,
            dataSort["NEGOCIO"][0].tiempo_actividad_final,
            dataSort["NEGOCIO"][0].latitud_negocio,
            dataSort["NEGOCIO"][0].longitud_negocio,
        );

        UTD_CLIE_Clientes.rows.add(
            dataSort["CLIENTE"][0].id_cliente,
            null,
            null,
            null,
            dataSort["CLIENTE"][0].id_oficina,
            dataSort["CLIENTE"][0].id_oficial_credito,
            '0000000000', // En desuso
            null);

        UDT_CLIE_Individual.rows.add(
            dataSort["INDIVIDUAL"][0].id_cliente,//id cliente
            dataSort["INDIVIDUAL"][0].id_persona,//id persona
            dataSort["INDIVIDUAL"][0].econ_ocupacion, // CATA_ocupacionPLD (enviar la etiqueta ej. EMPLEADA) YA NO SE USA
            dataSort["INDIVIDUAL"][0].econ_id_actividad_economica, // CATA_ActividadEconomica (los que tengan FINAFIM)
            dataSort["INDIVIDUAL"][0].econ_id_destino_credito, // CATA_destinoCredito
            dataSort["INDIVIDUAL"][0].econ_id_ubicacion_negocio, // CATA_ubicacionNegocio
            dataSort["INDIVIDUAL"][0].econ_id_rol_hogar, // CATA_rolHogar
            id_empresa,
            dataSort["INDIVIDUAL"][0].econ_cantidad_mensual, // Ej. 2000.0
            dataSort["INDIVIDUAL"][0].econ_sueldo_conyugue,
            dataSort["INDIVIDUAL"][0].econ_otros_ingresos,
            dataSort["INDIVIDUAL"][0].econ_otros_gastos,
            dataSort["INDIVIDUAL"][0].econ_familiares_extranjeros,
            dataSort["INDIVIDUAL"][0].econ_parentesco,
            dataSort["INDIVIDUAL"][0].envia_dinero, // 0/1 (NO/SI)
            dataSort["INDIVIDUAL"][0].econ_dependientes_economicos,
            dataSort["INDIVIDUAL"][0].econ_pago_casa,
            dataSort["INDIVIDUAL"][0].econ_gastos_vivienda,
            dataSort["INDIVIDUAL"][0].econ_gastos_familiares,
            dataSort["INDIVIDUAL"][0].econ_gastos_transporte,
            dataSort["INDIVIDUAL"][0].credito_anteriormente, // 0/1 (NO/SI)
            dataSort["INDIVIDUAL"][0].mejorado_ingreso, // 0/1 (NO/SI)
            dataSort["INDIVIDUAL"][0].lengua_indigena, // 0/1 (NO/SI)
            dataSort["INDIVIDUAL"][0].habilidad_diferente, // 0/1 (NO/SI)
            dataSort["INDIVIDUAL"][0].utiliza_internet, // 0/1 (NO/SI)
            dataSort["INDIVIDUAL"][0].utiliza_redes_sociales, // 0/1 (NO/SI)
            dataSort["INDIVIDUAL"][0].id_actividad_economica, // 0/1 (NO/SI)
            dataSort["INDIVIDUAL"][0].id_ocupacion, // CATA_ocupacionPLD
            dataSort["INDIVIDUAL"][0].id_profesion,
            dataSort["INDIVIDUAL"][0].id_tipo_red_social,
            dataSort["INDIVIDUAL"][0].usuario_red_social,
            dataSort["INDIVIDUAL"][0].econ_renta,
            dataSort["INDIVIDUAL"][0].vivienda_piso,
            dataSort["INDIVIDUAL"][0].vivienda_techo_losa,
            dataSort["INDIVIDUAL"][0].vivienda_bano,
            dataSort["INDIVIDUAL"][0].vivienda_letrina,
            dataSort["INDIVIDUAL"][0].vivienda_block,
            dataSort["INDIVIDUAL"][0].longitud_titular ? dataSort["INDIVIDUAL"][0].longitud_titular.toString(): "",
            dataSort["INDIVIDUAL"][0].latitud_titular ? dataSort["INDIVIDUAL"][0].latitud_titular.toString(): ""
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
        //     dataSort["BANCARIO"][0].id_banco,
        //     dataSort["BANCARIO"][0].clave_banco,
        //     dataSort["BANCARIO"][0].nombre_banco,
        //     dataSort["BANCARIO"][0].id_tipo_cuenta,
        //     dataSort["BANCARIO"][0].clave_tipo_cuenta,
        //     dataSort["BANCARIO"][0].nombre_tipo_cuenta,
        //     dataSort["BANCARIO"][0].numero_cuenta,
        //     dataSort["BANCARIO"][0].principal,
        //     dataSort["BANCARIO"][0].activo);

        UDT_SPLD_DatosCliente.rows.add(
            0, //No mandar nada
            dataSort["PLD"][0].id_cliente,//id del cliente
            dataSort["PLD"][0].desempenia_funcion_publica,
            dataSort["PLD"][0].desempenia_funcion_publica_cargo,
            dataSort["PLD"][0].desempenia_funcion_publica_dependencia,
            dataSort["PLD"][0].familiar_desempenia_funcion_publica,
            dataSort["PLD"][0].familiar_desempenia_funcion_publica_cargo,
            dataSort["PLD"][0].familiar_desempenia_funcion_publica_dependencia,
            dataSort["PLD"][0].familiar_desempenia_funcion_publica_nombre,
            dataSort["PLD"][0].familiar_desempenia_funcion_publica_paterno,
            dataSort["PLD"][0].familiar_desempenia_funcion_publica_materno,
            dataSort["PLD"][0].familiar_desempenia_funcion_publica_parentesco,
            dataSort["PLD"][0].id_instrumento_monetario);

        UDT_CONT_FirmaElectronica.rows.add(
            dataSort["EFIRMA"][0].id_firma_electronica,
            dataSort["PERSONA"][0].id,
            dataSort["EFIRMA"][0].fiel
        );

        const result = await pool.request()
            .input('info_persona', UDT_CONT_Persona)
            .input('info_identificaciones', UDT_CONT_Identificaciones)
            .input('info_telefonos', UDT_CONT_Telefonos)
            .input('info_empleos', UDT_CONT_Negocios)
            .input('info_cliente', UTD_CLIE_Clientes)
            .input('info_individual', UDT_CLIE_Individual)
            .input('info_solicitud', UDT_CLIE_Solicitud)
            .input('info_dato_bancario', UDT_CLIE_DatoBancario)
            .input('info_datos_pld', UDT_SPLD_DatosCliente)
            .input('info_firma_electronica', UDT_CONT_FirmaElectronica)
            .input('id_opcion', sql.Int, 0)
            .input('uid', sql.Int, 0)
            .input('_id_client', sql.BigInt, _id)
            .execute('MOV_insertarInformacionClienteV2')

        if(!result) return new Error('Error create client')

        cleanAllTables();

        if(result.recordset[0].mensaje.trim().toUpperCase() === "VALIDATE")
            return new Error(result.recordset[0].evento);

        const idClientCreated = result.recordset[0].id_cliente;
            console.log('Id Client',idClientCreated)
        //Creado el cliente agregamos sus datos del hf
        const dataHF:any = await getClientHFById(idClientCreated);

        const identificationsHF = addIdentities(dataHF[1]);
        const ife_details:any = [{ ...dataHF[2][dataHF[2].length - 1] }]; // TODO CAMBIAR A ARREGLO
        const addressHF = addAddressClientHF(clientCouch.address, dataHF[3]);
        const phonesHF = addPhones(dataHF[4]);
        const personData = dataHF[0][0];

        clientCouch["id_cliente"] = dataHF[0][0].id;
        clientCouch["phones"] = phonesHF;
        // Guardar sólo los ids.
        clientCouch["address"] = addressHF;
        clientCouch["identities"] = identificationsHF;
        clientCouch["ife_details"] = ife_details;
        clientCouch["ine_duplicates"] = ife_details ? ife_details.numero_emision : "00";
        clientCouch["data_company"] = dataHF[8];
        clientCouch["data_efirma"] = dataHF[9];
        clientCouch["branch"] = [personData.id_oficina, personData.nombre_oficina];
        clientCouch["nationality"] = [personData.id_nationality, personData.nationality];
        clientCouch["province_of_birth"] = [`PROVINCE|${personData.id_province_of_birth}`, personData.province_of_birth];
        clientCouch["country_of_birth"] = [`COUNTRY|${personData.id_country_of_birth}`, personData.country_of_birth];
        clientCouch["status"] = [2, "Aprobado"];
        await new Client(clientCouch).save();

        return result.recordsets;
        //#endregion
    } catch (error:any) {
        console.log(error);
        return new Error(error.stack);
    }
}


function sortDataClient(client:any) {
    const IS_CREATE = client.id_cliente == 0;
    let clientHF:any = {};
    const phones = client.phones;
    const addresses = client.address;
    let id = 0;

    IS_CREATE ? console.log('CREATE CLIENT') : console.log('UPDATE CLIENT')

    clientHF.PERSONA = [
        {
            id: client.id_persona
            // id: IS_CREATE ? id : client.id_persona
        }
    ];

    clientHF.TELEFONO = [];
    const phonePerson = phones[0];
    const phoneBusiness = phones[1] ? phones[1] : phones[0];

    if(phones.length > 0)
    {
            (clientHF.TELEFONO).push(
                {
                    id: IS_CREATE ? 0 : Funct.validateInt(phoneBusiness._id),
                    idcel_telefono: phoneBusiness ? phoneBusiness.phone ? phoneBusiness.phone : phonePerson.phone : phonePerson.phone,
                    extension: "",
                    tipo_telefono: phoneBusiness ? phoneBusiness.type ? phoneBusiness.type : " " : " ",
                    compania: phoneBusiness ? phoneBusiness.company ? phoneBusiness.company : " " : " ",
                    sms: 0
                }
        )        
    }
    

    const business_data = client.business_data;
    addresses.forEach((campo:any) => {
        if (campo.type === 'NEGOCIO') {
            clientHF.NEGOCIO = [
                {
                    id: IS_CREATE ? 0 : Funct.validateInt(client.data_company[0]["id_empresa"]),
                    id_dir: IS_CREATE ? 0 : Funct.validateInt(campo._id), //id de la dirección del negocio
                    nombre: business_data.business_name ? business_data.business_name.trim() : "NEGOCIO",
                    calle: campo.address_line1 ? campo.address_line1 : "Calle ...",
                    referencia: campo.address_line1 ? campo.address_line1 : "Calle ...",
                    letra_exterior: campo.exterior_number ? campo.exterior_number.toString() : "SN",
                    letra_interior: campo.interior_number ? campo.interior_number.toString() : "SN",
                    num_exterior: Funct.validateInt(Funct.ConvertInt(campo.ext_number)),
                    num_interior: Funct.validateInt(Funct.ConvertInt(campo.int_number)),
                    id_pais: campo.country[0] ? getId(campo.country[0]) : 1,
                    id_estado: campo.province[0] ? getId(campo.province[0]) : 5,
                    id_municipio: campo.municipality[0] ? getId(campo.municipality[0]) : 946,
                    id_ciudad: campo.city[0] ? getId(campo.city[0]) : 1534,
                    id_colonia: campo.colony[0] ? getId(campo.colony[0]) : 42665,
                    cp: campo.post_code,
                    rfc: client.rfc && client.rfc != "" ? client.rfc : client.curp.slice(0, 13),
                    econ_registro_egresos_ingresos: 0,
                    casa_situacion: campo.ownership ? campo.ownership === true ? 1 : 0 : 0,
                    correo_electronico: client.email ? client.email : "",
                    id_vialidad: campo.road[0],
                    nombre_oficina: business_data.business_name ? `${business_data.business_name}` : "OFICINA...", //Mandar el nombre del negocio concatenar 'Oficina'
                    nombre_puesto: business_data.position ? business_data.position : "dueño",//PONER SOLO dueño //no actualizar
                    departamento: business_data.department ? business_data.department : "cobranza",
                    numero_empleados: business_data.number_employees ? business_data.number_employees : 0,
                    registro_egresos: 0,
                    revolvencia: "QUINCENAL",
                    ventas_totales_cantidad: business_data.income_sales_total,
                    ventas_totales_unidad: 0.0,
                    id_actividad_economica: business_data.economic_activity[0] ? business_data.economic_activity[0] : 716,
                    tiempo_actividad_incio: business_data.business_start_date ? getDates(business_data.business_start_date) : "1970-01-01",
                    tiempo_actividad_final: business_data.business_end_date ? getDates(business_data.business_end_date) : "1970-01-01",
                    id_empresa: IS_CREATE ? 0 : Funct.validateInt(client.data_company[0].id_empresa),
                    id_oficina_empresa: IS_CREATE ? 0 : Funct.validateInt(client.data_company[0].id_oficina_empresa),
                    longitud_negocio: '0',
                    latitud_negocio: '0'
                }
            ]
        }
    });

    clientHF.CLIENTE = [
        {
            id_cliente: IS_CREATE ? 0 : client.id_cliente,//id del cliente
            id_oficina: client.branch && client.branch[0] ? client.branch[0] : 1,
            id_oficial_credito: 0
        }
    ]
    const prospera = client.identities.filter((id:any) => id.tipo_id == 'PROSPERA' && id.status.trim().toUpperCase() == "ACTIVO");
    clientHF.IDENTIFICACIONES = [
        {
            id: IS_CREATE ? 0 : (prospera.length < 1 ? 0 : Funct.validateInt(prospera[0]._id)),
            id_entidad: IS_CREATE ? 0 : client.id_persona,
            tipo_identificacion: "PROSPERA",
            id_numero:  (prospera.length < 1 ? '' : prospera[0].numero_id ?? '')
        }
    ]

    clientHF.INDIVIDUAL = [ //Datos socieconomicos
        {
            id_cliente: IS_CREATE ? 0 : client.id_cliente,
            id_persona: IS_CREATE ? id : client.id_persona,
            econ_ocupacion: business_data.ocupation[1] ? business_data.ocupation[1] : "EMPLEADO",
            econ_id_actividad_economica: business_data.economic_activity[0],
            econ_id_destino_credito: business_data.loan_destination[0],
            econ_id_ubicacion_negocio: business_data.bis_location[0],
            econ_id_rol_hogar: client.rol_hogar[0],
            econ_id_empresa: 0,
            econ_cantidad_mensual: business_data.income_remittances,
            econ_sueldo_conyugue: business_data.income_partner,
            econ_otros_ingresos: business_data.income_other,
            econ_otros_gastos: business_data.expense_business,
            econ_familiares_extranjeros: 0,
            econ_parentesco: "",
            envia_dinero: 0,
            econ_dependientes_economicos: client.economic_dependants,
            econ_pago_casa: business_data.income_job,
            econ_gastos_vivienda: business_data.expense_debt,
            econ_gastos_familiares: business_data.expense_family,
            econ_gastos_transporte: business_data.expense_credit_cards,
            credito_anteriormente: business_data.has_previous_experience,
            mejorado_ingreso: client.has_improved_income, // es un bit Ha mejora su ingreso desde que solicito un credito?
            lengua_indigena: client.speaks_dialect,  // es un bit Habla alguna lengua indígena?
            habilidad_diferente: client.has_disable, // es un bit Habilidades diferentes?
            utiliza_internet: client.internet_access, // 
            utiliza_redes_sociales: !!client.prefered_social[0],
            id_actividad_economica: business_data.economic_activity[0],
            id_ocupacion: business_data.ocupation[0],
            id_profesion: business_data.profession[0],
            id_tipo_red_social: client.prefered_social[0],
            usuario_red_social:client.user_social,
            econ_renta: business_data.expense_rent,
            vivienda_piso: client.household_floor,
            vivienda_techo_losa: client.household_roof,
            vivienda_bano: client.household_toilet,
            vivienda_letrina: client.household_latrine,
            vivienda_block: client.household_brick,
            longitud_titular: client.coordinates[0],
            latitud_titular: client.coordinates[1],

        }
    ]

    clientHF.PLD = [
        {
            id_cliente: IS_CREATE ? 0 : client.id_cliente,
            desempenia_funcion_publica: !!client.spld.desempenia_funcion_publica_cargo,
            desempenia_funcion_publica_cargo: client.spld.desempenia_funcion_publica_cargo,
            desempenia_funcion_publica_dependencia: client.spld.desempenia_funcion_publica_dependencia,
            familiar_desempenia_funcion_publica: !!client.spld.familiar_desempenia_funcion_publica_cargo,
            familiar_desempenia_funcion_publica_cargo: client.spld.familiar_desempenia_funcion_publica_cargo,
            familiar_desempenia_funcion_publica_dependencia: client.spld.familiar_desempenia_funcion_publica_dependencia,
            familiar_desempenia_funcion_publica_nombre: client.spld.familiar_desempenia_funcion_publica_nombre,
            familiar_desempenia_funcion_publica_paterno: client.spld.familiar_desempenia_funcion_publica_paterno,
            familiar_desempenia_funcion_publica_materno: client.spld.familiar_desempenia_funcion_publica_materno,
            familiar_desempenia_funcion_publica_parentesco: client.spld.familiar_desempenia_funcion_publica_parentesco,
            id_instrumento_monetario: client.spld.instrumento_monetario[0]
        }
    ]

    clientHF.BANCARIO = []

    clientHF.EFIRMA = [
        {
            id_firma_electronica: IS_CREATE ? 0 : Funct.validateInt(client.data_efirma[0].id),
            fiel: ""
        }
    ]

    return clientHF;
}

async function getClientHFById(externalId:number) {
    try {
        let pool = await sql.connect(sqlConfig);
        let result = await pool
            .request()
            .input("idCliente", sql.Int, externalId)
            .execute("MOV_ObtenerDatosPersona");

        return result.recordsets;
    } catch (err) {
        console.log(err)
        // throw new Error(err)
    }
}


const addIdentities = (body:any) => {
    const identities = []
    for (let i = 0; i < body.length; i++) {
        const itemIdentity = body[i];
        identities.push({
            _id: itemIdentity.id,
            id_persona: itemIdentity.id_persona,
            tipo_id: itemIdentity.tipo_identificacion,
            numero_id: itemIdentity.id_numero,
            id_direccion: itemIdentity.id_direccion,
            status: itemIdentity.estatus_registro
        })

    }

    return identities;
}


const addAddressClientHF = (addressMongo:any, addressHF:any) => {
    const address = []
    const domicilio = addressMongo.find((item:any) => (item.type === 'DOMICILIO'));

    // console.log('domicilio', domicilio);
    for (let i = 0; i < addressHF.length; i++) {
        const add = addressHF[i];

        if (add.tipo.trim() === 'DOMICILIO') {
            add.id_pais = domicilio.country[0];
            add.nombre_pais = domicilio.country[1];
            add.id_estado = domicilio.province[0];
            add.nombre_estado = domicilio.province[1];
            add.id_municipio = domicilio.municipality[0];
            add.nombre_municipio = domicilio.municipality[1];
            add.id_ciudad_localidad = domicilio.city[0];
            add.nombre_ciudad_localidad = domicilio.city[1];
            add.id_asentamiento = domicilio.colony[0];
            add.nombre_asentamiento = domicilio.colony[1];
            add.direccion = domicilio.address_line1;
            add.codigo_postal = domicilio.post_code;
        }

        address.push({
            _id: add.id,
            type: add.tipo.trim(),

            country: [!(add.id_pais.toString()).includes('COUNTRY') ? `COUNTRY|${add.id_pais}` : add.id_pais, add.nombre_pais],

            province: [!(add.id_estado.toString()).includes('PROVINCE') ? `PROVINCE|${add.id_estado}` : add.id_estado, add.nombre_estado],
            municipality: [!(add.id_municipio.toString()).includes('MUNICIPALITY') ? `MUNICIPALITY|${add.id_municipio}` : add.id_municipio, add.nombre_municipio],
            city: [!(add.id_ciudad_localidad.toString()).includes('CITY') ? `CITY|${add.id_ciudad_localidad}` : add.id_ciudad_localidad, add.nombre_ciudad_localidad],
            colony: [!(add.id_asentamiento.toString()).includes('NEIGHBORHOOD') ? `NEIGHBORHOOD|${add.id_asentamiento}` : add.id_asentamiento, add.nombre_asentamiento],

            address_line1: add.direccion,
            exterior_number: add.numero_exterior.trim(),
            interior_number: add.numero_interior.trim(),
            ext_number: add.num_exterior,
            int_number: add.num_interior,
            street_reference: add.referencia,
            ownership_type: [add.casa_situacion, add.casa_situacion_etiqueta],
            post_code: add.codigo_postal,
            residence_since: add.tiempo_habitado_inicio,
            residence_to: add.tiempo_habitado_final,
            road: [add.vialidad, add.etiqueta_vialidad]
        })
    }

    return address;
}

const addPhones = (body:any) => {
    const phones = []
    for (let i = 0; i < body.length; i++) {
        const phone = body[i]
        phones.push({
            _id: phone.id,
            phone: phone.idcel_telefono.trim(),
            type: phone.tipo_telefono.trim(),
            company: phone.compania.trim(),
            validated: false
        })
    }

    return phones;
}
