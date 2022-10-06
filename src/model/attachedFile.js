const mongoose = require('mongoose');

const attachedFileSchema = new mongoose.Schema({
    file: {type: String, trim: true},
    file_name: { type: String, trim: true},
    alias: { type: String, trim: true},
    description: { type: String, trim: true},
    client_id: {type: mongoose.Schema.Types.ObjectId, ref: 'Client'},
    loan_id: {type: mongoose.Schema.Types.ObjectId, ref: 'Loanapp'}
}, { timestamps: true});

const AttachedFile = mongoose.model('AttachedFile', attachedFileSchema);
module.exports = AttachedFile;