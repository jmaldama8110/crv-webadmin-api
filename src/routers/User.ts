import express from 'express';
import User from '../model/User';
import sql from 'mssql';
import { sqlConfig } from '../db/connSQL';
import { authorize } from '../middleware/authorize';
import * as Nano from 'nano';
import fs from 'fs';
import path from 'path'
const router = express.Router();

router.post("/users/hf/login", async (req, res) => {

  try {
    const user: any = await User.findUserByCredentialsHF(
      req.body.user,
      req.body.password
    );

    const token = await User.generateAuthTokenHf(user)
    res.status(200).send({ ...user, token });

  } catch (error: any) {
    console.log(error);
    res.status(400).send(error.message);
  }
});

router.post("/db_all_docs", authorize, async (req, res) => {
  try {

    let nano = Nano.default(req.body.path);
    const db = nano.use(req.body.db_name);

    const today = Date.now().toString();
    const fileName = `${req.body.db_name}-${today}.txt`
    
    const doclist = await db.list({ include_docs: true });
    const data = doclist.rows.map((row: any) => {
      delete row.doc._rev
      return {
        ...row.doc
      }
    });

    const filePath = path.join(__dirname,fileName);

    fs.appendFileSync(filePath,JSON.stringify(data))
    
    res.send({ fileName });
  }
  catch (e: any) {
    console.log(e.message)
    res.status(400).send(e.message);
  }
});
router.post('/db_restore', authorize, async (req,res) =>{

    try{
    
     if( !req.body.fileName || !req.body.target || !req.body.db_name){
        throw new Error('No fileName or target or db_name parameter provided in body request')
      }
    const filePath = path.join(__dirname,req.body.fileName as string);
    const data:any = JSON.parse(fs.readFileSync(filePath, "utf8") );
    let nano = Nano.default(req.body.target);
    const db = nano.use(req.body.db_name);
    await db.bulk({docs: data});
    res.send({count: data.length})
    
  }
  catch(e:any){
    res.status(400).send(e.message)
  }
})

router.post('/db_catalog_restore', authorize, async (req, res) => {
  try {

      if( !req.body.catalogKeyword || !req.body.target || !req.body.db_name){
          throw new Error('catalogKeyword, target and db_name params not provided in body');
      }  
      await updateSingleCatalogFromHF(req.body.catalogKeyword, 10000,req.body.target, req.body.db_name, true)

      res.status(201).send('Done!');
  }
  catch (error) {
      console.log(error + '');
      res.status(400).send(error + '')
  }
});
router.post('/db_special_catalog_restore', authorize, async (req, res) => {
  try {

      if( !req.body.catalogKeyword ||  // CATA_pais, en la BD HF
          !req.body.shortname || // nombre del couchdb_type para este catalogo especial
          !req.body.target ||  // target Couchdb instance
          !req.body.db_name){ // couchdb name
          throw new Error('catalogKeyword, target and db_name params not provided in body');
      }  
      await updateSingleCatalogFromHFByRelationship(req.body.catalogKeyword, 1000, req.body.shortname,req.body.target,req.body.db_name);
      res.status(201).send('Done!');
  }
  catch (error) {
      console.log(error + '');
      res.status(400).send(error + '')
  }
});

async function updateSingleCatalogFromHF(name: string, chunk: number,target: string, dbName:string, filterActive?: boolean ){

  let nano = Nano.default(`${target}`);
  const db = nano.use(dbName ? dbName : '');
  await db.createIndex({ index: { fields: ["couchdb_type","name"]}});        
  const docsDestroy = await db.find({ selector: { couchdb_type: "CATALOG",name }, limit: 100000 });
  
  if (docsDestroy.docs.length > 0) {
      const docsEliminate = docsDestroy.docs.map(doc => {
          const { _id, _rev } = doc;
          return { _deleted: true, _id, _rev }
      })
      db.bulk({ docs: docsEliminate })
          .then((body) => { console.log('DELETE', name) })
          .catch((error) => console.log(error));
  }

  sql.connect(sqlConfig, (err) => {
      const request = new sql.Request();
      request.stream = true;//Activarlo al trabajar con varias filas

      if (filterActive) {
          request.query(`select * from ${name} where estatus_registro = \'ACTIVO\'`);
      } else {
          request.query(`select * from ${name}`);
      }

      let rowData: any = [];

      request.on('row', row => {

          rowData.push({ name, couchdb_type: 'CATALOG', ...row });
          if (rowData.length >= chunk) {
              request.pause(); //Pausar la insercción

              db.bulk({ docs: rowData })
                  .then((body) => { })
                  .catch((error) => { throw new Error(error) });

              rowData = [];
              request.resume();//continuar la insercción
          }
      })

      request.on("error", (err) => {
          console.log(err);
      });

      request.on("done", (result) => {
          db.bulk({ docs: rowData })
              .then((body) => { })
              .catch((error) => console.log(error));

          rowData = [];
          request.resume();

          console.log("Catalog Done!", name, "!!", result);
      });
  })

}
async function updateSingleCatalogFromHFByRelationship(name: string, chunk: number, shortname: string,target: string, dbName:string, relationship_name?: string, relationship?: string) {
  try {
        let nano = Nano.default(`${target}`);
        const db = nano.use(dbName ? dbName : '');
        await db.createIndex( { index: { fields: ["couchdb_type"]}});
        const docsDestroy = await db.find({ selector: { couchdb_type: shortname }, limit: 100000 });

      if (docsDestroy.docs.length > 0) {

          const docsEliminate = docsDestroy.docs.map(doc => {
              const { _id, _rev } = doc;
              return { _deleted: true, _id, _rev }
          })
          db.bulk({ docs: docsEliminate })
              .then((body) => { })
              .catch((error) => console.log(error));
      }

      sql.connect(sqlConfig, (err) => {
          const request = new sql.Request();
          request.stream = true;//Activarlo al trabajar con varias filas

          request.query(`select * from ${name}`);

          let rowData: any = [];

          request.on('row', row => {
              // relationship
              const codigo_postal = row.codigo_postal
              let dataRow: any = relationship ? {
                  _id: `${shortname.toUpperCase()}|${(row.id).toString()}`,
                  codigo_postal,
                  couchdb_type: shortname,
                  etiqueta: row.etiqueta,
                  [relationship]: `${relationship_name}|${(row[`id_${relationship}`]).toString()}`,
              } : {
                  _id: `${shortname.toUpperCase()}|${(row.id).toString()}`,
                  // name: shortname,
                  couchdb_type: shortname,
                  etiqueta: row.etiqueta
              }
              // if(relationship) dataRow.[relationship] = `${relationship_name}|${(row[`id_${relationship}`]).toString()}`;
              // if(row.codigo_postal || row.abreviatura || row.codigo) console.log(row.codigo_postal, row.abreviatura, row.codigo)
              if (row.codigo_postal) dataRow.codigo_postal = row.codigo_postal;
              if (row.codigo) dataRow.codigo = row.codigo;
              if (row.abreviatura) dataRow.abreviatura = row.abreviatura;

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
                      .catch((error) => { throw new Error(error) });

                  rowData = [];
                  request.resume();//continuar la insercción
              }
          })

          request.on("error", (err) => {
              console.log(err);
          });

          request.on("done", (result) => {
              db.bulk({ docs: rowData })
                  .then((body) => { })
                  .catch((error) => console.log(error));

              rowData = [];
              request.resume();

              console.log("Dones Catalog Special", name, "!!", result);
          });
      })
  } catch (e: any) {
      console.log(e)
      throw new Error(e)
  }
}



export { router as userRouter }