const mongoose = require('mongoose');

const constractSchema = new mongoose.Schema({
    name_client: { type: String, uppercase: true, trim: true },
    email_client: { type: String, trim: true },
    name_attorney: { type: String, uppercase: true, trim: true}, //nombre del apoderado
    email_attorney: { type: String, trim: true },
    file: { type: String, trim: true },
    docusign_link: { type: String, trim: true },
    status: { type: String, trim: true }
});

const contract = mongoose.model('contract', constractSchema);
module.exports = contract;