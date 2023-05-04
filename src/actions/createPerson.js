const DocumentCollection = require('./../model/documentCollection');
const ClientCollection = require('./../model/clientCollection');
const { sqlConfig } = require("../db/connSQL");
const tbl = require('../utils/TablesSQL');
const moment = require("moment");
const sql = require("mssql");
const formato = 'YYYY-MM-DD';

const Document = new DocumentCollection();
const Client = new ClientCollection();

const getDates = (fecha) => {
    const date = moment.utc(fecha).format(formato)
    return date;
}

function getId(el) {
    return parseInt(el.split('|')[1])
}

async function sortDataPerson(client, action) {
    try {
        let person = {};
        const IS_CREATE = client.id_persona === 0
        // const CREATE = false;

        const addresses = client.address;
        const dirDomi = await addresses.filter(addresses => addresses.type == 'DOMICILIO');
        const dirIfe = await addresses.filter(addresses => addresses.type == 'IFE');
        const dirRfc = await addresses.filter(addresses => addresses.type == 'RFC');

        const phones = client.phones;

        const entidad_nac = dirDomi[0].province[0] ? dirDomi[0].province[0] : 'PROVINCE|5';
        // console.log({entidad_nac})
        const province = await Document.findOne({ _id: entidad_nac, couchdb_type: 'PROVINCE' });
        if (!province) {console.log('Province not found'); return }

        person.DATOS_PERSONALES = [
            {
                id: IS_CREATE ? 0 : client.id_persona,
                nombre: client.name,
                apellido_paterno: client.lastname ? client.lastname : "S/A",
                apellido_materno: client.second_lastname ? client.second_lastname : "S/A",
                fecha_nacimiento: client.dob ? getDates(client.dob) : "1990-01-01",
                id_sexo: client.sex[0] ? client.sex[0] : 4,
                id_escolaridad: client.education_level[0] ? client.education_level[0] : 2,
                id_estado_civil: client.marital_status[0] ? client.marital_status[0] : 1,
                entidad_nacimiento: `${province.etiqueta}-${province.abreviatura}`,
                regimen: client.tributary_regime[1] ? client.tributary_regime[1] : " ",
                id_oficina: client.branch && client.branch[0] ? client.branch[0] : 1,
                curp_fisica: 0,
                datos_personales_diferentes_curp: 0,
                id_entidad_nacimiento: client.province_of_birth[0] ? getId(client.province_of_birth[0]) : dirDomi[0].province[0] ? getId(dirDomi[0].province)[0] : 5,
                id_nacionalidad: client.nationality[0] ? client.nationality[0] : 1,
                id_pais_nacimiento: client.country_of_birth[0] ? getId(client.country_of_birth[0]) : 1,
                es_pep: 0,
                es_persona_prohibida: 0
            }
        ]

        person.IDENTIFICACIONES = [];
        person.IDENTIFICACIONES.push(
            {
                id: IS_CREATE ? 0 : client.identities[2]._id,
                id_entidad: IS_CREATE ? 0 : client.id_persona,
                tipo_identificacion: "CURP",
                id_numero: client.curp
            },
            {
                id: IS_CREATE ? 0 : client.identities[0]._id,
                id_entidad: IS_CREATE ? 0 : client.id_persona,
                tipo_identificacion: "IFE",
                id_numero: client.clave_ine.slice(0, 18) // ine_clave
            },
            {
                id: IS_CREATE ? 0 : client.identities[1]._id,
                id_entidad: IS_CREATE ? 0 : client.id_persona,
                tipo_identificacion: "RFC",
                id_numero: client.rfc && client.rfc != "" ? client.rfc : client.curp.slice(0, 13)
            }
        )

        person.DIRECCIONES = []

        person.DIRECCIONES.push(
            {
                id: IS_CREATE ? 0 : dirDomi[0]._id,
                tipo: 'DOMICILIO',
                id_pais: dirDomi[0].country[0] ? getId(dirDomi[0].country[0]) : 1,
                id_estado: dirDomi[0].province[0] ? getId(dirDomi[0].province[0]) : 5,
                id_municipio: dirDomi[0].municipality[0] ? getId(dirDomi[0].municipality[0]) : 946,
                id_localidad: dirDomi[0].city[0] ? getId(dirDomi[0].city[0]) : 1534,
                id_asentamiento: dirDomi[0].colony[0] ? getId(dirDomi[0].colony[0]) : 42665,
                direccion: dirDomi[0].address_line1 ? dirDomi[0].address_line1 : " ",
                numero_exterior: dirDomi[0].ext_number ? dirDomi[0].ext_number.toString() : "SN",
                numero_interior: dirDomi[0].int_number ? dirDomi[0].int_number.toString() : "SN",
                referencia: dirDomi[0].address_line1 ? dirDomi[0].address_line1 : " ",
                casa_situacion: dirDomi[0].ownership ? dirDomi[0].ownership === true ? 1 : 0 : 0, //No se guarda el ownership 0 => RENTADO / 1- => PROPIO
                tiempo_habitado_inicio: dirDomi[0].residence_since ? getDates(dirDomi[0].residence_since) : "2022-06-22",
                tiempo_habitado_final: dirDomi[0].residence_to ? getDates(dirDomi[0].residence_to) : "2022-06-20",
                correo_electronico: client.email ? client.email : '',
                num_interior: 0,
                num_exterior: 0,
                id_vialidad: dirDomi[0].road ? dirDomi[0].road[0] : 5,//vialidad
                domicilio_actual: 1
            }
        )

        //Si no se encuentra una dirección del IFE, se le asignará el mismo del domicilio
        person.DIRECCIONES.push(
            {
                id: IS_CREATE ? 0 : dirIfe.length >= 1 ? dirIfe[0]._id : 0,
                tipo: 'IFE',
                id_pais: dirIfe.length >= 1 && dirIfe[0].country[0] ? getId(dirIfe[0].country[0]) : (person.DIRECCIONES)[0].id_pais,
                id_estado: dirIfe.length >= 1 && dirIfe[0].province[0] ? getId(dirIfe[0].province[0]) : (person.DIRECCIONES)[0].id_estado,
                id_municipio: dirIfe.length >= 1 && dirIfe[0].municipality[0] ? getId(dirIfe[0].municipality[0]) : (person.DIRECCIONES)[0].id_municipio,
                id_localidad: dirIfe.length >= 1 && dirIfe[0].city[0] ? getId(dirIfe[0].city[0]) : (person.DIRECCIONES)[0].id_localidad,
                id_asentamiento: dirIfe.length >= 1 && dirIfe[0].colony[0] ? getId(dirIfe[0].colony[0]) : (person.DIRECCIONES)[0].id_asentamiento,
                direccion: dirIfe.length >= 1 ? dirIfe[0].address_line1 ? dirIfe[0].address_line1 : (person.DIRECCIONES)[0].direccion : (person.DIRECCIONES)[0].direccion,
                numero_exterior: dirIfe[0].ext_number ? dirIfe[0].ext_number.toString() : "SN",
                numero_interior: dirIfe[0].int_number ? dirIfe[0].int_number.toString() : "SN",
                referencia: dirIfe.length >= 1 && dirIfe[0].street_reference ? dirIfe[0].street_reference : (person.DIRECCIONES)[0].direccion,
                casa_situacion: dirIfe.length >= 1 ? dirIfe[0].ownership ? dirIfe[0].ownership === true ? 1 : 0 : 0 : (person.DIRECCIONES)[0].casa_situacion,
                tiempo_habitado_inicio: dirIfe.length >= 1 && dirIfe[0].start_date ? getDates(dirIfe[0].start_date) : (person.DIRECCIONES)[0].tiempo_habitado_inicio,
                tiempo_habitado_final: dirIfe.length >= 1 && dirIfe[0].end_dat ? getDates(dirIfe[0].end_date) : (person.DIRECCIONES)[0].tiempo_habitado_final,
                correo_electronico: client.email ? client.email : '',
                num_interior: 0,
                num_exterior: 0,
                id_vialidad: dirIfe[0].road ? dirIfe[0].road[0] : 5,//vialidad
                domicilio_actual: 1
            }
        )

        //Agregamos la dirección del RFC
        person.DIRECCIONES.push(
            {
                id: IS_CREATE ? 0 : dirRfc[0]._id,
                tipo: 'RFC',
                id_pais: dirRfc.length >= 1 && dirRfc[0].country[0] ? getId(dirRfc[0].country[0]) : (person.DIRECCIONES)[0].id_pais,
                id_estado: dirRfc.length >= 1 && dirRfc[0].province[0] ? getId(dirRfc[0].province[0]) : (person.DIRECCIONES)[0].id_estado,
                id_municipio: dirRfc.length >= 1 && dirRfc[0].municipality[0] ? getId(dirRfc[0].municipality[0]) : (person.DIRECCIONES)[0].id_municipio,
                id_localidad: dirRfc.length >= 1 && dirRfc[0].city[0] ? getId(dirRfc[0].city[0]) : (person.DIRECCIONES)[0].id_localidad,
                id_asentamiento: dirRfc.length >= 1 && dirRfc[0].colony[0] ? getId(dirRfc[0].colony[0]) : (person.DIRECCIONES)[0].id_asentamiento,
                direccion: dirRfc.length >= 1 && dirRfc[0].address_line1 ? dirRfc[0].address_line1 : (person.DIRECCIONES)[0].direccion,
                numero_exterior: dirRfc[0].ext_number ? dirRfc[0].ext_number.toString() : "SN",
                numero_interior: dirRfc[0].int_number ? dirRfc[0].int_number.toString() : "SN",
                referencia: dirRfc.length >= 1 && dirRfc[0].street_reference ? dirRfc[0].street_reference : (person.DIRECCIONES)[0].direccion,
                casa_situacion: dirRfc.length >= 1 ? dirRfc[0].ownership ? dirRfc[0].ownership === true ? 1 : 0 : 0 : (person.DIRECCIONES)[0].casa_situacion,
                tiempo_habitado_inicio: dirRfc.length >= 1 && dirRfc[0].start_date ? getDates(dirRfc[0].start_date) : (person.DIRECCIONES)[0].tiempo_habitado_inicio,
                tiempo_habitado_final: dirRfc.length >= 1 && dirRfc[0].end_dat ? getDates(dirRfc[0].end_date) : (person.DIRECCIONES)[0].tiempo_habitado_final,
                correo_electronico: client.email ? client.email : '',
                num_interior: 0,
                num_exterior: 0,
                id_vialidad: dirRfc[0].road ? dirRfc[0].road[0] : 5,//vialidad
                domicilio_actual: 1
            }
        )

        person.DATOS_IFE = [
            {
                id: IS_CREATE ? 0 : client.ife_details.id,
                numero_emision: client.numero_emisiones ? client.numero_emisiones.slice(0, 2) : "00", //TODO ine_duplicates
                numero_vertical_ocr: client.numero_vertical ? client.numero_vertical.slice(0, 13) : "0000000000000" // .numero_vertical
            }
        ]

        person.TELEFONOS = [];
        const phonePerson = phones[0];

        person.TELEFONOS.push(
            {
                id: IS_CREATE ? 0 : phonePerson._id,
                idcel_telefono: phonePerson && phonePerson.phone ?  phonePerson.phone : "0000000000",
                extension: "",
                tipo_telefono: phonePerson ? phonePerson.type ? phonePerson.type : "Móvil" : "Móvil",
                compania: phonePerson ? phonePerson.company ? phonePerson.company : "Telcel" : "Telcel",
                sms: 0
            }
        )

        return person;
    } catch (error) {
        console.log(error);
        return new Error(error.stack);
    }
}

async function createPersonHF(data) {
    try {
        const { _id } = data;
        const clientCouch = await Client.findOne({ _id });
        if(!clientCouch) return new Error('Client not Foun in couch');

        const dataSort = await sortDataPerson(clientCouch);
        if (!dataSort) return new Error('data sort Error');

        const pool = await sql.connect(sqlConfig);
        const action2 = dataSort['DATOS_PERSONALES'][0].id > 0 ? 'ACTUALIZAR_PERSONA' : 'INSERTAR_PERSONA'
        // TODO ENVIAR LOS id´s CUANDO SE TENGA QUE ACTUALIZAR DE LO CONTRARIO ENVIAR 0
        console.log(action2)
        for (const idx in dataSort['DIRECCIONES']) {
            tbl.UDT_CONT_DireccionContacto.rows.add(
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

        tbl.UDT_CONT_Persona.rows.add(
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
            tbl.UDT_CONT_Identificaciones.rows.add(
                dataSort['IDENTIFICACIONES'][idx].id, // ID
                dataSort['IDENTIFICACIONES'][idx].id_entidad, //IdPersona
                dataSort['IDENTIFICACIONES'][idx].tipo_identificacion,
                dataSort['IDENTIFICACIONES'][idx].id_numero, // CURP -> Validar desde el Front, debe estar compuesto por 4 letras - 6 números - 6 letras - 1 letra o número - 1 número
                dataSort['IDENTIFICACIONES'][idx].id_direccion,
                0//1 -> persona, 2->Empresa
            );
        }

        //Son para CURP Fisica (NO SE USA)
        tbl.UDT_CONT_CURP.rows.add(
            dataSort['IDENTIFICACIONES'].filter(item => item.tipo_identificacion == 'CURP')[0].id_curp,
            0,
            '',
            '',
            0,
            ''
        );

        tbl.UDT_CONT_IFE.rows.add(
            dataSort['DATOS_IFE'][0].id,
            dataSort['IDENTIFICACIONES'].filter(item => item.tipo_identificacion == 'IFE')[0].id_numero, // Clave de elector - 18 Caracteres TODO: FILTRAR EL NUMERO DEL IFE DE IDENTIFICACIONES
            dataSort['DATOS_IFE'][0].numero_emision,
            dataSort['DATOS_IFE'][0].numero_vertical_ocr
        );

        tbl.UDT_CONT_Telefonos.rows.add(
            dataSort['TELEFONOS'][0].id, //
            dataSort['TELEFONOS'][0].idcel_telefono, // número de Telefono
            '', // extension (No se usa)
            dataSort['TELEFONOS'][0].tipo_telefono, // Casa/Móvil/Caseta/Vecinto/Trabajo
            dataSort['TELEFONOS'][0].compania, // Telcel/Movistar/Telmex/Megacable/Axtel
            dataSort['TELEFONOS'][0].sms // 0-False, 1-True
        );

        const result = await pool.request()
            .input('DATOSDireccion', tbl.UDT_CONT_DireccionContacto)
            .input('DATOSPersona', tbl.UDT_CONT_Persona)
            .input('DATOSIdentificacion', tbl.UDT_CONT_Identificaciones)
            .input('DATOSCurp', tbl.UDT_CONT_CURP)
            .input('DATOSIfe', tbl.UDT_CONT_IFE)
            .input('DATOSTelefono', tbl.UDT_CONT_Telefonos)
            .input('etiqueta_opcion', sql.VarChar(50), action2) // INSERTAR_PERSONA/ACTUALIZAR_PERSONA
            .input('id_session', sql.Int, 0) // Quien manda la informacion
            .execute("MOV_AdministrarInformacionPersona")

        tbl.cleanTable(tbl.UDT_CONT_DireccionContacto);
        tbl.cleanTable(tbl.UDT_CONT_Persona);
        tbl.cleanTable(tbl.UDT_CONT_Identificaciones);
        tbl.cleanTable(tbl.UDT_CONT_CURP);
        tbl.cleanTable(tbl.UDT_CONT_IFE);
        tbl.cleanTable(tbl.UDT_CONT_Telefonos);

        // Actualizamos el Client de Couch con el id de Persona creado en HF
        console.log('Id Person: ', result.recordsets[0][0].id);

        clientCouch["id_persona"] = result.recordsets[0][0].id;
        await new ClientCollection(clientCouch).save();

        return result.recordsets;
    } catch (error) {
        console.log(error);
        return new Error(error.stack);
    }
}

module.exports = { sortDataPerson, createPersonHF, getDates, getId }
