const express = require("express");
const router = new express.Router();
const authorize = require("../middleware/authorize");
const puppeteer = require('puppeteer');
const fs = require('fs');
const nano = require('../db/connCouch');
const { ExpressHandlebars } = require('express-handlebars');
const { formatLocalDate } = require('../utils/dateFormatter');
const  formatLocalCurrency  = require('../utils/numberFormatter');

router.get("/docs/html/account-statement", async (req, res) => {

  try{
    const db = nano.use(process.env.COUCHDB_NAME);

    const accStt = await db.get(`CONTRACT|${req.query.contractId}`);
    const summary = accStt.rs[0][0];
    const mbrs = accStt.rs[1];
    const mbrsFr = accStt.rs[2];
    const pplan = accStt.rs[3]
    const movs = accStt.rs[4];

    const logoBase64 = fs.readFileSync('./public/logo-cnsrv-light.png', { encoding: 'base64'});
    const hbs = new ExpressHandlebars({ extname:".handlebars"});
    const data = await hbs.render('views/account-statement.handlebars', 
    { 
      logoImageFilePath: `data:image/jpeg;base64,${logoBase64}`,
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
         nombreCliente: summary.nombre_cliente ,
         nombreOficial: summary.nombre_oficial ,
         plazoCredito: `${summary.plazo_credito} ${summary.periodicidad}` ,
         fechaLimitePago: formatLocalDate(summary.FechaLimitePago) ,
      },
      summaryB: {
         cat: summary.cat,
         tasaInteres: summary.tasa_interes ,
         tasaMoratoriaAnual: summary.tasa_interes_moratorio ,
         montoTotalPagarEnPeriodo: formatLocalCurrency(summary.capital_vencido + summary.interes_vencido + summary.impuesto_vencido),
         capitalAPagar: summary.capital_vencido ,
         interesAPagar: summary.interes_vencido ,
         impuestaAPagar: summary.impuesto_vencido ,
         interesMoratorioAPagar: summary.interes_moratorio_generado ,
         impuestoInteresMoratorioAPagar: summary.impuesto_interes_moratorio_generado ,
         saldoInsolutoCapital: summary.saldo_capital_actual ,
         seguroVida: summary.seguro_vida ,
         seguroSaldoDeudor: summary.seguro_vida_deudor ,
      },  
      summaryC: {
        capitalVencidoPagado: summary.capital_pagado ,
        interesOrdinarioPagado: summary.interes_pagado ,
        impuestoInteresOrdinarioPagado: summary.impuesto_pagado ,
        interesesMoratoriosPagados: summary.interes_moratorio_pagado ,
        impuestoInteresesMoratoriosPagados: summary.impuesto_interes_moratorio_pagado ,
        totalPagado: summary.capital_pagado + summary.interes_pagado + summary.impuesto_pagado ,
        saldoActual: summary.saldo_capital_actual ,
        saldoActualCapital: summary.saldo_capital_actual ,
        interesesOrdinarios: summary.interes_generado_a_fecha_corte,
        impuestoInteresesOrdinarios: summary.impuesto_actual ,
        interesesMoratorios: summary.interes_moratorio_pagado ,
        impuestoInteresesMoratorios: summary.impuesto_interes_moratorio_pagado ,
        comisiones: "-",
      },
      summaryD: {
        capitalVencidoNoPagado: summary.saldo_capital_vencido ,
        interesOrdinarioVencidoNoPagado: summary.saldo_interes_vencido ,
        impuestoInteresOrdinarioVencidoNoPagado: summary.saldo_impuesto_vencido ,
        interesesMoratoriosGeneradosNoPagados: summary.saldo_interes_moratorio ,
        impuestoInteresesMoratoriosGeneradosNoPagados: summary.saldo_impuesto_interes_moratorio ,
        totalVencidoNoPagado: summary.saldo_capital_vencido + summary.saldo_interes_vencido + summary.saldo_impuesto_vencido +summary.saldo_interes_moratorio + summary.saldo_impuesto_vencido+summary.saldo_interes_moratorio+summary.saldo_impuesto_interes_moratorio,
        DA: summary.dias_atraso ,
        DAA: summary.dias_atraso_acumulados ,
        montoCargosObjetadosAclaracion: summary.monto_cargos_aclaracion ,
        folioReporteAclaracion: summary.folio_aclaracion ,
      },
      movs: movs.map( (i)=> ({ 
        no: i.no,
        origen: i.origen, 
        fecha: formatLocalDate(i.fecha),
        total:i.total,
        Capital: i.Capital,
        Interes: i.Interes,
        Impuesto: i.Impuesto,
        Interes_Moratorio: i.Interes_Moratorio,
        IVA_Interes_Moratorio: i.IVA_Interes_Moratorio })).reverse(),
      pplan: pplan.map( i => ({
        no: i.no,
        fecha_inicio: formatLocalDate(i.fecha_inicio),
        fecha_vencimiento: formatLocalDate(i.fecha_vencimiento),
        fecha_pago: (i.fecha_pago),
        dias_atraso: i.dias_atraso,
        dias_atraso_acumulados: i.dias_atraso_acumulados,
        saldo_insoluto: i.saldo_insoluto,
        capital: i.capital,
        interes: i.interes,
        impuesto: i.impuesto, 
        total: i.total,
      })),
  });
    
    res.send(data);
  }
  catch(error){
    res.status(400).send(error.message);
  }
});

router.get("/docs/pdf/account-statement",authorize, async (req, res) => {
  try {
    // Create a browser instance
    const browser = await puppeteer.launch();
    // Create a new page
    const page = await browser.newPage();

    const logoBase64 = fs.readFileSync('./public/logo-cnsrv-light.png', { encoding: 'base64'});
    
    const hbs = new ExpressHandlebars({ extname:".handlebars"});
    const htmlData = await hbs.render('views/account-statement.handlebars', { logoImageFilePath: `data:image/jpeg;base64,${logoBase64}`});

    await page.setContent(htmlData, { waitUntil: 'networkidle2' });
    //To reflect CSS used for screens instead of print
    await page.emulateMediaType('screen');
    
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
