const mongoose =  require('mongoose');

const criminalRecordSchema = new mongoose.Schema({

});

const criminalRecord = mongoose.model('criminalRecord', criminalRecordSchema);
module.exports = criminalRecord;