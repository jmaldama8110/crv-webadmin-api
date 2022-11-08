const mongoose = require("mongoose");

const socioeconomicSchema = new mongoose.Schema({

  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
  family_income: [],
  family_expense: [],
  family_goods: [],
  family_debts: [],
  
  bis_cash_flow: [],
  bis_accounts_receive:[],
  bis_goods: [],
  bis_debts: [],

  sales_daily: [],
  sales_weekly: [],
  sales_quicenal: [],
  sales_monthly: {type:String},
  seasonly:[],
  
  bis_sales: [],
  bis_sales_in_cash: { type: String },
  bis_sales_in_credit: { type: String },
  bis_sales_comment: { type: String },

  bis_purchase: [],
  mub_percentage: {type: String},
  mub_amount: { type: String},

  summary_sales_source: [],
  sales_avg: { type: String },
  sales_selected_data: {type: String},
  sales_comments: {type: String },
  
  bis_expense:[],
  bis_inventory:[],
  

}, { timestamps: true });

const Socioeconomic = mongoose.model("Socioeconomic", socioeconomicSchema);
module.exports = Socioeconomic;
