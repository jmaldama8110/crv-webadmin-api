const axios = require('axios');

export default axios.create({
    baseURL: process.env.PAYPAL_SANDBOX_URL
    
});