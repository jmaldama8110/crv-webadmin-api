const mongoose = require("mongoose");
const mongoose_delete = require("mongoose-delete");
const validador = require("validator");
const { sqlConfig } = require("../db/connSQL");
const sql = require("mssql");
const tbl = require('../utils/TablesSQL');


const clientSchema = new mongoose.Schema({
    id_persona: { type: Number },
    id_cliente: { type: Number },
    name: {
        type: String,
        trim: true,
        uppercase: true,
        required: true
    },
    lastname: {
        type: String,
        trim: true,
        uppercase: true,
        required: true
    },
    second_lastname: {
        type: String,
        trim: true,
        uppercase: true,
        // required: true
    },
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        validate(value) {
            if (!validador.isEmail(value)) {
                throw new Error("Correo electronico no válido..");
            }
        },
    },
    curp: {
        type: String,
        required: false,
        trim: true,
    },
    ine_clave: {
        type: String,
        trim: true,
        required:false
    },
    ine_duplicates: {
        type: String,
        trim: true,
        required:false
    },
    ine_doc_number: {
        type: String,
        trim: true,
        required:false
    },
    dob: {
        type: Date,
        required: false,
    },
    loan_cycle: {
        //Cuántos creditos ha tenido el cliente
        type: String,
        required: false,
    },
    branch: [],
    sex: [],
    education_level: [],
    address: [{
        _id: { type: Number },
        type: {type: String},
        country: [],
        province: [],
        municipality: [],
        city: [],
        colony: [],
        address_line1: { type: String},
        ext_number: { type: String},
        int_number: {type: String},
        street_reference: {type:String},
        ownership: {type:Boolean},
        post_code: {type:String},
        residence_since: {type: Date},
        residence_to: {type: Date}
    }],
    phones: [{
        _id: {
            type: Number
        },
        phone: {
            type: String,
            required: true
        },
        type: {
            type: String,
            default: 'Móvil',
            trim: true,
        },
        company: {
            type: String,
            required: false,
        },
        validated: {
            type: Boolean,
            default: false,
            required: true
        },
        validatedAt: {
            type: Date,
            required: false
        }
    }, ],
    external_id: {
        type: String,
        trim: true,
    },
    //TODO:Campos nuevos
    tributary_regime: [],
    rfc: {
        type: String,
        trim: true,
    },
    nationality: [],
    province_of_birth: [],
    country_of_birth: [],
    ocupation: [],
    marital_status: [],
    identities: [],
    identification_type: [], // INE/PASAPORTE/CEDULA/CARTILLA MILITAR/LICENCIA
    guarantor: [{
        name: {
            type: String,
            trim: true,
            uppercase: true,
        },
        lastname: {
            type: String,
            trim: true,
            uppercase: true,
        },
        second_lastname: {
            type: String,
            trim: true,
            uppercase: true,
        },
        dob: {
            type: Date,
            required: false,
        },
        sex: [],
        nationality: [],
        province_of_birth: [],
        country_of_birth: [],
        rfc: {
            type: String,
            trim: true,
        },
        curp: {
            type: String,
            trim: true,
        },
        ocupation: [],
        e_signature: {
            type: String,
            trim: true,
        },
        marital_status: [],
        phones: [{
            phone: {
                type: String,
                trim: true,
            },
            phone_type: {
                type: String,
                trim: true,
            },
        }, ],
        email: {
            type: String,
            trim: true,
        },
        identification_type: [],
        identification_number: {
            type: String,
            trim: true,
        },
        company_works_at: {
            type: String,
            trim: true,
        },
        address: [],
        person_resides_in: {
            type: String,
            trim: true,
        },
    }, ],
    business_data: {
        economic_activity: [],
        profession: [],
        business_name: {type:String},
        business_start_date: {type: Date}
    },
    beneficiaries: [{
        name: {
            type: String,
            trim: true,
            uppercase: true,
        },
        lastname: {
            type: String,
            trim: true,
            uppercase: true,
        },
        second_lastname: {
            type: String,
            trim: true,
            uppercase: true,
        },
        dob: {
            type: Date,
            required: false,
        },
        relationship: [],
        phones: [{
            phone: {
                type: String,
                trim: true,
            },
            phone_type: {
                type: String,
                trim: true,
            },
        }, ],
        percentage: {
            //Verificar que del total de beneficiarios sume 100%
            type: String,
            trim: true,
            uppercase: true,
        },
        address: [],
    }, ],
    personal_references: [],
    guarantee: [],
    user_id: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    id_oficial: { type: Number},
    ife_details: [],
    data_company: [],
    data_efirma: [],
    status:[]
}, { timestamps: true });

clientSchema.methods.toJSON = function(){
    const client = this

    const clientPublic = client.toObject()
    delete clientPublic.deletedAt
    delete clientPublic.createdAt
    delete clientPublic.updatedAt
    delete clientPublic.__v

    return clientPublic
}

clientSchema.statics.passwordHashing = async(password) => {
    return bcrypt.hash(password, 8);
};

clientSchema.statics.findClientByExternalId = async(externalId) => {
    try {

        let pool = await sql.connect(sqlConfig);
        let result = await pool
            .request()
            .input("idCliente", sql.Int, externalId)
            .execute("MOV_ObtenerDatosPersona");
        return result;
    } catch (err) {
        console.log(err)
        return err;
    }
};

clientSchema.statics.findClientByCurp = async(curp) => {
    try {

        let pool = await sql.connect(sqlConfig);
        let result = await pool
            .request()
            .input("CURPCliente", sql.VarChar, curp)
            .execute("MOV_ObtenerDatosPersona");
        return result;
    } catch (err) {
        console.log(err)
        return err;
    }

};

//Crear persona Hf
clientSchema.statics.createPersonHF = async(data, action) => {
    const pool = await sql.connect(sqlConfig);

    // TODO: ENVIAR LOS id´s CUANDO SE TENGA QUE ACTUALIZAR DE LO CONTRARIO ENVIAR 0

    for (const idx in data['DIRECCIONES']) {
        tbl.UDT_CONT_DireccionContacto.rows.add(
            data['DIRECCIONES'][idx].id,
            data['DIRECCIONES'][idx].tipo,
            data['DIRECCIONES'][idx].id_pais,
            data['DIRECCIONES'][idx].id_estado, // CATA_Estado
            data['DIRECCIONES'][idx].id_municipio, // CATA_municipio
            data['DIRECCIONES'][idx].id_localidad, // CATA_Ciudad_Localidad
            data['DIRECCIONES'][idx].id_asentamiento,
            data['DIRECCIONES'][idx].direccion, // CONT_Direcciones
            data['DIRECCIONES'][idx].numero_exterior,
            data['DIRECCIONES'][idx].numero_interior,
            data['DIRECCIONES'][idx].referencia,
            data['DIRECCIONES'][idx].casa_situacion, // 0-Rentado, 1-Propio (SOLO DOMICILIO)
            data['DIRECCIONES'][idx].tiempo_habitado_inicio,
            data['DIRECCIONES'][idx].tiempo_habitado_final,
            data['DIRECCIONES'][idx].correo_electronico,
            data['DIRECCIONES'][idx].num_interior,
            data['DIRECCIONES'][idx].num_exterior,
            data['DIRECCIONES'][idx].id_vialidad, // CATA_TipoVialidad
            data['DIRECCIONES'][idx].domicilio_actual // 0-Rentado, 1-Propio, 3-No Aplica (SOLO DOMICILIO -> Capturar el dato si el producto es Tu Hogar con Conserva)
        )
    }

    tbl.UDT_CONT_Persona.rows.add(
        data['DATOS_PERSONALES'][0].id,
        data['DATOS_PERSONALES'][0].nombre,
        data['DATOS_PERSONALES'][0].apellido_paterno,
        data['DATOS_PERSONALES'][0].apellido_materno,
        data['DATOS_PERSONALES'][0].fecha_nacimiento,
        data['DATOS_PERSONALES'][0].id_sexo,
        data['DATOS_PERSONALES'][0].id_escolaridad,
        data['DATOS_PERSONALES'][0].id_estado_civil,
        data['DATOS_PERSONALES'][0].entidad_nacimiento,
        data['DATOS_PERSONALES'][0].regimen,
        data['DATOS_PERSONALES'][0].id_oficina,
        data['DATOS_PERSONALES'][0].curp_fisica, // curp_fisica (SIEMPRE EN 0, NO SE USA)
        data['DATOS_PERSONALES'][0].datos_personales_diferentes_curp,
        data['DATOS_PERSONALES'][0].id_entidad_nacimiento,
        data['DATOS_PERSONALES'][0].id_nacionalidad,
        data['DATOS_PERSONALES'][0].id_pais_nacimiento,
        data['DATOS_PERSONALES'][0].es_pep,
        data['DATOS_PERSONALES'][0].es_persona_prohibida
    );

    for (const idx in data['IDENTIFICACIONES']) {
        tbl.UDT_CONT_Identificaciones.rows.add(
            data['IDENTIFICACIONES'][idx].id, // ID
            data['IDENTIFICACIONES'][idx].id_entidad, //IdPersona
            data['IDENTIFICACIONES'][idx].tipo_identificacion,
            data['IDENTIFICACIONES'][idx].id_numero, // CURP -> Validar desde el Front, debe estar compuesto por 4 letras - 6 números - 6 letras - 1 letra o número - 1 número
            data['IDENTIFICACIONES'][idx].id_direccion,
            0//1 -> persona, 2->Empresa
        );
    }
    //Son para CURP Fisica (NO SE USA)
    tbl.UDT_CONT_CURP.rows.add(
        data['IDENTIFICACIONES'].filter(item => item.tipo_identificacion == 'CURP')[0].id_curp,
        0,
        '',
        '',
        0,
        ''
    );

    tbl.UDT_CONT_IFE.rows.add(
        data['DATOS_IFE'][0].id,
        data['IDENTIFICACIONES'].filter(item => item.tipo_identificacion == 'IFE')[0].id_numero, // Clave de elector - 18 Caracteres TODO: FILTRAR EL NUMERO DEL IFE DE IDENTIFICACIONES
        data['DATOS_IFE'][0].numero_emision,
        data['DATOS_IFE'][0].numero_vertical_ocr
    );

    tbl.UDT_CONT_Telefonos.rows.add(
        data['TELEFONOS'][0].id, //
        data['TELEFONOS'][0].idcel_telefono, // número de Telefono
        '', // extension (No se usa)
        data['TELEFONOS'][0].tipo_telefono, // Casa/Móvil/Caseta/Vecinto/Trabajo
        data['TELEFONOS'][0].compania, // Telcel/Movistar/Telmex/Megacable/Axtel
        data['TELEFONOS'][0].sms // 0-False, 1-True
    );

    const result = await pool.request()
        .input('DATOSDireccion', tbl.UDT_CONT_DireccionContacto)
        .input('DATOSPersona', tbl.UDT_CONT_Persona)
        .input('DATOSIdentificacion', tbl.UDT_CONT_Identificaciones)
        .input('DATOSCurp', tbl.UDT_CONT_CURP)
        .input('DATOSIfe', tbl.UDT_CONT_IFE)
        .input('DATOSTelefono', tbl.UDT_CONT_Telefonos)
        .input('etiqueta_opcion', sql.VarChar(50), action) // INSERTAR_PERSONA/ACTUALIZAR_PERSONA
        .input('id_session', sql.Int, 0) // Quien manda la informacion
        .execute("MOV_AdministrarInformacionPersona")

    tbl.cleanTable(tbl.UDT_CONT_DireccionContacto);
    tbl.cleanTable(tbl.UDT_CONT_Persona);
    tbl.cleanTable(tbl.UDT_CONT_Identificaciones);
    tbl.cleanTable(tbl.UDT_CONT_CURP);
    tbl.cleanTable(tbl.UDT_CONT_IFE);
    tbl.cleanTable(tbl.UDT_CONT_Telefonos);

    return result.recordsets;
}

//crear clienteHf
clientSchema.statics.createClientHF = async(data, data2, value) => {
    try {
        const pool = await sql.connect(sqlConfig);

        const cleanAllTables = () => {
            tbl.cleanTable(tbl.UDT_CONT_Empresa);
            tbl.cleanTable(tbl.UDT_CONT_Direcciones);
            tbl.cleanTable(tbl.UDT_CONT_Oficinas);
            tbl.cleanTable(tbl.UDT_CONT_Persona);
            tbl.cleanTable(tbl.UDT_CONT_Telefonos);
            tbl.cleanTable(tbl.UDT_CONT_Identificaciones);
            tbl.cleanTable(tbl.UDT_CONT_Negocios);
            tbl.cleanTable(tbl.UTD_CLIE_Clientes);
            tbl.cleanTable(tbl.UDT_CLIE_Individual);
            tbl.cleanTable(tbl.UDT_CLIE_Solicitud);
            tbl.cleanTable(tbl.UDT_CLIE_DatoBancario);
            tbl.cleanTable(tbl.UDT_SPLD_DatosCliente);
            tbl.cleanTable(tbl.UDT_CONT_FirmaElectronica);
        }

        tbl.UDT_CONT_Empresa.rows.add(
            data["NEGOCIO"][0].id,
            data["NEGOCIO"][0].nombre,
            data["NEGOCIO"][0].rfc,
            '',
            0,
            data["NEGOCIO"][0].id_actividad_economica,
            '',
            data["NEGOCIO"][0].ventas_totales_cantidad,
            data["NEGOCIO"][0].ventas_totales_unidad.toString(),
            data["NEGOCIO"][0].revolvencia,
            data["NEGOCIO"][0].numero_empleados,
            data["NEGOCIO"][0].tiempo_actividad_incio,
            data["NEGOCIO"][0].tiempo_actividad_final,
            '',
            data["NEGOCIO"][0].econ_registro_egresos_ingresos, // 0/1
            ''
        );

        tbl.UDT_CONT_Direcciones.rows.add(
            data["NEGOCIO"][0].id_dir,
            '',
            data["NEGOCIO"][0].id_pais,
            data["NEGOCIO"][0].id_estado,
            data["NEGOCIO"][0].id_municipio,
            data["NEGOCIO"][0].id_ciudad,
            data["NEGOCIO"][0].id_colonia,
            data["NEGOCIO"][0].calle, //direccion
            data["NEGOCIO"][0].letra_exterior,
            data["NEGOCIO"][0].letra_interior,
            data["NEGOCIO"][0].referencia,
            data["NEGOCIO"][0].casa_situacion,
            data["NEGOCIO"][0].tiempo_actividad_incio,
            data["NEGOCIO"][0].tiempo_actividad_final,
            data["NEGOCIO"][0].correo_electronico,
            data["NEGOCIO"][0].num_exterior,
            data["NEGOCIO"][0].num_interior,
            data["NEGOCIO"][0].id_vialidad
        );

        tbl.UDT_CONT_Oficinas.rows.add(
            data["NEGOCIO"][0].id_oficina_empresa,//id_oficina
            data["NEGOCIO"][0].id_empresa, //id_empresa
            data["NEGOCIO"][0].id_dir, //id_direccion
            0,
            data["NEGOCIO"][0].nombre_oficina,
            '',
            '',
            '',
            '',
            '',
            ''
        );

        tbl.UDT_CONT_Telefonos.rows.add(
            data["TELEFONO"][0].id,
            data["TELEFONO"][0].idcel_telefono,
            '',
            data["TELEFONO"][0].tipo_telefono,
            data["TELEFONO"][0].compania,
            data["TELEFONO"][0].sms
        )

        const empresa = await pool.request()
            .input('tablaEmpresa', tbl.UDT_CONT_Empresa)
            .input('tablaDirecciones', tbl.UDT_CONT_Direcciones)
            .input('tablaOficinas', tbl.UDT_CONT_Oficinas)
            .input('tablaTelefonos', tbl.UDT_CONT_Telefonos)
            .input('id_opcion', sql.Int, value) // 1-Insertar/2-Actualizar
            .input('id_sesion', sql.Int, 0)
            .execute('MOV_AdministrarEmpresa')//Sirve para crear el negocio
        cleanAllTables();
        let id_empresa = 0;
        let id_direccion = 0;//direccion de empresa/Negocio
        let id_oficina = 0;
        let id_telefono = 0;

        if(value === 1){
            id_empresa = empresa.recordsets[0][0].id_resultado;
            id_direccion = empresa.recordsets[0][1].id_resultado;//direccion de empresa/Negocio
            id_oficina = empresa.recordsets[0][2].id_resultado;
            id_telefono = empresa.recordsets[0][3].id_resultado;
        }else{ //Si es actualizar llenarlos con valores de mongo
            id_empresa = data["NEGOCIO"][0].id_empresa;
            id_direccion = 0;
            id_oficina = data["NEGOCIO"][0].id_oficina_empresa;
            id_telefono = 0;
        }
        // return {
        //     id_empresa,
        //     id_direccion,
        //     id_oficina,
        //     id_telefono
        // };


        //#region CREATE CLIENT
        tbl.UDT_CONT_Persona.rows.add(data["PERSONA"][0].id, null, null,
            null, null, null, null, null, null,
            null, null, null, null, null, null,
            null, null, null);

        tbl.UDT_CONT_Identificaciones.rows.add( // NO SE USA
            data2['IDENTIFICACIONES'][3].id,//id prospera
            data2['IDENTIFICACIONES'][3].id_entidad,
            'PROSPERA',
            data2['IDENTIFICACIONES'][3].id_numero,
            0,
            1
        );

        tbl.UDT_CONT_Telefonos.rows.add(
            data["TELEFONO"][0].id,
            data["TELEFONO"][0].idcel_telefono,
            data["TELEFONO"][0].extension,
            data["TELEFONO"][0].tipo_telefono,
            data["TELEFONO"][0].compania,
            data["TELEFONO"][0].sms
        );

        tbl.UDT_CONT_Negocios.rows.add(
            data["NEGOCIO"][0].id,
            data["PERSONA"][0].id,
            id_oficina,
            data["NEGOCIO"][0].nombre_oficina,
            data["NEGOCIO"][0].nombre_puesto,
            data["NEGOCIO"][0].departamento,
            id_empresa,
            data["NEGOCIO"][0].numero_empleados,
            data["NEGOCIO"][0].registro_egresos,
            data["NEGOCIO"][0].revolvencia,
            data["NEGOCIO"][0].ventas_totales_cantidad,
            data["NEGOCIO"][0].ventas_totales_unidad,
            data["NEGOCIO"][0].id_actividad_economica,
            data["NEGOCIO"][0].tiempo_actividad_incio,
            data["NEGOCIO"][0].tiempo_actividad_final
        );

        tbl.UTD_CLIE_Clientes.rows.add(
            data["CLIENTE"][0].id_cliente,
            null,
            null,
            null,
            data["CLIENTE"][0].id_oficina,
            data["CLIENTE"][0].id_oficial_credito,
            '0000000000', // En desuso
            null);

        tbl.UDT_CLIE_Individual.rows.add(
            data["INDIVIDUAL"][0].id_cliente,//id cliente
            data["INDIVIDUAL"][0].id_persona,//id persona
            data["INDIVIDUAL"][0].econ_ocupacion, // CATA_ocupacionPLD (enviar la etiqueta ej. EMPLEADA) YA NO SE USA
            data["INDIVIDUAL"][0].econ_id_actividad_economica, // CATA_ActividadEconomica (los que tengan FINAFIM)
            data["INDIVIDUAL"][0].econ_id_destino_credito, // CATA_destinoCredito
            data["INDIVIDUAL"][0].econ_id_ubicacion_negocio, // CATA_ubicacionNegocio
            data["INDIVIDUAL"][0].econ_id_rol_hogar, // CATA_rolHogar
            id_empresa,
            data["INDIVIDUAL"][0].econ_cantidad_mensual, // Ej. 2000.0
            data["INDIVIDUAL"][0].econ_sueldo_conyugue,
            data["INDIVIDUAL"][0].econ_otros_ingresos,
            data["INDIVIDUAL"][0].econ_otros_gastos,
            data["INDIVIDUAL"][0].econ_familiares_extranjeros,
            data["INDIVIDUAL"][0].econ_parentesco,
            data["INDIVIDUAL"][0].envia_dinero, // 0/1 (NO/SI)
            data["INDIVIDUAL"][0].econ_dependientes_economicos,
            data["INDIVIDUAL"][0].econ_pago_casa,
            data["INDIVIDUAL"][0].econ_gastos_vivienda,
            data["INDIVIDUAL"][0].econ_gastos_familiares,
            data["INDIVIDUAL"][0].econ_gastos_transporte,
            data["INDIVIDUAL"][0].credito_anteriormente, // 0/1 (NO/SI)
            data["INDIVIDUAL"][0].mejorado_ingreso, // 0/1 (NO/SI) 
            data["INDIVIDUAL"][0].lengua_indigena, // 0/1 (NO/SI)
            data["INDIVIDUAL"][0].habilidad_diferente, // 0/1 (NO/SI)
            data["INDIVIDUAL"][0].utiliza_internet, // 0/1 (NO/SI)
            data["INDIVIDUAL"][0].utiliza_redes_sociales, // 0/1 (NO/SI)
            data["INDIVIDUAL"][0].id_actividad_economica, // 0/1 (NO/SI)
            data["INDIVIDUAL"][0].id_ocupacion, // CATA_ocupacionPLD
            data["INDIVIDUAL"][0].id_profesion
        );

        tbl.UDT_CLIE_Solicitud.rows.add(0, null, null, null, null, null, null);

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
        //     data["BANCARIO"][0].id_banco,
        //     data["BANCARIO"][0].clave_banco,
        //     data["BANCARIO"][0].nombre_banco,
        //     data["BANCARIO"][0].id_tipo_cuenta,
        //     data["BANCARIO"][0].clave_tipo_cuenta,
        //     data["BANCARIO"][0].nombre_tipo_cuenta,
        //     data["BANCARIO"][0].numero_cuenta,
        //     data["BANCARIO"][0].principal,
        //     data["BANCARIO"][0].activo);

        tbl.UDT_SPLD_DatosCliente.rows.add(
            0, //No mandar nada
            data["PLD"][0].id_cliente,//id del cliente
            data["PLD"][0].desempenia_funcion_publica,
            data["PLD"][0].desempenia_funcion_publica_cargo,
            data["PLD"][0].desempenia_funcion_publica_dependencia,
            data["PLD"][0].familiar_desempenia_funcion_publica,
            data["PLD"][0].familiar_desempenia_funcion_publica_cargo,
            data["PLD"][0].familiar_desempenia_funcion_publica_dependencia,
            data["PLD"][0].familiar_desempenia_funcion_publica_nombre,
            data["PLD"][0].familiar_desempenia_funcion_publica_paterno,
            data["PLD"][0].familiar_desempenia_funcion_publica_materno,
            data["PLD"][0].familiar_desempenia_funcion_publica_parentesco,
            data["PLD"][0].id_instrumento_monetario);

        tbl.UDT_CONT_FirmaElectronica.rows.add(
            data["EFIRMA"][0].id_firma_electronica,
            data["PERSONA"][0].id,
            data["EFIRMA"][0].fiel
        );

        const result = await pool.request()
            .input('info_persona', tbl.UDT_CONT_Persona)
            .input('info_identificaciones', tbl.UDT_CONT_Identificaciones)
            .input('info_telefonos', tbl.UDT_CONT_Telefonos)
            .input('info_empleos', tbl.UDT_CONT_Negocios)
            .input('info_cliente', tbl.UTD_CLIE_Clientes)
            .input('info_individual', tbl.UDT_CLIE_Individual)
            .input('info_solicitud', tbl.UDT_CLIE_Solicitud)
            .input('info_dato_bancario', tbl.UDT_CLIE_DatoBancario)
            .input('info_datos_pld', tbl.UDT_SPLD_DatosCliente)
            .input('info_firma_electronica', tbl.UDT_CONT_FirmaElectronica)
            .input('id_opcion', sql.Int, 0)
            .input('uid', sql.Int, 0)
            .execute('MOV_insertarInformacionClienteV2')
            // .execute('MOV_Prueba')

        console.log(result.recordsets)
        cleanAllTables();
        return result.recordsets;

        //#endregion


    } catch (error) {
        console.log(error);
        throw new Error(error)
    }
}

clientSchema.statics.getHomonimoHF = async(nombre, apellidoPaterno, apellidoMaterno) => {
    try{

        const pool = await sql.connect(sqlConfig);

        const result = await pool.request()
            .input('nombre', sql.VarChar, nombre)
            .input('apellido_paterno', sql.VarChar, apellidoPaterno)
            .input('apellido_materno', sql.VarChar, apellidoMaterno)
            .execute('MOV_obtenerHomonimo');

        return result.recordset;

    } catch (error) {
        return error;
    }
}

clientSchema.statics.updateCurpPersonaHF = async(idPerson, curpNueva) => {
    try {
        const pool = await sql.connect(sqlConfig);

        const result = await pool.request()
            .input('idPersona', sql.Int, idPerson)
            .input('curpNueva', sql.VarChar, curpNueva)
            .execute('MOV_ActualizarCurpPersona');

        return result.recordset;
    } catch (err) {
        return err;
    }
}

clientSchema.plugin(mongoose_delete, {
    deletedAt: true,
    deletedBy: true,
    overrideMethods: "all",
});

const Client = mongoose.model("Client", clientSchema);
module.exports = Client;