const mongoose = require('mongoose');

const pushNotificationSchema = new mongoose.Schema({
    title: {type: String, trim:true},
    notification: {type: String, trim:true},
    checked: {type: Boolean, default: false},
    user_id: {type: mongoose.Schema.Types.ObjectId, ref: 'User'}
}, { timestamps: true});

const PushNotification = mongoose.model('PushNotification', pushNotificationSchema)
module.exports  = PushNotification;