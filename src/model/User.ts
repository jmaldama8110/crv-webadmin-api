import { sqlConfig } from "../db/connSQL";
import sql from 'mssql';
import crypto from 'crypto';
import jwt from "jsonwebtoken";
import * as Nano from 'nano';
let nano = Nano.default(`${process.env.COUCHDB_PROTOCOL}://${process.env.COUCHDB_USER}:${process.env.COUCHDB_PASS}@${process.env.COUCHDB_HOST}:${process.env.COUCHDB_PORT}`);          
console.log(`${process.env.COUCHDB_PROTOCOL}://${process.env.COUCHDB_USER}:${process.env.COUCHDB_PASS}@${process.env.COUCHDB_HOST}:${process.env.COUCHDB_PORT}`)
export default class User {

    constructor(){

    }

    static async findUserByCredentialsHF( user: string, password: string ){

        const pool = await sql.connect(sqlConfig);

        let userFindRes = await pool
          .request()
          .input("id", sql.VarChar, user)
          .query("select * from ADMI_Usuarios WHERE ADMI_Usuarios.correo = @id");
        
        if (!userFindRes.rowsAffected[0]) {
          userFindRes = await pool
            .request()
            .input("id", sql.VarChar, user)
            .query("select * from ADMI_Usuarios WHERE ADMI_Usuarios.login = @id");
        }
      
        if (!userFindRes.rowsAffected[0]) {
          throw new Error("Bad credentials HF");
        }

        const userCredentials: any = userFindRes.recordset[0];

        let hash = crypto
          .createHash("md5")
          .update(password)
          .digest("hex")
          .toLocaleUpperCase();
        const passMd5 = userCredentials.pass.trim().replaceAll("-", "");
        if (!(passMd5 === hash)) {
          throw new Error("bad credentials...");
        }
      
        const loanOfficerRes = 
        await sql.query`SELECT 
        Plantilla.id_persona as id_oficial
        ,Persona.nombre as name
        ,Persona.apellido_paterno as lastname
        ,Persona.apellido_materno as second_lastname
        ,Oficina.nombre as nombre_oficina
        ,Plantilla.id_padre as id_padre
        ,Plantilla.id_oficina
        ,CATA_NivelPuesto.id AS id_nivel_puesto
        ,COALESCE(CATA_NivelPuesto.etiqueta,'') AS nivel_puesto
        FROM COMM_PlantillaSucursal Plantilla
        INNER JOIN CORP_Empleado Empleado
        ON Empleado.id=Plantilla.id_empleado
        AND Empleado.activo=1
        INNER JOIN CATA_Puesto Puesto
        ON Puesto.id=Empleado.id_puesto
        INNER JOIN CATA_RolSucursal rol
        ON rol.id=Plantilla.id_rol_sucursal
        AND rol.activo=1
        INNER JOIN CONT_Personas Persona
        ON Persona.id=Plantilla.id_persona
        INNER JOIN CORP_OficinasFinancieras Oficina
        On Oficina.id= Plantilla.id_oficina
        LEFT JOIN CATA_NivelPuesto ON Empleado.id_nivel_puesto = CATA_NivelPuesto.id
        AND CATA_NivelPuesto.activo = 1
        WHERE rol.codigo='PROM'
        AND Plantilla.estatus='ACTIVO'
        AND Plantilla.activo=1
        AND Persona.id=${userCredentials.id_persona}`
        
        if (!loanOfficerRes.recordsets.length) {
          throw new Error("No loan officer associated...");
        }
        const loanOfficerData:any = loanOfficerRes.recordset[0]
        
        const userReponse = {
          login: userCredentials.login.trim(),
          email: `${userCredentials.correo}`,
          loan_officer: userCredentials.id_persona,
          name: loanOfficerData.name,
          lastname: loanOfficerData.lastname,
          second_lastname: loanOfficerData.second_lastname,
          branch: [loanOfficerData.id_oficina,loanOfficerData.nombre_oficina],
          officer_rank: [loanOfficerData.id_nivel_puesto, loanOfficerData.nivel_puesto]
        };
        return userReponse;
      
    }

    static async generateAuthTokenHf( user:any){
        /// adds 24 hours of token expiration
        let sync_info = {};

        const sync_expiration = new Date();
        sync_expiration.setHours(sync_expiration.getHours() + 24);

        sync_info = {
            local_target: "local-db",
            remote_target: "cnsrv-promotor",
            sync_expiration,
        };

        const jwt_secret_key = process.env.JWT_SECRET_KEY ? process.env.JWT_SECRET_KEY : '';
        const token = jwt.sign(
        { user, sync_info },
            jwt_secret_key
        );

        const db = nano.use(process.env.COUCHDB_NAME!);
        const data:any  = {
            _id: Date.now().toString(),
            couchdb_type: "TOKEN",
            token
        }
        await db.insert(data)

        return token;
    }
}