import express from 'express';
import { authorize } from '../middleware/authorize';
import sql from 'mssql';
import { sqlConfig } from '../db/connSQL';
import * as Nano from 'nano';

let nano = Nano.default(`${process.env.COUCHDB_PROTOCOL}://${process.env.COUCHDB_USER}:${process.env.COUCHDB_PASS}@${process.env.COUCHDB_HOST}:${process.env.COUCHDB_PORT}`);
const router = express.Router();

router.get('/clients/exists', authorize, async (req:any, res:any) => {
    try {

        if( !req.query.identityNumber ){
            throw new Error('Identity Number parameter is required..');
        }

        let data = await findClientByCurp(req.query.identityNumber);
        if( data.rowsAffected[0] == 1 ){
            /// recordsets[0][0] contains personal Info from HF
            const personalData = {
                ...data.recordset[0],
            };
        
            res.send({ id_cliente: personalData.id });
        } else {
            res.send({id_cliente: ''});
        }

    }
    catch(error){
        console.log(error)
        res.status(400).send(error)
    }

});

router.get('/groups/hf/loanapps', authorize, async(req, res) => {
    try{

        if( !(req.query.branchId && req.query.applicationId) ){
            throw new Error('Query parametrs branchId or groupName are missing!')
        }
        const data:any = await getLoanApplicationById(parseInt(req.query.applicationId as string),parseInt(req.query.branchId as string));
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
              post_code: '',
              address_line1: group_address.direccion,
              road_type: [group_address.vialidad,''],
              province: [`PROVINCE|${group_address.estado}`,''],
              municipality: [`MUNICIPALITY|${group_address.municipio}`,''],
              city: [`CITY|${group_address.localidad}`,''],
              colony: [`NEIGHBORHOOD|${group_address.colonia}`,''],
              address_line2:group_address.referencia,       
              numero_exterior: group_address.numero_exterior,
              numero_interior: group_address.numero_interior
            }
             
        }
        
        const members = data[4].map( (i:any,nCounter:number) =>{
                const insuranceMemberInfo = data[5].find( (x:any)=> x.id_individual === i.id_individual);
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
                        percentage: (insuranceMemberInfo ? insuranceMemberInfo.porcentaje : 0 )
                    }
                    
                }
            })

        /// retrieves Product information, that is not provided by HF
        const db = nano.use(process.env.COUCHDB_NAME ? process.env.COUCHDB_NAME : '');

        await db.createIndex({ index:{  fields:["couchdb_type"] }});
        const productList = await db.find( { selector: { couchdb_type: "PRODUCT" }});
        const productMaster:any = productList.docs.find( (prod:any)=> prod.external_id == loan_application.id_producto_maestro  )
        if( !productMaster) {
            throw new Error('Se producto maestro no se encontro para id_producto_maestro: '+ loan_application.id_producto_maestro );
        }
        const identifierFreq = loan_application.periodicidad.slice(0,1);
        const frequency = productMaster.allowed_term_type.find( (i:any) => i.identifier === identifierFreq)
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
            frequency: [frequency.identifier,frequency.value],
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
              max_amount: (productMaster.max_amount)*(members.length),
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

        res.status(200).send( { group_data, loan_app}  );
        

    } catch(err){
        console.log(err);
        res.status(400).send(err);
    }
})

async function getLoanApplicationById ( loanAppId:number, branchId:number) {
    
    const pool = await sql.connect(sqlConfig);
    const result = await pool.request()
        .input('id_solicitud', sql.Int, loanAppId)
        .input('id_oficina', sql.Int, branchId)
        .execute('CLIE_ObtenerSolicitudClienteServicioFinanciero_V2');
    return result.recordsets;

}

function mapSocialMedia (id:number) {
    switch(id){
        case 2: 
            return 'WHATSAPP';
        case 3:
            return 'FACEBOOK';
        case 4: 
            return 'INSTAGRAM';
        default: 
            return '';
    }
}

router.get("/clients/hf", authorize, async(req, res) => {

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
    try {
        
        let data:any;
        if ( (req.query.externalId) ) {
            data = await findClientByExternalId(parseInt(req.query.externalId as string));
        } else {
            throw new Error('Some query parameters area mising...')
        }
        
        if (data.recordset.length == 1) {

            /// extract CURP and Ine Folio
            const curp = data.recordsets[1].find(
                (i:any) => i.tipo_identificacion === "CURP"
            );

            const ife = data.recordsets[1].find(
                (i:any) => i.tipo_identificacion === "IFE"
            );
            const rfc = data.recordsets[1].find(
                (i:any) => i.tipo_identificacion === "RFC"
            );

            /// busca el detalle de la IFE/INE
            const ineDetail = data.recordsets[2]
            const ine_detalle = ineDetail.find( (i:any) => i.id_identificacion_oficial === ife.id_numero )

            const identities = []
            for( let i=0; i< data.recordsets[1].length; i++){
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

            const address = [];
            let email = ''
            for (let i = 0; i < data.recordsets[3].length; i++) {
                const add = data.recordsets[3][i]                
                if( add.correo_electronico ){
                    email = add.correo_electronico;
                }
                address.push({
                    _id: add.id,
                    type: add.tipo.trim(),

                    country: [`COUNTRY|${add.id_pais}`,  add.nombre_pais],

                    province: [`PROVINCE|${add.id_estado}`, add.nombre_estado],
                    municipality: [`MUNICIPALITY|${add.id_municipio}`, add.nombre_municipio],
                    city: [`CITY|${add.id_ciudad_localidad}`, add.nombre_ciudad_localidad],
                    colony: [`NEIGHBORHOOD|${add.id_asentamiento}`, add.nombre_asentamiento],
                    address_line1: add.direccion,
                    ext_number: add.numero_exterior,
                    int_number: add.numero_interior,
                    street_reference: add.referencia,
                    ownership: add.casa_situacion === 'PROPIO' ? true : false,
                    post_code: add.codigo_postal,
                    residence_since: add.tiempo_habitado_inicio,
                    residence_to: add.tiempo_habitado_final,
                    road: [add.vialidad, add.etiqueta_vialidad],
                    email
                })
            }
            const phones = [];
            for (let l = 0; l < data.recordsets[4].length; l++) {
                
                const phoneAdd = data.recordsets[4][l]
                if( phoneAdd.idcel_telefono.trim() ){
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
                economic_dependants: "",
                internet_access: false,
                prefered_social: "",
                user_social: "",
            }
            let business_data:any = { 
                economic_activity:[], 
                profession:[],
                business_name: '',
                business_start_date:'',
                business_owned: false,
                business_phone: "",
                number_employees: "",
                loan_destination: [
                  0,
                  ""
                ],
                income_sales_total: "",
                income_partner: "",
                income_job: "",
                income_remittances: "",
                income_other: "",
                income_total: "",
                expense_family: "",
                expense_rent: "",
                expense_business: "",
                expense_debt: "",
                expense_credit_cards: "",
                expense_total: "",
                keeps_accounting_records: false,
                has_previous_experience: false,
                previous_loan_experience: "",
                bis_season_type: "",
            }

            let econActId = 0, econActCap = '',
            profId = 0, profCap = '',
            occupId = 0, occupCap = ''

            if( data.recordsets[7].length > 0 ){

                if( data.recordsets[7][0].id_actividad_economica  ){
                    econActId = data.recordsets[7][0].id_actividad_economica ? data.recordsets[7][0].id_actividad_economica : 0,
                    econActCap =  data.recordsets[7][0].nombre_actividad_economica ? data.recordsets[7][0].nombre_actividad_economica.toString(): '';
                }

                profId = data.recordsets[7][0].id_profesion ? data.recordsets[7][0].id_profesion : 0,
                profCap = data.recordsets[7][0].nombre_profesion? data.recordsets[7][0].nombre_profesion.toString() : '';
                
                occupId = perSet.id_occupation ? perSet.id_occupation : 0,
                occupCap = perSet.occupation? perSet.occupation.toString() : '';            
            }

            if( data.recordsets[7].length ) {

                business_data.economic_activity = [ econActId,econActCap],
                business_data.profession = [profId, profCap],
                business_data.business_name = data.recordsets[7][0].nombre_negocio,
                business_data.business_start_date = data.recordsets[7][0].econ_fecha_inicio_act_productiva,
                business_data.business_owned = false,
                business_data.business_phone = "",
                
                business_data.number_employees = "";
                business_data.loan_destination = [data.recordsets[7][0].econ_id_destino_credito,''];
                business_data.income_sales_total = data.recordsets[7][0].econ_cantidad_mensual;
                business_data.income_partner = data.recordsets[7][0].econ_sueldo_conyugue;
                

                household_data.economic_dependants = data.recordsets[7][0].econ_dependientes_economicos.toString();
                household_data.household_brick = !!data.recordsets[7][0].vivienda_block;
                household_data.household_floor = !!data.recordsets[7][0].vivienda_piso;
                household_data.household_latrine = !!data.recordsets[7][0].vivienda_letrina;
                household_data.household_roof = !!data.recordsets[7][0].vivienda_techo_losa;
                household_data.household_toilet =  !!data.recordsets[7][0].vivienda_bano;
                household_data.internet_access = !!data.recordsets[7][0].utiliza_internet;
                household_data.prefered_social = mapSocialMedia( data.recordsets[7][0].id_tipo_red_social );
                household_data.user_social = data.recordsets[7][0].usuario_red_social

            }

            const cicloData = data.recordsets[6]
            const loan_cycle = cicloData.length ? cicloData[0].ciclo : 0

            const result = {
                id_persona: perSet.id_persona,
                id_cliente: perSet.id,
                name: perSet.name,
                lastname: perSet.lastname,
                second_lastname: perSet.second_lastname,
                email,
                curp: curp ? curp.id_numero : "",
                clave_ine: ife ? ife.id_numero : "",
                numero_emisiones: ine_detalle ? ine_detalle.numero_emision: '',
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
                client_type: [2,'INDIVIDUAL'],
                nationality: [perSet.id_nationality, perSet.nationality],
                province_of_birth: [
                    `PROVINCE|${perSet.id_province_of_birth}`,
                    perSet.province_of_birth,
                ],
                country_of_birth: [
                    `COUNTRY|${perSet.id_country_of_birth}`,
                    perSet.country_of_birth,
                ],
                ocupation: [occupId , occupCap],
                marital_status: [perSet.id_marital_status, perSet.marital_status],
                identification_type: [], // INE/PASAPORTE/CEDULA/CARTILLA MILITAR/LICENCIA
                guarantor: [],
                business_data,
                ...household_data,                
                beneficiaries: [],
                personal_references: [],
                guarantee: [],
                ife_details: ineDetail,
                data_company: [data.recordsets[8][0]],
                data_efirma: [data.recordsets[9][0]],
            };
            res.send(result);
        } else {
            
            res.status(404).send("Not found");
        }
    } catch (err) {
        console.log(err);
        res.status(404).send('Client data not found');
    }
});


router.get('/clients/hf/search', authorize, async(req, res) => {
    
    try{

        if( !(req.query.branchId && req.query.clientName) ){
            throw new Error('Query parametrs branchId or clientName are missing!')
        }
        const data = await searchGroupLoanByName(req.query.clientName as string,parseInt(req.query.branchId as string));
        res.status(200).send(data);

    } catch(err){
        console.log(err);
        res.status(400).send(err);
    }
})

router.get('/catalogs/sync',authorize, async (req,res) => {
    try{
        await updateCatalogFromHF('CATA_ActividadEconomica',10000, true)
        await updateCatalogFromHF('CATA_sexo',10000)
        await updateCatalogFromHF('CATA_sector',10000)
        await updateCatalogFromHF('CATA_escolaridad',10000)
        await updateCatalogFromHF('CATA_estadoCivil',10000)
        await updateCatalogFromHF('CATA_nacionalidad',10000, true)
        
        await updateCatalogFromHF('CATA_parentesco',10000)
        await updateCatalogFromHF('CATA_profesion',10000, true)
        await updateCatalogFromHF('CATA_TipoRelacion',10000)
        await updateCatalogFromHF('CATA_TipoPuesto',10000)
        await updateCatalogFromHF('CATA_TipoVialidad',10000)
        await updateCatalogFromHF('CATA_Ciudad_Localidad',10000)
        await updateCatalogFromHF('CATA_destinoCredito',10000)
        await updateCatalogFromHF('CATA_ocupacionPLD',10000, true)
        await updateCatalogFromHF('CATA_banco',10000)
        await updateCatalogFromHF('CATA_TipoCuentaBancaria',10000)

        await updateCatalogFromHF('CATA_MotivoBajaCastigado',10000)
        await updateCatalogFromHF('CATA_MotivoBajaCancelacion',10000)
        await updateCatalogFromHF('CATA_MotivoBajaRechazado',10000)

        await updateCatalogFromHFByRelationship('CATA_asentamiento',1000,'NEIGHBORHOOD', 'CITY', 'ciudad_localidad' );
        await updateCatalogFromHFByRelationship('CATA_ciudad_localidad',1000,'CITY', 'MUNICIPALITY', 'municipio');
        await updateCatalogFromHFByRelationship('CATA_municipio',1000,'MUNICIPALITY', 'PROVINCE', 'estado');
        await updateCatalogFromHFByRelationship('CATA_estado',1000,'PROVINCE', 'COUNTRY', 'pais');
        await updateCatalogFromHFByRelationship('CATA_pais', 1000, 'COUNTRY');
        
        res.status(201).send('Done!');
    }
    catch(error){
        console.log(error + '');
        res.status(400).send(error + '')
    }
});

router.get('/products/sync', authorize, async(req, res) => {

    try {
        const db = nano.use(process.env.COUCHDB_NAME ? process.env.COUCHDB_NAME : '');
        const product:any = await getProductsWeb();
        if (!product || product.length === 0) {
            throw new Error("Not able to find the product(s)");
        }
        const productsDestroy = await db.find({ selector: { couchdb_type: { "$eq": 'PRODUCT' } }, limit: 100000 });

        const docsEliminate = productsDestroy.docs.map(doc => ({ _deleted: true, _id: doc._id, _rev: doc._rev }))
        await db.bulk({ docs: docsEliminate })

        const rowData:any = [];
        const creationDatetime = Date.now().toString();

        product.forEach((data:any) => {

            /// el dato de SQL viene en una lista separada por comas. Una vez split, hay que limpiar la cadena devuelta
            const freqTypes = data.periodicidades.split(",").map( (x:string) => x.trim() );
                      
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
                    min_amount: data.valor_minimo.toString(),
                    max_amount: data.valor_maximo.toString(),
                    default_amount: data.valor_minimo.toString(),
                    step_amount: "1000",
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
                        ( w:any,increment:number )=> ({
                                    _id: increment,
                                    identifier: mapIdentifierForTerm(w),
                                    value: mapValueForTerm(w),
                                    year_periods: mapYearPeriodForTerm(w)
                               
                    }))
                    ,
                    allowed_frequency: 
                    freqTypes.map(
                        ( w:any,increment:number )=> ({
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
        res.send(rowData);

    } catch (e) {
        res.status(400).send(e + '');
    }

});


async function getProductsWeb (){
    try{
        const pool = await sql.connect(sqlConfig);
        let result = await pool
                        .request()
                        .execute('MOV_ProductsForWeb');
        
        return result.recordset;
    } catch (err) {
        return err;
    }
}


function mapIdentifierForFrequency (frequencyType:string) {
    switch( frequencyType){
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
function mapIdentifierForTerm (frequencyType:string) {
    switch( frequencyType){
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
function mapValueForTerm (frequencyType:string) {
    switch( frequencyType){
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
function mapYearPeriodForTerm (frequencyType:string) {
    switch( frequencyType){
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



async function updateCatalogFromHF (name:string, chunk:number, filterActive?:boolean) {
    try {
        const db = nano.use(process.env.COUCHDB_NAME ? process.env.COUCHDB_NAME : '');
        const docsDestroy = await db.find({ selector: { name }, limit: 100000 });
        if (docsDestroy.docs.length > 0) {
            const docsEliminate = docsDestroy.docs.map(doc => {
                const { _id, _rev } = doc;
                return { _deleted: true, _id, _rev }
            })
            db.bulk({ docs: docsEliminate })
                .then((body) => { console.log('DELETE', name) })
                .catch((error) => console.log(error));
        }

        sql.connect(sqlConfig, (err) => {
            const request = new sql.Request();
            request.stream = true;//Activarlo al trabajar con varias filas

            if (filterActive) {
                request.query(`select * from ${name} where estatus_registro = \'ACTIVO\'`);
            } else {
                request.query(`select * from ${name}`);
            }

            let rowData:any = [];

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

async function updateCatalogFromHFByRelationship(name:string, chunk:number, shortname:string, relationship_name?:string, relationship?:string) {
    try {
        const db = nano.use(process.env.COUCHDB_NAME ? process.env.COUCHDB_NAME : '');
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

            let rowData:any = [];

            request.on('row', row => {
                // relationship
                const codigo_postal = row.codigo_postal
                let dataRow:any = relationship ? {
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
                // if(relationship) dataRow.[relationship] = `${relationship_name}|${(row[`id_${relationship}`]).toString()}`;
                // if(row.codigo_postal || row.abreviatura || row.codigo) console.log(row.codigo_postal, row.abreviatura, row.codigo)
                if (row.codigo_postal) dataRow.codigo_postal = row.codigo_postal;
                if (row.codigo) dataRow.codigo = row.codigo;
                if (row.abreviatura) dataRow.abreviatura = row.abreviatura;

                rowData.push(dataRow)

                // rowData.push(relationship ? codigo_postal ?  {
                //     _id:`${shortname.toUpperCase()}|${(row.id).toString()}`,
                //     codigo_postal,
                //     couchdb_type: shortname,
                //     etiqueta: row.etiqueta,
                //     [relationship]: `${relationship_name}|${(row[`id_${relationship}`]).toString()}`,
                // } : {
                //     _id:`${shortname.toUpperCase()}|${(row.id).toString()}`,
                //     couchdb_type: shortname,
                //     etiqueta: row.etiqueta,
                //     [relationship]: `${relationship_name}|${(row[`id_${relationship}`]).toString()}`,
                // } : {
                //     _id:`${shortname.toUpperCase()}|${(row.id).toString()}`,
                //     // name: shortname,
                //     couchdb_type: shortname,
                //     etiqueta: row.etiqueta
                // });
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
    } catch (e:any) {
        console.log(e)
        throw new Error(e)
    }
}


router.get('/clients/hf/getBalance', authorize, async(req, res) => {
    
    try{
        const result:any = await getBalanceById( parseInt(req.query.idCliente as string));
        res.send(result[0]);
    } catch (error:any) {
        res.status(401).send(error.message)
    }
});

async function getBalanceById (idClient:number){
    try{
        const pool = await sql.connect(sqlConfig);
        const result = await pool.request()
            .input('idCliente', sql.Int, idClient)
            .execute('MOV_ObtenerSaldoClienteById');
        return result.recordsets
    } catch (err:any) {
        throw new Error(err);
    }
}
async function createReference (typeReference: string, idClient: number) {
    const pool = await sql.connect(sqlConfig);
    const result = await pool.request()
        .input('tipoEvento', sql.Int, typeReference)
        .input('id_cliente', sql.Int, idClient)
        .execute('MARE_ObtenerReferenciaIntermediario');

    return result.recordset;
}


router.get('/clients/hf/loanapps', authorize, async(req, res) => {
    try{
        if( !(req.query.branchId && req.query.applicationId) ){
            throw new Error('Query parametrs branchId or groupName are missing!')
        }
        const data:any = await getSolicitudServicioFinanciero(parseInt(req.query.applicationId as string),parseInt(req.query.branchId as string));
        
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

        await db.createIndex({ index:{  fields:["couchdb_type"] }});
        const productList = await db.find( { selector: { couchdb_type: "PRODUCT" }});
        const productMaster:any = productList.docs.find( (prod:any)=> prod.external_id == loan_application.id_producto_maestro  )
        
        const identifierFreq = loan_application.periodicidad.slice(0,1);
        const frequency = productMaster.allowed_term_type.find( (i:any) => i.identifier === identifierFreq)
        /// Uses the same loan application info, except some field, ei: id_solicitud,
        /// and fecha Desembolso y Fecha primer pago
        const fechaDesNew = new Date();
        const fechaPPagoNew = new Date();

        fechaDesNew.setDate(fechaDesNew.getDate() + 7);
        fechaPPagoNew.setDate( fechaPPagoNew.getDate() + 14);

        const members = data[4].map( (i:any,nCounter:number) =>{
            const insuranceMemberInfo = data[5].find( (x:any)=> x.id_individual === i.id_individual);
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
                    percentage: (insuranceMemberInfo ? insuranceMemberInfo.porcentaje : 0 )
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
            frequency: [frequency.identifier,frequency.value],
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
              max_amount: (productMaster.max_amount)*(members.length),
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

    catch(err){
        console.log(err);
        res.status(400).send(err);

    }
})

async function getSolicitudServicioFinanciero (loanAppId:number, branchId:number) {
    // MOV_ObtenerSolicitudClienteServicioFinanciero_V2
        const pool = await sql.connect(sqlConfig);
        const result = await pool.request()
            .input('id_solicitud', sql.Int, loanAppId)
            .input('id_oficina', sql.Int, branchId)
            .execute('CLIE_ObtenerSolicitudClienteServicioFinanciero_V2');
        return result.recordsets;
}

router.get('/clients/hf/accountstatement', authorize, async (req, res)=> {

    try {
        const months = ['01','02','03','04','05','06','07','08','09','10','11','12'];
        const idContract = req.query.contractId as string;
        const dateFrom = new Date(req.query.dateFrom as string);
        const dateEnd = new Date(req.query.dateEnd as string);
        const yearDate = dateEnd.getFullYear().toString();
        const month = dateEnd.getMonth();
        const monthDate = months[ month ];
        const forceRefresh = !!parseInt(req.query.forceRefresh as string);
        let data:any = {};

        const db = nano.use(process.env.COUCHDB_NAME ? process.env.COUCHDB_NAME : '');

        try{
            data = await db.get(`CONTRACT|${idContract}`);   
            const queryDate = new Date(data.query_at);
            const now = new Date();
            const timeDiff = now.getTime() - queryDate.getTime();
            // converts miliseconds in hours, and calculate 6 hours for normal refresh
            const hoursDiff = timeDiff / (1000 * 3600);
            if( (hoursDiff > 12 || forceRefresh ) ){
                throw new Error('not account statement found, thus continue on cached block')
            }
            // retrieves only the Record Set part of the document
            res.send(data.rs);
        }
        catch(e) {
            
            let rs = await getObtenerEstadoCuentaPeriodo(  parseInt(idContract),
                                                                dateFrom,
                                                                dateEnd,
                                                                parseInt(yearDate),
                                                                parseInt(monthDate) );
            /// rs -> Result set of the account statement at the time being query
            /// query_at -> timestamp when the query was last saved
            const timeNow = new Date().toISOString();
            /// Insert or Update document
            await db.insert({ ...data,rs, query_at: timeNow, couchdb_type: "ACC_STATEMENT"}, `CONTRACT|${idContract}`);
            res.send(rs); 
        }

    }
    catch(error){
        console.log(error);
        res.status(400).send(error);
    }
})

async function getObtenerEstadoCuentaPeriodo (idContract:number, fechaInicial:Date, fechaFinal:Date, anio:number, mes:number) {

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

router.get('/clients/createReference', authorize, async(req, res) => {
    try {
        //TODO: typeReference: 1 -> id: Crédito por id_cliente (NO USAR)
        //      typeReference: 2 -> id: Garantía Líquida por id_cliente
        //      typeReference: 3 -> id: Pago de moratorios por id_cliente
        //      typeReference: 6 -> id: Pago de crédito por id_contrato

        const { typeReference, contractId, clientId} = req.query;
        const id = typeReference === '2' ? clientId as string : contractId as string;
        const sqlRes = await createReference(typeReference as string, parseInt(id));
        
        res.status(200).send(sqlRes);
    } catch (error:any) {
        res.status(401).send(error.message);
    }
})



async function findClientByCurp (curp:string){
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

async function findClientByExternalId (externalId:number) {
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

async function searchGroupLoanByName (groupName:string, branchId:number) {
    try {
        const pool = await sql.connect(sqlConfig);
        const result = await pool.request()
            .input('nombre_cliente', sql.VarChar, groupName)
            .input('id_oficina', sql.Int, branchId)
            .input('pagina', sql.Int, 1)
            .input('registros_pagina', sql.Int, 50)
            .execute('CLIE_ObtenerClientesYSolicitudesPorOficina');
        const newRes = result.recordset.map( i =>({ 
                                            idCliente: i.idCliente,
                                            nombreCliente: i.nombreCliente,
                                            idSolicitud: i.idSolicitud,
                                            estatus: i.estatus.trim(),
                                            sub_estatus: i.sub_estatus.trim(),
                                            idTipoCliente: i.idTipoCliente,
                                            TipoCliente: i.TipoCliente
                                        }))

        return newRes;

    } catch (err:any) {
        throw new Error(err);
    }
}


export { router as hfRouter}