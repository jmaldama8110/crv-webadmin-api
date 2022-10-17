const mongoose = require('mongoose');

const guarantorSchema = new mongoose.Schema({
    name: { type: String, required: true},
    lastname: { type: String, required: true},
    second_lastname: { type: String, required: false},
    relationship: { type: String, required: true },
    email: { type: String, required: true},
    phone: { type: String, required: true},
    status: [],
    expiresAt: { type: Date, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    verificedAt: { type: Date, required: false },
});

const Guarantor = mongoose.model('Guarantor', guarantorSchema);
module.exports = Guarantor;