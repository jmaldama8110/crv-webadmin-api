const mongoose = require('mongoose')

const notificationSchema = new mongoose.Schema({
   identifier: { type: String, unique: true },
   documentData: [],
   documentVerifications: [],
   globalResult: {},
   globalResultDescription:{},
   resutlLiveness: {},
   scoreLiveness: {}
}, { timestamps: true })

const Notification = mongoose.model('Notification', notificationSchema)

module.exports = Notification