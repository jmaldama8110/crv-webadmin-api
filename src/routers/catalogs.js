const express = require('express');
const router = new express.Router();
const Catalog = require('../model/catalog')
const Neighborhood = require('../model/neighborhood');
const City = require('../model/city');
const Municipality = require('../model/municipality');
const Province = require('../model/province');
const Country = require('../model/country');
const auth = require ('../middleware/auth');

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