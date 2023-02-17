const DocumentCollection = require('./documentCollection');
const connCouch = require("./../db/connCouch");
const { sqlConfig } = require('../db/connSQL');
const sql = require('mssql');

class CatalogCollection extends DocumentCollection {
    constructor(obj = {}) {
        super()
        this._id = obj._id || Date.now().toString(),
        this._rev = obj._rev,
        this._couchdb_type = 'CATALOG',
        this._name = obj.name,
        this._id = obj.id,
        this._codigo_estado = obj.codigo_estado,
        this._codigo_municipio = obj.codigo_municipio,
        this._codigo_locallidad = obj.codigo_locallidad,
        this._nombre_localidad = obj.nombre_localidad,
        this._codigo_postal = obj.codigo_postal,
        this._id_ciudad_localidad = obj.id_ciudad_localidad,
        this._id_municipio = obj.id_municipio,
        this._id_estado = obj.id_estado,
        this._id_pais = obj.id_pais,
        this._etiqueta = obj.etiqueta,
        this._codigo = obj.codigo,
        this._abreviatura = obj.abreviatura,
        this._descripcion = obj.descripcion,
        this._eliminado = obj.eliminado,
        this._tipo = obj.tipo
    }

    async updateCatalogFromHF(name, chunk, filterActive) {
        try {
            const db = connCouch.use(process.env.COUCHDB_NAME);
            const docsDestroy = await db.find({ selector: { name }, limit: 100000 });
            if(docsDestroy.docs.length > 0 ) {
                const docsEliminate = docsDestroy.docs.map(doc => {
                    const { _id, _rev } = doc;
                    return { _deleted: true, _id, _rev }
                })
                db.bulk({ docs: docsEliminate })
                .then((body) => {console.log('DELETE', name)})
                .catch((error) => console.log(error));
            }

            sql.connect(sqlConfig, (err) => {
                const request = new sql.Request();
                request.stream = true;//Activarlo al trabajar con varias filas

                if (filterActive) {
                    request.query(`select * from ${name} where estatus_registro = \'ACTIVO\'`);
                } else{
                    request.query(`select * from ${name}`);
                }

                let rowData = [];

                request.on('row', row => {
                    // console.log(row);
                    rowData.push({ name, couchdb_type: this._couchdb_type, ...row });
                    if (rowData.length >= chunk) {
                        request.pause(); //Pausar la insercción

                        db.bulk({ docs: rowData })
                            .then((body) => { })
                            .catch((error) => {throw new Error(error)});

                        rowData = [];
                        request.resume();//continuar la insercción
                    }
                })

                request.on("error", (err) => {
                    console.log(err);
                });

                request.on("done", (result) => {
                    db.bulk({docs: rowData})
                        .then((body) => {})
                        .catch((error) => console.log(error));

                    rowData = [];
                    request.resume();

                    console.log("Dones Catalog", name, "!!", result);
                });
            })
        } catch (e) {
            console.log(e)
        }
    }
    async updateCatalogFromHFByRelationship(name, chunk, shortname, relationship_name, relationship) {
        try {
            const db = connCouch.use(process.env.COUCHDB_NAME);
            const docsDestroy = await db.find({ selector: { couchdb_type: shortname }, limit: 100000 });

            if(docsDestroy.docs.length > 0 ) {

                const docsEliminate = docsDestroy.docs.map(doc => {
                    const { _id, _rev } = doc;
                    return { _deleted: true, _id, _rev }
                })
                db.bulk({ docs: docsEliminate })
                .then((body) => {})
                .catch((error) => console.log(error));
            }

            sql.connect(sqlConfig, (err) => {
                const request = new sql.Request();
                request.stream = true;//Activarlo al trabajar con varias filas

                request.query(`select * from ${name}`);

                let rowData = [];

                request.on('row', row => {
                    // relationship
                    const codigo_postal = row.codigo_postal
                    let dataRow = relationship ? {
                        _id:`${shortname.toUpperCase()}|${(row.id).toString()}`,
                        codigo_postal,
                        couchdb_type: shortname,
                        etiqueta: row.etiqueta,
                        [relationship]: `${relationship_name}|${(row[`id_${relationship}`]).toString()}`,
                    }:{
                        _id:`${shortname.toUpperCase()}|${(row.id).toString()}`,
                        // name: shortname,
                        couchdb_type: shortname,
                        etiqueta: row.etiqueta
                    }
                    // if(relationship) dataRow.[relationship] = `${relationship_name}|${(row[`id_${relationship}`]).toString()}`;
                    // if(row.codigo_postal || row.abreviatura || row.codigo) console.log(row.codigo_postal, row.abreviatura, row.codigo)
                    if(row.codigo_postal) dataRow.codigo_postal = row.codigo_postal;
                    if(row.codigo) dataRow.codigo = row.codigo;
                    if(row.abreviatura) dataRow.abreviatura = row.abreviatura;

                    rowData.push(dataRow)

                    // rowData.push(relationship ? codigo_postal ?  {
                    //     _id:`${shortname.toUpperCase()}|${(row.id).toString()}`,
                    //     codigo_postal,
                    //     couchdb_type: shortname,
                    //     etiqueta: row.etiqueta,
                    //     [relationship]: `${relationship_name}|${(row[`id_${relationship}`]).toString()}`,
                    // } : {
                    //     _id:`${shortname.toUpperCase()}|${(row.id).toString()}`,
                    //     couchdb_type: shortname,
                    //     etiqueta: row.etiqueta,
                    //     [relationship]: `${relationship_name}|${(row[`id_${relationship}`]).toString()}`,
                    // } : {
                    //     _id:`${shortname.toUpperCase()}|${(row.id).toString()}`,
                    //     // name: shortname,
                    //     couchdb_type: shortname,
                    //     etiqueta: row.etiqueta
                    // });
                    if (rowData.length >= chunk) {
                        request.pause(); //Pausar la insercción

                        db.bulk({ docs: rowData })
                            .then((body) => { })
                            .catch((error) => {throw new Error(error)});

                        rowData = [];
                        request.resume();//continuar la insercción
                    }
                })

                request.on("error", (err) => {
                    console.log(err);
                });

                request.on("done", (result) => {
                    db.bulk({docs: rowData})
                        .then((body) => {})
                        .catch((error) => console.log(error));

                    rowData = [];
                    request.resume();

                    console.log("Dones Catalog Special", name, "!!", result);
                });
            })
        } catch (e) {
            console.log(e)
            throw new Error(e)
        }
    }
}

module.exports = CatalogCollection;