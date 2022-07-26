const  mongoose = require("mongoose");

const identityimgSchema = new mongoose.Schema({
    
    frontImage: {
        type: String,
        required: true,
    },
    backImage: {
        type: String,
        required: true,
    },
    faceImage: {
        type: String,
        required: true,
    },
    user_id: {},
    status: []
}, { timestamps: true });

identityimgSchema.toJSON = function () {

    const identity = this;

    const identityPublic =  identity.toObject();
    delete identityPublic.createdAt;
    delete identityPublic.updatedAt;
    delete identityPublic.__v;

    return identityPublic;
}

const Identityimg = mongoose.model('Identityimg',identityimgSchema)
module.exports = Identityimg;