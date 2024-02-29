import sql from 'mssql';
import { sqlConfig } from '../db/connSQL';
import { DocumentCollection } from './DocumentCollection';

export class Group extends DocumentCollection {

    id_cliente: any;
    group_name: any;
    weekday_meet: any;
    hour_meet: any;
    loan_officer: any;
    loan_cycle: any;
    address: any;
    created_by: any;
    branch: any;
    status: any;
    coordinates: any;

    constructor(obj = {} as any) {
        super()
        this._id = obj._id || Date.now().toString(),
        this._rev = obj._rev,
        this.couchdb_type = 'GROUP',
        this.id_cliente = obj.id_cliente,
        this.group_name = obj.group_name,
        this.weekday_meet = obj.weekday_meet,
        this.hour_meet = obj.hour_meet,
        this.loan_officer = obj.loan_officer,
        this.loan_cycle = obj.loan_cycle,
        this.address = obj.address,
        this.created_by = obj.created_by,
        this.branch = obj.branch,
        this.status = obj.status,
        this.coordinates = obj.coordinates
    }

    /**
     *
     * @param {number} idGroup Id_cliente de HF
     * @returns {Array}
     */
    async getGroupById(idGroup:number) {
        try {
            const pool = await sql.connect(sqlConfig);

            const result = await pool.request()
                .input('id_grupo', sql.Int, idGroup)
                .execute('MOV_ObtenerGrupoByID')

            return result.recordset;
        }
        catch (error:any) {
            throw new Error(error)
        }
    }
}
