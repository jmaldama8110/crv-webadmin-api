const express = require('express');
const router = new express.Router();

const authorize = require("../middleware/authorize");

const CatalogCollection = require('../model/catalogCollection');

router.get('/catalogs/sync',authorize, async (req,res) => {
    try{
        const catalogCollection = new CatalogCollection();
        await catalogCollection.updateCatalogFromHF('CATA_ActividadEconomica',10000, true)
        await catalogCollection.updateCatalogFromHF('CATA_sexo',10000)
        await catalogCollection.updateCatalogFromHF('CATA_sector',10000)
        await catalogCollection.updateCatalogFromHF('CATA_escolaridad',10000)
        await catalogCollection.updateCatalogFromHF('CATA_estadoCivil',10000)
        await catalogCollection.updateCatalogFromHF('CATA_nacionalidad',10000, true)
        
        await catalogCollection.updateCatalogFromHF('CATA_parentesco',10000)
        await catalogCollection.updateCatalogFromHF('CATA_profesion',10000, true)
        await catalogCollection.updateCatalogFromHF('CATA_TipoRelacion',10000)
        await catalogCollection.updateCatalogFromHF('CATA_TipoPuesto',10000)
        await catalogCollection.updateCatalogFromHF('CATA_TipoVialidad',10000)
        await catalogCollection.updateCatalogFromHF('CATA_Ciudad_Localidad',10000)
        await catalogCollection.updateCatalogFromHF('CATA_destinoCredito',10000)
        await catalogCollection.updateCatalogFromHF('CATA_ocupacionPLD',10000, true)
        await catalogCollection.updateCatalogFromHF('CATA_banco',10000)
        await catalogCollection.updateCatalogFromHF('CATA_TipoCuentaBancaria',10000)

        await catalogCollection.updateCatalogFromHF('CATA_MotivoBajaCastigado',10000)
        await catalogCollection.updateCatalogFromHF('CATA_MotivoBajaCancelacion',10000)
        await catalogCollection.updateCatalogFromHF('CATA_MotivoBajaRechazado',10000)

        await catalogCollection.updateCatalogFromHFByRelationship('CATA_asentamiento',1000,'NEIGHBORHOOD', 'CITY', 'ciudad_localidad' );
        await catalogCollection.updateCatalogFromHFByRelationship('CATA_ciudad_localidad',1000,'CITY', 'MUNICIPALITY', 'municipio');
        await catalogCollection.updateCatalogFromHFByRelationship('CATA_municipio',1000,'MUNICIPALITY', 'PROVINCE', 'estado');
        await catalogCollection.updateCatalogFromHFByRelationship('CATA_estado',1000,'PROVINCE', 'COUNTRY', 'pais');
        await catalogCollection.updateCatalogFromHFByRelationship('CATA_pais', 1000, 'COUNTRY');
        await catalogCollection.createCouchDBTypeParams();

        res.status(201).send('Done!');
    }
    catch(error){
        console.log(error + '');
        res.status(400).send(error + '')
    }
})


module.exports = router;