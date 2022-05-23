const mongoose = require("mongoose")


const productSchema = new mongoose.Schema({
    product_name: {
        type: Stryng,
        required: true,
        trim:true
    }
})