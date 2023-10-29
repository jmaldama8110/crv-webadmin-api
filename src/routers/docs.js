const express = require("express");
const router = new express.Router();
const authorize = require("../middleware/authorize");
const puppeteer = require('puppeteer');
const fs = require('fs');
const nano = require('../db/connCouch');
const { ExpressHandlebars } = require('express-handlebars');
const { formatLocalDate2 } = require('../utils/dateFormatter');
const  {formatLocalCurrency, getRounded}  = require('../utils/numberFormatter');
const Client = require('../model/client');
const multer  = require('multer');
const { arrayFromStringSize } = require("../utils/arrayTransformations");
const { calculateYearsMonthsFromDates } = require("../utils/diffDates");

const upload = multer();

const serverHost = `${process.env.WEB_SERVER_HOST}`;

router.get('/docs/html/visitas-certificacion-social', async(req, res) =>{

  try{

    const db = nano.use(process.env.COUCHDB_NAME);
    await db.createIndex({ index: { fields: ["couchdb_type"]}});
    const queryVisits = await db.find( { selector: { couchdb_type: "VISIT" }});
    const queryContracts = await db.find( { selector: { couchdb_type: "CONTRACT" }})
    
    const queryData = queryVisits.docs.map( i => {
      
      const contractData = queryContracts.docs.find( x => x._id === i.contract_id )
      return {
        created_by: i.created_by,
        created_at: i.created_at,
        contract_id: i.contract_id,
        mapLink: `https://www.google.com/maps/@?api=1&map_action=map&zoom=18&center=${i.coordinates[0]}%2C${i.coordinates[1]}`,
        internalArrears: i.internalArrears,
        completePayment: i.completePayment,
        nombreOficialCredito: contractData.nombreOficialCredito,
        nombreCliente: contractData.nombreCliente,
        visitQuiz: i.visitQuiz ? 'Si': 'No',
        visits_pics: i.visits_pics,
        sucursal: contractData.branch[1],
        ciclo: contractData.Ciclo,
        montoTotalAutorizado: contractData.montoTotalAutorizado,

      }
    }).filter( (w) => w.visitQuiz == 'Si' ) // visitQuiz TRUE only
    
    const hbs = new ExpressHandlebars({ extname:".handlebars" });
    const data = await hbs.render('views/visitas-certificacion-social.handlebars', {
        serverHost,
        queryData,
     });
    res.send(data);

  }
  catch(error){
    res.status(400).send(error.message);
  }

})

router.get("/docs/pdf/account-statement",authorize, async (req, res) => {
  try {
  
    const db = nano.use(process.env.COUCHDB_NAME);
    // Look up for the contract Id Information Generated ACCOUNT_STATEMENT
    const accStt = await db.get(`CONTRACT|${req.query.contractId}`);
    const summary = accStt.rs[0][0];
    const mbrs = accStt.rs[1];
    const mbrsFr = accStt.rs[2];
    const pplan = accStt.rs[3]
    const movs = accStt.rs[4];
    
    const hbs = new ExpressHandlebars({ extname:".handlebars"});
    
    const imgs = await loadBase64ImgArrayFromDB(['logo-cnsrv-light.png']);
    
    const htmlData = await hbs.render('views/account-statement.handlebars', 
    { 
      chartCapitalPagado:   summary.capital_pagado,
      chartCapitalPendiente: summary.saldo_capital_actual,
      chartInteresPagado: summary.interes_pagado,
      chartInteresPendiente: summary.interes_vencido,
      serverHost,
      imgLogoConserva: imgs[0],
      condusefTexto: {
          nombreSucursal: summary.nombre_oficina,
          direccionSucursal: summary.direccion_oficina,
          telefonoSucursal: summary.telefono_oficina, 
          unel1: summary.une.split('\r\n')[0],
          unel2: summary.une.split('\r\n')[1],
          unel3: summary.une.split('\r\n')[2],
          unel4: summary.une.split('\r\n')[3],
         },
      summaryA: {
         fechaInicial: formatLocalDate(summary.fecha_inicial),
         fechaFinal: formatLocalDate(summary.fecha_final),
         numeroContrato:  summary.id_contrato ,
         diaHoraReunion: `${summary.dia_reunion} ${summary.hora_reunion}` ,
         fechaContrato: formatLocalDate(summary.fecha_desembolso) ,
         montoCredito: formatLocalCurrency(summary.monto_credito) ,
         saldoInicialPeriodo: formatLocalCurrency(summary.saldo_inicial_periodo) ,
         saldoFinalPeriodo: formatLocalCurrency(summary.saldo_final_periodo) ,
         fechaCorte: formatLocalDate(summary.fecha_corte) ,
         nombreClienteLabel: summary.tipo_cliente == 1 ? 'Nombre del Grupo' : 'Nombre del Cliente',
         nombreCliente: summary.nombre_cliente ,
         nombreOficialLabel: summary.tipo_contrato === 'CONSERVA TE ACTIVA' ? 'Asesor de Negocio' :'Oficial de Credito',
         nombreOficial: summary.nombre_oficial ,
         plazoCredito: `${summary.plazo_credito} ${summary.periodicidad}` ,
         fechaLimitePago: formatLocalDate(summary.FechaLimitePago),
      },
      summaryB: {
         cat: summary.cat,
         tasaInteres: summary.tasa_interes ,
         tasaMoratoriaAnual: summary.tasa_interes_moratorio ,
         montoTotalPagarEnPeriodo: formatLocalCurrency(
            summary.capital_vencido + 
            summary.interes_vencido + 
            summary.impuesto_vencido+
            summary.interes_moratorio_generado +
            summary.impuesto_interes_moratorio_generado) ,
         capitalAPagar: formatLocalCurrency(summary.capital_vencido),
         interesAPagar: formatLocalCurrency(summary.interes_vencido),
         impuestaAPagar: formatLocalCurrency(summary.impuesto_vencido),
         interesMoratorioAPagar: formatLocalCurrency(summary.interes_moratorio_generado),
         impuestoInteresMoratorioAPagar: formatLocalCurrency(summary.impuesto_interes_moratorio_generado),
         saldoInsolutoCapital: formatLocalCurrency(summary.saldo_capital_actual),
         seguroVidaLabel: summary.tipo_contrato === 'CONSERVA TE ACTIVA' ? 'Seguro de Vida y Saldo Deudor' : 'Seguro de Vida',
         seguroVidaReal: summary.tipo_contrato === 'CONSERVA TE ACTIVA' ? formatLocalCurrency(summary.seguro_vida + summary.seguro_vida_deudor) : formatLocalCurrency(summary.seguro_vida),
         seguroVida: formatLocalCurrency(summary.seguro_vida ),
         seguroSaldoDeudor: formatLocalCurrency(summary.seguro_vida_deudor)         
      },

      summaryC: {
        capitalVencidoPagado: formatLocalCurrency(summary.capital_pagado),
        interesOrdinarioPagado: formatLocalCurrency(summary.interes_pagado),
        impuestoInteresOrdinarioPagado:formatLocalCurrency(summary.impuesto_pagado),
        interesesMoratoriosPagados: formatLocalCurrency(summary.interes_moratorio_pagado),
        impuestoInteresesMoratoriosPagados: formatLocalCurrency(summary.impuesto_interes_moratorio_pagado),
        totalPagado: formatLocalCurrency(
          summary.capital_pagado + 
          summary.interes_pagado + 
          summary.impuesto_pagado +
          summary.interes_moratorio_pagado + 
          summary.impuesto_interes_moratorio_pagado ),
        saldoActual: formatLocalCurrency( 
          summary.saldo_capital_actual +
          summary.interes_actual + 
          summary.impuesto_actual +
          summary.interes_moratorio_actual + 
          summary.impuesto_interes_moratorio_actual),
        saldoActualCapital: formatLocalCurrency(summary.saldo_capital_actual),
        interesesOrdinarios: formatLocalCurrency(summary.interes_actual),
        impuestoInteresesOrdinarios: formatLocalCurrency(summary.impuesto_actual),
        interesesMoratorios: formatLocalCurrency(summary.interes_moratorio_actual),
        impuestoInteresesMoratorios: formatLocalCurrency(summary.impuesto_interes_moratorio_actual),
        comisiones: "No Aplica",
      },
      summaryD: {
        capitalVencidoNoPagado: formatLocalCurrency(summary.saldo_capital_vencido),
        interesOrdinarioVencidoNoPagado: formatLocalCurrency(summary.saldo_interes_vencido),
        impuestoInteresOrdinarioVencidoNoPagado: formatLocalCurrency(summary.saldo_impuesto_vencido),
        interesesMoratoriosGeneradosNoPagados: formatLocalCurrency(summary.saldo_interes_moratorio),
        impuestoInteresesMoratoriosGeneradosNoPagados: formatLocalCurrency(summary.saldo_impuesto_interes_moratorio),
        totalVencidoNoPagado: formatLocalCurrency(
          summary.saldo_capital_vencido + 
          summary.saldo_interes_vencido + 
          summary.saldo_impuesto_vencido +
          summary.saldo_interes_moratorio +
          summary.saldo_impuesto_interes_moratorio ),
        DA: summary.dias_atraso,
        DAA: summary.dias_atraso_acumulados,
        montoCargosObjetadosAclaracion: formatLocalCurrency(summary.monto_cargos_aclaracion),
        folioReporteAclaracion: summary.folio_aclaracion ,
      },
      movs: movs.map( (i)=> ({ 
        no: i.no,
        origen: i.origen, 
        fecha: formatLocalDate(i.fecha),
        total: formatLocalCurrency(i.total),
        Capital: formatLocalCurrency(i.Capital),
        Interes: formatLocalCurrency(i.Interes),
        Impuesto: formatLocalCurrency(i.Impuesto),
        Interes_Moratorio: formatLocalCurrency(i.Interes_Moratorio),
        IVA_Interes_Moratorio: formatLocalCurrency(i.IVA_Interes_Moratorio) })).reverse(),
      totalMovs: ()=>{
        let sum = 0;
        for( let i=0; i< movs.length; i++){
          sum = sum + movs[i].total;
        }
        return formatLocalCurrency(sum);
      },
      pplan: pplan.map( i => ({
        no: i.no,
        fecha_inicio: formatLocalDate(i.fecha_inicio),
        fecha_vencimiento: formatLocalDate(i.fecha_vencimiento),
        fecha_pago: (i.fecha_pago),
        dias_atraso: i.dias_atraso,
        dias_atraso_acumulados: i.dias_atraso_acumulados,
        saldo_insoluto: formatLocalCurrency(i.saldo_insoluto),
        capital: formatLocalCurrency(i.capital),
        interes: formatLocalCurrency(i.interes),
        impuesto: formatLocalCurrency(i.impuesto), 
        total: formatLocalCurrency(i.total),
      })),
      pplanTotales: () =>{
        let totales = {capitalTotal: 0,interesTotal: 0,ivaTotal: 0,granTotal: 0}
        for(let i=0; i<pplan.length; i++){
          totales = {
            capitalTotal: totales.capitalTotal + pplan[i].capital,
            interesTotal: totales.interesTotal + pplan[i].interes,
            ivaTotal: totales.ivaTotal +  pplan[i].impuesto,
            granTotal: totales.granTotal + pplan[i].total
          }
        }
        return {  capitalTotal: formatLocalCurrency(totales.capitalTotal),
                  interesTotal: formatLocalCurrency(totales.interesTotal),
                  ivaTotal: formatLocalCurrency(totales.ivaTotal),
                  granTotal: formatLocalCurrency(totales.granTotal) }
      },
      integrantesLista: mbrsFr.map( i =>{
        const clientItem = mbrs.find( x => x.id_cliente == i.id_cliente );
        return {
          importe: formatLocalCurrency(i.monto_autorizado),
          nombre: `${clientItem.nombre} ${clientItem.apellido_paterno} ${clientItem.apellido_materno}`,
          proporcion_credito: getRounded(i.proporcion_credito*100),
          cargo: i.cargo,
        }
      }),

    });

    const result = await renderPDf(htmlData);
    res.send({...result } );


  } catch (e) {
    console.log(e);
    res.status(400).send(e);
  }
});


/*** ***TARJETON DE REFERENCIAS ******/

router.get('/docs/html/tarjeton-digital', async(req, res) =>{

  try{

    const { typeReference, contractId, clientId} = req.query;
    const id = typeReference === '2' ? clientId : contractId;
    const sqlRes = await Client.createReference(typeReference, id);

    const hbs = new ExpressHandlebars({ extname:".handlebars" });
    const bbienestarInfo = sqlRes.find( x => x.id_intermerdiario == 1 );
    const banorteInfo = sqlRes.find( x => x.id_intermerdiario == 2 );
    const bbvaInfo = sqlRes.find( x => x.id_intermerdiario == 4 );
    const fbienestarInfo = sqlRes.find( x => x.id_intermerdiario == 6 );
    const bbajioInfo = sqlRes.find( x => x.id_intermerdiario == 7 );
    const paynetInfo = sqlRes.find( x => x.id_intermerdiario == 8 );
    const payCashInfo = sqlRes.find( x => x.id_intermerdiario == 9 );
    const conservaInfo = sqlRes.find( x => x.id_intermerdiario == 11 );

    const imgs = await loadBase64ImgArrayFromDB( [
      'banbajio-logo.png',
      'banorte-logo.jpg',
      'bbienestar-logo.png',
      'bbva-logo.jpg',
      'bodega-logo.png',
      'circlek-logo.png',
      'cityclub-logo.png',
      'extra-logo.png',
      'farmahorro-logo.jpeg',
      'farmguadalajara-logo.jpeg',
      'fbienestar-logo.jpg',
      'logo-cnsrv-light.png',
      'merza-logo.png',
      'paycash-logo.png',
      'paynet-logo.jpg',
      'sams-logo.png',
      'santander-logo.png',
      'seven-logo.png',
      'soriana-logo.png',
      'superama-logo.png',
      'waldos-logo.jpeg',
      'walmart-logo.png',
      'yza-logo.png'
    ]);
    const banbajioLogo = imgs[0];
    const banorteLogo = imgs [1];
    const bbienestarLogo = imgs[2];
    const bbvaLogo = imgs[3];
    const bodegaLogo = imgs[4];
    const circlekLogo = imgs[5];
    const cityclubLogo = imgs[6];
    const extraLogo = imgs[7]
    const farmahorroLogo = imgs[8]
    const farmguadalajaraLogo = imgs[9]
    const fbienestarLogo = imgs[10]
    const cnsrvlightLogo = imgs[11];
    const merzaLogo = imgs[12];
    const paycashLogo = imgs[13];
    const paynetLogo = imgs[14];
    const samsLogo = imgs[15];
    const santanderLogo = imgs[16];
    const sevenLogo = imgs[17];
    const sorianaLogo = imgs[18];
    const superamaLogo = imgs[19]
    const waldosLogo = imgs[20]
    const walmartLogo = imgs[21];
    const yzaLogo = imgs[22];
  
    const htmlData = await hbs.render('views/tarjeton-digital.handlebars', {
        banbajioLogo,banorteLogo, bbienestarLogo,bbvaLogo,bodegaLogo,circlekLogo,cityclubLogo,extraLogo,farmahorroLogo,waldosLogo,walmartLogo,yzaLogo,
        farmguadalajaraLogo,fbienestarLogo,cnsrvlightLogo,merzaLogo,paycashLogo,paynetLogo,samsLogo,santanderLogo,sevenLogo,sorianaLogo,superamaLogo,
        clientId,
        serverHost,
        payCashInfo,
        paynetInfo,
        bbienestarInfo,
        fbienestarInfo,
        bbajioInfo,
        banorteInfo,
        bbvaInfo,
        conservaInfo
     });

     res.send(htmlData);
 

  }
  catch(error){
    res.status(400).send(error.message);
  }

})



router.get('/docs/pdf/tarjeton-digital',authorize, async(req, res) =>{

  try{

    const { typeReference, contractId, clientId} = req.query;
    const id = typeReference === '2' ? clientId : contractId;
    const sqlRes = await Client.createReference(typeReference, id);

    const hbs = new ExpressHandlebars({ extname:".handlebars" });
    const bbienestarInfo = sqlRes.find( x => x.id_intermerdiario == 1 );
    const banorteInfo = sqlRes.find( x => x.id_intermerdiario == 2 );
    const bbvaInfo = sqlRes.find( x => x.id_intermerdiario == 4 );
    const fbienestarInfo = sqlRes.find( x => x.id_intermerdiario == 6 );
    const bbajioInfo = sqlRes.find( x => x.id_intermerdiario == 7 );
    const paynetInfo = sqlRes.find( x => x.id_intermerdiario == 8 );
    const payCashInfo = sqlRes.find( x => x.id_intermerdiario == 9 );
    const conservaInfo = sqlRes.find( x => x.id_intermerdiario == 11 );

    const imgs = await loadBase64ImgArrayFromDB( [
      'banbajio-logo.png',
      'banorte-logo.jpg',
      'bbienestar-logo.png',
      'bbva-logo.jpg',
      'bodega-logo.png',
      'circlek-logo.png',
      'cityclub-logo.png',
      'extra-logo.png',
      'farmahorro-logo.jpeg',
      'farmguadalajara-logo.jpeg',
      'fbienestar-logo.jpg',
      'logo-cnsrv-light.png',
      'merza-logo.png',
      'paycash-logo.png',
      'paynet-logo.jpg',
      'sams-logo.png',
      'santander-logo.png',
      'seven-logo.png',
      'soriana-logo.png',
      'superama-logo.png',
      'waldos-logo.jpeg',
      'walmart-logo.png',
      'yza-logo.png'
    ]);
    const banbajioLogo = imgs[0];
    const banorteLogo = imgs [1];
    const bbienestarLogo = imgs[2];
    const bbvaLogo = imgs[3];
    const bodegaLogo = imgs[4];
    const circlekLogo = imgs[5];
    const cityclubLogo = imgs[6];
    const extraLogo = imgs[7]
    const farmahorroLogo = imgs[8]
    const farmguadalajaraLogo = imgs[9]
    const fbienestarLogo = imgs[10]
    const cnsrvlightLogo = imgs[11];
    const merzaLogo = imgs[12];
    const paycashLogo = imgs[13];
    const paynetLogo = imgs[14];
    const samsLogo = imgs[15];
    const santanderLogo = imgs[16];
    const sevenLogo = imgs[17];
    const sorianaLogo = imgs[18];
    const superamaLogo = imgs[19]
    const waldosLogo = imgs[20]
    const walmartLogo = imgs[21];
    const yzaLogo = imgs[22];
  
    const htmlData = await hbs.render('views/tarjeton-digital.handlebars', {
        banbajioLogo,banorteLogo, bbienestarLogo,bbvaLogo,bodegaLogo,circlekLogo,cityclubLogo,extraLogo,farmahorroLogo,waldosLogo,walmartLogo,yzaLogo,
        farmguadalajaraLogo,fbienestarLogo,cnsrvlightLogo,merzaLogo,paycashLogo,paynetLogo,samsLogo,santanderLogo,sevenLogo,sorianaLogo,superamaLogo,
        clientId,
        serverHost,
        payCashInfo,
        paynetInfo,
        bbienestarInfo,
        fbienestarInfo,
        bbajioInfo,
        banorteInfo,
        bbvaInfo,
        conservaInfo
     });
    const result = await renderPDf(htmlData); 
    res.send({...result } );
  }
  catch(error){
    res.status(400).send(error.message);
  }

})

router.get('/docs/pdf/test', async(req, res) =>{

  try{

    if( !req.query.loanId ){
      throw new Error('parameter loanId is missing in URL');
    }
    const db = nano.use(process.env.COUCHDB_NAME);
    await db.createIndex({ index: { fields: ["couchdb_type"]}});
    const query = await db.find( { selector: { couchdb_type: "LOANAPP_GROUP" }, limit: 50000});
    
    const loanApp = query.docs.find( i => i._id === req.query.loanId );
    if( !loanApp ){
      throw new Error('Loan App does not exist with the id:' + req.query.loanId);
    }

    if( !loanApp.members ){
      throw new Error('No members found at the loan application!')
    }
    const keys = loanApp.members.map( x => ( x.client_id ));
    const clientsQuery = await db.fetch({keys: keys})
    
    const loginUser = {
      fullName: req.user ?`${req.user.name} ${req.lastname} ${req.second_lastname}` : '__________________________________________________________________'
    }


    const clientsData = clientsQuery.rows.map( (x) => {

      const memberData = loanApp.members.find( y => y.client_id === x.doc._id )
      const loanCycle = parseInt(memberData.loan_cycle) + 1
      const memberLoanAmount = memberData.apply_amount;
      const beneficiaryInfo = {
        name: memberData.insurance.beneficiary,
        relationship: memberData.insurance.relationship,
        percentage: memberData.insurance.percentage
      }
        const dob = x.doc.dob.slice(0,10).split('-').reverse();
        dob.length = 3;
        
        const mobilePhone = x.doc.phones.find( y => y.type === 'Móvil')
        const otherPhone = x.doc.phones.find( y => y.type === 'Caseta')

        const homeAddress = x.doc.address.find( y => y.type === 'DOMICILIO');
        const bisAddress = x.doc.address.find( y => y.type === 'NEGOCIO');
        let bisAddressSame = 'No';
        if( bisAddress ){ // evaluates first bisAddress exists, since object may not exits
          if( !!bisAddress.bis_address_same ) {
            bisAddressSame = bisAddress.bis_address_same ? 'Si': 'No';
          }
  
        }
        const incomeInfo = {
          sales: formatLocalCurrency(parseInt(x.doc.business_data.income_sales_total)),
          family: formatLocalCurrency(parseInt(x.doc.business_data.income_partner)),
          job: formatLocalCurrency(parseInt(x.doc.business_data.income_job)),
          abroad: formatLocalCurrency(parseInt(x.doc.business_data.income_remittances)),
          other: formatLocalCurrency(parseInt(x.doc.business_data.income_other)),
          total: formatLocalCurrency(parseInt(x.doc.business_data.income_total)),
        }
        const expensesInfo = {
          family: formatLocalCurrency(parseInt(x.doc.business_data.expense_family)),
          rent: formatLocalCurrency(parseInt(x.doc.business_data.expense_rent)),
          bis: formatLocalCurrency(parseInt(x.doc.business_data.expense_business)),
          payables: formatLocalCurrency(parseInt(x.doc.business_data.expense_debt)),
          debt: formatLocalCurrency(parseInt(x.doc.business_data.expense_credit_cards)),
          total: formatLocalCurrency(parseInt(x.doc.business_data.expense_total)),
        }
        const bisQualitySalesMonthly = {
          monthSaleJan: x.doc.business_data.bis_quality_sales_monthly.month_sale_jan,
          monthSaleFeb: x.doc.business_data.bis_quality_sales_monthly.month_sale_feb,
          monthSaleMar: x.doc.business_data.bis_quality_sales_monthly.month_sale_mar,
          monthSaleApr: x.doc.business_data.bis_quality_sales_monthly.month_sale_apr,
          monthSaleMay: x.doc.business_data.bis_quality_sales_monthly.month_sale_may,
          monthSaleJun: x.doc.business_data.bis_quality_sales_monthly.month_sale_jun,
          monthSaleJul: x.doc.business_data.bis_quality_sales_monthly.month_sale_jul,
          monthSaleAug: x.doc.business_data.bis_quality_sales_monthly.month_sale_aug,
          monthSaleSep: x.doc.business_data.bis_quality_sales_monthly.month_sale_sep,
          monthSaleOct: x.doc.business_data.bis_quality_sales_monthly.month_sale_oct,
          monthSaleNov: x.doc.business_data.bis_quality_sales_monthly.month_sale_nov,
          monthSaleDic: x.doc.business_data.bis_quality_sales_monthly.month_sale_dic
    
        }
 
       return {
        name: x.doc.name,
        lastname: x.doc.lastname,
        second_lastname: x.doc.second_lastname,
        branch: loanApp.branch[1],
        apply_at: formatLocalDate2(loanApp.apply_at).split("/"),
        loan_cycle: loanCycle,
        economicDependants: x.doc.economic_dependants,
        internetAccess: x.doc.internet_access ? 'Si' : 'No',
        isSocialMediaFacebook: x.doc.prefered_social === 'FACEBOOK' ? 'X' : '',
        isSocialWhatsapp: x.doc.prefered_social === 'WHATSAPP' ? 'X' : '',
        isSocialMediaInstagram: x.doc.prefered_social === 'INSTAGRAM' ? 'X' : '',
        userSocialMedia: x.doc.user_social,
        memberLoanAmount: formatLocalCurrency(memberLoanAmount),
        isNewLoan: loanCycle > 1 ? "": "X",
        isFemale: x.doc.sex[0] == 3 ? 'X' : ' ',
        isMale: x.doc.sex[0] != 3 ? 'X' : ' ',
        isSingle: x.doc.marital_status[0] == 1 ? "X": "",
        isMarried: x.doc.marital_status[0] == 2 ? "X": "",
        isCommonLaw: x.doc.marital_status[0] == 3 ? "X": "",
        nationality: x.doc.nationality[0] == 1 ? "MEXICANA": "OTRA",
        countrtAndProvince: `${x.doc.province_of_birth[1]}, ${x.doc.country_of_birth[1]}`.toUpperCase(),
        dob,
        curp: arrayFromStringSize(x.doc.curp,18,'*'),
        rfc: arrayFromStringSize(x.doc.rfc,13,'*'),
        email: x.doc.email,
        mobilePhone: !!mobilePhone ? arrayFromStringSize(mobilePhone.phone,10,'*') : arrayFromStringSize('',10,''),
        otherPhone: !!otherPhone ? arrayFromStringSize(otherPhone.phone,10,'*') : arrayFromStringSize('',10,''),
        geoLat: !!x.doc.coordinates ? x.doc.coordinates[0] : 0,
        geoLng: !!x.doc.coordinates ? x.doc.coordinates[1] : 0,
        homeAddress,
        bisAddress,
        bisAddressSame,
        hasHouseholdFloor: x.doc.household_floor ? 'X' : '',
        hasHouseholdRoof: x.doc.household_roof ? 'X' : '',
        hasHouseholdToilet: x.doc.household_toilet ? 'X' : '',
        hasHouseholdLatrine: x.doc.household_latrine ? 'X' : '',
        hasHouseholdBrick: x.doc.household_brick ? 'X' : '',
        economicActivity: x.doc.business_data.economic_activity[1],
        numberEmployees: x.doc.business_data.number_employees,
        loanDestination: x.doc.business_data.loan_destination[1],
        bisYearsMonths: calculateYearsMonthsFromDates(new Date(!!x.doc.business_data.business_start_date ?x.doc.business_data.business_start_date: new Date() ), new Date()),
        homeYearsMonths: calculateYearsMonthsFromDates(new Date(!!homeAddress.residence_since? homeAddress.residence_since : new Date() ), new Date()),
        homeOwnershipRented: homeAddress.ownership_type === 'Renta',
        homeOwnershipOwned: homeAddress.ownership_type,
        homeOwnershipRelative: homeAddress.ownership_type,
        keepsAccountingRecords: x.doc.business_data.keeps_accounting_records ?'Si' :'No',
        hasPreviousExperience: x.doc.business_data.has_previous_experience ? 'Si': 'No',
        previousExperience: x.doc.business_data.previous_loan_experience,
        incomeInfo,
        expensesInfo,
        bisQualitySalesMonthly,
        isBisTypeDaily: x.doc.business_data.bis_season_type === 'D' ? 'X': '',
        isBisTypeWeekly: x.doc.business_data.bis_season_type === 'S' ? 'X': '',
        isBisTypeFortnightly : x.doc.business_data.bis_season_type === 'C' ? 'X': '',
        beneficiaryInfo,
        loginUser
       }
      })
    
    const hbs = new ExpressHandlebars({ extname:".handlebars" });
    const htmlData = await hbs.render('views/solicitud-grupo-solidario.handlebars', {
        serverHost,
        clientsData: clientsData,
     });
     const result = await renderPDf(htmlData);
     res.send({...result } );

  }
  catch(error){
    res.status(400).send(error.message);
  }

})


router.get('/docs/html/test', async(req, res) =>{

  try{

    if( !req.query.loanId ){
      throw new Error('parameter loanId is missing in URL');
    }
    const db = nano.use(process.env.COUCHDB_NAME);
    await db.createIndex({ index: { fields: ["couchdb_type"]}});
    const query = await db.find( { selector: { couchdb_type: "LOANAPP_GROUP" }, limit: 50000});
    
    const loanApp = query.docs.find( i => i._id === req.query.loanId );
    if( !loanApp ){
      throw new Error('Loan App does not exist with the id:' + req.query.loanId);
    }

    if( !loanApp.members ){
      throw new Error('No members found at the loan application!')
    }
    const keys = loanApp.members.map( x => ( x.client_id ));
    const clientsQuery = await db.fetch({keys: keys})
    
    const loginUser = {
      fullName: req.user ?`${req.user.name} ${req.lastname} ${req.second_lastname}` : '__________________________________________________________________'
    }


    const clientsData = clientsQuery.rows.map( (x) => {

      const memberData = loanApp.members.find( y => y.client_id === x.doc._id )
      const loanCycle = parseInt(memberData.loan_cycle) + 1
      const memberLoanAmount = memberData.apply_amount;
      const beneficiaryInfo = {
        name: memberData.insurance.beneficiary,
        relationship: memberData.insurance.relationship,
        percentage: memberData.insurance.percentage
      }
        const dob = x.doc.dob.slice(0,10).split('-').reverse();
        dob.length = 3;
        
        const mobilePhone = x.doc.phones.find( y => y.type === 'Móvil')
        const otherPhone = x.doc.phones.find( y => y.type === 'Caseta')

        const homeAddress = x.doc.address.find( y => y.type === 'DOMICILIO');
        const bisAddress = x.doc.address.find( y => y.type === 'NEGOCIO');
        let bisAddressSame = 'No';
        if( bisAddress ){ // evaluates first bisAddress exists, since object may not exits
          if( !!bisAddress.bis_address_same ) {
            bisAddressSame = bisAddress.bis_address_same ? 'Si': 'No';
          }
  
        }
        const incomeInfo = {
          sales: formatLocalCurrency(parseInt(x.doc.business_data.income_sales_total)),
          family: formatLocalCurrency(parseInt(x.doc.business_data.income_partner)),
          job: formatLocalCurrency(parseInt(x.doc.business_data.income_job)),
          abroad: formatLocalCurrency(parseInt(x.doc.business_data.income_remittances)),
          other: formatLocalCurrency(parseInt(x.doc.business_data.income_other)),
          total: formatLocalCurrency(parseInt(x.doc.business_data.income_total)),
        }
        const expensesInfo = {
          family: formatLocalCurrency(parseInt(x.doc.business_data.expense_family)),
          rent: formatLocalCurrency(parseInt(x.doc.business_data.expense_rent)),
          bis: formatLocalCurrency(parseInt(x.doc.business_data.expense_business)),
          payables: formatLocalCurrency(parseInt(x.doc.business_data.expense_debt)),
          debt: formatLocalCurrency(parseInt(x.doc.business_data.expense_credit_cards)),
          total: formatLocalCurrency(parseInt(x.doc.business_data.expense_total)),
        }
        const bisQualitySalesMonthly = {
          monthSaleJan: x.doc.business_data.bis_quality_sales_monthly.month_sale_jan,
          monthSaleFeb: x.doc.business_data.bis_quality_sales_monthly.month_sale_feb,
          monthSaleMar: x.doc.business_data.bis_quality_sales_monthly.month_sale_mar,
          monthSaleApr: x.doc.business_data.bis_quality_sales_monthly.month_sale_apr,
          monthSaleMay: x.doc.business_data.bis_quality_sales_monthly.month_sale_may,
          monthSaleJun: x.doc.business_data.bis_quality_sales_monthly.month_sale_jun,
          monthSaleJul: x.doc.business_data.bis_quality_sales_monthly.month_sale_jul,
          monthSaleAug: x.doc.business_data.bis_quality_sales_monthly.month_sale_aug,
          monthSaleSep: x.doc.business_data.bis_quality_sales_monthly.month_sale_sep,
          monthSaleOct: x.doc.business_data.bis_quality_sales_monthly.month_sale_oct,
          monthSaleNov: x.doc.business_data.bis_quality_sales_monthly.month_sale_nov,
          monthSaleDic: x.doc.business_data.bis_quality_sales_monthly.month_sale_dic
    
        }
 
       return {
        name: x.doc.name,
        lastname: x.doc.lastname,
        second_lastname: x.doc.second_lastname,
        branch: loanApp.branch[1],
        apply_at: formatLocalDate2(loanApp.apply_at).split("/"),
        loan_cycle: loanCycle,
        economicDependants: x.doc.economic_dependants,
        internetAccess: x.doc.internet_access ? 'Si' : 'No',
        isSocialMediaFacebook: x.doc.prefered_social === 'FACEBOOK' ? 'X' : '',
        isSocialWhatsapp: x.doc.prefered_social === 'WHATSAPP' ? 'X' : '',
        isSocialMediaInstagram: x.doc.prefered_social === 'INSTAGRAM' ? 'X' : '',
        userSocialMedia: x.doc.user_social,
        memberLoanAmount: formatLocalCurrency(memberLoanAmount),
        isNewLoan: loanCycle > 1 ? "": "X",
        isFemale: x.doc.sex[0] == 3 ? 'X' : ' ',
        isMale: x.doc.sex[0] != 3 ? 'X' : ' ',
        isSingle: x.doc.marital_status[0] == 1 ? "X": "",
        isMarried: x.doc.marital_status[0] == 2 ? "X": "",
        isCommonLaw: x.doc.marital_status[0] == 3 ? "X": "",
        nationality: x.doc.nationality[0] == 1 ? "MEXICANA": "OTRA",
        countrtAndProvince: `${x.doc.province_of_birth[1]}, ${x.doc.country_of_birth[1]}`.toUpperCase(),
        dob,
        curp: arrayFromStringSize(x.doc.curp,18,'*'),
        rfc: arrayFromStringSize(x.doc.rfc,13,'*'),
        email: x.doc.email,
        mobilePhone: !!mobilePhone ? arrayFromStringSize(mobilePhone.phone,10,'*') : arrayFromStringSize('',10,''),
        otherPhone: !!otherPhone ? arrayFromStringSize(otherPhone.phone,10,'*') : arrayFromStringSize('',10,''),
        geoLat: !!x.doc.coordinates ? x.doc.coordinates[0] : 0,
        geoLng: !!x.doc.coordinates ? x.doc.coordinates[1] : 0,
        homeAddress,
        bisAddress,
        bisAddressSame,
        hasHouseholdFloor: x.doc.household_floor ? 'X' : '',
        hasHouseholdRoof: x.doc.household_roof ? 'X' : '',
        hasHouseholdToilet: x.doc.household_toilet ? 'X' : '',
        hasHouseholdLatrine: x.doc.household_latrine ? 'X' : '',
        hasHouseholdBrick: x.doc.household_brick ? 'X' : '',
        economicActivity: x.doc.business_data.economic_activity[1],
        numberEmployees: x.doc.business_data.number_employees,
        loanDestination: x.doc.business_data.loan_destination[1],
        bisYearsMonths: calculateYearsMonthsFromDates(new Date(!!x.doc.business_data.business_start_date ?x.doc.business_data.business_start_date: new Date() ), new Date()),
        homeYearsMonths: calculateYearsMonthsFromDates(new Date(!!homeAddress.residence_since? homeAddress.residence_since : new Date() ), new Date()),
        homeOwnershipRented: homeAddress.ownership_type === 'Renta',
        homeOwnershipOwned: homeAddress.ownership_type,
        homeOwnershipRelative: homeAddress.ownership_type,
        keepsAccountingRecords: x.doc.business_data.keeps_accounting_records ?'Si' :'No',
        hasPreviousExperience: x.doc.business_data.has_previous_experience ? 'Si': 'No',
        previousExperience: x.doc.business_data.previous_loan_experience,
        incomeInfo,
        expensesInfo,
        bisQualitySalesMonthly,
        isBisTypeDaily: x.doc.business_data.bis_season_type === 'D' ? 'X': '',
        isBisTypeWeekly: x.doc.business_data.bis_season_type === 'S' ? 'X': '',
        isBisTypeFortnightly : x.doc.business_data.bis_season_type === 'C' ? 'X': '',
        beneficiaryInfo,
        loginUser
       }
      })
    
    const hbs = new ExpressHandlebars({ extname:".handlebars" });
    const htmlData = await hbs.render('views/solicitud-grupo-solidario.handlebars', {
        serverHost,
        clientsData: clientsData,        
     });
    res.send(htmlData);

  }
  catch(error){
    console.log(error);
    res.status(400).send(error.message);
  }

})



async function renderPDf( htmlData ) {

  const serverEnv = process.env.SERVER_ENV || 'development'
  const browser = (serverEnv === 'development') ? await puppeteer.launch() : 
                                                await puppeteer.launch({executablePath: '/usr/bin/chromium-browser', args: ['--no-sandbox', '--disable-setuid-sandbox']});
  
  const page = await browser.newPage();
  await page.setContent(htmlData, { waitUntil: ['domcontentloaded', 'load', "networkidle0"] });
 
  //To reflect CSS used for screens instead of print
  await page.emulateMediaType('print');
  const fileNamePathPdf = `./public/pdfs/accstatement_${Date.now().toString()}.pdf`
  
  const pdf = await page.pdf({
    path: fileNamePathPdf,
    margin: { top: '20px', right: '30px', bottom: '20px', left: '30px' },
    printBackground: true,
    format: 'Letter',
  });
  // Close the browser instance
  await browser.close();
  // fs.unlinkSync(fileNamePathPdf);
  // res.send(pdf.toString('base64'));
  return { downloadPath: serverHost+'/' +fileNamePathPdf.replace('./public/','') }
}

router.post('/photos/upload', authorize, upload.array('photos', 24), async function (req, res, next) {
  try{

    const newListDocs = [];
    for( let i=0; i< req.files.length; i++ ){
      /// ignores files that are not images PNG or JPEG
      if( !(req.files[i].mimetype === 'image/png' || 
          req.files[i].mimetype === 'image/jpeg')
       ) continue;

      const base64str = req.files[i].buffer.toString('base64');
      const item = {
        _id: req.files[i].originalname,
        base64str,
        title: req.files[i].originalname,
        mimetype: req.files[i].mimetype
      }
      newListDocs.push(item);
    }
    const db = nano.use(process.env.COUCHDB_NAME_PHOTOSTORE);
    await db.bulk( {docs: newListDocs} );
    res.send({ uploads: newListDocs.length });
  }
  catch(e){
    res.status(400).send({ error: e.message, note:'try upload less than 24 photo files'});
  }
  
});


router.get('/docs/img', async (req, res) =>{
  /// server images based on the _id
    const id = req.query.id;
  
    try{
      if( !id ) throw new Error('No img id supplied..');
      const db = nano.use(process.env.COUCHDB_NAME_PHOTOSTORE);
      const imageData = await db.get(id);
      const img = Buffer.from(imageData.base64str,'base64');
      res.writeHead(200,{
        'Content-Type': imageData.mimetype,
        'Content-Length': img.length
      });
      res.end(img);
    }
    catch(e){
      console.log(e)
      res.status(400).send(e.message);
    }
})


async function loadBase64ImgArrayFromDB (keys) {
  const db = nano.use(process.env.COUCHDB_NAME_PHOTOSTORE);
  const data = await db.fetch({keys:keys });
  const newData = data.rows.map( x=> ( { base64str: x.doc.base64str, mimetype: x.doc.mimetype, title: x.doc.title }))
  return newData;
  
}


module.exports = router;
