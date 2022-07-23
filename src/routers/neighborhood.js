const express = require("express");
const router = new express.Router();
const Neighborhood = require('../model/neighborhood');

router.get('/neighborhood/:cp', async(req, res) => {

    try{

        if( !req.params.cp ){
            throw new Error('You need to provide a calida *cp* param')
        }

        let match = {
            codigo_postal: req.params.cp
        }
        if( req.query.id){
            match = { ...match, _id: parseInt(req.query.id)}
        }

        
        const data = await Neighborhood.find(match);
        console.log(match);
        console.log(data);

        for( let i=0; i< data.length; i++){
            const n1 = await data[i].populate('ciudad_localidad').execPopulate()
            const n2 = await n1.ciudad_localidad.populate('municipio').execPopulate();        
            const n3 = await n2.municipio.populate('estado').execPopulate();
            await n3.estado.populate('pais').execPopulate();
        }

        console.log('ese es el resultado final', data)
            
        res.status(200).send(data);

    } catch(e) {
        res,status(400).send(e);
    }

})

module.exports = router;