const DocumentCollection = require("./documentCollection");

class SocioeconomicsCollection extends DocumentCollection {
    constructor(obj = {}) {
        super()
        this._id = obj._id || Date.now().toString(),
        this._rev = obj._rev,
        this._couchdb_type = 'SOCIOECONOMIC',
        this._created_by = obj.created_by ,
        this._family_income = obj.family_income ,
        this._family_expense = obj.family_expense ,
        this._family_goods = obj.family_goods ,
        this._family_debts = obj.family_debts ,
        this._bis_cash_flow = obj.bis_cash_flow ,
        this._bis_accounts_receive = obj.bis_accounts_receive ,
        this._bis_goods = obj.bis_goods ,
        this._bis_debts = obj.bis_debts ,
        this._sales_daily = obj.sales_daily ,
        this._sales_weekly = obj.sales_weekly ,
        this._sales_quicenal = obj.sales_quicenal ,
        this._sales_monthly = obj.sales_monthly ,
        this._seasonly = obj.seasonly ,
        this._bis_sales = obj.bis_sales ,
        this._bis_sales_in_cash = obj.bis_sales_in_cash ,
        this._bis_sales_in_credit = obj.bis_sales_in_credit ,
        this._bis_sales_comment = obj.bis_sales_comment ,
        this._bis_purchase = obj.bis_purchase ,
        this._mub_percentage = obj.mub_percentage ,
        this._mub_amount = obj.mub_amount ,
        this._summary_sales_source = obj.summary_sales_source ,
        this._sales_avg = obj.sales_avg ,
        this._sales_selected_data = obj.sales_selected_data ,
        this._sales_comments = obj.sales_comments ,
        this._bis_expense = obj.bis_expense ,
        this._bis_inventory = obj.bis_inventory
    }
}

module.exports = SocioeconomicsCollection;