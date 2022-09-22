const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN

const client  = require('twilio')(accountSid , authToken )

const sendSMS = ( to, body )=> {

    const from = process.env.TWILIO_PHONE_NUMBER_FROM
    
    client.messages.create({
        to,
        from,
        body
    });
}

module.exports = sendSMS