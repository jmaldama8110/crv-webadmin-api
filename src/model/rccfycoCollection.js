const DocumentCollection = require('./documentCollection');

class RccfycoCollection extends DocumentCollection {
    constructor(obj = {}) {
        super()
        this._id = obj._id || Date.now().toString(),
        this._rev = obj._rev,
        this._couchdb_type = 'RCCFYCO',
        this._folioConsulta = obj.folioConsulta ,
        this._folioConsultaOtorgante = obj.folioConsultaOtorgante ,
        this._claveOtorgante = obj.claveOtorgante ,
        this._client_id = obj.client_id , // CLIENTcOLLECTION
        this._persona = obj.persona ,
        this._consultas = obj.consultas ,
        this._creditos = obj.creditos ,
        this._domicilios = obj.domicilios ,
        this._empleos = obj.empleos ,
        this._scores = obj.scores ,
        this._mensajes = obj.mensajes 
    }
}

module.exports = RccfycoCollection;