const express = require("express");
const router = new express.Router();
const authorize = require("../middleware/authorize");
const puppeteer = require('puppeteer');
const fs = require('fs');
const { ExpressHandlebars } = require('express-handlebars');

router.get("/docs/html/account-statement", async (req, res) => {

  try{
    const logoBase64 = fs.readFileSync('./public/logo-cnsrv-light.png', { encoding: 'base64'});

    const hbs = new ExpressHandlebars({ extname:".handlebars"});
    const data = await hbs.render('views/home.handlebars', { logoImageFilePath: `data:image/jpeg;base64,${logoBase64}`});
    res.send(data);
  }
  catch(error){
    res.status(400).send(error.message);
  }
});

router.get("/docs/pdf/account-statement", async (req, res) => {
  try {
    // Create a browser instance
    const browser = await puppeteer.launch({executablePath: '/usr/bin/chromium-browser'});
    // Create a new page
    const page = await browser.newPage();

    const logoBase64 = fs.readFileSync('./public/logo-cnsrv-light.png', { encoding: 'base64'});
    
    const hbs = new ExpressHandlebars({ extname:".handlebars"});
    const htmlData = await hbs.render('views/account-statement.handlebars', { logoImageFilePath: `data:image/jpeg;base64,${logoBase64}`});

    await page.setContent(htmlData, { waitUntil: 'networkidle2' });
    //To reflect CSS used for screens instead of print
    await page.emulateMediaType('screen');
    
    const fileNamePathPdf = `./temp/puppeteer-${Date.now().toString()}.pdf`
    
    const pdf = await page.pdf({
      path: fileNamePathPdf,
      margin: { top: '20px', right: '30px', bottom: '20px', left: '30px' },
      printBackground: true,
      format: 'Letter',
    });
    // Close the browser instance
    await browser.close();
    fs.unlinkSync(fileNamePathPdf);
    res.send(pdf.toString('base64'));

  } catch (e) {
    res.status(400).send(e.message);
  }
});

module.exports = router;
