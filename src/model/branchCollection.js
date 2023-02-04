const DocumentCollection = require('./documentCollection');
const connCouch = require("../db/connCouch");
const sql = require("mssql");
const { sqlConfig } = require("../db/connSQL");

class BranchCollection extends DocumentCollection {
	constructor(obj = {}) {
		super()
		this._id = obj._id || Date.now().toString(),
			this._rev = obj._rev,
			this._couchdb_type = 'BRANCH',
			this.id = obj.id,
			this._nombre = obj.nombre,
			this._alias = obj.alias,
			this._colonia = obj.colonia || [],
			this._municipio = obj.municipio || [],
			this._estado = obj.estado || [],
			this._pais = obj.pais || [],
			this._direccion = obj.direccion,
			this._codigo_postal = obj.codigo_postal,
			this._enabled = obj.enabled || false
	}

	async getAllBranches(chunk) {
		try {
			const db = connCouch.use(process.env.COUCHDB_NAME);
			const docsDestroy = await db.find({ selector: { name: 'CORP_OficinasFinancieras' }, limit: 100000 });
			if (docsDestroy.docs.length > 0) {
				const docsEliminate = docsDestroy.docs.map(doc => {
					const { _id, _rev } = doc;
					return { _deleted: true, _id, _rev }
				})
				db.bulk({ docs: docsEliminate })
					.then((body) => { console.log('DELETE', 'CORP_OficinasFinancieras') })
					.catch((error) => console.log(error));
			}
			// await Branch.deleteMany({});

			sql.connect(sqlConfig, (err) => {
				const request = new sql.Request();
				request.stream = true;

				request.query(`select * from CORP_OficinasFinancieras WHERE id_tipo_oficina = 1`);

				let rowData = [];

				request.on('row', async (row) => {
					// console.log(row);
					rowData.push({
						id: row.id,
						name: 'CORP_OficinasFinancieras',
						...row,
						...this
					});
					if (rowData.length >= chunk) {
						request.pause();
						// Branch.insertMany(rowData);
						db.bulk({ docs: rowData })
							.then((body) => { })
							.catch((error) => { throw new Error(error) });

						rowData = [];
						request.resume();
					}
				})

				request.on("error", (err) => { console.log(err); });

				request.on("done", async (result) => {
					// Branch.insertMany(rowData);
					db.bulk({ docs: rowData })
						.then((body) => { })
						.catch((error) => { throw new Error(error) });
					console.log(rowData[0])

					rowData = [];
					request.resume();
					console.log('Done Branch!!', result);
				});
			});
		} catch (e) {
			return e;
		}
	}

	static async getOficialCredito(idOffice) {
		try {
			const pool = await sql.connect(sqlConfig);
			const result = await pool.request()
				.input('id_sucursal', sql.Int, idOffice)
				.input('id_zona', sql.Int, 0)
				.input('id_coordinador', sql.Int, 0)
				.input('codigo', sql.VarChar, 'PROM')
				.input('operacion', sql.VarChar, 'CLIENTE')
				.input('id_sesion', sql.Int, 1)
				.execute('COMM_ObtenerPlantillaPuesto');

			return result.recordset;
		} catch (err) {
			throw new Error(err);
		}

	}

	async getAllBranchesHF(save) {
		try {
			const request = new sql.Request();
			const db = connCouch.use(process.env.COUCHDB_NAME);

			let pool = await sql.connect(sqlConfig);
			let result = await pool
				.request()
				.execute("MOV_ObtenerOficinasFinancieras");
			if (save) {
				const docsDestroy = await db.find({ selector: { couchdb_type: this._couchdb_type }, limit: 100000 });

				if (docsDestroy.docs.length > 0) {
					const docsEliminate = docsDestroy.docs.map(doc => {
						const { _id, _rev } = doc;
						return { _deleted: true, _id, _rev }
					});

					db.bulk({ docs: docsEliminate })
						.then((body) => { console.log('DELETE', this._couchdb_type) })
						.catch((error) => console.log(error));
				}
				if (result.recordset.length == 0) throw new Error('Nada que guardar')

				const branches = result.recordset.map((branch) => {
					const { id, nombre, id_colonia, nombre_colonia, id_municipio,
						nombre_municipio, id_estado, nombre_estado, id_pais,
						nombre_pais, direccion, codigo_postal } = branch;
					return {
						couchdb_type: this._couchdb_type,
						createdAt: this._createdAt,
						updatedAt: this._updatedAt,
						id: id,
						nombre: nombre,
						colonia: [id_colonia, nombre_colonia],
						municipio: [id_municipio, nombre_municipio],
						estado: [id_estado, nombre_estado],
						pais: [id_pais, nombre_pais],
						direccion: direccion,
						codigo_postal: codigo_postal,
						enabled: this._enabled
					}
				});

				db.bulk({ docs: branches })
					.then((body) => { })
					.catch((error) => { throw new Error(error) });
			}

			return result.recordset;

		} catch (e) {
			throw new Error(e)
		}
	}
}

module.exports = BranchCollection;