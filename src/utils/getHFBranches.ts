import sql from 'mssql';
import { sqlConfig } from '../db/connSQL';
import * as Nano from 'nano';
let nano = Nano.default(`${process.env.COUCHDB_PROTOCOL}://${process.env.COUCHDB_USER}:${process.env.COUCHDB_PASS}@${process.env.COUCHDB_HOST}:${process.env.COUCHDB_PORT}`);

export interface HfBranchType {
  id: number;
  name: string;
}
export async function getHfBranches (){
    await sql.connect(sqlConfig);
    const queryBranchesResultSet =
      await sql.query`SELECT CORP_CuotaNegocio.id_origen AS id, 
         CORP_CuotaNegocio.etiqueta AS nombre,
         CuotaNegocioPadre.id_origen AS id_zona
    FROM CORP_CuotaNegocio
    INNER JOIN CORP_CuotaNegocio CuotaNegocioPadre
    ON CORP_CuotaNegocio.id_cuota_negocio_padre = CuotaNegocioPadre.id
    WHERE CORP_CuotaNegocio.activo = 1
    AND CORP_CuotaNegocio.id_tipo_cuota_negocio = 3
    AND CORP_CuotaNegocio.id_categoria_cuota_negocio = 2`

    const result = (queryBranchesResultSet.recordset as Array<any>).map( (i:HfBranchType) => ({
      id: i.id,
      name: i.name
    }) )

    return result
}

export async function findDbs( ){
  // Recupera la lista de BD de Sucursales solamente, quitando la global
  const dblist = await nano.db.list();
  const newlist = dblist.filter( (db:string) => (db.includes("cnsrv-promotor")) )
                        .filter( (x:string) => (x != 'cnsrv-promotor'))
  return newlist;

}