const Neighborhood = require("../model/neighborhood");
const City = require('../model/city');
const Municipality = require('../model/municipality');
const Province = require('../model/province');
const Country = require('../model/country');
const Catalog = require('../model/catalog');


const getDataFromHF = async() => {

    await Neighborhood.updateFromHF(1000);
    await City.updateFromHF(1000);
    await Municipality.updateFromHF(1000);
    await Province.updateFromHF(1000);
    await Country.updateFromHF(1000);

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

}

// getDataFromHF();