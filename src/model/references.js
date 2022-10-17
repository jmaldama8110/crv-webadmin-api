const mongoose = require('mongoose');

const referenceSchema = new mongoose.Schema({
    
    name: {
        type: String,
        trim: true,
        uppercase: true,
    },
    lastname: {
        type: String,
        trim: true,
        uppercase: true,
    },
    second_lastname: {
        type: String,
        trim: true,
        uppercase: true,
    },
    address: [],
    phone: { type: String, required: false },
    phone_verified: { type: Boolean, default: false },
    relationship: { type: String, required: true },
    percentage: { type: String, required: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    verifiedAt: { type: Date, required: false },
    status: []

});

const Reference = mongoose.model('Reference', referenceSchema);
module.exports = Reference;