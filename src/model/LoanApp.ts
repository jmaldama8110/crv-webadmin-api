import sql from 'mssql';
import { sqlConfig } from '../db/connSQL';
import { DocumentCollection } from './DocumentCollection';

export class LoanApp extends DocumentCollection {
    apply_by: any;
    id_solicitud: any;
    id_cliente: any;
    loan_officer: any;
    id_producto: any;
    id_disposicion: any;
    apply_amount: any;
    approved_total: any;
    term: any;
    estatus: any;
    sub_estatus: any;
    renovation: any;
    frequency: any;
    first_repay_date: any;
    disbursment_date: any;
    disbursment_mean: any;
    liquid_guarantee: any;
    product: any;
    created_by: any;
    status: any;
    dropout: any;
    members: any;

    constructor(obj = {} as any) {
        super({ branch: obj.branch })
        this._id = obj._id || Date.now().toString(),
            this._rev = obj._rev,
            this.couchdb_type = 'LOANAPP',
            this.apply_by = obj.apply_by,
            this.id_solicitud = obj.id_solicitud || 0,
            this.id_cliente = obj.id_cliente || 0,
            this.loan_officer = obj.loan_officer || 0,
            this.branch = obj.branch || [1, 'ORIENTE'],
            this.id_producto = obj.id_producto || 0, // Product HF, Se crea cuando pasa a estatus Por Autorizar
            this.id_disposicion = obj.id_disposicion || 0, // Se obtiene dependiendo el producto maestro
            this.apply_amount = obj.apply_amount || 0,  // En caso de grupos es la suma total de monto de lo integrantes
            this.approved_total = obj.approved_total || 0,
            this.term = obj.term || 0,
            this.estatus = obj.estatus || 'TRAMITE',
            this.sub_estatus = obj.sub_estatus || 'NUEVO TRAMITE',
            this.renovation = obj.renovation || false,
            this.frequency = obj.frequency || ['S', 'Semana(s)'],
            this.first_repay_date = obj.first_repay_date || '', // type Date
            this.disbursment_date = obj.disbursment_date || '', // type Date
            this.disbursment_mean = obj.disbursment_mean || 'ORP', // ORP/
            this.liquid_guarantee = obj.liquid_guarantee || 0, // ORP/
            this.product = obj.product || {
                external_id: 1,
                min_amount: 2000,
                max_amount: 58000,
                step_amount: 1000,
                min_term: 8,
                max_term: 24,
                product_name: "CREDITO SOLIDARIO",
                term_types: [],
                rate: "91.21",
                tax: "16",
                GL_financeable: true,
                liquid_guarantee: 10
            }, // TODO Buscar el extenal id en couch al sincronizar, Product Couch
            this.created_by = obj.created_by || 'promotor@grupoconserva.mx',
            this.status = obj.status || [1, 'Pendiente'],
            this.dropout = obj.dropout || [],
            this.members = obj.members || [{
                client_id: '', // id client couch
                id_cliente: 0, // id cliente/individual HF
                id_persona: 0,
                estatus: '', // estatus HF
                sub_estatus: '', // sub_estatus HF
                position: '', // cargo
                apply_amount: 0,
                suggested_amount: 0,
                approved_amount: 0,
                id_activity_economic: 0,
                previus_amount: 0,
                // id_solicitud_prestamo: 0,
                cicle: 0,
                id_riesgo_pld: 0,
                riesgo_pld: '',
                id_cata_medio_desembolso: 2,
                monto_garantia_financiable: 0,
                insurance: {
                    id_insurance: 0,
                    id_individual: 0,
                    id_seguro: 0,
                    id_asignacion_seguro: 0,
                    fullname: '',
                    relationship: '',
                    porcentage: 100,
                    costo_seguro: 0,
                    incluye_saldo_deudor: 1,
                    activo: 1,
                }
            }]
    }
    async getDetailLoan(idLoan:number, idOffice: number) {
        try{
            const pool = await sql.connect(sqlConfig);

            const result = await pool.request()
            .input('id_solicitud', sql.Int, idLoan)
            .input('id_oficina', sql.Int, idOffice)
            .execute('MOV_ObtenerSolicitudClienteServicioFinanciero_V2')

            return result.recordsets;
        }
        catch (error:any) {
            throw new Error(error)
        }
    }


}