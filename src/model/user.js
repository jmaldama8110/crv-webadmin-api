const mongoose = require('mongoose')
const validador = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const axios = require('axios');
const url = require('url');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    lastname: {
        type: String,
        trim: true,
        required: true
    },
    email:{
        type: String,
        unique: true,
        required: true,
        trim: true,
        validate(value){
            if( ! (validador.isEmail(value)) ){
                throw new Error('Correo electronico no valido..')
            }   
        }
    },
    password:{
        type: String,
        trim: true
    },
    selfi:{
        type: Buffer,
        required: false
    },
    tokens: [{
            token:{
                type: String,
                required: true
            },
            veridoc_token: {
                type: String,
                required: true
            }
        }]

},
{ timestamps: true } )


userSchema.methods.generateAuthToken = async function () {
    const user = this

    /// adds 5 hours of token expiration
    const expires_at = new Date();
    expires_at.setHours( expires_at.getHours() + 5);
    ///////////

    const jwt_secret_key = process.env.JWT_SECRET_KEY
    const token  = jwt.sign(    {   _id : user._id.toString(), expires_at } , jwt_secret_key)

    /// Veridoc Access Token
    const api = axios.create({
        method: 'post',
        url:'/auth/token',
        baseURL: process.env.VERIDOC_URL,
        headers: { 'content-type': 'application/x-www-form-urlencoded' }
    })
    const params = new url.URLSearchParams({
        grant_type: 'client_credentials',
        client_id: process.env.VERIDOC_CLIENT_ID,
        client_secret: process.env.VERIDOC_CLIENT_SECRET,
        audience: 'veridocid'
    });
    const veridocRes = await api.post('/auth/token',params);
    const veridoc_token = veridocRes.data.access_token;
    ////////////////////////////////////////////////////////

    user.tokens = user.tokens.concat( { token, veridoc_token  } )
    await user.save()

    return token
}

userSchema.methods.toJSON = function(){
    const user = this

    const userPublic = user.toObject()
    
    delete userPublic._id;
    delete userPublic.password
    delete userPublic.tokens
    delete userPublic.selfi

    return userPublic

    
}

userSchema.statics.findUserByCredentials = async ( email, password ) => {
    
    const user = await User.findOne( {email} )

    if( !user ){
        throw new Error('No puede logearse...')
    }

    const isMatch = await bcrypt.compare( password, user.password )

    if( !isMatch ){
        throw new Error ('No puede logearse...')
    }

    return user
}

const User = mongoose.model('User',userSchema )

module.exports = User