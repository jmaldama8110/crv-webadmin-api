const express = require('express');
const router = new express.Router();
const Catalog = require('../model/catalog')
const Neighborhood = require('../model/neighborhood');
const City = require('../model/city');
const Municipality = require('../model/municipality');
const Province = require('../model/province');
const Country = require('../model/country');
const Branch = require('../model/branch');
const auth = require ('../middleware/auth');

router.get('/catalogs/sync', auth, async (req,res) => {
    try{
            
        Catalog.updateCatalogFromHF('CATA_ActividadEconomica',10000)
        Catalog.updateCatalogFromHF('CATA_sexo',10000)
        Catalog.updateCatalogFromHF('CATA_sector',10000)
        Catalog.updateCatalogFromHF('CATA_escolaridad',10000)
        Catalog.updateCatalogFromHF('CATA_estadoCivil',10000)
        Catalog.updateCatalogFromHF('CATA_nacionalidad',10000)
        Catalog.updateCatalogFromHF('CATA_ocupacion',10000)
        Catalog.updateCatalogFromHF('CATA_parentesco',10000)
        Catalog.updateCatalogFromHF('CATA_profesion',10000)
        Catalog.updateCatalogFromHF('CATA_TipoRelacion',10000)
        Catalog.updateCatalogFromHF('CATA_TipoPuesto',10000)
        Catalog.updateCatalogFromHF('CATA_TipoVialidad',10000)
        Catalog.updateCatalogFromHF('CATA_Ciudad_Localidad',10000)
        Catalog.updateCatalogFromHF('CATA_destinoCredito',10000)
        Catalog.updateCatalogFromHF('CATA_ocupacionPLD',10000)

        await Neighborhood.updateFromHF(1000);
        await City.updateFromHF(1000);
        await Municipality.updateFromHF(1000);
        await Province.updateFromHF(1000);
        await Country.updateFromHF(1000);

        res.status(201).send('Done!')
    }
    catch(error){
        console.log(error + '');
        res.status(401).send(error + '')
    }
})

router.get('/universalCatalog', auth, async(req, res) => {
    const match = {}
    
    try{

        if (req.query.id){
            match._id = req.query.id
        }

        if (req.query.name){
            match.name = req.query.name
        }

        const catalogs = await Catalog.find(match);
        if(!catalogs || catalogs.length == 0){
            throw new Error('No records found');
        }

        res.status(200).send(catalogs);

    } catch(e){
        console.log(e + '');
        res.status(400).send(e + '');
    }
});

router.get('/neighborhoodCatalog', auth, async(req, res) => {
    const match = {}
    
    try{

        if (req.query.id){
            match._id = req.query.id
        }

        const catalog = await Neighborhood.find(match);
        if(!catalog || catalog.length == 0){
            throw new Error('No records found');
        }

        res.status(200).send(catalog);

    } catch(e){
        console.log(e + '');
        res.status(400).send(e + '');
    }
});

router.get('/cityCatalog', auth, async(req, res) => {
    const match = {}
    
    try{

        if (req.query.id){
            match._id = req.query.id
        }

        const catalog = await City.find(match);
        if(!catalog || catalog.length == 0){
            throw new Error('No records found');
        }
        
        res.status(200).send(catalog);

    } catch(e){
        console.log(e + '');
        res.status(400).send(e + '');
    }
});

router.get('/municipalityCatalog', auth, async(req, res) => {
    const match = {}
    
    try{

        if (req.query.id){
            match._id = req.query.id
        }

        const catalog = await Municipality.find(match);
        if(!catalog || catalog.length == 0){
            throw new Error('No records found');
        }
        
        res.status(200).send(catalog);

    } catch(e){
        console.log(e + '');
        res.status(400).send(e + '');
    }
});

router.get('/provinceCatalog', auth, async(req, res) => {
    const match = {}
    
    try{

        if (req.query.id){
            match._id = req.query.id
        }

        const catalog = await Province.find(match);
        if(!catalog || catalog.length == 0){
            throw new Error('No records found');
        }
        
        res.status(200).send(catalog);

    } catch(e){
        console.log(e + '');
        res.status(400).send(e + '');
    }
});

router.get('/countryCatalog', auth, async(req, res) => {
    const match = {}
    
    try{

        if (req.query.id){
            match._id = req.query.id
        }

        const catalog = await Country.find(match);
        if(!catalog || catalog.length == 0){
            throw new Error('No records found');
        }
        
        res.status(200).send(catalog);

    } catch(e){
        console.log(e + '');
        res.status(400).send(e + '');
    }
});

module.exports = router;