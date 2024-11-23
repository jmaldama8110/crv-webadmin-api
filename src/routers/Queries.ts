import express, { query } from 'express';
import * as Nano from 'nano';

let nano = Nano.default(`${process.env.COUCHDB_PROTOCOL}://${process.env.COUCHDB_USER}:${process.env.COUCHDB_PASS}@${process.env.COUCHDB_HOST}:${process.env.COUCHDB_PORT}`);


const router = express.Router();

router.get('/query/data',  async (req: any, res) => {

    try {
        const dbQuery = await nano.db.list();
        const dbsList = dbQuery.filter( (db:string) => (db.includes("cnsrv-promotor")) )
                              .filter( (x:string) => ( (x != 'cnsrv-promotor' && x != 'cnsrv-promotor-' )  ) )
        let data:any = []
        for( let i=0; i < dbsList.length; i++){
            const buff = await getGroupsFromDb(dbsList[i]);
            data = data.concat(buff);
        }
        res.send(data);

    } catch (err: any) {
        res.send(err.message);
    }
});

async function getGroupsFromDb(dbName:string){
    const db = nano.use(dbName);
    const queryGroup = await db.find({
        selector: {
            couchdb_type: "GROUP"
        }, limit: 100000
    });

    const queryLoans = await db.find({
        selector: {
            couchdb_type: "LOANAPP_GROUP",
        }, limit: 10000
    })
    
    const loansData = queryLoans.docs.filter( (x:any) => x.estatus == 'ACEPTADO' && x.sub_estatus == 'PRESTAMO ACTIVO')
    let data:any = []

    data = loansData.map( (k:any) => {
        const groupDoc:any = queryGroup.docs.find( (w:any)=> w._id === k._id )
        return {
            _id: k._id,
            id_cliente: k.id_cliente,
            id_solicitud: k.id_solicitud,
            nombre_grupo: groupDoc ? groupDoc.group_name : '',
            monto_solicitado: k.apply_amount,
            producto_id: k.product.external_id,
            producto_nombre: k.product.product_name,
            frecuencia: k.frequency[1],
            plazo: k.term,
            promotor: k.created_by
        }
    })
    
    return data;

}
export { router as QueryRouter }