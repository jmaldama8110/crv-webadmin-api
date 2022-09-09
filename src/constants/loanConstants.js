// [id, sub_estatus, status]
// [1,"Pendiente"],
// [2,"Listo para tramite", "Tramite"], 
// [3,"Por autorizar", "Tramite"],
// [4,"Autorizado", "Aceptado"]
const loanConstants = {
    "Pendiente": [1,"Pendiente"],
    "ListoPT": [2,"Listo para tramite"],
    "PorAut": [3,"Por autorizar"],
    "Autorizado": [4,"Autorizado"]
}

module.exports = loanConstants;