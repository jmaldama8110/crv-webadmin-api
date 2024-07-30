import express from 'express';
import puppeteer from "puppeteer";
import sql from 'mssql';
import { sqlConfig } from '../db/connSQL';

import { authorize } from '../middleware/authorize';
import { create } from 'express-handlebars';
import { arrayFromStringSize, calculateYearsMonthsFromDates, formatLocalCurrency, formatLocalDate, formatLocalDate2, getRounded } from '../utils/misc';
import * as Nano from 'nano';

// const multer  = require('multer')
// const upload = multer();

let nano = Nano.default(`${process.env.COUCHDB_PROTOCOL}://${process.env.COUCHDB_USER}:${process.env.COUCHDB_PASS}@${process.env.COUCHDB_HOST}:${process.env.COUCHDB_PORT}`);

const serverHost = `${process.env.WEB_SERVER_HOST}`;

const router = express.Router();

router.get("/docs/pdf/account-statement", authorize, async (req:any, res) => {
  try {

    const db = nano.use(process.env.COUCHDB_NAME ? `${process.env.COUCHDB_NAME}-${req.user.branch[1].replace(/ /g,'').toLowerCase()}` : '');
    // Look up for the contract Id Information Generated ACCOUNT_STATEMENT
    const accStt: any = await db.get(`CONTRACT|${req.query.contractId}`);
    const summary = accStt.rs[0][0];
    const mbrs = accStt.rs[1];
    const mbrsFr = accStt.rs[2];
    const pplan = accStt.rs[3]
    const movs = accStt.rs[4];

    const hbs = create();

    const imgs = await loadBase64ImgArrayFromDB(['logo-cnsrv-light.png']);

    const htmlData = await hbs.render('views/account-statement.handlebars',
      {
        chartCapitalPagado: summary.capital_pagado,
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
          numeroContrato: summary.id_contrato,
          diaHoraReunion: `${summary.dia_reunion} ${summary.hora_reunion}`,
          fechaContrato: formatLocalDate(summary.fecha_desembolso),
          montoCredito: formatLocalCurrency(summary.monto_credito),
          saldoInicialPeriodo: formatLocalCurrency(summary.saldo_inicial_periodo),
          saldoFinalPeriodo: formatLocalCurrency(summary.saldo_final_periodo),
          fechaCorte: formatLocalDate(summary.fecha_corte),
          nombreClienteLabel: summary.tipo_cliente == 1 ? 'Nombre del Grupo' : 'Nombre del Cliente',
          nombreCliente: summary.nombre_cliente,
          nombreOficialLabel: summary.tipo_contrato === 'CONSERVA TE ACTIVA' ? 'Asesor de Negocio' : 'Oficial de Credito',
          nombreOficial: summary.nombre_oficial,
          plazoCredito: `${summary.plazo_credito} ${summary.periodicidad}`,
          fechaLimitePago: formatLocalDate(summary.FechaLimitePago),
        },
        summaryB: {
          cat: summary.cat,
          tasaInteres: summary.tasa_interes,
          tasaMoratoriaAnual: summary.tasa_interes_moratorio,
          montoTotalPagarEnPeriodo: formatLocalCurrency(
            summary.capital_vencido +
            summary.interes_vencido +
            summary.impuesto_vencido +
            summary.interes_moratorio_generado +
            summary.impuesto_interes_moratorio_generado),
          capitalAPagar: formatLocalCurrency(summary.capital_vencido),
          interesAPagar: formatLocalCurrency(summary.interes_vencido),
          impuestaAPagar: formatLocalCurrency(summary.impuesto_vencido),
          interesMoratorioAPagar: formatLocalCurrency(summary.interes_moratorio_generado),
          impuestoInteresMoratorioAPagar: formatLocalCurrency(summary.impuesto_interes_moratorio_generado),
          saldoInsolutoCapital: formatLocalCurrency(summary.saldo_capital_actual),
          seguroVidaLabel: summary.tipo_contrato === 'CONSERVA TE ACTIVA' ? 'Seguro de Vida y Saldo Deudor' : 'Seguro de Vida',
          seguroVidaReal: summary.tipo_contrato === 'CONSERVA TE ACTIVA' ? formatLocalCurrency(summary.seguro_vida + summary.seguro_vida_deudor) : formatLocalCurrency(summary.seguro_vida),
          seguroVida: formatLocalCurrency(summary.seguro_vida),
          seguroSaldoDeudor: formatLocalCurrency(summary.seguro_vida_deudor)
        },

        summaryC: {
          capitalVencidoPagado: formatLocalCurrency(summary.capital_pagado),
          interesOrdinarioPagado: formatLocalCurrency(summary.interes_pagado),
          impuestoInteresOrdinarioPagado: formatLocalCurrency(summary.impuesto_pagado),
          interesesMoratoriosPagados: formatLocalCurrency(summary.interes_moratorio_pagado),
          impuestoInteresesMoratoriosPagados: formatLocalCurrency(summary.impuesto_interes_moratorio_pagado),
          totalPagado: formatLocalCurrency(
            summary.capital_pagado +
            summary.interes_pagado +
            summary.impuesto_pagado +
            summary.interes_moratorio_pagado +
            summary.impuesto_interes_moratorio_pagado),
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
            summary.saldo_impuesto_interes_moratorio),
          DA: summary.dias_atraso,
          DAA: summary.dias_atraso_acumulados,
          montoCargosObjetadosAclaracion: formatLocalCurrency(summary.monto_cargos_aclaracion),
          folioReporteAclaracion: summary.folio_aclaracion,
        },
        movs: movs.map((i: any) => ({
          no: i.no,
          origen: i.origen,
          fecha: formatLocalDate(i.fecha),
          total: formatLocalCurrency(i.total),
          Capital: formatLocalCurrency(i.Capital),
          Interes: formatLocalCurrency(i.Interes),
          Impuesto: formatLocalCurrency(i.Impuesto),
          Interes_Moratorio: formatLocalCurrency(i.Interes_Moratorio),
          IVA_Interes_Moratorio: formatLocalCurrency(i.IVA_Interes_Moratorio)
        })).reverse(),
        totalMovs: () => {
          let sum = 0;
          for (let i = 0; i < movs.length; i++) {
            sum = sum + movs[i].total;
          }
          return formatLocalCurrency(sum);
        },
        pplan: pplan.map((i: any) => ({
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
        pplanTotales: () => {
          let totales = { capitalTotal: 0, interesTotal: 0, ivaTotal: 0, granTotal: 0 }
          for (let i = 0; i < pplan.length; i++) {
            totales = {
              capitalTotal: totales.capitalTotal + pplan[i].capital,
              interesTotal: totales.interesTotal + pplan[i].interes,
              ivaTotal: totales.ivaTotal + pplan[i].impuesto,
              granTotal: totales.granTotal + pplan[i].total
            }
          }
          return {
            capitalTotal: formatLocalCurrency(totales.capitalTotal),
            interesTotal: formatLocalCurrency(totales.interesTotal),
            ivaTotal: formatLocalCurrency(totales.ivaTotal),
            granTotal: formatLocalCurrency(totales.granTotal)
          }
        },
        integrantesLista: mbrsFr.map((i: any) => {
          const clientItem = mbrs.find((x: any) => x.id_cliente == i.id_cliente);
          return {
            importe: formatLocalCurrency(i.monto_autorizado),
            nombre: `${clientItem.nombre} ${clientItem.apellido_paterno} ${clientItem.apellido_materno}`,
            proporcion_credito: getRounded(i.proporcion_credito * 100),
            cargo: i.cargo,
          }
        }),

      });

    const result = await renderPDf(htmlData, `estado_cuenta_`);
    res.send({ ...result });


  } catch (e) {
    console.log(e);
    res.status(400).send(e);
  }
});


router.get('/docs/pdf/tarjeton-digital', authorize, async (req: any, res: any) => {

  try {
    const typeReference = req.query.typeReference ? req.query.typeReference as string : '';
    const contractId = req.query.contractId ? req.query.contractId as string : '';
    const clientId = req.query.clientId ? req.query.clientId as string : '';

    const id = typeReference === '2' ? parseInt(clientId) : parseInt(contractId);
    const sqlRes = await createReference(typeReference, id);
    const onlyNumbers = new RegExp(/^\d+$/);

    const referencesData = sqlRes.map((i: any) => ({
      id_intermerdiario: i.id_intermerdiario,
      nombre: i.nombre,
      no_cuenta: (i.no_cuenta == '0' || !i.no_cuenta) ? '000000000000' : i.no_cuenta,
      contiene_codigo_barras: i.contiene_codigo_barras,
      referencia: i.referencia.match(onlyNumbers) ? i.referencia : '00000000000',
      nombre_cliente: i.nombre_cliente,
      tipo_evento: i.tipo_evento,
      tipo_cliente: i.tipo_cliente
    }))

    const hbs = create();

    const bbienestarInfo = referencesData.find(x => x.id_intermerdiario == 1 && x.nombre == "BANSEFI");
    const banorteInfo = referencesData.find(x => x.id_intermerdiario == 15 && x.nombre == 'BANORTE');
    const bbvaInfo = referencesData.find(x => x.id_intermerdiario == 4 && x.nombre == "BANCOMER");
    const fbienestarInfo = referencesData.find(x => x.id_intermerdiario == 6 && x.nombre == "TELECOMM");
    const bbajioInfo = referencesData.find(x => x.id_intermerdiario == 7 && x.nombre == 'BAJIO   1288');
    const paynetInfo = referencesData.find(x => x.id_intermerdiario == 8 && x.nombre == "PAYNET");
    const payCashInfo = referencesData.find(x => x.id_intermerdiario == 9 && x.nombre == "PAYCASH");
    const conservaInfo = referencesData.find(x => x.id_intermerdiario == 11 && x.nombre == "CONSERVA");
    const clubpagoInfo = referencesData.find(x => x.id_intermerdiario == 12 && x.nombre == 'CLUBPAGO');
    const santaderInfo = referencesData.find(x => x.id_intermerdiario == 13 && x.nombre == 'SANTANDER');
    const afirmeInfo = referencesData.find(x => x.id_intermerdiario == 14 && x.nombre == "AFIRME");
    const antadInfo = referencesData.find(x => x.id_intermerdiario == 15 && x.nombre == 'ANTAD');


    const imgs = await loadBase64ImgArrayFromDB([
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
      'yza-logo.png',
      'afirme-logo.png',
      'spei-logo.png',
      'antad-logo.jpg',
      'clubpago-logo.png'
    ]);


    const banbajioLogo = imgs[0];
    const banorteLogo = imgs[1];
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
    const afirmeLogo = imgs[23];
    const speiLogo = imgs[24];
    const antadLogo = imgs[25];
    const clubpagoLogo = imgs[26];

    const htmlData = await hbs.render('views/tarjeton-2024.handlebars', {
      banbajioLogo, banorteLogo, bbienestarLogo, bbvaLogo, bodegaLogo, circlekLogo, cityclubLogo, extraLogo, farmahorroLogo, waldosLogo, walmartLogo, yzaLogo,
      farmguadalajaraLogo, fbienestarLogo, cnsrvlightLogo, merzaLogo, paycashLogo, paynetLogo, samsLogo, santanderLogo, sevenLogo, sorianaLogo, superamaLogo, afirmeLogo, speiLogo,
      clubpagoLogo, antadLogo,
      clientId,
      serverHost,
      payCashInfo,
      clubpagoInfo,
      antadInfo,
      afirmeInfo,
      santaderInfo,
      paynetInfo,
      bbienestarInfo,
      fbienestarInfo,
      bbajioInfo,
      banorteInfo,
      bbvaInfo,
      conservaInfo
    });

    const result = await renderPDf(htmlData, 'tarjeton-pago');
    res.send({ ...result });
  }
  catch (error: any) {

    res.status(400).send(error.message);
  }

})

router.get('/docs/html/tarjeton-digital', async (req: any, res: any) => {

  try {

    const typeReference = req.query.typeReference ? req.query.typeReference as string : '';
    const contractId = req.query.contractId ? req.query.contractId as string : '';
    const clientId = req.query.clientId ? req.query.clientId as string : '';

    const id = typeReference === '2' ? parseInt(clientId) : parseInt(contractId);
    const sqlRes = await createReference(typeReference, id);
    const onlyNumbers = new RegExp(/^\d+$/);

    const referencesData = sqlRes.map((i: any) => ({
      id_intermerdiario: i.id_intermerdiario,
      nombre: i.nombre,
      no_cuenta: (i.no_cuenta == '0' || !i.no_cuenta) ? '000000000000' : i.no_cuenta,
      contiene_codigo_barras: i.contiene_codigo_barras,
      referencia: i.referencia.match(onlyNumbers) ? i.referencia : '00000000000',
      nombre_cliente: i.nombre_cliente,
      tipo_evento: i.tipo_evento,
      tipo_cliente: i.tipo_cliente
    }))

    const hbs = create();

    const bbienestarInfo = referencesData.find(x => x.id_intermerdiario == 1 && x.nombre == "BANSEFI");
    const banorteInfo = referencesData.find(x => x.id_intermerdiario == 15 && x.nombre == 'BANORTE');
    const bbvaInfo = referencesData.find(x => x.id_intermerdiario == 4 && x.nombre == "BANCOMER");
    const fbienestarInfo = referencesData.find(x => x.id_intermerdiario == 6 && x.nombre == "TELECOMM");
    const bbajioInfo = referencesData.find(x => x.id_intermerdiario == 7 && x.nombre == 'BAJIO   1288');
    const paynetInfo = referencesData.find(x => x.id_intermerdiario == 8 && x.nombre == "PAYNET");
    const payCashInfo = referencesData.find(x => x.id_intermerdiario == 9 && x.nombre == "PAYCASH");
    const conservaInfo = referencesData.find(x => x.id_intermerdiario == 11 && x.nombre == "CONSERVA");
    const clubpagoInfo = referencesData.find(x => x.id_intermerdiario == 12 && x.nombre == 'CLUBPAGO');
    const santaderInfo = referencesData.find(x => x.id_intermerdiario == 13 && x.nombre == 'SANTANDER');
    const afirmeInfo = referencesData.find(x => x.id_intermerdiario == 14 && x.nombre == "AFIRME");
    const antadInfo = referencesData.find(x => x.id_intermerdiario == 15 && x.nombre == 'ANTAD');


    const imgs = await loadBase64ImgArrayFromDB([
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
      'yza-logo.png',
      'afirme-logo.png',
      'spei-logo.png',
      'antad-logo.jpg',
      'clubpago-logo.png'
    ]);


    const banbajioLogo = imgs[0];
    const banorteLogo = imgs[1];
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
    const afirmeLogo = imgs[23];
    const speiLogo = imgs[24];
    const antadLogo = imgs[25];
    const clubpagoLogo = imgs[26];

    const htmlData = await hbs.render('views/tarjeton-2024.handlebars', {
      banbajioLogo, banorteLogo, bbienestarLogo, bbvaLogo, bodegaLogo, circlekLogo, cityclubLogo, extraLogo, farmahorroLogo, waldosLogo, walmartLogo, yzaLogo,
      farmguadalajaraLogo, fbienestarLogo, cnsrvlightLogo, merzaLogo, paycashLogo, paynetLogo, samsLogo, santanderLogo, sevenLogo, sorianaLogo, superamaLogo, afirmeLogo, speiLogo,
      clubpagoLogo, antadLogo,
      clientId,
      serverHost,
      payCashInfo,
      clubpagoInfo,
      antadInfo,
      afirmeInfo,
      santaderInfo,
      paynetInfo,
      bbienestarInfo,
      fbienestarInfo,
      bbajioInfo,
      banorteInfo,
      bbvaInfo,
      conservaInfo
    });
    // const result = await renderPDf(htmlData); 
    res.send(htmlData);
  }
  catch (error: any) {

    res.status(400).send(error.message);
  }

})


router.get('/docs/pdf/mujeres-de-palabra', authorize, async (req: any, res: any) => {

  try {

    if (!req.query.loanId) {
      throw new Error('parameter loanId is missing in URL');
    }

    const db = nano.use(process.env.COUCHDB_NAME ? `${process.env.COUCHDB_NAME}-${req.user.branch[1].replace(/ /g,'').toLowerCase()}` : '');
    const loanApp: any = await db.get(req.query.loanId as string);
    if (!loanApp) {
      throw new Error('Loan App does not exist with the id:' + req.query.loanId);
    }

    if (!loanApp.members) {
      throw new Error('No members found at the loan application!')
    }
    const keys = loanApp.members.map((x: any) => (x.client_id));


    const clientsQuery = await db.fetch({ keys: keys })

    /// get bulk info on beneficiaries
    const beneficiaryQuery = await db.find({ selector: { couchdb_type: "RELATED-PEOPLE" }, limit: 10000 })
    const beneficiaryList = beneficiaryQuery.docs.filter((item: any) => item.relation_type === "beneficiary");

    const loginUser = {
      fullName: req.user ? `${req.user.name} ${req.user.lastname} ${req.user.second_lastname}` : '__________________________________________________________________'
    }
    const newClientsList: any = clientsQuery.rows.filter((r: any) => !r.error)
    const clientsData = newClientsList.map((x: any) => {

      const memberData = loanApp.members.find((y: any) => y.client_id === x.doc._id)
      const loanCycle = parseInt(memberData.loan_cycle) + 1
      const memberLoanAmount = memberData.apply_amount;
      let beneficiaryInfo = {
        name: memberData.insurance.beneficiary,
        lastname: '',
        second_lastname: '',
        relationship: memberData.insurance.relationship,
        percentage: memberData.insurance.percentage,
        phone: [],
        dob: [] ,
        address: {
          post_code: "",
          address_line1: "",
          street_reference: "",
          road: "",
          colony: "",
          city: "",
          municipality: "",
          province: "",
          country: "",
          fullExtNumber: '',
          fullIntNumber: ''
        }
      }

      /// if Benefiary found, replace info
      const beneficiaryFound: any = beneficiaryList.find((item: any) => (item.client_id === x.doc._id))
      if (beneficiaryFound) {
        const dob = 
          beneficiaryFound.dob ? 
            beneficiaryFound.dob.slice(0, 10).split('-').reverse() :
            ['','','']
        
        beneficiaryInfo.name = beneficiaryFound.name
        beneficiaryInfo.dob = dob
        beneficiaryInfo.lastname = beneficiaryFound.lastname
        beneficiaryInfo.second_lastname = beneficiaryFound.second_lastname
        beneficiaryInfo.percentage = beneficiaryFound.percentage
        beneficiaryInfo.relationship = beneficiaryFound.relationship
        beneficiaryInfo.phone = beneficiaryFound.phone ? beneficiaryFound.phone.split("") : []
        beneficiaryInfo.address.post_code = beneficiaryFound.address.post_code
        beneficiaryInfo.address.address_line1 = beneficiaryFound.address.address_line1
        beneficiaryInfo.address.street_reference = beneficiaryFound.street_reference
        beneficiaryInfo.address.colony = beneficiaryFound.address.colony[1]
        beneficiaryInfo.address.province = beneficiaryFound.address.province[1]
        beneficiaryInfo.address.municipality = beneficiaryFound.address.municipality[1]
        beneficiaryInfo.address.city = beneficiaryFound.address.city[1]
        beneficiaryInfo.address.country = beneficiaryFound.address.country[1]
        beneficiaryInfo.address.road = beneficiaryFound.address.road[1]
        beneficiaryInfo.address.fullExtNumber = `${beneficiaryFound.address.ext_number ? beneficiaryFound.address.ext_number : ''} ${beneficiaryFound.address.exterior_number === 'SN' ? '' : beneficiaryFound.address.exterior_number}`
        beneficiaryInfo.address.fullIntNumber = `${beneficiaryFound.address.int_number ? beneficiaryFound.address.int_number : ''} ${beneficiaryFound.address.interior_number === 'SN' ? '' : beneficiaryFound.address.interior_number}`

      }
      const dob = x.doc.dob.slice(0, 10).split('-').reverse();
      dob.length = 3;

      const mobilePhone = x.doc.phones.find((y: any) => y.type === 'Móvil')
      const otherPhone = x.doc.phones.find((y: any) => y.type === 'Caseta')

      const homeAddress = x.doc.address.find((y: any) => y.type === 'DOMICILIO');
      const bisAddress = x.doc.address.find((y: any) => y.type === 'NEGOCIO');
      let bisAddressSame = 'No';
      if (bisAddress) { // evaluates first bisAddress exists, since object may not exits
        if (!!bisAddress.bis_address_same) {
          bisAddressSame = bisAddress.bis_address_same ? 'Si' : 'No';
        }

      }
      homeAddress.fullExtNumber = `${homeAddress.ext_number ? homeAddress.ext_number : ''} ${homeAddress.exterior_number === 'SN' ? '' : homeAddress.exterior_number}`
      homeAddress.fullIntNumber = `${homeAddress.int_number ? homeAddress.int_number : ''} ${homeAddress.interior_number === 'SN' ? '' : homeAddress.interior_number}`
      bisAddress.fullExtNumber = `${bisAddress.ext_number ? bisAddress.ext_number : ''} ${bisAddress.exterior_number === 'SN' ? '' : bisAddress.exterior_number}`
      bisAddress.fullIntNumber = `${bisAddress.int_number ? bisAddress.int_number : ''} ${bisAddress.interior_number === 'SN' ? '' : bisAddress.interior_number}`

      const incomeInfo = {
        sales: x.doc.business_data.income_sales_total,
        family: x.doc.business_data.income_partner,
        job: x.doc.business_data.income_job,
        abroad: x.doc.business_data.income_remittances,
        other: x.doc.business_data.income_other,
        total: x.doc.business_data.income_total,
      }
      const expensesInfo = {
        family: x.doc.business_data.expense_family,
        rent: x.doc.business_data.expense_rent,
        bis: x.doc.business_data.expense_business,
        payables: x.doc.business_data.expense_debt,
        debt: x.doc.business_data.expense_credit_cards,
        total: x.doc.business_data.expense_total,
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
        branch: loanApp.branch ? loanApp.branch[1] : '',
        apply_at: formatLocalDate2(loanApp.apply_at ? loanApp.apply_at : (new Date()).toISOString()).split("/"),
        loan_cycle: loanCycle,
        economicDependants: x.doc.economic_dependants,
        internetAccess: x.doc.internet_access ? 'Si' : 'No',
        isSocialMediaFacebook: x.doc.prefered_social ? x.doc.prefered_social[0] == 3 ? 'X' : '' : '',
        isSocialMediaWhatsapp: x.doc.prefered_social ? x.doc.prefered_social[0] == 2 ? 'X' : '' : '',
        isSocialMediaInstagram: x.doc.prefered_social ? x.doc.prefered_social[0] == 4 ? 'X' : '' : '',
        userSocialMedia: x.doc.user_social,
        memberLoanAmount: formatLocalCurrency(memberLoanAmount),
        isNewLoan: loanCycle > 1 ? "" : "X",
        isFemale: x.doc.sex ? x.doc.sex[0] == 3 ? 'X' : ' ' : '',
        isMale: x.doc.sex ? x.doc.sex[0] != 3 ? 'X' : ' ' : '',
        isSingle: x.doc.marital_status ? x.doc.marital_status[0] == 1 ? "X" : "" : "",
        isMarried: x.doc.marital_status ? x.doc.marital_status[0] == 2 ? "X" : "" : "",
        isCommonLaw: x.doc.marital_status ? x.doc.marital_status[0] == 3 ? "X" : "" : "",
        nationality: x.doc.nationality ? x.doc.nationality[0] == 1 ? "MEXICANA" : "OTRA" : "",
        countrtAndProvince: x.doc.province_of_birth ? `${x.doc.province_of_birth[1]}, ${x.doc.country_of_birth[1]}`.toUpperCase() : "",
        dob,
        curp: arrayFromStringSize(x.doc.curp, 18, '*'),
        rfc: arrayFromStringSize(x.doc.rfc, 13, '*'),
        email: x.doc.email,
        mobilePhone: !!mobilePhone ? arrayFromStringSize(mobilePhone.phone, 10, '*') : arrayFromStringSize('', 10, ''),
        otherPhone: !!otherPhone ? arrayFromStringSize(otherPhone.phone, 10, '*') : arrayFromStringSize('', 10, ''),
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
        economicActivity: !x.doc.business_data.economic_activity ? 'NO ESPECIFICADO' : x.doc.business_data.economic_activity[1],
        profession: !x.doc.business_data.profession ? 'NO ESPECIFICADO' : x.doc.business_data.profession[1],
        occupation: !x.doc.business_data.ocupation ? 'NO ESPECIFICADO' : x.doc.business_data.ocupation[1],
        numberEmployees: x.doc.business_data.number_employees,
        loanDestination: x.doc.business_data.loan_destination ? x.doc.business_data.loan_destination[1] : 'NO ESPECIFICADO',
        bisYearsMonths: calculateYearsMonthsFromDates(new Date(!!x.doc.business_data.business_start_date ? x.doc.business_data.business_start_date : new Date()), new Date()),
        homeYearsMonths: calculateYearsMonthsFromDates(new Date(!!homeAddress.residence_since ? homeAddress.residence_since : new Date()), new Date()),
        homeOwnershipRented: homeAddress.ownership_type ? (homeAddress.ownership_type[0] == 2 ? 'X' : '') : '',
        homeOwnershipOwned: homeAddress.ownership_type ? (homeAddress.ownership_type[0] == 1 ? 'X' : '') : '',
        homeOwnershipRelative: homeAddress.ownership_type ? (homeAddress.ownership_type[0] == 3 ? 'X' : '') : '',
        keepsAccountingRecords: x.doc.business_data.keeps_accounting_records ? 'Si' : 'No',
        hasPreviousExperience: x.doc.business_data.has_previous_experience ? 'Si' : 'No',
        previousExperience: x.doc.business_data.previous_loan_experience,
        incomeInfo,
        expensesInfo,
        bisQualitySalesMonthly,
        isBisTypeDaily: x.doc.business_data.bis_season_type === 'D' ? 'X' : '',
        isBisTypeWeekly: x.doc.business_data.bis_season_type === 'S' ? 'X' : '',
        isBisTypeFortnightly: x.doc.business_data.bis_season_type === 'C' ? 'X' : '',
        beneficiaryInfo,
        loginUser
      }
    })

    const hbs = create();
    const htmlData = await hbs.render('views/solicitud-grupo-solidario.handlebars', {
      serverHost,
      clientsData: clientsData,
    });
    const result = await renderPDf(htmlData, `solicitud_grupo_solidario`);
    res.send({ ...result });

  }
  catch (error: any) {
    console.log(error);
    res.status(400).send(error.message);
  }

})

router.get('/docs/html/mujeres-de-palabra', async (req: any, res: any) => {

  try {

    if (!req.query.loanId || req.query.dbName) {
      throw new Error('parameter loanId or dbName are missing in URL');
    }
    const db = nano.use(req.query.dbName as string);
    const loanApp: any = await db.get(req.query.loanId as string);
    if (!loanApp) {
      throw new Error('Loan App does not exist with the id:' + req.query.loanId);
    }

    if (!loanApp.members) {
      throw new Error('No members found at the loan application!')
    }
    const keys = loanApp.members.map((x: any) => (x.client_id));


    const clientsQuery = await db.fetch({ keys: keys })

    /// get bulk info on beneficiaries
    const beneficiaryQuery = await db.find({ selector: { couchdb_type: "RELATED-PEOPLE" }, limit: 10000 })
    const beneficiaryList = beneficiaryQuery.docs.filter((item: any) => item.relation_type === "beneficiary");

    const loginUser = {
      fullName: req.user ? `${req.user.name} ${req.user.lastname} ${req.user.second_lastname}` : '__________________________________________________________________'
    }
    const newClientsList: any = clientsQuery.rows.filter((r: any) => !r.error)
    const clientsData = newClientsList.map((x: any) => {

      const memberData = loanApp.members.find((y: any) => y.client_id === x.doc._id)
      const loanCycle = parseInt(memberData.loan_cycle) + 1
      const memberLoanAmount = memberData.apply_amount;
      let beneficiaryInfo = {
        name: memberData.insurance.beneficiary,
        lastname: '',
        second_lastname: '',
        relationship: memberData.insurance.relationship,
        percentage: memberData.insurance.percentage,
        phone: [],
        dob: [],
        address: {
          post_code: "",
          address_line1: "",
          street_reference: "",
          road: "",
          colony: "",
          city: "",
          municipality: "",
          province: "",
          country: "",
          fullExtNumber: '',
          fullIntNumber: ''
        }
      }

      /// if Benefiary found, replace info
      const beneficiaryFound: any = beneficiaryList.find((item: any) => (item.client_id === x.doc._id))
      if (beneficiaryFound) {
        const dob = 
          beneficiaryFound.dob ? 
            beneficiaryFound.dob.slice(0, 10).split('-').reverse() :
            ['','','']

        beneficiaryInfo.name = beneficiaryFound.name
        beneficiaryInfo.dob = dob
        beneficiaryInfo.lastname = beneficiaryFound.lastname
        beneficiaryInfo.second_lastname = beneficiaryFound.second_lastname
        beneficiaryInfo.percentage = beneficiaryFound.percentage
        beneficiaryInfo.relationship = beneficiaryFound.relationship
        beneficiaryInfo.phone = beneficiaryFound.phone ? beneficiaryFound.phone.split("") : []
        beneficiaryInfo.address.post_code = beneficiaryFound.address.post_code
        beneficiaryInfo.address.address_line1 = beneficiaryFound.address.address_line1
        beneficiaryInfo.address.street_reference = beneficiaryFound.street_reference
        beneficiaryInfo.address.colony = beneficiaryFound.address.colony[1]
        beneficiaryInfo.address.province = beneficiaryFound.address.province[1]
        beneficiaryInfo.address.municipality = beneficiaryFound.address.municipality[1]
        beneficiaryInfo.address.city = beneficiaryFound.address.city[1]
        beneficiaryInfo.address.country = beneficiaryFound.address.country[1]
        beneficiaryInfo.address.road = beneficiaryFound.address.road[1]
        beneficiaryInfo.address.fullExtNumber = `${beneficiaryFound.address.ext_number ? beneficiaryFound.address.ext_number : ''} ${beneficiaryFound.address.exterior_number === 'SN' ? '' : beneficiaryFound.address.exterior_number}`
        beneficiaryInfo.address.fullIntNumber = `${beneficiaryFound.address.int_number ? beneficiaryFound.address.int_number : ''} ${beneficiaryFound.address.interior_number === 'SN' ? '' : beneficiaryFound.address.interior_number}`

      }
      const dob = x.doc.dob.slice(0, 10).split('-').reverse();
      dob.length = 3;

      const mobilePhone = x.doc.phones.find((y: any) => y.type === 'Móvil')
      const otherPhone = x.doc.phones.find((y: any) => y.type === 'Caseta')

      const homeAddress = x.doc.address.find((y: any) => y.type === 'DOMICILIO');
      const bisAddress = x.doc.address.find((y: any) => y.type === 'NEGOCIO');
      let bisAddressSame = 'No';
      if (bisAddress) { // evaluates first bisAddress exists, since object may not exits
        if (!!bisAddress.bis_address_same) {
          bisAddressSame = bisAddress.bis_address_same ? 'Si' : 'No';
        }

      }
      homeAddress.fullExtNumber = `${homeAddress.ext_number ? homeAddress.ext_number : ''} ${homeAddress.exterior_number === 'SN' ? '' : homeAddress.exterior_number}`
      homeAddress.fullIntNumber = `${homeAddress.int_number ? homeAddress.int_number : ''} ${homeAddress.interior_number === 'SN' ? '' : homeAddress.interior_number}`
      bisAddress.fullExtNumber = `${bisAddress.ext_number ? bisAddress.ext_number : ''} ${bisAddress.exterior_number === 'SN' ? '' : bisAddress.exterior_number}`
      bisAddress.fullIntNumber = `${bisAddress.int_number ? bisAddress.int_number : ''} ${bisAddress.interior_number === 'SN' ? '' : bisAddress.interior_number}`

      const incomeInfo = {
        sales: x.doc.business_data.income_sales_total,
        family: x.doc.business_data.income_partner,
        job: x.doc.business_data.income_job,
        abroad: x.doc.business_data.income_remittances,
        other: x.doc.business_data.income_other,
        total: x.doc.business_data.income_total,
      }
      const expensesInfo = {
        family: x.doc.business_data.expense_family,
        rent: x.doc.business_data.expense_rent,
        bis: x.doc.business_data.expense_business,
        payables: x.doc.business_data.expense_debt,
        debt: x.doc.business_data.expense_credit_cards,
        total: x.doc.business_data.expense_total,
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
        branch: loanApp.branch ? loanApp.branch[1] : '',
        apply_at: formatLocalDate2(loanApp.apply_at ? loanApp.apply_at : (new Date()).toISOString()).split("/"),
        loan_cycle: loanCycle,
        economicDependants: x.doc.economic_dependants,
        internetAccess: x.doc.internet_access ? 'Si' : 'No',
        isSocialMediaFacebook: x.doc.prefered_social ? x.doc.prefered_social[0] == 3 ? 'X' : '' : '',
        isSocialMediaWhatsapp: x.doc.prefered_social ? x.doc.prefered_social[0] == 2 ? 'X' : '' : '',
        isSocialMediaInstagram: x.doc.prefered_social ? x.doc.prefered_social[0] == 4 ? 'X' : '' : '',
        userSocialMedia: x.doc.user_social,
        memberLoanAmount: formatLocalCurrency(memberLoanAmount),
        isNewLoan: loanCycle > 1 ? "" : "X",
        isFemale: x.doc.sex ? x.doc.sex[0] == 3 ? 'X' : ' ' : '',
        isMale: x.doc.sex ? x.doc.sex[0] != 3 ? 'X' : ' ' : '',
        isSingle: x.doc.marital_status ? x.doc.marital_status[0] == 1 ? "X" : "" : "",
        isMarried: x.doc.marital_status ? x.doc.marital_status[0] == 2 ? "X" : "" : "",
        isCommonLaw: x.doc.marital_status ? x.doc.marital_status[0] == 3 ? "X" : "" : "",
        nationality: x.doc.nationality ? x.doc.nationality[0] == 1 ? "MEXICANA" : "OTRA" : "",
        countrtAndProvince: x.doc.province_of_birth ? `${x.doc.province_of_birth[1]}, ${x.doc.country_of_birth[1]}`.toUpperCase() : "",
        dob,
        curp: arrayFromStringSize(x.doc.curp, 18, '*'),
        rfc: arrayFromStringSize(x.doc.rfc, 13, '*'),
        email: x.doc.email,
        mobilePhone: !!mobilePhone ? arrayFromStringSize(mobilePhone.phone, 10, '*') : arrayFromStringSize('', 10, ''),
        otherPhone: !!otherPhone ? arrayFromStringSize(otherPhone.phone, 10, '*') : arrayFromStringSize('', 10, ''),
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
        economicActivity: !x.doc.business_data.economic_activity ? 'NO ESPECIFICADO' : x.doc.business_data.economic_activity[1],
        profession: !x.doc.business_data.profession ? 'NO ESPECIFICADO' : x.doc.business_data.profession[1],
        occupation: !x.doc.business_data.ocupation ? 'NO ESPECIFICADO' : x.doc.business_data.ocupation[1],
        numberEmployees: x.doc.business_data.number_employees,
        loanDestination: x.doc.business_data.loan_destination ? x.doc.business_data.loan_destination[1] : 'NO ESPECIFICADO',
        bisYearsMonths: calculateYearsMonthsFromDates(new Date(!!x.doc.business_data.business_start_date ? x.doc.business_data.business_start_date : new Date()), new Date()),
        homeYearsMonths: calculateYearsMonthsFromDates(new Date(!!homeAddress.residence_since ? homeAddress.residence_since : new Date()), new Date()),
        homeOwnershipRented: homeAddress.ownership_type ? (homeAddress.ownership_type[0] == 2 ? 'X' : '') : '',
        homeOwnershipOwned: homeAddress.ownership_type ? (homeAddress.ownership_type[0] == 1 ? 'X' : '') : '',
        homeOwnershipRelative: homeAddress.ownership_type ? (homeAddress.ownership_type[0] == 3 ? 'X' : '') : '',
        keepsAccountingRecords: x.doc.business_data.keeps_accounting_records ? 'Si' : 'No',
        hasPreviousExperience: x.doc.business_data.has_previous_experience ? 'Si' : 'No',
        previousExperience: x.doc.business_data.previous_loan_experience,
        incomeInfo,
        expensesInfo,
        bisQualitySalesMonthly,
        isBisTypeDaily: x.doc.business_data.bis_season_type === 'D' ? 'X' : '',
        isBisTypeWeekly: x.doc.business_data.bis_season_type === 'S' ? 'X' : '',
        isBisTypeFortnightly: x.doc.business_data.bis_season_type === 'C' ? 'X' : '',
        beneficiaryInfo,
        loginUser
      }
    })

    const hbs = create();
    const htmlData = await hbs.render('views/solicitud-grupo-solidario.handlebars', {
      serverHost,
      clientsData: clientsData,
    });
    //  const result = await renderPDf(htmlData,`solicitud_grupo_solidario`);
    //  res.send({...result } );
    res.send(htmlData);


  }
  catch (error: any) {
    console.log(error);
    res.status(400).send(error.message);
  }

})

router.get('/docs/html/conserva-t-activa', async (req: any, res: any) => {

  try {

    if (!req.query.loanId || req.query.dbName) {
      throw new Error('parameter loanId or dbName are missing in URL');
    }
    const db = nano.use(req.query.dbName as string);
    const loanApp: any = await db.get(req.query.loanId as string);
    if (!loanApp) {
      throw new Error('Loan App does not exist with the id:' + req.query.loanId);
    }

    if (!loanApp.members) {
      throw new Error('No members found at the loan application!')
    }
    const keys = loanApp.members.map((x: any) => (x.client_id));

    const clientsQuery = await db.fetch({ keys: keys })

    const beneficiaryQuery = await db.find({ selector: { couchdb_type: "RELATED-PEOPLE" }, limit: 10000 })
    const beneficiaryList = beneficiaryQuery.docs.filter((item: any) => item.relation_type === "beneficiary");

    const loginUser = {
      fullName: req.user ? `${req.user.name} ${req.user.lastname} ${req.user.second_lastname}` : ''
    }
    const newClientsList: any = clientsQuery.rows.filter((r: any) => !r.error)
    const clientsData = newClientsList.map((x: any) => {

      const memberData = loanApp.members.find((y: any) => y.client_id === x.doc._id)
      const loanCycle = parseInt(memberData.loan_cycle) + 1
      const memberLoanAmount = memberData.apply_amount;
      let beneficiaryInfo = {
        name: memberData.insurance.beneficiary,
        lastname: '',
        second_lastname: '',
        relationship: memberData.insurance.relationship,
        percentage: memberData.insurance.percentage,
        address: {
          post_code: "",
          address_line1: "",
          street_reference: "",
          road: "",
          colony: "",
          city: "",
          municipality: "",
          province: "",
          country: "",
          fullExtNumber: '',
          fullIntNumber: ''
        }
      }

      const dob = 
          x.doc.dob ?
        x.doc.dob.slice(0, 10).split('-').reverse() : []
      dob.length = 3;

      const mobilePhone = x.doc.phones.find((y: any) => y.type === 'Móvil')
      const otherPhone = x.doc.phones.find((y: any) => y.type === 'Caseta')

      const homeAddress = x.doc.address.find((y: any) => y.type === 'DOMICILIO');
      const bisAddress = x.doc.address.find((y: any) => y.type === 'NEGOCIO');
      let bisAddressSame = '';
      if (bisAddress) { // evaluates first bisAddress exists, since object may not exits
        if (!!bisAddress.bis_address_same) {
          bisAddressSame = bisAddress.bis_address_same ? 'x' : '';
        }

      }

      /// if Benefiary found, replace info
      const beneficiaryFound: any = beneficiaryList.find((item: any) => (item.client_id === x.doc._id))
      if (beneficiaryFound) {
        beneficiaryInfo.name = beneficiaryFound.name
        beneficiaryInfo.lastname = beneficiaryFound.lastname
        beneficiaryInfo.second_lastname = beneficiaryFound.second_lastname
        beneficiaryInfo.percentage = beneficiaryFound.percentage
        beneficiaryInfo.relationship = beneficiaryFound.relationship
        beneficiaryInfo.address.post_code = beneficiaryFound.address.post_code
        beneficiaryInfo.address.address_line1 = beneficiaryFound.address.address_line1
        beneficiaryInfo.address.street_reference = beneficiaryFound.street_reference
        beneficiaryInfo.address.colony = beneficiaryFound.address.colony[1]
        beneficiaryInfo.address.province = beneficiaryFound.address.province[1]
        beneficiaryInfo.address.municipality = beneficiaryFound.address.municipality[1]
        beneficiaryInfo.address.city = beneficiaryFound.address.city[1]
        beneficiaryInfo.address.country = beneficiaryFound.address.country[1]
        beneficiaryInfo.address.road = beneficiaryFound.address.road[1]
        beneficiaryInfo.address.fullExtNumber = `${beneficiaryFound.address.ext_number ? beneficiaryFound.address.ext_number : ''} ${beneficiaryFound.address.exterior_number === 'SN' ? '' : beneficiaryFound.address.exterior_number}`
        beneficiaryInfo.address.fullIntNumber = `${beneficiaryFound.address.int_number ? beneficiaryFound.address.int_number : ''} ${beneficiaryFound.address.interior_number === 'SN' ? '' : beneficiaryFound.address.interior_number}`

      }

      homeAddress.fullExtNumber = `${homeAddress.ext_number ? homeAddress.ext_number : ''} ${homeAddress.exterior_number}`
      homeAddress.fullIntNumber = `${homeAddress.int_number ? homeAddress.int_number : ''} ${homeAddress.interior_number}`
      bisAddress.fullExtNumber = `${bisAddress.ext_number ? bisAddress.ext_number : ''} ${bisAddress.exterior_number}`
      bisAddress.fullIntNumber = `${bisAddress.int_number ? bisAddress.int_number : ''} ${bisAddress.interior_number}`

      /// FALSE PLD check when this field is empty
      const isClientPppYesNo = x.doc.spld.familiar_desempenia_funcion_publica_cargo ? 'Si' : 'No';
      const pPpClientName = x.doc.spld.familiar_desempenia_funcion_publica_cargo ?
        `${x.doc.spld.familiar_desempenia_funcion_publica_nombre} ${x.doc.spld.familiar_desempenia_funcion_publica_paternos} ${x.doc.spld.familiar_desempenia_funcion_publica_materno}` : ''


      return {
        name: x.doc.name,
        lastname: x.doc.lastname,
        second_lastname: x.doc.second_lastname,
        branch: loanApp.branch ? loanApp.branch[1] : '',
        apply_at: formatLocalDate2(loanApp.apply_at ? loanApp.apply_at : (new Date()).toISOString()).split("/"),
        loan_cycle: loanCycle > 1 ? loanCycle : '',
        economicDependants: x.doc.economic_dependants,
        hasPrimaria: x.doc.education_level ? x.doc.education_level[0] == 4 ? 'x' : '' : '',
        hasSecundaria: x.doc.education_level ? x.doc.education_level[0] == 5 ? 'x' : '' : '',
        hasPrepa: x.doc.education_level ? x.doc.education_level[0] == 8 ? 'x' : '' : '',
        hasUniversidad: x.doc.education_level ? x.doc.education_level[0] == 9 ? 'x' : '' : '',
        hasNinguno: x.doc.education_level ? x.doc.education_level[0] == 2 ? 'x' : '' : '',
        speaksDialectYes: x.doc.speaks_dialect ? 'x' : '',
        speaksDialectNo: x.doc.speaks_dialect ? '' : 'x',
        hasDisableYes: x.doc.has_disable ? 'x' : '',
        hasDisableNo: x.doc.has_disable ? '' : 'x',
        internetAccessYes: x.doc.internet_access ? 'x' : '',
        internetAccessNo: x.doc.internet_access ? '' : 'x',
        usesSocialMediaYes: x.doc.prefered_social ? x.doc.prefered_social[0] == 1 ? '' : 'x' : '',
        usesSocialMediaNo: x.doc.prefered_social ? x.doc.prefered_social[0] == 1 ? '' : '' : 'x',
        isSocialMediaFacebook: x.doc.prefered_social ? x.doc.prefered_social[0] == 3 ? 'x' : '' : '',
        isSocialMediaWhatsapp: x.doc.prefered_social ? x.doc.prefered_social[0] == 2 ? 'x' : '' : '',
        isSocialMediaInstagram: x.doc.prefered_social ? x.doc.prefered_social[0] == 4 ? 'x' : '' : '',
        userSocialMedia: x.doc.user_social,
        memberLoanAmount: formatLocalCurrency(memberLoanAmount),
        isNewLoan: loanCycle <= 1 ? "x" : "",
        isFemale: x.doc.sex ? x.doc.sex[0] == 3 ? 'x' : '' : '',
        isMale: x.doc.sex ? x.doc.sex[0] != 3 ? 'x' : '' : '',
        isSingle: x.doc.marital_status ? x.doc.marital_status[0] == 1 ? "x" : "" : "",
        isMarried: x.doc.marital_status ? x.doc.marital_status[0] == 2 ? "x" : "" : "",
        isCommonLaw: x.doc.marital_status ? x.doc.marital_status[0] == 3 ? "x" : "" : "",
        isNationalityMx: x.doc.nationality ? x.doc.nationality[0] == 1 ? 'x' : '' : '',
        notMxNationality: x.doc.nationality ? x.doc.nationality[0] == 1 ? "" : x.doc.nationality[1] : "",
        countryAndProvince: x.doc.province_of_birth ? `${x.doc.province_of_birth[1]}, ${x.doc.country_of_birth[1]}`.toUpperCase() : "",
        dob,
        curp: x.doc.curp,
        rfc: x.doc.rfc,
        claveIne: x.doc.clave_ine,
        email: x.doc.email,
        mobilePhone: mobilePhone ? mobilePhone.phone : '',
        otherPhone: otherPhone ? otherPhone.phone : '',
        geoLat: !!x.doc.coordinates ? x.doc.coordinates[0] : 0,
        geoLng: !!x.doc.coordinates ? x.doc.coordinates[1] : 0,
        homeAddress,
        homeAddressRoad: homeAddress.road ? homeAddress.road[1] : '',
        bisAddress,
        bisAddressRoad: bisAddress.road ? bisAddress.road[1] : '',
        bisAddressSame,
        hasHouseholdFloor: x.doc.household_floor ? 'x' : '',
        hasHouseholdRoof: x.doc.household_roof ? 'x' : '',
        hasHouseholdToilet: x.doc.household_toilet ? 'x' : '',
        hasHouseholdLatrine: x.doc.household_latrine ? 'x' : '',
        hasHouseholdBrick: x.doc.household_brick ? 'x' : '',
        isRolHogarJefe: x.doc.rol_hogar ? x.doc.rol_hogar[0] == 1 ? 'x' : '' : '',
        isRolHogarEsposo: x.doc.rol_hogar ? x.doc.rol_hogar[0] == 2 ? 'x' : '' : '',
        isRolHogarHijo: x.doc.rol_hogar ? x.doc.rol_hogar[0] == 3 ? 'x' : '' : '',
        isRolHogarOtro: x.doc.rol_hogar ? x.doc.rol_hogar[0] == 4 ? 'x' : '' : '',
        economicActivity: !x.doc.business_data.economic_activity ? 'NO ESPECIFICADO' : x.doc.business_data.economic_activity[1],
        profession: !x.doc.business_data.profession ? 'NO ESPECIFICADO' : x.doc.business_data.profession[1],
        occupation: !x.doc.business_data.ocupation ? 'NO ESPECIFICADO' : x.doc.business_data.ocupation[1],
        numberEmployees: x.doc.business_data.number_employees,
        bisDataPhone: x.doc.business_data.business_phone ? x.doc.business_data.business_phone : '',
        loanDestination: x.doc.business_data.loan_destination ? x.doc.business_data.loan_destination[1] : 'NO ESPECIFICADO',
        bisYearsMonths: calculateYearsMonthsFromDates(new Date(!!x.doc.business_data.business_start_date ? x.doc.business_data.business_start_date : new Date()), new Date()),
        homeYearsMonths: calculateYearsMonthsFromDates(new Date(!!homeAddress.residence_since ? homeAddress.residence_since : new Date()), new Date()),
        homeOwnershipRented: homeAddress.ownership_type ? (homeAddress.ownership_type[0] == 2 ? 'x' : '') : '',
        homeOwnershipOwned: homeAddress.ownership_type ? (homeAddress.ownership_type[0] == 1 ? 'x' : '') : '',
        homeOwnershipRelative: homeAddress.ownership_type ? (homeAddress.ownership_type[0] == 3 ? 'x' : '') : '',
        keepsAccountingRecords: x.doc.business_data.keeps_accounting_records ? 'Si' : 'No',
        hasPreviousExperience: x.doc.business_data.has_previous_experience ? 'Si' : 'No',
        previousExperience: x.doc.business_data.previous_loan_experience,
        isClientPppYesNo, pPpClientName,
        beneficiaryInfo,
        loginUser
      }
    })

    const hbs = create();
    const htmlData = await hbs.render('views/solicitud-grupo-tactiva.handlebars', {
      serverHost,
      clientsData
    });

    res.send(htmlData);


  }
  catch (error: any) {
    console.log(error);
    res.status(400).send(error.message);
  }

})
router.get('/docs/pdf/conserva-t-activa', authorize, async (req: any, res: any) => {

  try {
    if (!req.query.loanId) {
      throw new Error('parameter loanId is missing in URL');
    }

    const db = nano.use(process.env.COUCHDB_NAME ? `${process.env.COUCHDB_NAME}-${req.user.branch[1].replace(/ /g,'').toLowerCase()}` : '');
    const loanApp: any = await db.get(req.query.loanId as string);
    if (!loanApp) {
      throw new Error('Loan App does not exist with the id:' + req.query.loanId);
    }

    if (!loanApp.members) {
      throw new Error('No members found at the loan application!')
    }
    const keys = loanApp.members.map((x: any) => (x.client_id));

    const clientsQuery = await db.fetch({ keys: keys })

    const beneficiaryQuery = await db.find({ selector: { couchdb_type: "RELATED-PEOPLE" }, limit: 10000 })
    const beneficiaryList = beneficiaryQuery.docs.filter((item: any) => item.relation_type === "beneficiary");

    const loginUser = {
      fullName: req.user ? `${req.user.name} ${req.user.lastname} ${req.user.second_lastname}` : ''
    }
    const newClientsList: any = clientsQuery.rows.filter((r: any) => !r.error)
    const clientsData = newClientsList.map((x: any) => {

      const memberData = loanApp.members.find((y: any) => y.client_id === x.doc._id)
      const loanCycle = parseInt(memberData.loan_cycle) + 1
      const memberLoanAmount = memberData.apply_amount;
      let beneficiaryInfo = {
        name: memberData.insurance.beneficiary,
        lastname: '',
        second_lastname: '',
        relationship: memberData.insurance.relationship,
        percentage: memberData.insurance.percentage,
        address: {
          post_code: "",
          address_line1: "",
          street_reference: "",
          road: "",
          colony: "",
          city: "",
          municipality: "",
          province: "",
          country: "",
          fullExtNumber: '',
          fullIntNumber: ''
        }
      }
      const dob = 
          x.doc.dob ?
        x.doc.dob.slice(0, 10).split('-').reverse() : []
      dob.length = 3;

      const mobilePhone = x.doc.phones.find((y: any) => y.type === 'Móvil')
      const otherPhone = x.doc.phones.find((y: any) => y.type === 'Caseta')

      const homeAddress = x.doc.address.find((y: any) => y.type === 'DOMICILIO');
      const bisAddress = x.doc.address.find((y: any) => y.type === 'NEGOCIO');
      let bisAddressSame = '';
      if (bisAddress) { // evaluates first bisAddress exists, since object may not exits
        if (!!bisAddress.bis_address_same) {
          bisAddressSame = bisAddress.bis_address_same ? 'x' : '';
        }

      }

      /// if Benefiary found, replace info
      const beneficiaryFound: any = beneficiaryList.find((item: any) => (item.client_id === x.doc._id))
      if (beneficiaryFound) {
        beneficiaryInfo.name = beneficiaryFound.name
        beneficiaryInfo.lastname = beneficiaryFound.lastname
        beneficiaryInfo.second_lastname = beneficiaryFound.second_lastname
        beneficiaryInfo.percentage = beneficiaryFound.percentage
        beneficiaryInfo.relationship = beneficiaryFound.relationship
        beneficiaryInfo.address.post_code = beneficiaryFound.address.post_code
        beneficiaryInfo.address.address_line1 = beneficiaryFound.address.address_line1
        beneficiaryInfo.address.street_reference = beneficiaryFound.street_reference
        beneficiaryInfo.address.colony = beneficiaryFound.address.colony[1]
        beneficiaryInfo.address.province = beneficiaryFound.address.province[1]
        beneficiaryInfo.address.municipality = beneficiaryFound.address.municipality[1]
        beneficiaryInfo.address.city = beneficiaryFound.address.city[1]
        beneficiaryInfo.address.country = beneficiaryFound.address.country[1]
        beneficiaryInfo.address.road = beneficiaryFound.address.road[1]
        beneficiaryInfo.address.fullExtNumber = `${beneficiaryFound.address.ext_number ? beneficiaryFound.address.ext_number : ''} ${beneficiaryFound.address.exterior_number === 'SN' ? '' : beneficiaryFound.address.exterior_number}`
        beneficiaryInfo.address.fullIntNumber = `${beneficiaryFound.address.int_number ? beneficiaryFound.address.int_number : ''} ${beneficiaryFound.address.interior_number === 'SN' ? '' : beneficiaryFound.address.interior_number}`

      }

      homeAddress.fullExtNumber = `${homeAddress.ext_number ? homeAddress.ext_number : ''} ${homeAddress.exterior_number}`
      homeAddress.fullIntNumber = `${homeAddress.int_number ? homeAddress.int_number : ''} ${homeAddress.interior_number}`
      bisAddress.fullExtNumber = `${bisAddress.ext_number ? bisAddress.ext_number : ''} ${bisAddress.exterior_number}`
      bisAddress.fullIntNumber = `${bisAddress.int_number ? bisAddress.int_number : ''} ${bisAddress.interior_number}`

      /// FALSE PLD check when this field is empty
      const isClientPppYesNo = x.doc.spld.familiar_desempenia_funcion_publica_cargo ? 'Si' : 'No';
      const pPpClientName = x.doc.spld.familiar_desempenia_funcion_publica_cargo ?
        `${x.doc.spld.familiar_desempenia_funcion_publica_nombre} ${x.doc.spld.familiar_desempenia_funcion_publica_paternos} ${x.doc.spld.familiar_desempenia_funcion_publica_materno}` : ''


      return {
        name: x.doc.name,
        lastname: x.doc.lastname,
        second_lastname: x.doc.second_lastname,
        branch: loanApp.branch ? loanApp.branch[1] : '',
        apply_at: formatLocalDate2(loanApp.apply_at ? loanApp.apply_at : (new Date()).toISOString()).split("/"),
        loan_cycle: loanCycle > 1 ? loanCycle : '',
        economicDependants: x.doc.economic_dependants,
        hasPrimaria: x.doc.education_level ? x.doc.education_level[0] == 4 ? 'x' : '' : '',
        hasSecundaria: x.doc.education_level ? x.doc.education_level[0] == 5 ? 'x' : '' : '',
        hasPrepa: x.doc.education_level ? x.doc.education_level[0] == 8 ? 'x' : '' : '',
        hasUniversidad: x.doc.education_level ? x.doc.education_level[0] == 9 ? 'x' : '' : '',
        hasNinguno: x.doc.education_level ? x.doc.education_level[0] == 2 ? 'x' : '' : '',
        speaksDialectYes: x.doc.speaks_dialect ? 'x' : '',
        speaksDialectNo: x.doc.speaks_dialect ? '' : 'x',
        hasDisableYes: x.doc.has_disable ? 'x' : '',
        hasDisableNo: x.doc.has_disable ? '' : 'x',
        internetAccessYes: x.doc.internet_access ? 'x' : '',
        internetAccessNo: x.doc.internet_access ? '' : 'x',
        usesSocialMediaYes: x.doc.prefered_social ? x.doc.prefered_social[0] == 1 ? '' : 'x' : '',
        usesSocialMediaNo: x.doc.prefered_social ? x.doc.prefered_social[0] == 1 ? '' : '' : 'x',
        isSocialMediaFacebook: x.doc.prefered_social ? x.doc.prefered_social[0] == 3 ? 'x' : '' : '',
        isSocialMediaWhatsapp: x.doc.prefered_social ? x.doc.prefered_social[0] == 2 ? 'x' : '' : '',
        isSocialMediaInstagram: x.doc.prefered_social ? x.doc.prefered_social[0] == 4 ? 'x' : '' : '',
        userSocialMedia: x.doc.user_social,
        memberLoanAmount: formatLocalCurrency(memberLoanAmount),
        isNewLoan: loanCycle <= 1 ? "x" : "",
        isFemale: x.doc.sex ? x.doc.sex[0] == 3 ? 'x' : '' : '',
        isMale: x.doc.sex ? x.doc.sex[0] != 3 ? 'x' : '' : '',
        isSingle: x.doc.marital_status ? x.doc.marital_status[0] == 1 ? "x" : "" : "",
        isMarried: x.doc.marital_status ? x.doc.marital_status[0] == 2 ? "x" : "" : "",
        isCommonLaw: x.doc.marital_status ? x.doc.marital_status[0] == 3 ? "x" : "" : "",
        isNationalityMx: x.doc.nationality ? x.doc.nationality[0] == 1 ? 'x' : '' : '',
        notMxNationality: x.doc.nationality ? x.doc.nationality[0] == 1 ? "" : x.doc.nationality[1] : "",
        countryAndProvince: x.doc.province_of_birth ? `${x.doc.province_of_birth[1]}, ${x.doc.country_of_birth[1]}`.toUpperCase() : "",
        dob,
        curp: x.doc.curp,
        rfc: x.doc.rfc,
        claveIne: x.doc.clave_ine,
        email: x.doc.email,
        mobilePhone: mobilePhone ? mobilePhone.phone : '',
        otherPhone: otherPhone ? otherPhone.phone : '',
        geoLat: !!x.doc.coordinates ? x.doc.coordinates[0] : 0,
        geoLng: !!x.doc.coordinates ? x.doc.coordinates[1] : 0,
        homeAddress,
        homeAddressRoad: homeAddress.road ? homeAddress.road[1] : '',
        bisAddress,
        bisAddressRoad: bisAddress.road ? bisAddress.road[1] : '',
        bisAddressSame,
        hasHouseholdFloor: x.doc.household_floor ? 'x' : '',
        hasHouseholdRoof: x.doc.household_roof ? 'x' : '',
        hasHouseholdToilet: x.doc.household_toilet ? 'x' : '',
        hasHouseholdLatrine: x.doc.household_latrine ? 'x' : '',
        hasHouseholdBrick: x.doc.household_brick ? 'x' : '',
        isRolHogarJefe: x.doc.rol_hogar ? x.doc.rol_hogar[0] == 1 ? 'x' : '' : '',
        isRolHogarEsposo: x.doc.rol_hogar ? x.doc.rol_hogar[0] == 2 ? 'x' : '' : '',
        isRolHogarHijo: x.doc.rol_hogar ? x.doc.rol_hogar[0] == 3 ? 'x' : '' : '',
        isRolHogarOtro: x.doc.rol_hogar ? x.doc.rol_hogar[0] == 4 ? 'x' : '' : '',
        economicActivity: !x.doc.business_data.economic_activity ? 'NO ESPECIFICADO' : x.doc.business_data.economic_activity[1],
        profession: !x.doc.business_data.profession ? 'NO ESPECIFICADO' : x.doc.business_data.profession[1],
        occupation: !x.doc.business_data.ocupation ? 'NO ESPECIFICADO' : x.doc.business_data.ocupation[1],
        numberEmployees: x.doc.business_data.number_employees,
        bisDataPhone: x.doc.business_data.business_phone ? x.doc.business_data.business_phone : '',
        loanDestination: x.doc.business_data.loan_destination ? x.doc.business_data.loan_destination[1] : 'NO ESPECIFICADO',
        bisYearsMonths: calculateYearsMonthsFromDates(new Date(!!x.doc.business_data.business_start_date ? x.doc.business_data.business_start_date : new Date()), new Date()),
        homeYearsMonths: calculateYearsMonthsFromDates(new Date(!!homeAddress.residence_since ? homeAddress.residence_since : new Date()), new Date()),
        homeOwnershipRented: homeAddress.ownership_type ? (homeAddress.ownership_type[0] == 2 ? 'x' : '') : '',
        homeOwnershipOwned: homeAddress.ownership_type ? (homeAddress.ownership_type[0] == 1 ? 'x' : '') : '',
        homeOwnershipRelative: homeAddress.ownership_type ? (homeAddress.ownership_type[0] == 3 ? 'x' : '') : '',
        keepsAccountingRecords: x.doc.business_data.keeps_accounting_records ? 'Si' : 'No',
        hasPreviousExperience: x.doc.business_data.has_previous_experience ? 'Si' : 'No',
        previousExperience: x.doc.business_data.previous_loan_experience,
        isClientPppYesNo, pPpClientName,
        beneficiaryInfo,
        loginUser
      }
    })

    const hbs = create();
    const htmlData = await hbs.render('views/solicitud-grupo-tactiva.handlebars', {
      serverHost,
      clientsData
    });

    const result = await renderPDf(htmlData, `solicitud_grupo_tactiva`);
    res.send({ ...result });



  }
  catch (error: any) {
    console.log(error);
    res.status(400).send(error.message);
  }

})

async function renderPDf(htmlData: string, fileName: string) {

  const serverEnv = process.env.SERVER_ENV || 'development'



  const browser = (serverEnv === 'development') ? await puppeteer.launch({ headless: 'new' }) :
    await puppeteer.launch({ headless: 'new', executablePath: '/usr/bin/chromium-browser', args: ['--no-sandbox', '--disable-setuid-sandbox'] });

  const page = await browser.newPage();
  await page.setContent(htmlData, { waitUntil: ['domcontentloaded', 'load', "networkidle0"] });

  //To reflect CSS used for screens instead of print
  await page.emulateMediaType('print');
  const fileNamePathPdf = `./public/pdfs/${fileName}${Date.now().toString()}.pdf`

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
  return { downloadPath: fileNamePathPdf.replace('./public/', '') }
}

// router.post('/photos/upload', authorize, upload.array('photos', 24), async function (req:any, res:any, next) {
//   try{

//     const newListDocs = [];
//     for( let i=0; i< req.files.length; i++ ){
//       /// ignores files that are not images PNG or JPEG
//       if( !(req.files[i].mimetype === 'image/png' || 
//           req.files[i].mimetype === 'image/jpeg')
//        ) continue;

//       const base64str = req.files[i].buffer.toString('base64');
//       const item = {
//         _id: req.files[i].originalname,
//         base64str,
//         title: req.files[i].originalname,
//         mimetype: req.files[i].mimetype
//       }
//       newListDocs.push(item);
//     }
//     const db = nano.use(process.env.COUCHDB_NAME_PHOTOSTORE?process.env.COUCHDB_NAME_PHOTOSTORE: '');
//     await db.bulk( {docs: newListDocs} );
//     res.send({ uploads: newListDocs.length });
//   }
//   catch(e:any){
//     res.status(400).send({ error: e.message, note:'try upload less than 24 photo files'});
//   }

// });


router.get('/docs/img', async (req, res) => {
  /// server images based on the _id
  const id = req.query.id as string;

  try {
    if (!id) throw new Error('No img id supplied..');
    const db = nano.use(process.env.COUCHDB_NAME_PHOTOSTORE ? process.env.COUCHDB_NAME_PHOTOSTORE : '');
    const imageData: any = await db.get(id);
    const img = Buffer.from(imageData.base64str, 'base64');
    res.writeHead(200, {
      'Content-Type': imageData.mimetype,
      'Content-Length': img.length
    });
    res.end(img);
  }
  catch (e: any) {
    console.log(e)
    res.status(400).send(e.message);
  }
})


async function loadBase64ImgArrayFromDB(keys: string[]) {
  const db = nano.use(process.env.COUCHDB_NAME_PHOTOSTORE ? process.env.COUCHDB_NAME_PHOTOSTORE : '');
  const data = await db.fetch({ keys: keys });
  const newData = data.rows.map((x: any) => ({ base64str: x.doc.base64str, mimetype: x.doc.mimetype, title: x.doc.title }))
  return newData;

}

async function createReference(typeReference: string, idClient: number) {
  const pool = await sql.connect(sqlConfig);
  const result = await pool.request()
    .input('tipoEvento', sql.Int, typeReference)
    .input('id_cliente', sql.Int, idClient)
    .execute('MARE_ObtenerReferenciaIntermediario');

  return result.recordset;

}

export { router as puppeteerRouter }