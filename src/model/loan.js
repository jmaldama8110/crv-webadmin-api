const mongoose = require('mongoose')
    /// modelo para los Loans desde la BD
const loanSchema = new mongoose.Schema({
    product_id: {
        type: Object,
        required: true
    },
    loan_application_date: {
        type: Date,
        required: true
    },
    loan_application_id: {
        type: String,
        required: true
    },
    status: [

    ],
    apply_at: {
        type: Date,
        required: true
    },
    apply_by: { // quien crea la solicitud
        type: Object,
        required: true
    },
    approved_at: { //fecha de aprobacion
        type: Date,
        required: false
    },
    approved_by: { //quien aprobo la solicitud
        type: Object,
        required: false
    },
    disbursed_at: { // fecha de desembolso
        type: Date,
        required: false
    },
    apply_amount: { //importe solicitado
        type: String,
        required: false
    },
    approved_amount: { // importe aprobado
        type: String,
        required: false
    },
    term: [ // plazo
        //1er valor de plazo
        //ejemplo
        // [6, "M", "Meses"]
        //2do id del tipo de plazo
        //3er etiqueta del plazo

    ],
    frequency: [
        // [ "S", "Semana"]
    ],
    loan_schedule: [{
        number: {
            type: Number,
            required: true
        },
        amount: {
            type: String,
            required: true
        },
        principal: {
            type: String,
            required: true
        },
        interest: {
            type: String,
            required: true
        },
        tax: {
            type: String,
            required: true
        },
        insurance: {
            type: String,
            required: true
        }
    }]

}, { timestamps: true })

const Loan = mongoose.model('Loan', loanSchema)

module.exports = Loan