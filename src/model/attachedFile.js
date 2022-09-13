const mongoose = require('mongoose');


const attachedFileSchema = new mongoose.Model({
    file: {type: String, trim: true},
    name: { type: String, trim: true},
    alias: { type: String, trim: true},
    description: { type: String, trim: true},
    id_cliente: {type: mongoose.Schema.Types.ObjectId, ref: 'Client'}
}, { timestamps: true});

const attachedFile = mongoose.model('attachedFile', attachedFileSchema);
module.exports = attachedFile;