const express = require("express");
const router = new express.Router();
const authorize = require("../middleware/authorize");
const puppeteer = require('puppeteer');
const fs = require('fs');
const nano = require('../db/connCouch');
const { ExpressHandlebars } = require('express-handlebars');
const { formatLocalDate } = require('../utils/dateFormatter');
const  {formatLocalCurrency, getRounded}  = require('../utils/numberFormatter');

// router.get("/docs/html/account-statement", async (req, res) => {

//   try{
//     const db = nano.use(process.env.COUCHDB_NAME);
//     // Look up for the contract Id Information Generated ACCOUNT_STATEMENT
//     const accStt = await db.get(`CONTRACT|${req.query.contractId}`);
//     const summary = accStt.rs[0][0];
//     const mbrs = accStt.rs[1];
//     const mbrsFr = accStt.rs[2];
//     const pplan = accStt.rs[3]
//     const movs = accStt.rs[4];

    
//     const logoBase64 = fs.readFileSync('./public/logo-cnsrv-light.png', { encoding: 'base64'});
//     const hbs = new ExpressHandlebars({ extname:".handlebars"});
    
//     const data = await hbs.render('views/account-statement.handlebars', 
//     { 
//       logoImageFilePath: `data:image/jpeg;base64,${logoBase64}`,
//       chartCapitalPagado:   summary.capital_pagado,
//       chartCapitalPendiente: summary.saldo_capital_actual,
//       chartInteresPagado: summary.interes_pagado,
//       chartInteresPendiente: summary.interes_vencido,
      
//       condusefTexto: {
//           nombreSucursal: summary.nombre_oficina,
//           direccionSucursal: summary.direccion_oficina,
//           telefonoSucursal: summary.telefono_oficina, 
//           unel1: summary.une.split('\r\n')[0],
//           unel2: summary.une.split('\r\n')[1],
//           unel3: summary.une.split('\r\n')[2],
//           unel4: summary.une.split('\r\n')[3],
//          },
//       summaryA: {
//          fechaInicial: formatLocalDate(summary.fecha_inicial),
//          fechaFinal: formatLocalDate(summary.fecha_final),
//          numeroContrato:  summary.id_contrato ,
//          diaHoraReunion: `${summary.dia_reunion} ${summary.hora_reunion}` ,
//          fechaContrato: formatLocalDate(summary.fecha_desembolso) ,
//          montoCredito: formatLocalCurrency(summary.monto_credito) ,
//          saldoInicialPeriodo: formatLocalCurrency(summary.saldo_inicial_periodo) ,
//          saldoFinalPeriodo: formatLocalCurrency(summary.saldo_final_periodo) ,
//          fechaCorte: formatLocalDate(summary.fecha_corte) ,
//          nombreClienteLabel: summary.tipo_cliente == 1 ? 'Nombre del Grupo' : 'Nombre del Cliente',
//          nombreCliente: summary.nombre_cliente ,
//          nombreOficialLabel: summary.tipo_contrato === 'CONSERVA TE ACTIVA' ? 'Asesor de Negocio' :'Oficial de Credito',
//          nombreOficial: summary.nombre_oficial ,
//          plazoCredito: `${summary.plazo_credito} ${summary.periodicidad}` ,
//          fechaLimitePago: formatLocalDate(summary.FechaLimitePago),
//       },
//       summaryB: {
//          cat: summary.cat,
//          tasaInteres: summary.tasa_interes ,
//          tasaMoratoriaAnual: summary.tasa_interes_moratorio ,
//          montoTotalPagarEnPeriodo: formatLocalCurrency(
//             summary.capital_vencido + 
//             summary.interes_vencido + 
//             summary.impuesto_vencido+
//             summary.interes_moratorio_generado +
//             summary.impuesto_interes_moratorio_generado) ,
//          capitalAPagar: formatLocalCurrency(summary.capital_vencido),
//          interesAPagar: formatLocalCurrency(summary.interes_vencido),
//          impuestaAPagar: formatLocalCurrency(summary.impuesto_vencido),
//          interesMoratorioAPagar: formatLocalCurrency(summary.interes_moratorio_generado),
//          impuestoInteresMoratorioAPagar: formatLocalCurrency(summary.impuesto_interes_moratorio_generado),
//          saldoInsolutoCapital: formatLocalCurrency(summary.saldo_capital_actual),
//          seguroVidaLabel: summary.tipo_contrato === 'CONSERVA TE ACTIVA' ? 'Seguro de Vida y Saldo Deudor' : 'Seguro de Vida',
//          seguroVidaReal: summary.tipo_contrato === 'CONSERVA TE ACTIVA' ? formatLocalCurrency(summary.seguro_vida + summary.seguro_vida_deudor) : formatLocalCurrency(summary.seguro_vida),
//          seguroVida: formatLocalCurrency(summary.seguro_vida ),
//          seguroSaldoDeudor: formatLocalCurrency(summary.seguro_vida_deudor)         
//       },

//       summaryC: {
//         capitalVencidoPagado: formatLocalCurrency(summary.capital_pagado),
//         interesOrdinarioPagado: formatLocalCurrency(summary.interes_pagado),
//         impuestoInteresOrdinarioPagado:formatLocalCurrency(summary.impuesto_pagado),
//         interesesMoratoriosPagados: formatLocalCurrency(summary.interes_moratorio_pagado),
//         impuestoInteresesMoratoriosPagados: formatLocalCurrency(summary.impuesto_interes_moratorio_pagado),
//         totalPagado: formatLocalCurrency(
//           summary.capital_pagado + 
//           summary.interes_pagado + 
//           summary.impuesto_pagado +
//           summary.interes_moratorio_pagado + 
//           summary.impuesto_interes_moratorio_pagado ),
//         saldoActual: formatLocalCurrency( 
//           summary.saldo_capital_actual +
//           summary.interes_actual + 
//           summary.impuesto_actual +
//           summary.interes_moratorio_actual + 
//           summary.impuesto_interes_moratorio_actual),
//         saldoActualCapital: formatLocalCurrency(summary.saldo_capital_actual),
//         interesesOrdinarios: formatLocalCurrency(summary.interes_actual),
//         impuestoInteresesOrdinarios: formatLocalCurrency(summary.impuesto_actual),
//         interesesMoratorios: formatLocalCurrency(summary.interes_moratorio_actual),
//         impuestoInteresesMoratorios: formatLocalCurrency(summary.impuesto_interes_moratorio_actual),
//         comisiones: "No Aplica",
//       },
//       summaryD: {
//         capitalVencidoNoPagado: formatLocalCurrency(summary.saldo_capital_vencido),
//         interesOrdinarioVencidoNoPagado: formatLocalCurrency(summary.saldo_interes_vencido),
//         impuestoInteresOrdinarioVencidoNoPagado: formatLocalCurrency(summary.saldo_impuesto_vencido),
//         interesesMoratoriosGeneradosNoPagados: formatLocalCurrency(summary.saldo_interes_moratorio),
//         impuestoInteresesMoratoriosGeneradosNoPagados: formatLocalCurrency(summary.saldo_impuesto_interes_moratorio),
//         totalVencidoNoPagado: formatLocalCurrency(
//           summary.saldo_capital_vencido + 
//           summary.saldo_interes_vencido + 
//           summary.saldo_impuesto_vencido +
//           summary.saldo_interes_moratorio +
//           summary.saldo_impuesto_interes_moratorio ),
//         DA: summary.dias_atraso,
//         DAA: summary.dias_atraso_acumulados,
//         montoCargosObjetadosAclaracion: formatLocalCurrency(summary.monto_cargos_aclaracion),
//         folioReporteAclaracion: summary.folio_aclaracion ,
//       },
//       movs: movs.map( (i)=> ({ 
//         no: i.no,
//         origen: i.origen, 
//         fecha: formatLocalDate(i.fecha),
//         total: formatLocalCurrency(i.total),
//         Capital: formatLocalCurrency(i.Capital),
//         Interes: formatLocalCurrency(i.Interes),
//         Impuesto: formatLocalCurrency(i.Impuesto),
//         Interes_Moratorio: formatLocalCurrency(i.Interes_Moratorio),
//         IVA_Interes_Moratorio: formatLocalCurrency(i.IVA_Interes_Moratorio) })).reverse(),
//       totalMovs: ()=>{
//         let sum = 0;
//         for( let i=0; i< movs.length; i++){
//           sum = sum + movs[i].total;
//         }
//         return formatLocalCurrency(sum);
//       },
//       pplan: pplan.map( i => ({
//         no: i.no,
//         fecha_inicio: formatLocalDate(i.fecha_inicio),
//         fecha_vencimiento: formatLocalDate(i.fecha_vencimiento),
//         fecha_pago: (i.fecha_pago),
//         dias_atraso: i.dias_atraso,
//         dias_atraso_acumulados: i.dias_atraso_acumulados,
//         saldo_insoluto: formatLocalCurrency(i.saldo_insoluto),
//         capital: formatLocalCurrency(i.capital),
//         interes: formatLocalCurrency(i.interes),
//         impuesto: formatLocalCurrency(i.impuesto), 
//         total: formatLocalCurrency(i.total),
//       })),
//       pplanTotales: () =>{
//         let totales = {capitalTotal: 0,interesTotal: 0,ivaTotal: 0,granTotal: 0}
//         for(let i=0; i<pplan.length; i++){
//           totales = {
//             capitalTotal: totales.capitalTotal + pplan[i].capital,
//             interesTotal: totales.interesTotal + pplan[i].interes,
//             ivaTotal: totales.ivaTotal +  pplan[i].impuesto,
//             granTotal: totales.granTotal + pplan[i].total
//           }
//         }
//         return {  capitalTotal: formatLocalCurrency(totales.capitalTotal),
//                   interesTotal: formatLocalCurrency(totales.interesTotal),
//                   ivaTotal: formatLocalCurrency(totales.ivaTotal),
//                   granTotal: formatLocalCurrency(totales.granTotal) }
//       },
//       integrantesLista: mbrsFr.map( i =>{
//         const clientItem = mbrs.find( x => x.id_cliente == i.id_cliente );
//         return {
//           importe: formatLocalCurrency(i.monto_autorizado),
//           nombre: `${clientItem.nombre} ${clientItem.apellido_paterno} ${clientItem.apellido_materno}`,
//           proporcion_credito: getRounded(i.proporcion_credito*100),
//           cargo: i.cargo,
//         }
//       }),

//   });
    
//     res.send(data);
//   }
//   catch(error){
//     res.status(400).send(error.message);
//   }
// });

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
    
    const logoBase64 = fs.readFileSync('./public/logo-cnsrv-light.png', { encoding: 'base64'});
    const hbs = new ExpressHandlebars({ extname:".handlebars" });

    const data = await hbs.render('views/visitas-certificacion-social.handlebars', {
        logoImageFilePath: `data:image/jpeg;base64,${logoBase64}`,
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
    const logoBase64 = fs.readFileSync('./public/logo-cnsrv-light.png', { encoding: 'base64'});
    
    const hbs = new ExpressHandlebars({ extname:".handlebars"});
    
    const htmlData = await hbs.render('views/account-statement.handlebars', 
    { 
      logoImageFilePath: `data:image/jpeg;base64,${logoBase64}`,
      chartCapitalPagado:   summary.capital_pagado,
      chartCapitalPendiente: summary.saldo_capital_actual,
      chartInteresPagado: summary.interes_pagado,
      chartInteresPendiente: summary.interes_vencido,
      
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
    res.send({ downloadPath: fileNamePathPdf.replace('./public/','') });


  } catch (e) {
    res.status(400).send(e.message);
  }
});

module.exports = router;
