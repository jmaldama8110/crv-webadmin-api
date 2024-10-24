import express from 'express';
import { authorize } from '../middleware/authorize';
import sql from 'mssql';
import { sqlConfig } from '../db/connSQL';
import * as Nano from 'nano';
import { clientDataDef } from './Actions';

let nano = Nano.default(`${process.env.COUCHDB_PROTOCOL}://${process.env.COUCHDB_USER}:${process.env.COUCHDB_PASS}@${process.env.COUCHDB_HOST}:${process.env.COUCHDB_PORT}`);
const router = express.Router();

router.get('/clients/exists', authorize, async (req: any, res: any) => {
    try {
        /**
         * when IdentityNumber used CURP, returns { id_cliente (persona) } or empty when not found
         * when claveIne used, returns id:[] array of listed Ids for identity
         */

        if (!req.query.identityNumber && !req.query.claveIne) {
            throw new Error('Identity Number or Clave INE parameter is required..');
        }
        let data: any = undefined
        if (req.query.identityNumber) {
            data = await findClientByCurp(req.query.identityNumber);
            if (data.rowsAffected[0] == 1) {
                /// recordsets[0][0] contains personal Info from HF
                const personalData = {
                    ...data.recordset[0],
                };
                res.send({ id_cliente: personalData.id });
            } else {
                res.send({ id_cliente: '' });
            }

        }
        if (req.query.claveIne) {
            data = await findClientByClaveIne(req.query.claveIne);
            if (data.rowsAffected[0] > 0) {
                if (data.recordsets[0].length > 0) {
                    res.send({ ids: data.recordsets[0][0].id })
                }
                else {
                    res.send({ ids: '' })
                }
            }
            else {
                res.send({ ids: '' })
            }
        }



    }
    catch (error) {
        console.log(error)
        res.status(400).send(error)
    }

});

router.get('/groups/hf/loanapps', authorize, async (req:any, res) => {
    try {

        if (!(req.query.branchId && req.query.applicationId)) {
            throw new Error('Query parametrs branchId or groupName are missing!')
        }
        const data: any = await getLoanApplicationById(parseInt(req.query.applicationId as string), parseInt(req.query.branchId as string));
        const resultObject = await processLoanApplicationByDataRS(data,req.user.branch);
        res.status(200).send(resultObject);


    } catch (err) {
        console.log(err);
        res.status(400).send(err);
    }
})

export async function getLoanApplicationById(loanAppId: number, branchId: number) {

    const pool = await sql.connect(sqlConfig);
    const result = await pool.request()
        .input('id_solicitud', sql.Int, loanAppId)
        .input('id_oficina', sql.Int, branchId)
        .execute('CLIE_ObtenerSolicitudClienteServicioFinanciero_V2');
    return result.recordsets;

}

async function processLoanApplicationByDataRS(data: any, branch:[number,string]) {

    /**
             * resultsets[0] => Detalle de la solicitud
             * resultsets[1] => Ciclo y estatus 
             * resultsets[2] => Nombre del grupo, dia / hora reunion
             * resultsets[3] => Direccion del grupo
             * resultsets[4] => Integrantes, cargo, etc (importe solicitado, autorizado, etc)
             * resultsets[5] => Integrantes / Detalle Seguro (Costo, tipo seguro, Beneficiario, parentezco, etc)
    */

    const loan_application = data[0][0];
    const loan_cycle = data[1][0];
    const group_info = data[2][0];
    const group_address = data[3][0];

    const group_data = {

        id_cliente: group_info.id_cliente,
        group_name: group_info.nombre,
        weekday_meet: group_info.reunion_dia.trim(),
        hour_meet: group_info.reunion_hora.trim(),
        branch: group_info.id_oficina,
        loan_officer: loan_application.id_oficial,
        loan_cycle: loan_cycle.ciclo,
        address: {
            id: group_address.id,
            post_code: '',
            address_line1: group_address.direccion,
            road_type: [group_address.vialidad, ''],
            province: [`PROVINCE|${group_address.estado}`, ''],
            municipality: [`MUNICIPALITY|${group_address.municipio}`, ''],
            city: [`CITY|${group_address.localidad}`, ''],
            colony: [`NEIGHBORHOOD|${group_address.colonia}`, ''],
            street_reference: group_address.referencia,
            numero_exterior: `${group_address.numero_exterior}`,
            numero_interior: `${group_address.numero_interior}`
        }
    }

    const members = data[4].map((i: any, nCounter: number) => {
        const insuranceMemberInfo = data[5].find((x: any) => x.id_individual === i.id_individual);
        ///// buscar en la DB local si existe el integrante, como cliente por medio de id_cliente
        return {
            _id: `${Date.now() + nCounter}`,
            id_member: i.id,
            id_cliente: i.id_individual,
            fullname: `${i.nombre} ${i.apellido_paterno} ${i.apellido_materno}`,
            estatus: i.estatus.trim(),
            sub_estatus: i.sub_estatus.trim(),
            position: i.cargo.trim(),
            apply_amount: i.monto_solicitado,
            approved_amount: i.monto_autorizado,
            previous_amount: i.monto_anterior,
            loan_cycle: i.ciclo,
            disbursment_mean: i.id_cata_medio_desembolso,
            insurance: {
                id: nCounter,
                beneficiary: (insuranceMemberInfo ? insuranceMemberInfo.nombre_beneficiario : ''),
                relationship: (insuranceMemberInfo ? insuranceMemberInfo.parentesco : ''),
                percentage: (insuranceMemberInfo ? insuranceMemberInfo.porcentaje : 0)
            }

        }
    })

    /// retrieves Product information, that is not provided by HF
    const db = nano.use(process.env.COUCHDB_NAME ? `${process.env.COUCHDB_NAME}-${branch[1].replace(/ /g,'').toLowerCase()}` : '');

    await db.createIndex({ index: { fields: ["couchdb_type"] } });
    const productList = await db.find({ selector: { couchdb_type: "PRODUCT" }, limit: 10000 });

    const productMaster: any = productList.docs.find((prod: any) => prod.external_id == loan_application.id_producto_maestro)
    if (!productMaster) {
        throw new Error('El producto maestro no se encontro para id_producto_maestro: ' + loan_application.id_producto_maestro);
    }
    const identifierFreq = loan_application.periodicidad.slice(0, 1);
    const frequency = productMaster.allowed_term_type.find((i: any) => i.identifier === identifierFreq)
    /// Uses the same loan application info, except some field, ei: id_solicitud,

    const loan_app = {
        id_cliente: loan_application.id_cliente,
        id_solicitud: loan_application.id, // uses the same Id of the previous one
        loan_officer: loan_application.id_oficial,
        branch: loan_application.id_oficina,
        id_producto: loan_application.id_producto,
        id_disposicion: loan_application.id_disposicion,
        apply_amount: loan_application.monto_total_solicitado,
        approved_total: loan_application.monto_total_autorizado,
        term: loan_application.plazo,
        frequency: [frequency.identifier, frequency.value],
        first_repay_date: loan_application.fecha_primer_pago,
        disbursment_date: loan_application.fecha_entrega,
        disbursment_mean: loan_application.medio_desembolso.trim(),
        liquid_guarantee: loan_application.garantia_liquida,
        loan_cycle: loan_cycle.ciclo,
        estatus: loan_application.estatus.trim(), // para renovacion
        sub_estatus: loan_application.sub_estatus.trim(), /// 
        members,
        product: {
            external_id: productMaster.external_id,
            min_amount: productMaster.min_amount,
            max_amount: (productMaster.max_amount) * (members.length),
            step_amount: productMaster.step_amount,
            min_term: productMaster.min_term,
            max_term: productMaster.max_term,
            product_name: productMaster.product_name,
            term_types: productMaster.allowed_term_type,
            rate: productMaster.rate,
            tax: productMaster.tax,
            GL_financeable: false,
            liquid_guarantee: loan_application.garantia_liquida
        }
    }
    return { group_data, loan_app }
}

router.get('/products/hf', authorize, async (req:any, res) => {
    try {
        if (!(req.query.branchId && req.query.clientType)) {
            throw new Error('Query parametrs branchId or ClientType are missing!')
        }

        const data: any = await getProductsByBranch(parseFloat(req.query.branchId.toString()), parseFloat(req.query.clientType.toString()))
        
        const db = nano.use(process.env.COUCHDB_NAME ? `${process.env.COUCHDB_NAME}-${req.user.branch[1].replace(/ /g,'').toLowerCase()}` : '');
        const productsQuery = await db.find({
            selector: {
                couchdb_type: "PRODUCT"
            },
            limit: 10000
        })

        const newData = data[0].map((x: any) => {
            const i: any = productsQuery.docs.find((y: any) => y.external_id == x.id)
            return { ...i }
        })
        const productsNew = newData.filter((x: any) => (!!x._id))

        res.send(productsNew)
    }
    catch (err) {
        console.log(err);
        res.status(400).send(err);
    }
})

async function getProductsByBranch(branchId: number, clientType: number) {
    const pool = await sql.connect(sqlConfig);
    const result = await pool.request()
        .input('id_producto', sql.Int, 0)
        .input('id_fondeador', sql.Int, 0)
        .input('id_disposicion', sql.Int, 0)
        .input('id_servicio_financiero', sql.Int, 0)
        .input('id_tipo_cliente', sql.Int, clientType)
        .input('id_oficina', sql.Int, branchId)
        .input('id_periodicidad', sql.Int, 0)
        .input('id_tipo_contrato', sql.Int, 0)
        .input('visible', sql.Int, 1)
        .input('producto_maestro', sql.Int, 1)
        .execute('CATA_obtenerProducto');
    return result.recordsets;

}

router.get("/clients/hf", authorize, async (req, res) => {


    try {

        let data: any;
        if ((req.query.externalId)) {
            data = await findClientByExternalId(parseInt(req.query.externalId as string));
        } else {
            if (req.query.identityNumber) {
                data = await getClientByCurp(req.query.identityNumber as string);
            } else {
                throw new Error('Some query parameters area mising...')
            }
        }


        if (data.recordset.length == 1) {
            const result = processClientDataRS(data)
            res.send(result);
        } else {

            res.status(404).send("Not found");
        }
    } catch (err) {
        console.log(err);
        res.status(404).send('Client data not found');
    }
});

function processClientDataRS(data: any) {
    //  get the Client Data with identityNumber and externalId
    /* 
      data.recordsets[0][0]  -> Datos personsales
      data.recordsets[0][1] Dataset -> Identificaciones
      data.recordsets[0][2] Dataset -> Datos del IFE / INE
      data.recordsets[0][3] Direcciones -> Direcciones  
      data.recordsets[0][4] Telefonos
      data.recordsets[0][5] Aval
      data.recordsets[0][6] Ciclo
      data.recordsets[0][7] Datos economicos
      */
    /// extract CURP and Ine Folio
    const curp = data.recordsets[1].find(
        (i: any) => i.tipo_identificacion === "CURP"
    );

    const ife = data.recordsets[1].find(
        (i: any) => i.tipo_identificacion === "IFE"
    );
    const rfc = data.recordsets[1].find(
        (i: any) => i.tipo_identificacion === "RFC"
    );

    /// busca el detalle de la IFE/INE
    const ineDetail = data.recordsets[2]
    const ine_detalle = ineDetail.find((i: any) => i.id_identificacion_oficial === ife.id_numero)

    const identities = []
    for (let i = 0; i < data.recordsets[1].length; i++) {
        const itemIdentity = data.recordsets[1][i];
        identities.push({
            _id: itemIdentity.id,
            id_persona: itemIdentity.id_persona,
            tipo_id: itemIdentity.tipo_identificacion,
            numero_id: itemIdentity.id_numero,
            id_direccion: itemIdentity.id_direccion,
            status: itemIdentity.estatus_registro
        })
    }

    let address = [];
    let email = ''
    for (let i = 0; i < data.recordsets[3].length; i++) {
        const add = data.recordsets[3][i]
        if (add.correo_electronico) {
            email = add.correo_electronico;
        }

        address.push({
            _id: add.id,
            type: add.tipo.trim(),

            country: [`COUNTRY|${add.id_pais}`, add.nombre_pais],

            province: [`PROVINCE|${add.id_estado}`, add.nombre_estado],
            municipality: [`MUNICIPALITY|${add.id_municipio}`, add.nombre_municipio],
            city: [`CITY|${add.id_ciudad_localidad}`, add.nombre_ciudad_localidad],
            colony: [`NEIGHBORHOOD|${add.id_asentamiento}`, add.nombre_asentamiento],
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
            road: [add.vialidad, add.etiqueta_vialidad],
            email
        })
    }

    /// limpia el arreglo de direcciones para dejar solo uno por cada TYPE
    const map:any = {}; // valor temporal para reemplazar el objeto iterado, con el ultimo
    address.forEach( (add:any) => map[add.type] = add )
    address = Object.values(map);
    //////////////
    
      


    const phones = [];
    for (let l = 0; l < data.recordsets[4].length; l++) {

        const phoneAdd = data.recordsets[4][l]
        if (phoneAdd.idcel_telefono.trim()) {
            phones.push({
                _id: phoneAdd.id,
                phone: phoneAdd.idcel_telefono.trim(),
                type: phoneAdd.tipo_telefono.trim(),
                company: phoneAdd.compania.trim(),
                validated: false
            });
        }
    }

    const perSet = {
        ...data.recordsets[0][0],
    };

    let household_data = {
        household_floor: false,
        household_roof: false,
        household_toilet: false,
        household_latrine: false,
        household_brick: false,
        economic_dependants: '',
        internet_access: false,
        prefered_social: [0, ""],
        rol_hogar: [0, ""],
        user_social: '',
        has_disable: false,
        speaks_dialect: false,
        has_improved_income: false,
    }
    let business_data: any = {
        bis_location: [0, ""],
        economic_activity: ['', ''],
        profession: ['', ''],
        ocupation: ["", ""],
        business_start_date: '',
        business_name: '',
        business_owned: false,
        business_phone: '',
        number_employees: '',
        loan_destination: [0, ''],
        income_sales_total: 0,
        income_partner: 0,
        income_job: 0,
        income_remittances: 0,
        income_other: 0,
        income_total: 0,
        expense_family: 0,
        expense_rent: 0,
        expense_business: 0,
        expense_debt: 0,
        expense_credit_cards: 0,
        expense_total: 0,
        keeps_accounting_records: false,
        has_previous_experience: false,
        previous_loan_experience: '',
        bis_season_type: ''
    }
    let spld: any = {
        desempenia_funcion_publica_cargo: "",
        desempenia_funcion_publica_dependencia: "",
        familiar_desempenia_funcion_publica_cargo: "",
        familiar_desempenia_funcion_publica_dependencia: "",
        familiar_desempenia_funcion_publica_nombre: "",
        familiar_desempenia_funcion_publica_paterno: "",
        familiar_desempenia_funcion_publica_materno: "",
        familiar_desempenia_funcion_publica_parentesco: "",
        instrumento_monetario: [0, ""]
    }



    let econActId = 0, econActCap = '',
        profId = 0, profCap = '',
        occupId = 0, occupCap = '', bisLoc = 0

    if (data.recordsets[7].length > 0) {

        if (data.recordsets[7][0].id_actividad_economica) {
            econActId = data.recordsets[7][0].id_actividad_economica ? data.recordsets[7][0].id_actividad_economica : 0,
                econActCap = data.recordsets[7][0].nombre_actividad_economica ? data.recordsets[7][0].nombre_actividad_economica.toString() : '';
        }

        profId = data.recordsets[7][0].id_profesion ? data.recordsets[7][0].id_profesion : 0,
            profCap = data.recordsets[7][0].nombre_profesion ? data.recordsets[7][0].nombre_profesion.toString() : '';

        occupId = perSet.id_occupation ? perSet.id_occupation : 0,
            occupCap = perSet.occupation ? perSet.occupation.toString() : '';
        bisLoc = !!data.recordsets[7][0].econ_id_ubicacion_negocio ? data.recordsets[7][0].econ_id_ubicacion_negocio : 0
    }



    if (data.recordsets[7].length) {
        business_data.bis_location = [bisLoc, '']
        business_data.economic_activity = [econActId, econActCap]
        business_data.profession = [profId, profCap]
        business_data.ocupation = [occupId, occupCap]
        business_data.business_name = data.recordsets[7][0].nombre_negocio
        business_data.business_start_date = data.recordsets[7][0].econ_fecha_inicio_act_productiva,
            business_data.business_owned = false,
            business_data.business_phone = "",

            business_data.number_employees = data.recordsets[7][0].econ_numero_empleados;
        business_data.loan_destination = [data.recordsets[7][0].econ_id_destino_credito, ''];

        business_data.income_sales_total = data.recordsets[7][0].econ_ventas_totales_cantidad ? data.recordsets[7][0].econ_ventas_totales_cantidad : 0;
        business_data.income_partner = data.recordsets[7][0].econ_sueldo_conyugue ? data.recordsets[7][0].econ_sueldo_conyugue : 0;
        business_data.income_other = data.recordsets[7][0].econ_otros_ingresos ? data.recordsets[7][0].econ_otros_ingresos : 0;
        business_data.income_job = data.recordsets[7][0].econ_pago_casa ? data.recordsets[7][0].econ_pago_casa : 0;
        business_data.income_remittances = data.recordsets[7][0].econ_cantidad_mensual ? data.recordsets[7][0].econ_cantidad_mensual : 0;
        business_data.income_total = 0;

        business_data.expense_family = data.recordsets[7][0].econ_gastos_familiares ? data.recordsets[7][0].econ_gastos_familiares : 0;
        business_data.expense_rent = data.recordsets[7][0].econ_renta ? data.recordsets[7][0].econ_renta : 0;
        business_data.expense_business = data.recordsets[7][0].econ_otros_gastos ? data.recordsets[7][0].econ_otros_gastos : 0;
        business_data.expense_debt = data.recordsets[7][0].econ_gastos_vivienda ? data.recordsets[7][0].econ_gastos_vivienda : 0;
        business_data.expense_credit_cards = data.recordsets[7][0].econ_gastos_transporte ? data.recordsets[7][0].econ_gastos_transporte : 0;;
        business_data.expense_total = 0;

        household_data.economic_dependants = data.recordsets[7][0].econ_dependientes_economicos.toString();
        household_data.household_brick = !!data.recordsets[7][0].vivienda_block;
        household_data.household_floor = !!data.recordsets[7][0].vivienda_piso;
        household_data.household_latrine = !!data.recordsets[7][0].vivienda_letrina;
        household_data.household_roof = !!data.recordsets[7][0].vivienda_techo_losa;
        household_data.household_toilet = !!data.recordsets[7][0].vivienda_bano;

        household_data.internet_access = !!data.recordsets[7][0].utiliza_internet;
        household_data.prefered_social = [data.recordsets[7][0].id_tipo_red_social, ""]
        household_data.user_social = data.recordsets[7][0].usuario_red_social
        household_data.rol_hogar = [data.recordsets[7][0].econ_id_rol_hogar, ""];
        household_data.has_disable = data.recordsets[7][0].habilidad_diferente;
        household_data.speaks_dialect = data.recordsets[7][0].lengua_indigena;
        household_data.has_improved_income = data.recordsets[7][0].mejorado_ingreso;

        spld.desempenia_funcion_publica_cargo = data.recordsets[7][0].desempenia_funcion_publica_cargo,
            spld.desempenia_funcion_publica_dependencia = data.recordsets[7][0].desempenia_funcion_publica_dependencia,
            spld.familiar_desempenia_funcion_publica_cargo = data.recordsets[7][0].familiar_desempenia_funcion_publica_cargo,
            spld.familiar_desempenia_funcion_publica_dependencia = data.recordsets[7][0].familiar_desempenia_funcion_publica_dependencia,
            spld.familiar_desempenia_funcion_publica_nombre = data.recordsets[7][0].familiar_desempenia_funcion_publica_nombre,
            spld.familiar_desempenia_funcion_publica_paterno = data.recordsets[7][0].familiar_desempenia_funcion_publica_paterno,
            spld.familiar_desempenia_funcion_publica_materno = data.recordsets[7][0].familiar_desempenia_funcion_publica_materno,
            spld.familiar_desempenia_funcion_publica_parentesco = data.recordsets[7][0].familiar_desempenia_funcion_publica_parentesco,
            spld.instrumento_monetario = [data.recordsets[7][0].id_instrumento_monetario, ""]

    }

    const cicloData = data.recordsets[6]
    const loan_cycle = cicloData.length ? cicloData[0].ciclo : 0
    
    // Default data_company values sets to 0 or emptry strings
    let data_company = [
        {
            id_empresa: 0,
            nombre_comercial: "",
            id_oficina_empresa: 0,
            nombre_oficina: "",
            numero_empleados: 0,
            revolvencia: "",
            id_empleado: 0
        }
    ]
    // evaluates whether an object is not empty, then asign it
    if( !! data.recordsets[8][0]  ){
        data_company = [ data.recordsets[8][0] ] // inside brackets
    }

    let data_efirma =
        data.recordsets[9][0] ?
            data.recordsets[9][0] :
            {
                id: 0,
                id_persona: 0,
                fiel: ''
            }
    const result = {
        id_persona: perSet.id_persona,
        id_cliente: perSet.id,
        name: perSet.name,
        lastname: perSet.lastname,
        second_lastname: perSet.second_lastname,
        email,
        curp: curp ? curp.id_numero : "",
        clave_ine: ife ? ife.id_numero : "",
        numero_emisiones: ine_detalle ? ine_detalle.numero_emision : '',
        numero_vertical: ine_detalle ? ine_detalle.numero_vertical_ocr : '',
        rfc: rfc ? rfc.id_numero : "",
        dob: perSet.dob,
        loan_cycle,
        branch: [perSet.id_oficina, perSet.nombre_oficina],
        sex: [perSet.id_gender, perSet.gender],
        education_level: [perSet.id_scholarship, perSet.scholarship],
        identities,
        address,
        phones,
        tributary_regime: [],
        not_bis: false,
        client_type: [2, 'INDIVIDUAL'],
        nationality: [perSet.id_nationality, perSet.nationality],
        province_of_birth: [
            `PROVINCE|${perSet.id_province_of_birth}`,
            perSet.province_of_birth,
        ],
        country_of_birth: [
            `COUNTRY|${perSet.id_country_of_birth}`,
            perSet.country_of_birth,
        ],

        marital_status: [perSet.id_marital_status, perSet.marital_status],
        identification_type: [], // INE/PASAPORTE/CEDULA/CARTILLA MILITAR/LICENCIA
        guarantor: [],
        business_data,
        ...household_data,
        spld,
        beneficiaries: [],
        personal_references: [],
        guarantee: [],
        ife_details: ineDetail,
        data_company,
        data_efirma: [data_efirma],
    };

    return result;
}

router.get("/clients/hf/person-search", authorize, async (req, res) => {
    try {
        if (!req.query.keyword) {
            throw new Error('Keyword parameter is required..');
        }
        if (!req.query.branchId) {
            throw new Error('BranchId parameter is required..');
        }

        let data: any = await findClientByKeyword(req.query.keyword as string);
        const branchId = parseInt(req.query.branchId as string)
        const newData = data.recordset.filter( (x:any) => x.id_oficina_cliente == branchId )
        res.send(newData);

    }
    catch (e: any) {
        console.log(e);
        res.status(400).send(e.message)
    }
})

router.get('/clients/hf/search', authorize, async (req, res) => {

    try {

        if (!(req.query.branchId && req.query.clientName)) {
            throw new Error('Query parametrs branchId or clientName are missing!')
        }
        const data = await searchGroupLoanByName(req.query.clientName as string, parseInt(req.query.branchId as string));
        res.status(200).send(data);

    } catch (err) {
        console.log(err);
        res.status(400).send(err);
    }
})

router.post('/catalog', authorize, async (req:any, res) => {

    try {
        switch (req.body.catalogName) {
            case "CATA_ActividadEconomica":
                await updateCatalogFromHF('CATA_ActividadEconomica', 10000, req.user.branch,true);
                break;
            case "CATA_sexo":
                await updateCatalogFromHF('CATA_sexo', 10000,req.user.branch);
                break;
            case "CATA_sector":
                await updateCatalogFromHF('CATA_sector', 10000,req.user.branch)
                break;
            case "CATA_escolaridad":
                await updateCatalogFromHF('CATA_escolaridad', 10000,req.user.branch);
                break;
            case "CATA_estadoCivil":
                await updateCatalogFromHF('CATA_estadoCivil', 10000,req.user.branch);
                break;
            case "CATA_nacionalidad":
                await updateCatalogFromHF('CATA_nacionalidad', 10000,req.user.branch, true);
                break;
            case "CATA_parentesco":
                await updateCatalogFromHF('CATA_parentesco', 10000, req.user.branch);
                break;
            case "CATA_profesion":
                await updateCatalogFromHF('CATA_profesion', 10000, req.user.branch, true);
                break;
            case "CATA_TipoRelacion":
                await updateCatalogFromHF('CATA_TipoRelacion', 10000, req.user.branch);
                break;
            case "CATA_TipoPuesto":
                await updateCatalogFromHF('CATA_TipoPuesto', 10000, req.user.branch);
                break;
            case "CATA_TipoVialidad":
                await updateCatalogFromHF('CATA_TipoVialidad', 10000, req.user.branch);
                break;
            case "CATA_TipoDomicilio":
                await updateCatalogFromHF('CATA_TipoDomicilio', 10000, req.user.branch);
                break;
            case "CATA_Ciudad_Localidad":
                await updateCatalogFromHF('CATA_Ciudad_Localidad', 10000,req.user.branch);
                break;
            case "CATA_destinoCredito":
                await updateCatalogFromHF('CATA_destinoCredito', 10000,req.user.branch);
                break;
            case "CATA_ocupacionPLD":
                await updateCatalogFromHF('CATA_ocupacionPLD', 10000,req.user.branch, true);
                break;
            case "CATA_banco":
                await updateCatalogFromHF('CATA_banco', 10000,req.user.branch);
                break;
            case "CATA_TipoCuentaBancaria":
                await updateCatalogFromHF('CATA_TipoCuentaBancaria', 10000,req.user.branch);
                break;
            case "CATA_MotivoBajaCastigado":
                await updateCatalogFromHF('CATA_MotivoBajaCastigado', 10000,req.user.branch);
                break;
            case "CATA_MotivoBajaCancelacion":
                await updateCatalogFromHF('CATA_MotivoBajaCancelacion', 10000,req.user.branch);
                break;
            case "CATA_MotivoBajaRechazado":
                await updateCatalogFromHF('CATA_MotivoBajaRechazado', 10000,req.user.branch);
                break;
            case "CATA_rolHogar":
                await updateCatalogFromHF('CATA_rolHogar', 10000,req.user.branch);
                break;
            case "CATA_ubicacionNegocio":
                await updateCatalogFromHF('CATA_ubicacionNegocio', 10000,req.user.branch);
                break;
            case "SPLD_InstrumentoMonetario":
                await updateCatalogFromHF('SPLD_InstrumentoMonetario', 10000,req.user.branch);
                break;
            case "CATA_RedesSociales":
                await updateCatalogFromHF('CATA_RedesSociales', 10000,req.user.branch);
                break;
            case "CATA_asentamiento":
                await updateCatalogFromHFByRelationship('CATA_asentamiento', 1000, 'NEIGHBORHOOD',req.user.branch, 'CITY', 'ciudad_localidad');
                break;
            case "CATA_ciudad_localidad":
                await updateCatalogFromHFByRelationship('CATA_ciudad_localidad', 1000, 'CITY',req.user.branch, 'MUNICIPALITY', 'municipio');
                break;
            case "CATA_municipio":
                await updateCatalogFromHFByRelationship('CATA_municipio', 1000, 'MUNICIPALITY',req.user.branch, 'PROVINCE', 'estado');
                break;
            case "CATA_estado":
                await updateCatalogFromHFByRelationship('CATA_estado', 1000, 'PROVINCE',req.user.branch, 'COUNTRY', 'pais');
                break;
            case "CATA_pais":
                await updateCatalogFromHFByRelationship('CATA_pais', 1000, 'COUNTRY',req.user.branch);
                break;
            case "CATA_GroupMeetingTime":

                await updateCatalogGroupTimes(req.user.branch);
                break;
            default:
                throw new Error('No catalogName value provided')
        }
        res.status(201).send(`Catalog updated: ${req.body.catalogName}`);

    }
    catch (e: any) {
        console.log(e);
        res.status(401).send(e.message);
    }
});


router.get('/catalogs/sync', authorize, async (req:any, res) => {
    try {
        await updateCatalogFromHF('CATA_ActividadEconomica', 10000, req.user.branch,true)
        await updateCatalogFromHF('CATA_sexo', 10000,req.user.branch)
        await updateCatalogFromHF('CATA_sector', 10000,req.user.branch)
        await updateCatalogFromHF('CATA_escolaridad', 10000,req.user.branch)
        await updateCatalogFromHF('CATA_estadoCivil', 10000,req.user.branch)
        await updateCatalogFromHF('CATA_nacionalidad', 10000,req.user.branch, true)

        await updateCatalogFromHF('CATA_parentesco', 10000,req.user.branch)
        await updateCatalogFromHF('CATA_profesion', 10000,req.user.branch, true)
        await updateCatalogFromHF('CATA_TipoRelacion', 10000,req.user.branch)
        await updateCatalogFromHF('CATA_TipoPuesto', 10000,req.user.branch)
        await updateCatalogFromHF('CATA_TipoVialidad', 10000,req.user.branch)
        await updateCatalogFromHF('CATA_TipoDomicilio', 10000,req.user.branch)
        await updateCatalogFromHF('CATA_Ciudad_Localidad', 10000,req.user.branch)
        await updateCatalogFromHF('CATA_destinoCredito', 10000,req.user.branch)
        await updateCatalogFromHF('CATA_ocupacionPLD', 10000,req.user.branch, true)
        await updateCatalogFromHF('CATA_banco', 10000,req.user.branch)
        await updateCatalogFromHF('CATA_TipoCuentaBancaria', 10000,req.user.branch)

        await updateCatalogFromHF('CATA_MotivoBajaCastigado', 10000,req.user.branch)
        await updateCatalogFromHF('CATA_MotivoBajaCancelacion', 10000,req.user.branch)
        await updateCatalogFromHF('CATA_MotivoBajaRechazado', 10000,req.user.branch)

        await updateCatalogFromHF('CATA_rolHogar', 10000,req.user.branch)
        await updateCatalogFromHF('CATA_ubicacionNegocio', 10000,req.user.branch)
        await updateCatalogFromHF('SPLD_InstrumentoMonetario', 10000,req.user.branch)
        await updateCatalogFromHF('CATA_RedesSociales', 10000,req.user.branch);
        await updateCatalogGroupTimes(req.user.branch);

        await updateCatalogFromHFByRelationship('CATA_asentamiento', 1000, 'NEIGHBORHOOD',req.user.branch, 'CITY', 'ciudad_localidad');
        await updateCatalogFromHFByRelationship('CATA_ciudad_localidad', 1000, 'CITY',req.user.branch, 'MUNICIPALITY', 'municipio');
        await updateCatalogFromHFByRelationship('CATA_municipio', 1000, 'MUNICIPALITY',req.user.branch, 'PROVINCE', 'estado');
        await updateCatalogFromHFByRelationship('CATA_estado', 1000, 'PROVINCE',req.user.branch, 'COUNTRY', 'pais');
        await updateCatalogFromHFByRelationship('CATA_pais', 1000, 'COUNTRY',req.user.branch);

        res.status(201).send('Done!');
    }
    catch (error) {
        console.log(error + '');
        res.status(400).send(error + '')
    }
});


router.get('/products/sync', authorize, async (req:any, res) => {

    try {
        const result = await productsSync(req.user.branch);
        res.send(result);

    } catch (e) {

        res.status(400).send(e + '');
    }

});


async function getProductsWeb() {
    const pool = await sql.connect(sqlConfig);
    let result = await pool
        .request()
        .execute('MOV_ProductsForWeb');
    return result.recordset;

}

router.get('/product', authorize, async (req, res) => {

    try {
        const product: any = await getProductsWeb();
        res.send({ count: product.length, result: product });
    }
    catch (e) {
        res.status(401).send(JSON.stringify(e))
    }
})

function mapIdentifierForFrequency(frequencyType: string) {
    switch (frequencyType) {
        case 'Semanal':
            return 'Sl';
        case 'Catorcenal':
            return 'Cl';
        case 'Quincenal':
            return 'Ql';
        case 'Mensual':
            return 'Ml'
        default:
            return undefined;
    }
}
function mapIdentifierForTerm(frequencyType: string) {
    switch (frequencyType) {
        case 'Semanal':
            return 'S';
        case 'Catorcenal':
            return 'C';
        case 'Quincenal':
            return 'Q';
        case 'Mensual':
            return 'M'
        default:
            return undefined;
    }
}
function mapValueForTerm(frequencyType: string) {
    switch (frequencyType) {
        case 'Semanal':
            return 'Semana(s)';
        case 'Catorcenal':
            return 'Catorcena(s)';
        case 'Quincenal':
            return 'Quicena(s)';
        case 'Mensual':
            return 'Mes(es)'
        default:
            return undefined;
    }
}
function mapYearPeriodForTerm(frequencyType: string) {
    switch (frequencyType) {
        case 'Semanal':
            return '52';
        case 'Catorcenal':
            return '26';
        case 'Quincenal':
            return '24';
        case 'Mensual':
            return '12'
        default:
            return undefined;
    }
}



async function updateCatalogFromHF(name: string, chunk: number,branch: [number, string], filterActive?: boolean) {
    try {
        const db = nano.use(process.env.COUCHDB_NAME ? `${process.env.COUCHDB_NAME}-${branch[1].replace(/ /g,'').toLowerCase()}` : '');
        await db.createIndex({ index: { fields: ["couchdb_type", "name"] } });
        const docsDestroy = await db.find({ selector: { couchdb_type: "CATALOG", name }, limit: 100000 });
        if (docsDestroy.docs.length > 0) {
            const docsEliminate = docsDestroy.docs.map(doc => {
                const { _id, _rev } = doc;
                return { _deleted: true, _id, _rev }
            })

            await db.bulk({ docs: docsEliminate });

        }

        sql.connect(sqlConfig, (err) => {
            const request = new sql.Request();
            request.stream = true;//Activarlo al trabajar con varias filas

            if (filterActive) {
                request.query(`select * from ${name} where estatus_registro = \'ACTIVO\'`);
            } else {
                request.query(`select * from ${name}`);
            }

            let rowData: any = [];

            request.on('row', row => {
                // console.log(row);
                rowData.push({ name, couchdb_type: 'CATALOG', ...row });
                if (rowData.length >= chunk) {
                    request.pause(); //Pausar la insercción

                    db.bulk({ docs: rowData })
                        .then((body) => { })
                        .catch((error) => { throw new Error(error) });

                    rowData = [];
                    request.resume();//continuar la insercción
                }
            })

            request.on("error", (err) => {
                console.log(err);
            });

            request.on("done", (result) => {
                db.bulk({ docs: rowData })
                    .then((body) => { })
                    .catch((error) => console.log(error));

                rowData = [];
                request.resume();

                console.log("Catalog Done!", name, "!!", result);
            });
        })
    } catch (e) {
        console.log(e)
    }
}

async function updateCatalogFromHFByRelationship(name: string, chunk: number, shortname: string, branch:[number, string],relationship_name?: string, relationship?: string) {
    try {
        const db = nano.use(process.env.COUCHDB_NAME ? `${process.env.COUCHDB_NAME}-${branch[1].replace(/ /g,'').toLowerCase()}` : '');
        await db.createIndex({ index: { fields: ["couchdb_type"] } });
        const docsDestroy = await db.find({ selector: { couchdb_type: shortname }, limit: 100000 });

        if (docsDestroy.docs.length > 0) {

            const docsEliminate = docsDestroy.docs.map(doc => {
                const { _id, _rev } = doc;
                return { _deleted: true, _id, _rev }
            })
            db.bulk({ docs: docsEliminate })
                .then((body) => { })
                .catch((error) => console.log(error));
        }

        sql.connect(sqlConfig, (err) => {
            const request = new sql.Request();
            request.stream = true;//Activarlo al trabajar con varias filas

            request.query(`select * from ${name}`);

            let rowData: any = [];

            request.on('row', row => {
                // relationship
                const codigo_postal = row.codigo_postal
                let dataRow: any = relationship ? {
                    _id: `${shortname.toUpperCase()}|${(row.id).toString()}`,
                    codigo_postal,
                    couchdb_type: shortname,
                    etiqueta: row.etiqueta,
                    [relationship]: `${relationship_name}|${(row[`id_${relationship}`]).toString()}`,
                } : {
                    _id: `${shortname.toUpperCase()}|${(row.id).toString()}`,
                    // name: shortname,
                    couchdb_type: shortname,
                    etiqueta: row.etiqueta
                }
                if (row.codigo_postal) dataRow.codigo_postal = row.codigo_postal;
                if (row.codigo) dataRow.codigo = row.codigo;
                if (row.abreviatura) dataRow.abreviatura = row.abreviatura;

                rowData.push(dataRow)

                if (rowData.length >= chunk) {
                    request.pause(); //Pausar la insercción

                    db.bulk({ docs: rowData })
                        .then((body) => { })
                        .catch((error) => { throw new Error(error) });

                    rowData = [];
                    request.resume();//continuar la insercción
                }
            })

            request.on("error", (err) => {
                console.log(err);
            });

            request.on("done", (result) => {
                db.bulk({ docs: rowData })
                    .then((body) => { })
                    .catch((error) => console.log(error));

                rowData = [];
                request.resume();

                console.log("Dones Catalog Special", name, "!!", result);
            });
        })
    } catch (e: any) {
        console.log(e)
        throw new Error(e)
    }
}

async function updateCatalogGroupTimes(branch:[number,string]) {
    const db = nano.use(process.env.COUCHDB_NAME ? `${process.env.COUCHDB_NAME}-${branch[1].replace(/ /g,'').toLowerCase()}` : '');
    await db.createIndex({ index: { fields: ["couchdb_type", "name"] } });
    const docsDestroy = await db.find({ selector: { couchdb_type: "CATALOG", name: "CATA_GroupMeetingTime" }, limit: 100000 });

    const docsEliminate = docsDestroy.docs.map(doc => {
        const { _id, _rev } = doc;
        return { _deleted: true, _id, _rev }
    })
    await db.bulk({ docs: docsEliminate })
    const meetingTimeDocs = [
        { id: 1, couchdb_type: "CATALOG", name: "CATA_GroupMeetingTime", etiqueta: "7" },
        { id: 2, couchdb_type: "CATALOG", name: "CATA_GroupMeetingTime", etiqueta: "7:30" },
        { id: 3, couchdb_type: "CATALOG", name: "CATA_GroupMeetingTime", etiqueta: "8" },
        { id: 4, couchdb_type: "CATALOG", name: "CATA_GroupMeetingTime", etiqueta: "8:30" },
        { id: 5, couchdb_type: "CATALOG", name: "CATA_GroupMeetingTime", etiqueta: "9" },
        { id: 6, couchdb_type: "CATALOG", name: "CATA_GroupMeetingTime", etiqueta: "9:30" },
        { id: 7, couchdb_type: "CATALOG", name: "CATA_GroupMeetingTime", etiqueta: "10" },
        { id: 8, couchdb_type: "CATALOG", name: "CATA_GroupMeetingTime", etiqueta: "10:30" },
        { id: 9, couchdb_type: "CATALOG", name: "CATA_GroupMeetingTime", etiqueta: "11" },
        { id: 10, couchdb_type: "CATALOG", name: "CATA_GroupMeetingTime", etiqueta: "11:30" },
        { id: 11, couchdb_type: "CATALOG", name: "CATA_GroupMeetingTime", etiqueta: "12" },
        { id: 12, couchdb_type: "CATALOG", name: "CATA_GroupMeetingTime", etiqueta: "12:30" },
        { id: 13, couchdb_type: "CATALOG", name: "CATA_GroupMeetingTime", etiqueta: "13" },
        { id: 14, couchdb_type: "CATALOG", name: "CATA_GroupMeetingTime", etiqueta: "13:30" },
        { id: 15, couchdb_type: "CATALOG", name: "CATA_GroupMeetingTime", etiqueta: "14" },
        { id: 16, couchdb_type: "CATALOG", name: "CATA_GroupMeetingTime", etiqueta: "14:30" },
        { id: 17, couchdb_type: "CATALOG", name: "CATA_GroupMeetingTime", etiqueta: "15" },
        { id: 18, couchdb_type: "CATALOG", name: "CATA_GroupMeetingTime", etiqueta: "15:30" },
        { id: 19, couchdb_type: "CATALOG", name: "CATA_GroupMeetingTime", etiqueta: "16" },
        { id: 20, couchdb_type: "CATALOG", name: "CATA_GroupMeetingTime", etiqueta: "16:30" },
        { id: 21, couchdb_type: "CATALOG", name: "CATA_GroupMeetingTime", etiqueta: "17" },
        { id: 22, couchdb_type: "CATALOG", name: "CATA_GroupMeetingTime", etiqueta: "17:30" },
        { id: 23, couchdb_type: "CATALOG", name: "CATA_GroupMeetingTime", etiqueta: "18" },
        { id: 24, couchdb_type: "CATALOG", name: "CATA_GroupMeetingTime", etiqueta: "18:30" },
        { id: 25, couchdb_type: "CATALOG", name: "CATA_GroupMeetingTime", etiqueta: "19" },
        { id: 26, couchdb_type: "CATALOG", name: "CATA_GroupMeetingTime", etiqueta: "19:30" },
        { id: 27, couchdb_type: "CATALOG", name: "CATA_GroupMeetingTime", etiqueta: "20" },
        { id: 28, couchdb_type: "CATALOG", name: "CATA_GroupMeetingTime", etiqueta: "20:30" },
        { id: 29, couchdb_type: "CATALOG", name: "CATA_GroupMeetingTime", etiqueta: "21" },
        { id: 30, couchdb_type: "CATALOG", name: "CATA_GroupMeetingTime", etiqueta: "21:30" }

    ]

    await db.bulk({ docs: meetingTimeDocs });


}


router.get('/clients/hf/getBalance', authorize, async (req, res) => {

    try {
        const result: any = await getBalanceById(parseInt(req.query.idCliente as string));
        res.send(result[0]);
    } catch (error: any) {
        res.status(401).send(error.message)
    }
});

export async function getBalanceById(idClient: number) {

    const pool = await sql.connect(sqlConfig);
    const result = await pool.request()
        .input('idCliente', sql.Int, idClient)
        .execute('MOV_ObtenerSaldoClienteById');
    return result.recordsets
}

export async function getContractInfo(idContract: number) {
    const pool = await sql.connect(sqlConfig);

    const dateTime = new Date();

    const result = await pool
        .request()
        .input("dateCurrrent", sql.Date, dateTime)
        .input("dateTimeCurrent", sql.DateTime, dateTime)
        .input("idContrato", sql.Int, idContract)
        .query(
            `
    SELECT OTOR_Contratos.id_cliente AS idCliente,
    OTOR_Contratos.id AS idContrato,
    OTOR_SolicitudPrestamos.id_producto_maestro,
    (CASE (OTOR_Contratos.id_tipo_cliente)
         WHEN  1
         THEN 
         (
             SELECT ISNULL(CLIE_Grupos.nombre,'')
             FROM CLIE_Grupos 
             WHERE id_cliente = OTOR_contratos.id_cliente
         )
         WHEN  2
         THEN 
         (
             SELECT ISNULL(CONT_Personas.nombre, '') + ' ' + ISNULL(CONT_Personas.apellido_paterno, '') + ' ' + ISNULL(CONT_Personas.apellido_materno, '')
             FROM CONT_Personas 
             INNER JOIN CLIE_Individual
             ON CONT_Personas.id = CLIE_Individual.id_persona
             WHERE CLIE_Individual.id_cliente = OTOR_contratos.id_cliente
         )
         ELSE
         ''
     END) AS nombreCliente,
     (
         SELECT ISNULL(COUNT(*),0)
         FROM OTOR_SolicitudPrestamoMonto
         WHERE OTOR_SolicitudPrestamoMonto.id_solicitud_prestamo = OTOR_SolicitudPrestamos.id
         AND OTOR_SolicitudPrestamoMonto.autorizado = 1
     ) AS numeroMiembros,
     OTOR_SolicitudPrestamos.ciclo AS Ciclo,
     OTOR_SolicitudPrestamos.monto_total_autorizado AS montoTotalAutorizado,
     CATA_Productos.periodos AS plazo,
     CATA_Productos.periodicidad AS periodicidad,
     dbo.ufnObtenerFechaHabil(OTOR_Contratos.fecha_primer_pago) AS fechaPrimerPago,
     dbo.ufnObtenerFechaHabil(OTOR_Contratos.fecha_ultimo_pago) AS fechaUltimoPago,
     (CASE (OTOR_Contratos.id_tipo_cliente)
         WHEN  1
         THEN 
         (
             SELECT ISNULL(OTOR_ContratoGrupal.monto_reembolso,0)
             FROM OTOR_ContratoGrupal 
             WHERE OTOR_ContratoGrupal.no_folio = OTOR_contratos.id
         )
         WHEN  2
         THEN 
         (
             SELECT ISNULL(OTOR_ContratoIndividual.monto_reembolso,0)
             FROM OTOR_ContratoIndividual 
             WHERE OTOR_ContratoIndividual.id_contrato = OTOR_contratos.id
         )
         ELSE
         ''
     END) AS montoReembolso,
     (CASE (OTOR_Contratos.estatus)
         WHEN  'DESEMBOLSADO'
         THEN 
         (
             CAST(dbo.ufnGetSaldoPendiente(OTOR_Contratos.id, @dateTimeCurrent)AS MONEY)
         )
         WHEN  'TRANSITO'
         THEN 
         (
             0
         )
         ELSE
         0
     END) AS saldoActual,
     dbo.ufnCalcularPrincipalVencido(OTOR_Contratos.id,dbo.ufnGetNumeroPago(@dateTimeCurrent, OTOR_Contratos.id, -1), @dateTimeCurrent) AS SaldoEnMora,
     dbo.ufnCalcularInteresVencido(OTOR_Contratos.id,dbo.ufnGetNumeroPago(@dateTimeCurrent, OTOR_Contratos.id, -1), @dateTimeCurrent) AS SaldoInteres,
     dbo.ufnCalcularImpuestoVencido(OTOR_Contratos.id,dbo.ufnGetNumeroPago(@dateTimeCurrent, OTOR_Contratos.id, -1), @dateTimeCurrent) AS SaldoImpuesto,
     dbo.ufnGetCantidadPagosVencidos(OTOR_Contratos.id,dbo.ufnGetNumeroPago(@dateTimeCurrent, OTOR_Contratos.id, -1), @dateTimeCurrent) AS NoPagosVencidos,
     (
         SELECT dbo.ufnObtenerFechaHabil(OTOR_DetallePlanPagos.fecha_vencimiento)
         FROM OTOR_DetallePlanPagos
         WHERE OTOR_DetallePlanPagos.id =
         (
             SELECT ISNULL(MAX(OTOR_DetallePlanPagos.id), (SELECT OTOR_DetallePlanPagos.id FROM dbo.OTOR_DetallePlanPagos 
                                                           INNER JOIN OTOR_PlanPagos 
                                                           ON OTOR_DetallePlanPagos.id_plan_pago = OTOR_PlanPagos.id
                                                           WHERE  OTOR_PlanPagos.id_contrato = OTOR_Contratos.id
                                                           AND OTOR_DetallePlanPagos.numero_pago = 1))
             FROM OTOR_DetallePlanPagos 
             INNER JOIN OTOR_PlanPagos 
             ON OTOR_DetallePlanPagos.id_plan_pago = OTOR_PlanPagos.id
             WHERE  OTOR_PlanPagos.id_contrato = OTOR_Contratos.id
             AND OTOR_DetallePlanPagos.numero_pago >= dbo.ufnGetNumeroPago(@dateTimeCurrent, OTOR_Contratos.id, -1)
             AND OTOR_DetallePlanPagos.fecha_vencimiento <= @dateTimeCurrent
         )
     ) AS fechaProximoPago,
     dbo.ufnGetDiasAtraso(@dateTimeCurrent, OTOR_Contratos.id, -1) AS diasDeMora,
     OTOR_SolicitudPrestamos.id_oficial AS idOficialCredito,
     (
         SELECT ISNULL(CONT_Personas.nombre, '') + ' ' + ISNULL(CONT_Personas.apellido_paterno, '') + ' ' + ISNULL(CONT_Personas.apellido_materno, '')
         FROM CONT_Personas 
         WHERE id = OTOR_SolicitudPrestamos.id_oficial
     ) AS nombreOficialCredito,
     --dbo.ufnGetProvisionBySaldoDias(dbo.ufnGetSaldoPendiente(OTOR_Contratos.id, @fechaFinal), dbo.ufnGetDiasAtraso(@fechaFinal, OTOR_Contratos.id, -1))
     0 AS provision,
     OTOR_Contratos.estatus AS estatus,
     (
         SELECT RECU_Reembolsos.fecha_efectiva
         FROM RECU_ContratoEventos
         INNER JOIN RECU_Reembolsos 
         ON RECU_ContratoEventos.id = RECU_Reembolsos.id_contrato_evento
         WHERE id = (SELECT ISNULL(MAX(id),0)
                     FROM RECU_ContratoEventos 
                     WHERE id_contrato = OTOR_Contratos.id
                     AND tipo_evento='REEMBOLSO')
         AND RECU_ContratoEventos.revertido = 0 
     ) AS fechaUltimoReembolso,
     CORP_OficinasFinancieras.id AS idOficina,
     ISNULL(CORP_OficinasFinancieras.nombre,'') AS nombreOficina,
     CORP_Zonas.id AS idEstado,
     ISNULL(CORP_Zonas.nombre,'') AS nombreEstado,
     ROW_NUMBER() OVER(ORDER BY OTOR_Contratos.id ASC) AS RowNum,
     dbo.ufnObtenerDiasAtraso(@dateTimeCurrent, OTOR_Contratos.id) AS diasAtrasoAcumulados,
     
     (
     CASE (OTOR_Contratos.estatus)
         WHEN  'DESEMBOLSADO'
             THEN 
                 
                 CASE WHEN dbo.ufnGetDiasAtraso(@dateTimeCurrent, OTOR_Contratos.id, -1) > 0
                 
              THEN 
                 (
                     CAST(dbo.ufnGetSaldoPendiente(OTOR_Contratos.id, @dateTimeCurrent)AS MONEY)
                 )
             ELSE
             (
                0
             )
             END
         WHEN 'TRANSITO'
         THEN 
          (
             0
          )
          ELSE
          (
            0
          )
     END
     
     )AS [Par 1],
     CATA_Productos.tipo_contrato
        FROM OTOR_Contratos
        INNER JOIN OTOR_SolicitudPrestamos
        ON OTOR_Contratos.id_solicitud_prestamo = OTOR_SolicitudPrestamos.id
        INNER JOIN CATA_Productos
        ON OTOR_SolicitudPrestamos.id_producto = CATA_Productos.id
        INNER JOIN CORP_OficinasFinancieras
        ON OTOR_SolicitudPrestamos.id_oficina = CORP_OficinasFinancieras.id
        INNER JOIN CORP_Zonas
        ON CORP_OficinasFinancieras.id_zona = CORP_Zonas.id
        WHERE OTOR_Contratos.id = @idContrato
    `);
    return result.recordsets
}
async function createReference(typeReference: string, idClient: number) {
    const pool = await sql.connect(sqlConfig);
    const result = await pool.request()
        .input('tipoEvento', sql.Int, typeReference)
        .input('id_cliente', sql.Int, idClient)
        .execute('MARE_ObtenerReferenciaIntermediario');

    return result.recordset;
}


router.get('/clients/hf/loanapps', authorize, async (req, res) => {
    try {
        if (!(req.query.branchId && req.query.applicationId)) {
            throw new Error('Query parametrs branchId or groupName are missing!')
        }
        const data: any = await getSolicitudServicioFinanciero(parseInt(req.query.applicationId as string), parseInt(req.query.branchId as string));

        /**
         * resultsets[0] => Detalle de la solicitud
         * resultsets[1] => Ciclo y estatus 
         * resultsets[4] => Integrantes, cargo, etc (importe solicitado, autorizado, etc)
         * resultsets[5] => Detalle Seguro (Costo, tipo seguro, Beneficiario, parentezco, etc)
         * resultsets[7] => Avales (Costo, tipo seguro, Beneficiario, parentezco, etc)
         */
        const loan_application = data[0][0];
        const loan_cycle = data[1][0];

        const db = nano.use(process.env.COUCHDB_NAME ? process.env.COUCHDB_NAME : '');

        await db.createIndex({ index: { fields: ["couchdb_type"] } });
        const productList = await db.find({ selector: { couchdb_type: "PRODUCT" } });
        const productMaster: any = productList.docs.find((prod: any) => prod.external_id == loan_application.id_producto_maestro)

        const identifierFreq = loan_application.periodicidad.slice(0, 1);
        const frequency = productMaster.allowed_term_type.find((i: any) => i.identifier === identifierFreq)
        /// Uses the same loan application info, except some field, ei: id_solicitud,
        /// and fecha Desembolso y Fecha primer pago
        const fechaDesNew = new Date();
        const fechaPPagoNew = new Date();

        fechaDesNew.setDate(fechaDesNew.getDate() + 7);
        fechaPPagoNew.setDate(fechaPPagoNew.getDate() + 14);

        const members = data[4].map((i: any, nCounter: number) => {
            const insuranceMemberInfo = data[5].find((x: any) => x.id_individual === i.id_individual);
            ///// buscar en la DB local si existe el integrante, como cliente por medio de id_cliente
            return {
                _id: `${Date.now() + nCounter}`,
                id_member: i.id,
                id_cliente: i.id_individual,
                fullname: `${i.nombre} ${i.apellido_paterno} ${i.apellido_materno}`,
                estatus: i.estatus.trim(),
                sub_estatus: i.sub_estatus.trim(),
                position: i.cargo.trim(),
                apply_amount: i.monto_solicitado,
                approved_amount: i.monto_autorizado,
                previous_amount: i.monto_anterior,
                loan_cycle: i.ciclo,
                disbursment_mean: i.id_cata_medio_desembolso,
                insurance: {
                    id: nCounter,
                    beneficiary: (insuranceMemberInfo ? insuranceMemberInfo.nombre_beneficiario : ''),
                    relationship: (insuranceMemberInfo ? insuranceMemberInfo.parentesco : ''),
                    percentage: (insuranceMemberInfo ? insuranceMemberInfo.porcentaje : 0)
                }
            }
        })

        const loan_app = {
            id_cliente: loan_application.id_cliente,
            id_solicitud: loan_application.id, // uses the same Id of the previous one
            loan_officer: loan_application.id_oficial,
            branch: loan_application.id_oficina,
            id_producto: loan_application.id_producto,
            id_disposicion: loan_application.id_disposicion,
            apply_amount: loan_application.monto_total_solicitado,
            approved_total: loan_application.monto_total_autorizado,
            term: loan_application.plazo,
            frequency: [frequency.identifier, frequency.value],
            first_repay_date: fechaPPagoNew.toISOString(),
            disbursment_date: fechaDesNew.toISOString(),
            disbursment_mean: loan_application.medio_desembolso.trim(),
            liquid_guarantee: loan_application.garantia_liquida,
            loan_cycle: loan_cycle.ciclo,
            estatus: loan_application.estatus.trim(), // para renovacion
            sub_estatus: loan_application.sub_estatus.trim(), /// 
            renovation: true,
            members,
            product: {
                external_id: productMaster.external_id,
                min_amount: productMaster.min_amount,
                max_amount: (productMaster.max_amount) * (members.length),
                step_amount: productMaster.step_amount,
                min_term: productMaster.min_term,
                max_term: productMaster.max_term,
                product_name: productMaster.product_name,
                term_types: productMaster.allowed_term_type,
                rate: productMaster.rate,
                tax: productMaster.tax,
                GL_financeable: false,
                liquid_guarantee: 10,
            }
        }

        res.send(loan_app)

    }

    catch (err) {
        console.log(err);
        res.status(400).send(err);

    }
})

async function getSolicitudServicioFinanciero(loanAppId: number, branchId: number) {
    // MOV_ObtenerSolicitudClienteServicioFinanciero_V2
    const pool = await sql.connect(sqlConfig);
    const result = await pool.request()
        .input('id_solicitud', sql.Int, loanAppId)
        .input('id_oficina', sql.Int, branchId)
        .execute('CLIE_ObtenerSolicitudClienteServicioFinanciero_V2');
    return result.recordsets;
}

router.get('/clients/hf/accountstatement', authorize, async (req, res) => {

    try {
        const months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
        const idContract = req.query.contractId as string;
        const dateFrom = new Date(req.query.dateFrom as string);
        const dateEnd = new Date(req.query.dateEnd as string);
        const yearDate = dateEnd.getFullYear().toString();
        const month = dateEnd.getMonth();
        const monthDate = months[month];
        const forceRefresh = !!parseInt(req.query.forceRefresh as string);
        let data: any = {};

        const db = nano.use(process.env.COUCHDB_NAME ? process.env.COUCHDB_NAME : '');

        try {
            data = await db.get(`CONTRACT|${idContract}`);
            const queryDate = new Date(data.query_at);
            const now = new Date();
            const timeDiff = now.getTime() - queryDate.getTime();
            // converts miliseconds in hours, and calculate 6 hours for normal refresh
            const hoursDiff = timeDiff / (1000 * 3600);
            if ((hoursDiff > 12 || forceRefresh)) {
                throw new Error('not account statement found, thus continue on cached block')
            }
            // retrieves only the Record Set part of the document
            res.send(data.rs);
        }
        catch (e) {

            let rs = await getObtenerEstadoCuentaPeriodo(parseInt(idContract),
                dateFrom,
                dateEnd,
                parseInt(yearDate),
                parseInt(monthDate));
            /// rs -> Result set of the account statement at the time being query
            /// query_at -> timestamp when the query was last saved
            const timeNow = new Date().toISOString();
            /// Insert or Update document
            await db.insert({ ...data, rs, query_at: timeNow, couchdb_type: "ACC_STATEMENT" }, `CONTRACT|${idContract}`);
            res.send(rs);
        }

    }
    catch (error) {
        console.log(error);
        res.status(400).send(error);
    }
})

router.get('/contract', authorize, async (req, res) => {
    try {
        if (!req.query.idContract) {
            throw new Error('idContract missing query param!');
        }
        const data: any = await getContractInfo(parseInt(req.query.idContract as string));
        if (!data[0][0]) {
            throw new Error('No contract found')
        }
        res.send(data[0][0])
    }
    catch (e: any) {
        res.status(400).send(e.message)
    }
})

async function getObtenerEstadoCuentaPeriodo(idContract: number, fechaInicial: Date, fechaFinal: Date, anio: number, mes: number) {

    // -- DATOS DEL CONTRATO
    // -- DATOS IFE, CURP, TELEFONO
    // -- MONTO AUTORIZADO
    // -- TABLA DE AMORTIZACION
    // -- MOVIMIENTOS DEL PERIODO
    const pool = await sql.connect(sqlConfig);
    const result = await pool.request()
        .input('idContrado', sql.Int, idContract)
        .input('fechaInicial', sql.Date, fechaInicial)
        .input('fechaFinal', sql.Date, fechaFinal)
        .input('anio', sql.Int, anio)
        .input('mes', sql.Int, mes)
        .execute('MOV_ObtenerEstadoCuentaPeriodo');
    return result.recordsets
}

router.get('/clients/createReference', authorize, async (req, res) => {
    try {
        //TODO: typeReference: 1 -> id: Crédito por id_cliente (NO USAR)
        //      typeReference: 2 -> id: Garantía Líquida por id_cliente
        //      typeReference: 3 -> id: Pago de moratorios por id_cliente
        //      typeReference: 6 -> id: Pago de crédito por id_contrato

        const { typeReference, contractId, clientId } = req.query;
        const id = typeReference === '2' ? clientId as string : contractId as string;
        const sqlRes = await createReference(typeReference as string, parseInt(id));

        res.status(200).send(sqlRes);
    } catch (error: any) {
        res.status(401).send(error.message);
    }
})



async function findClientByCurp(curp: string) {
    let pool = await sql.connect(sqlConfig);
    let result = await pool
        .request()
        .input("id", sql.Int, 0)
        .input("palabra", sql.VarChar, curp)
        .input("pagina_inicio", sql.Int, 0)
        .input("numero_registros", sql.Int, 0)
        .input("contador", sql.Int, 0)
        // .execute("CONT_BuscarPersona");
        .execute("MOV_BuscarPersona");
    return result;
}

async function findClientByKeyword(keyword: string) {
    let pool = await sql.connect(sqlConfig);
    let result = await pool
        .request()
        .input("nombre", sql.VarChar, keyword)
        .input("filtro", sql.Int, 0)
        .input("pagina", sql.Int, 1)
        .input("total_registros", sql.Int, 100)
        .input("id_oficina", sql.Int, 0)
        .input("id_opcion", sql.Int, 2)
        .execute("CLIE_ObtenerPersonaCliente"); 
        // .execute("MOV_BuscarPersona");
    return result;
}

export async function findClientByExternalId(externalId: number) {

    let pool = await sql.connect(sqlConfig);
    let result = await pool
        .request()
        .input("idCliente", sql.Int, externalId)
        .execute("MOV_ObtenerDatosPersona");
    return result;
};

export async function getClientByCurp(curp: string) {
    let pool = await sql.connect(sqlConfig);
    let result = await pool
        .request()
        .input("CURPCliente", sql.VarChar, curp)
        .execute("MOV_ObtenerDatosPersona");
    return result;
}

async function findClientByClaveIne(claveIne: string) {
    try {

        let pool = await sql.connect(sqlConfig);
        let result = await pool
            .request()
            .input("clave_ife", sql.VarChar, claveIne)
            .execute("CLIE_getPersonByIFE");
        return result;
    } catch (err) {
        console.log(err)
        return err;
    }
};

async function searchGroupLoanByName(groupName: string, branchId: number) {
    try {
        const pool = await sql.connect(sqlConfig);
        const result = await pool.request()
            .input('nombre_cliente', sql.VarChar, groupName)
            .input('id_oficina', sql.Int, branchId)
            .input('pagina', sql.Int, 1)
            .input('registros_pagina', sql.Int, 5000)
            .execute('CLIE_ObtenerClientesYSolicitudesPorOficina');
        const newRes = result.recordset.map(i => ({
            idCliente: i.idCliente,
            nombreCliente: i.nombreCliente,
            idSolicitud: i.idSolicitud,
            estatus: i.estatus.trim(),
            sub_estatus: i.sub_estatus.trim(),
            idTipoCliente: i.idTipoCliente,
            TipoCliente: i.TipoCliente
        }))

        return newRes;

    } catch (err: any) {
        throw new Error(err);
    }
}

router.get("/groups/download", authorize, async (req: any, res) => {
    /** Actualiza toda la información de un grupo */
    try {
        if (!req.query.branchId || !req.query.applicationId || !req.query.idCliente) {
            throw new Error('branch Id, application id or id Cliente params missing');
        }
        const db = nano.use(process.env.COUCHDB_NAME ? `${process.env.COUCHDB_NAME}-${req.user.branch[1].replace(/ /g,'').toLowerCase()}` : '');

        const idCliente = parseInt(req.query.idCliente as string);
        const idSolicitud = parseInt(req.query.applicationId as string);
        const branchId = parseInt(req.query.branchId as string);

        const data = await getLoanApplicationById(idSolicitud, branchId);
        const resData = await processLoanApplicationByDataRS(data,req.user.branch);

        await db.createIndex({ index: { fields: ["couchdb_type"] } });
        const groupsQuery = await db.find({
            selector: {
                couchdb_type: "GROUP"
            }, limit: 100000
        });


        /*****  GROUP creation - update ****/
        const coloniesQuery = await db.find({ selector: { couchdb_type: 'NEIGHBORHOOD' } });
        const colony: any = coloniesQuery.docs.find((i: any) => i._id === resData.group_data.address.colony[0])

        const groupDoc: any = groupsQuery.docs.find((item: any) => item.id_cliente == idCliente);
        /// if exists, assigns otherwise create a new _ID
        let newGroupId = !groupDoc ? `${Date.now().toString()}-${resData.group_data.id_cliente}` : groupDoc._id;

        const updateGroupDoc: any = {
            _id: newGroupId,
            ...resData.group_data,
            address: {
                ...resData.group_data.address,
                post_code: colony ? colony.codigo_postal : "",
            },
            couchdb_type: "GROUP",
            created_by: req.user.login,
            branch: req.user.branch,
            created_at: new Date(),
            status: [2, "Activo"],
        }

        if (groupDoc) {
            /// group doc exists
            await db.insert({
                _rev: groupDoc._rev,
                ...updateGroupDoc
            })
        } else {
            await db.insert({
                ...updateGroupDoc
            })
        }
        /***** END - GROUP creation - update ****/

        /*** CONTRACT create - update */
        const contractQuery = await db.find({
            selector: {
                couchdb_type: "CONTRACT"
            }, limit: 100000
        });

        const contractData: any = await getBalanceById(idCliente);
        for (let x = 0; x < contractData[0].length; x++) {
            const contractDoc = contractQuery.docs.find((item: any) => item.idContrato == contractData[0][x].idContrato);
            const newIdContract = !contractDoc ? `${Date.now().toString()}-${contractData[0][x].idContrato}` : contractDoc._id

            const contractUpdateDoc = {
                _id: newIdContract,
                ...contractData[0][x],
                client_id: newGroupId,
                created_by: req.user.login,
                created_at: new Date().toISOString(),
                branch: req.user.branch,
                couchdb_type: "CONTRACT",
            }
            if (contractDoc) {
                await db.insert({
                    _rev: contractDoc._rev,
                    ...contractUpdateDoc
                })
            } else {
                await db.insert({
                    ...contractUpdateDoc
                })
            }

        }

        /** CLIENT create - update */
        const queryTemp = await db.find({ selector: { couchdb_type: "CLIENT" }, limit: 100000 });
        const clientsQuery = queryTemp.docs.filter((x: any) => x.branch[0] == req.user.branch[0])
        const listClientsCreate: any[] = []
        const listClientsUpdate: any[] = []
        for (let w = 0; w < resData.loan_app.members.length; w++) {
            const clientDataRS = await findClientByExternalId(resData.loan_app.members[w].id_cliente)
            if (clientDataRS.recordset.length == 1) {
                /// only valid when record set OK
                const clientDataResult = processClientDataRS(clientDataRS);
                const clientDoc = clientsQuery.find((y: any) => y.id_cliente == clientDataResult.id_cliente);
                const newClientId = !clientDoc ? `${(Date.now()).toString()}-${clientDataResult.id_cliente}` : clientDoc._id

                const clientUpdateDoc: any = {
                    couchdb_type: 'CLIENT',
                    ...clientDataDef,
                    ...clientDataResult,
                    business_data: {
                        ...clientDataDef.business_data,
                        ...clientDataResult.business_data
                    },
                    status: [2, 'Aprovado'],
                    _id: newClientId
                }

                if (clientDoc) {
                    listClientsUpdate.push({
                        _rev: clientDoc._rev,
                        ...clientUpdateDoc
                    })
                } else {
                    listClientsCreate.push(clientUpdateDoc)
                }
            }
        }

        /******* LOANAPP_GROUP creation - update */
        const applicationQuery = await db.find({
            selector: {
                couchdb_type: "LOANAPP_GROUP"
            }, limit: 100000
        });


        const loanAppDoc = applicationQuery.docs.find((item: any) => item.id_solicitud == idSolicitud);
        /// if exists, assigns otherwise create a new _ID
        let newLoanAppId = !loanAppDoc ? `${Date.now().toString()}-${resData.loan_app.id_solicitud}` : loanAppDoc._id;

        const newMembersData = resData.loan_app.members.map((m: any) => {
            let docClientFound = listClientsCreate.concat(listClientsUpdate).find((j: any) => j.id_cliente == m.id_cliente);
            return {
                ...m,
                client_id: docClientFound._id
            }
        })

        const updateLoanAppDoc = {
            couchdb_type: "LOANAPP_GROUP",
            ...resData.loan_app,
            _id: newLoanAppId,
            members: newMembersData,
            dropout: [],
            apply_by: newGroupId,
            GL_financeable: false,
            liquid_guarantee: 10,
            renovation: false,
            apply_at: new Date().toISOString(),
            created_by: req.user.login,
            created_at: new Date().toISOString(),
            branch: req.user.branch
        }
        if (loanAppDoc) {
            await db.insert({
                _rev: loanAppDoc._rev,
                ...updateLoanAppDoc
            })
        } else {
            await db.insert({
                ...updateLoanAppDoc
            })
        }

        await db.bulk({ docs: listClientsCreate.concat(listClientsUpdate) });

        res.send(resData);
    }
    catch (e: any) {
        console.log(e);
        res.status(400).send(e.message)
    }
});

export async function productsSync( branch:[number,string]) {

    const db = nano.use(process.env.COUCHDB_NAME ? `${process.env.COUCHDB_NAME}-${branch[1].replace(/ /g,'').toLowerCase()}` : '');
    const product: any = await getProductsWeb();
    if (!product || product.length === 0) {
        throw new Error("Not able to find the product(s)");
    }
    const productsDestroy = await db.find({ selector: { couchdb_type: { "$eq": 'PRODUCT' } }, limit: 100000 });

    const docsEliminate = productsDestroy.docs.map(doc => ({ _deleted: true, _id: doc._id, _rev: doc._rev }))
    await db.bulk({ docs: docsEliminate })

    const rowData: any = [];
    const creationDatetime = Date.now().toString();

    product.forEach((data: any) => {

        /// el dato de SQL viene en una lista separada por comas. Una vez split, hay que limpiar la cadena devuelta
        const freqTypes = data.periodicidades.split(",").map((x: string) => x.trim());

        rowData.push(
            {
                default_frecuency: [
                    mapIdentifierForFrequency(freqTypes[0]),
                    freqTypes[0]
                ],
                deleted: false,
                default_mobile_product: false,
                enabled: true,
                product_type: "1",
                product_name: data.nombre,
                external_id: data.id,
                min_amount: data.valor_minimo,
                max_amount: data.valor_maximo,
                default_amount: data.valor_minimo,
                step_amount: 1000,
                min_term: data.periodo_min,
                max_term: data.periodo_max,
                default_term: data.periodo_min,
                min_rate: data.tasa_anual_min.toString(),
                max_rate: data.tasa_anual_max.toString(),
                rate: data.tasa_anual_min.toString(),
                tax: data.impuesto.toString(),
                years_type: data.tipo_ano,
                allowed_term_type:
                    freqTypes.map(
                        (w: any, increment: number) => ({
                            _id: increment,
                            identifier: mapIdentifierForTerm(w),
                            value: mapValueForTerm(w),
                            year_periods: mapYearPeriodForTerm(w)

                        }))
                ,
                allowed_frequency:
                    freqTypes.map(
                        (w: any, increment: number) => ({
                            _id: increment,
                            identifier: mapIdentifierForFrequency(w),
                            value: w
                        })),
                liquid_guarantee: data.garantia_liquida.toString(),
                GL_financeable: data.garantia_liquida_financiable,
                requires_insurance: data.requiere_seguro,
                logo: '',
                avatar: '',
                createdAt: creationDatetime,
                updatedAt: creationDatetime,
                couchdb_type: 'PRODUCT'
            }
        )
    });
    await db.bulk({ docs: rowData });

    return { docs: rowData.length }

}





export { router as hfRouter }