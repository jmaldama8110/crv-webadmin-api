const mongoose = require("mongoose");

const bankaccSchema = new mongoose.Schema({
  bank_data: [],
  account_type: [],
  account_number: { type: String, trim: true, required:true },
  isdefault: {type: Boolean, default: false, required: true},
  enabled: { type: Boolean, default: true },
});

const Bankacc = mongoose.model("Bankacc", bankaccSchema);
module.exports = Bankacc;
