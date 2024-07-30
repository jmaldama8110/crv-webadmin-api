import sql from 'mssql';
import { sqlConfig } from '../db/connSQL';
import { Client } from "../model/Client";
import moment from 'moment';
import { Functions } from './Functions';
import { UDT_CONT_DireccionContacto, UDT_CONT_Persona, UDT_CONT_Identificaciones, UDT_CONT_CURP, UDT_CONT_IFE, UDT_CONT_Telefonos, cleanTable } from './TablesSql';
import { DocumentCollection } from '../model/DocumentCollection';


export async function createPersonHF(data: any) {
    let ClientDoc = new Client({ branch: data.branch });

    try {
        const { _id } = data;
        const clientCouch: any = await ClientDoc.findOne({ _id });
        if (!clientCouch) return new Error('Client not Foun in couch');

        const dataSort = await sortDataPerson(clientCouch);
        if (!dataSort) return new Error('data sort Error');
        let curp = dataSort['IDENTIFICACIONES'].filter((item: any) => item.tipo_identificacion == 'CURP')[0]?.id_numero;
        let validation_curp = await validateCURPDuplicada(curp, dataSort['DATOS_PERSONALES'][0].id);
        if (validation_curp !== "OK")
            return new Error(validation_curp);
        const pool = await sql.connect(sqlConfig);
        UDT_CONT_DireccionContacto.rows.length = 0;
        UDT_CONT_Persona.rows.length = 0;
        UDT_CONT_Identificaciones.rows.length = 0;
        UDT_CONT_CURP.rows.length = 0;
        UDT_CONT_IFE.rows.length = 0;
        UDT_CONT_Telefonos.rows.length = 0;
        const action2 = dataSort['DATOS_PERSONALES'][0].id > 0 ? 'ACTUALIZAR_PERSONA' : 'INSERTAR_PERSONA'
        // TODO ENVIAR LOS id´s CUANDO SE TENGA QUE ACTUALIZAR DE LO CONTRARIO ENVIAR 0
        console.log(action2)
        for (const idx in dataSort['DIRECCIONES']) {
            UDT_CONT_DireccionContacto.rows.add(
                dataSort['DIRECCIONES'][idx].id,
                dataSort['DIRECCIONES'][idx].tipo || '',
                dataSort['DIRECCIONES'][idx].id_pais,
                dataSort['DIRECCIONES'][idx].id_estado, // CATA_Estado
                dataSort['DIRECCIONES'][idx].id_municipio, // CATA_municipio
                dataSort['DIRECCIONES'][idx].id_localidad, // CATA_Ciudad_Localidad
                dataSort['DIRECCIONES'][idx].id_asentamiento,
                dataSort['DIRECCIONES'][idx].direccion, // CONT_Direcciones
                dataSort['DIRECCIONES'][idx].numero_exterior,
                dataSort['DIRECCIONES'][idx].numero_interior,
                dataSort['DIRECCIONES'][idx].referencia,
                dataSort['DIRECCIONES'][idx].casa_situacion, // 0-Rentado, 1-Propio (SOLO DOMICILIO)
                dataSort['DIRECCIONES'][idx].tiempo_habitado_inicio,
                dataSort['DIRECCIONES'][idx].tiempo_habitado_final,
                dataSort['DIRECCIONES'][idx].correo_electronico,
                dataSort['DIRECCIONES'][idx].num_interior,
                dataSort['DIRECCIONES'][idx].num_exterior,
                dataSort['DIRECCIONES'][idx].id_vialidad, // CATA_TipoVialidad
                dataSort['DIRECCIONES'][idx].domicilio_actual // 0-Rentado, 1-Propio, 3-No Aplica (SOLO DOMICILIO -> Capturar el dato si el producto es Tu Hogar con Conserva)
            )
        }

        UDT_CONT_Persona.rows.add(
            dataSort['DATOS_PERSONALES'][0].id,
            dataSort['DATOS_PERSONALES'][0].nombre,
            dataSort['DATOS_PERSONALES'][0].apellido_paterno,
            dataSort['DATOS_PERSONALES'][0].apellido_materno,
            dataSort['DATOS_PERSONALES'][0].fecha_nacimiento,
            dataSort['DATOS_PERSONALES'][0].id_sexo,
            dataSort['DATOS_PERSONALES'][0].id_escolaridad,
            dataSort['DATOS_PERSONALES'][0].id_estado_civil,
            dataSort['DATOS_PERSONALES'][0].entidad_nacimiento,
            dataSort['DATOS_PERSONALES'][0].regimen,
            dataSort['DATOS_PERSONALES'][0].id_oficina,
            dataSort['DATOS_PERSONALES'][0].curp_fisica, // curp_fisica (SIEMPRE EN 0, NO SE USA)
            dataSort['DATOS_PERSONALES'][0].datos_personales_diferentes_curp,
            dataSort['DATOS_PERSONALES'][0].id_entidad_nacimiento,
            dataSort['DATOS_PERSONALES'][0].id_nacionalidad,
            dataSort['DATOS_PERSONALES'][0].id_pais_nacimiento,
            dataSort['DATOS_PERSONALES'][0].es_pep,
            dataSort['DATOS_PERSONALES'][0].es_persona_prohibida,
            dataSort['DATOS_PERSONALES'][0].fecha_nacimiento
        );

        for (const idx in dataSort['IDENTIFICACIONES']) {
            UDT_CONT_Identificaciones.rows.add(
                dataSort['IDENTIFICACIONES'][idx].id, // ID
                dataSort['IDENTIFICACIONES'][idx].id_entidad, //IdPersona
                dataSort['IDENTIFICACIONES'][idx].tipo_identificacion,
                dataSort['IDENTIFICACIONES'][idx].id_numero, // CURP -> Validar desde el Front, debe estar compuesto por 4 letras - 6 números - 6 letras - 1 letra o número - 1 número
                dataSort['IDENTIFICACIONES'][idx].id_direccion,
                0//1 -> persona, 2->Empresa
            );
        }

        //Son para CURP Fisica (NO SE USA)
        UDT_CONT_CURP.rows.add(
            dataSort['IDENTIFICACIONES'].filter((item: any) => item.tipo_identificacion == 'CURP')[0].id_curp,
            0,
            '',
            '',
            0,
            ''
        );

        UDT_CONT_IFE.rows.add(
            dataSort['DATOS_IFE'][0].id,
            dataSort['IDENTIFICACIONES'].filter((item: any) => item.tipo_identificacion == 'IFE')[0].id_numero, // Clave de elector - 18 Caracteres TODO: FILTRAR EL NUMERO DEL IFE DE IDENTIFICACIONES
            dataSort['DATOS_IFE'][0].numero_emision,
            dataSort['DATOS_IFE'][0].numero_vertical_ocr
        );

        UDT_CONT_Telefonos.rows.add(
            dataSort['TELEFONOS'][0].id, //
            dataSort['TELEFONOS'][0].idcel_telefono, // número de Telefono
            '', // extension (No se usa)
            dataSort['TELEFONOS'][0].tipo_telefono, // Casa/Móvil/Caseta/Vecinto/Trabajo
            dataSort['TELEFONOS'][0].compania, // Telcel/Movistar/Telmex/Megacable/Axtel
            dataSort['TELEFONOS'][0].sms // 0-False, 1-True
        );

        const result: any = await pool.request()
            .input('DATOSDireccion', UDT_CONT_DireccionContacto)
            .input('DATOSPersona', UDT_CONT_Persona)
            .input('DATOSIdentificacion', UDT_CONT_Identificaciones)
            .input('DATOSCurp', UDT_CONT_CURP)
            .input('DATOSIfe', UDT_CONT_IFE)
            .input('DATOSTelefono', UDT_CONT_Telefonos)
            .input('etiqueta_opcion', sql.VarChar(50), action2) // INSERTAR_PERSONA/ACTUALIZAR_PERSONA
            .input('id_session', sql.Int, 0) // Quien manda la informacion
            .input('_id_client', sql.BigInt, _id.slice(0, 13))
            .execute("MOV_AdministrarInformacionPersona")

        if (result.recordsets[0][0].Resultado.trim().toUpperCase() === "VALIDATE")
            return new Error(result.recordsets[0][0].Mensaje);
        cleanTable(UDT_CONT_DireccionContacto);
        cleanTable(UDT_CONT_Persona);
        cleanTable(UDT_CONT_Identificaciones);
        cleanTable(UDT_CONT_CURP);
        cleanTable(UDT_CONT_IFE);
        cleanTable(UDT_CONT_Telefonos);

        // Actualizamos el Client de Couch con el id de Persona creado en HF
        console.log('Id Person: ', result.recordsets[0][0].id);

        clientCouch["id_persona"] = result.recordsets[0][0].id;
        await new Client(clientCouch).save();

        return result.recordsets;
    } catch (error: any) {
        console.log(error);
        return new Error(error.stack);
    }
}

async function sortDataPerson(client: any) {
    const Document = new DocumentCollection({ branch: client.branch });
    const Funct = new Functions();

    try {
        let person: any = {};
        const IS_CREATE = client.id_persona === 0
        // const CREATE = false;

        const addresses = client.address;
        const dirDomi = await addresses.filter((addresses: any) => addresses.type == 'DOMICILIO');
        const dirIfe = await addresses.filter((addresses: any) => addresses.type == 'IFE');
        const dirRfc = await addresses.filter((addresses: any) => addresses.type == 'RFC');
        const identities = client.identities;

        const ife = await client.identities.filter((id: any) => id.tipo_id == 'IFE' && id.status.trim().toUpperCase() == "ACTIVO");
        const rfc = await client.identities.filter((id: any) => id.tipo_id == 'RFC' && id.status.trim().toUpperCase() == "ACTIVO");
        const curp = await client.identities.filter((id: any) => id.tipo_id == 'CURP' && id.status.trim().toUpperCase() == "ACTIVO");
        const phones = client.phones;

        const entidad_nac = dirDomi[0].province[0] ? dirDomi[0].province[0] : 'PROVINCE|5';
        // console.log({entidad_nac})
        const province: any = await Document.findOne({ _id: entidad_nac, couchdb_type: 'PROVINCE' });
        if (!province) { console.log('Province not found'); return }

        person.DATOS_PERSONALES = [
            {
                id: IS_CREATE ? 0 : client.id_persona,
                nombre: client.name,
                apellido_paterno: client.lastname,
                apellido_materno: client.second_lastname,
                fecha_nacimiento: client.dob ? getDates(client.dob) : "1990-01-01",
                id_sexo: client.sex[0] ? client.sex[0] : 4,
                id_escolaridad: client.education_level[0] ? client.education_level[0] : 2,
                id_estado_civil: client.marital_status[0] ? client.marital_status[0] : 1,
                entidad_nacimiento: `${province.etiqueta}-${province.abreviatura}`,
                regimen: "",// client.tributary_regime[1] ? client.tributary_regime[1] : " ",
                id_oficina: client.branch && client.branch[0] ? client.branch[0] : 1,
                curp_fisica: 0,
                datos_personales_diferentes_curp: 0,
                id_entidad_nacimiento: client.province_of_birth[0] ? getId(client.province_of_birth[0]) : dirDomi[0].province[0] ? getId(dirDomi[0].province[0]) : 5,
                id_nacionalidad: client.nationality[0] ? client.nationality[0] : 1,
                id_pais_nacimiento: client.country_of_birth[0] ? getId(client.country_of_birth[0]) : 1,
                es_pep: 0,
                es_persona_prohibida: 0
            }
        ]

        person.IDENTIFICACIONES = [];
        person.IDENTIFICACIONES.push(
            {
                id: IS_CREATE ? 0 : (curp.length < 1 ? 0 : Funct.validateInt(curp[0]._id)),
                id_entidad: IS_CREATE ? 0 : client.id_persona,
                tipo_identificacion: "CURP",
                id_numero: client.curp
            },
            {
                id: IS_CREATE ? 0 : (ife.length < 1 ? 0 : Funct.validateInt(ife[0]._id)),
                id_entidad: IS_CREATE ? 0 : client.id_persona,
                tipo_identificacion: "IFE",
                id_numero: client.clave_ine.slice(0, 18) // ine_clave
            },
            {
                id: IS_CREATE ? 0 : (rfc.length < 1 ? 0 : Funct.validateInt(rfc[0]._id)),
                id_entidad: IS_CREATE ? 0 : client.id_persona,
                tipo_identificacion: "RFC",
                id_numero: client.rfc && client.rfc != "" ? client.rfc : client.curp.slice(0, 13)
            }
        )

        person.DIRECCIONES = []

        person.DIRECCIONES.push(
            {
                id: IS_CREATE ? 0 : Funct.validateInt(dirDomi[0]._id),
                tipo: 'DOMICILIO',
                id_pais: dirDomi[0].country[0] ? getId(dirDomi[0].country[0]) : 1,
                id_estado: dirDomi[0].province[0] ? getId(dirDomi[0].province[0]) : 5,
                id_municipio: dirDomi[0].municipality[0] ? getId(dirDomi[0].municipality[0]) : 946,
                id_localidad: dirDomi[0].city[0] ? getId(dirDomi[0].city[0]) : 1534,
                id_asentamiento: dirDomi[0].colony[0] ? getId(dirDomi[0].colony[0]) : 42665,
                direccion: dirDomi[0].address_line1 ? dirDomi[0].address_line1 : " ",
                referencia: dirDomi[0].address_line1 ? dirDomi[0].address_line1 : " ",
                casa_situacion: dirDomi[0].ownership_type ? dirDomi[0].ownership_type[0] : 0,
                tiempo_habitado_inicio: dirDomi[0].residence_since ? getDates(dirDomi[0].residence_since) : "2022-06-22",
                tiempo_habitado_final: dirDomi[0].residence_to ? getDates(dirDomi[0].residence_to) : "2022-06-20",
                correo_electronico: client.email ? client.email : '',
                numero_exterior: dirDomi[0].exterior_number ? dirDomi[0].exterior_number.toString() : "SN",
                numero_interior: dirDomi[0].interior_number ? dirDomi[0].interior_number.toString() : "SN",
                num_exterior: dirDomi[0].ext_number ? Funct.validateInt(Funct.ConvertInt(dirDomi[0].ext_number)) : 0,
                num_interior: dirDomi[0].int_number ? Funct.validateInt(Funct.ConvertInt(dirDomi[0].int_number)) : 0,
                id_vialidad: dirDomi[0].road ? dirDomi[0].road[0] : 5,//vialidad
                domicilio_actual: 1
            }
        )

        //Si no se encuentra una dirección del IFE, se le asignará el mismo del domicilio
        person.DIRECCIONES.push(
            {
                id: IS_CREATE ? 0 : dirIfe.length >= 1 ? Funct.validateInt(dirIfe[0]._id) : 0,
                tipo: 'IFE',
                id_pais: dirIfe.length >= 1 && dirIfe[0].country[0] ? getId(dirIfe[0].country[0]) : (person.DIRECCIONES)[0].id_pais,
                id_estado: dirIfe.length >= 1 && dirIfe[0].province[0] ? getId(dirIfe[0].province[0]) : (person.DIRECCIONES)[0].id_estado,
                id_municipio: dirIfe.length >= 1 && dirIfe[0].municipality[0] ? getId(dirIfe[0].municipality[0]) : (person.DIRECCIONES)[0].id_municipio,
                id_localidad: dirIfe.length >= 1 && dirIfe[0].city[0] ? getId(dirIfe[0].city[0]) : (person.DIRECCIONES)[0].id_localidad,
                id_asentamiento: dirIfe.length >= 1 && dirIfe[0].colony[0] ? getId(dirIfe[0].colony[0]) : (person.DIRECCIONES)[0].id_asentamiento,
                direccion: dirIfe.length >= 1 ? dirIfe[0].address_line1 ? dirIfe[0].address_line1 : (person.DIRECCIONES)[0].direccion : (person.DIRECCIONES)[0].direccion,
                referencia: dirIfe.length >= 1 && dirIfe[0].street_reference ? dirIfe[0].street_reference : (person.DIRECCIONES)[0].direccion,
                casa_situacion: dirIfe.length >= 1 && dirIfe[0].ownership_type ? dirIfe[0].ownership_type[0] : (person.DIRECCIONES)[0].casa_situacion,
                tiempo_habitado_inicio: dirIfe.length >= 1 && dirIfe[0].start_date ? getDates(dirIfe[0].start_date) : (person.DIRECCIONES)[0].tiempo_habitado_inicio,
                tiempo_habitado_final: dirIfe.length >= 1 && dirIfe[0].end_dat ? getDates(dirIfe[0].end_date) : (person.DIRECCIONES)[0].tiempo_habitado_final,
                correo_electronico: client.email ? client.email : '',
                numero_exterior: dirIfe.length >= 1 && dirIfe[0].exterior_number ? dirIfe[0].exterior_number.toString() : "SN",
                numero_interior: dirIfe.length >= 1 && dirIfe[0].interior_number ? dirIfe[0].interior_number.toString() : "SN",
                num_exterior: dirIfe.length >= 1 && dirIfe[0].ext_number ? Funct.validateInt(Funct.ConvertInt(dirIfe[0].ext_number)) : 0,
                num_interior: dirIfe.length >= 1 && dirIfe[0].int_number ? Funct.validateInt(Funct.ConvertInt(dirIfe[0].int_number)) : 0,
                id_vialidad: dirIfe.length >= 1 && dirIfe[0].road ? dirIfe[0].road[0] : 5,//vialidad
                domicilio_actual: 1
            }
        )

        //Agregamos la dirección del RFC
        person.DIRECCIONES.push(
            {
                id: IS_CREATE ? 0 : dirRfc.length >= 1 ? Funct.validateInt(dirRfc[0]._id) : 0,
                tipo: 'RFC',
                id_pais: dirRfc.length >= 1 && dirRfc[0].country[0] ? getId(dirRfc[0].country[0]) : (person.DIRECCIONES)[0].id_pais,
                id_estado: dirRfc.length >= 1 && dirRfc[0].province[0] ? getId(dirRfc[0].province[0]) : (person.DIRECCIONES)[0].id_estado,
                id_municipio: dirRfc.length >= 1 && dirRfc[0].municipality[0] ? getId(dirRfc[0].municipality[0]) : (person.DIRECCIONES)[0].id_municipio,
                id_localidad: dirRfc.length >= 1 && dirRfc[0].city[0] ? getId(dirRfc[0].city[0]) : (person.DIRECCIONES)[0].id_localidad,
                id_asentamiento: dirRfc.length >= 1 && dirRfc[0].colony[0] ? getId(dirRfc[0].colony[0]) : (person.DIRECCIONES)[0].id_asentamiento,
                direccion: dirRfc.length >= 1 && dirRfc[0].address_line1 ? dirRfc[0].address_line1 : (person.DIRECCIONES)[0].direccion,
                referencia: dirRfc.length >= 1 && dirRfc[0].street_reference ? dirRfc[0].street_reference : (person.DIRECCIONES)[0].direccion,
                casa_situacion: dirRfc.length >= 1 && dirRfc[0].ownership_type ? dirRfc[0].ownership_type[0] : (person.DIRECCIONES)[0].casa_situacion,
                tiempo_habitado_inicio: dirRfc.length >= 1 && dirRfc[0].start_date ? getDates(dirRfc[0].start_date) : (person.DIRECCIONES)[0].tiempo_habitado_inicio,
                tiempo_habitado_final: dirRfc.length >= 1 && dirRfc[0].end_dat ? getDates(dirRfc[0].end_date) : (person.DIRECCIONES)[0].tiempo_habitado_final,
                correo_electronico: client.email ? client.email : '',
                numero_exterior: dirRfc.length >= 1 && dirRfc[0].exterior_number ? dirRfc[0].exterior_number.toString() : "SN",
                numero_interior: dirRfc.length >= 1 && dirRfc[0].interior_number ? dirRfc[0].interior_number.toString() : "SN",
                num_exterior: dirRfc.length >= 1 && dirRfc[0].ext_number ? Funct.validateInt(Funct.ConvertInt(dirRfc[0].ext_number)) : 0,
                num_interior: dirRfc.length >= 1 && dirRfc[0].int_number ? Funct.validateInt(Funct.ConvertInt(dirRfc[0].int_number)) : 0,
                id_vialidad: dirRfc.length >= 1 && dirRfc[0].road ? dirRfc[0].road[0] : 5,//vialidad
                domicilio_actual: 1
            }
        )

        person.DATOS_IFE = [
            {
                id: IS_CREATE ? 0 : Funct.validateInt(client.ife_details[0]?.id ?? '0'),
                numero_emision: client.numero_emisiones ? client.numero_emisiones.slice(0, 2) : "00", //TODO ine_duplicates
                numero_vertical_ocr: client.numero_vertical ? client.numero_vertical.slice(0, 13) : "0000000000000" // .numero_vertical
            }
        ]

        person.TELEFONOS = [];
        const phonePerson = phones[0];

        person.TELEFONOS.push(
            {
                id: IS_CREATE ? 0 : Funct.validateInt(phonePerson._id),
                idcel_telefono: phonePerson && phonePerson.phone ? phonePerson.phone : "0000000000",
                extension: "",
                tipo_telefono: phonePerson ? phonePerson.type ? phonePerson.type : "Móvil" : "Móvil",
                compania: phonePerson ? phonePerson.company ? phonePerson.company : "Telcel" : "Telcel",
                sms: 0
            }
        )

        return person;
    } catch (error: any) {
        console.log(error);
        return new Error(error.stack);
    }
}
export const getDates = (fecha: any) => {
    const formato = 'YYYY-MM-DD';
    const date = moment.utc(fecha).format(formato)
    return date;
}

export function getId(el: any) {
    return parseInt(el.split('|')[1])
}

export async function validateCURPDuplicada(curp: any, id_persona: any) {
    if ((curp ?? "").length == 0)
        curp = "CURPX1";
    curp = curp.trim();
    if (id_persona == 0)
        id_persona = -1;
    const pool = await sql.connect(sqlConfig);
    let result = await pool.request()
        .input("curp", sql.VarChar(100), curp)
        .input("id_persona", sql.Int(), id_persona)
        .query("SELECT COUNT(id) AS cantidad,COALESCE(MAX(id_persona),0) AS id_persona " +
            "FROM CONT_IdentificacionOficial " +
            "WHERE tipo_identificacion='CURP' AND estatus_registro='ACTIVO' AND id_numero=@curp AND id_persona<>@id_persona;");

    if (result.recordset.length > 0) {
        if (result.recordset[0].cantidad > 0)
            return "CURP " + curp + " existente en HF con id_persona " + result.recordset[0].id_persona;
    }
    return "OK";
}


