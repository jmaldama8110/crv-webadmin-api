const mongoose = require('mongoose');

const guarenteeSchema = new mongoose.Schema({

    guarantee_type: { type: String, required: true },

    vehicle: {
        general_data: {},
        motor_data: {},
        body_data: {},
        mechanics_data: {},
        blue_book: {type:String, required: false},
        sale_value: {type:String, required: false},
        depreciation: [],
        photos: []
    },
    property: {
        ownership_name: { type: String, required: false},
        coords: {},
        services_data: {},
        general_data: {},
        materials_data: {},
        market_value: { type: String, required: false},
        proportional_value: { type: String, required: false},
        max_loan_amount: { type: String, required: false},
        metrics_data: {},
        photos:[]
    },
    equipment: {
        description:  { type: String, required: false},
        brand: { type: String, required: false},
        item_type: { type: String, required: false},
        serie: { type: String, required: false},
        year_purchase: { type: String, required: false},
        years_remain: { type: String, required: false},
        commercial_value: { type: String, required: false},
        new_used: { type: String, required: false},
        condition: { type: String, required: false},
        less_one_year: { type: String, required: false},
        photos: []
    },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    verificedAt: { type: Date, required: false },

});

const Guarentee = mongoose.model('Guarantee', guarenteeSchema);
module.exports = Guarentee;