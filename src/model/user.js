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
        trim: true,
        validate(pass){
            if( ! (validador.isLength( pass, { min:6 } ) )  ){
                throw new Error('Longitud minimo 6 ')
            }
        }
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
            // veridoc_token: {
            //     type: String,
            //     required: true
            // }
        }],
    code:{
        type: String,
        required: false
    },
    datecode:{
        type: Date,
        required: false
    }

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
    // const api = axios.create({
    //     method: 'post',
    //     url:'/auth/token',
    //     baseURL: process.env.VERIDOC_URL,
    //     headers: { 'content-type': 'application/x-www-form-urlencoded' }
    // })
    // const params = new url.URLSearchParams({
    //     grant_type: 'client_credentials',
    //     client_id: process.env.VERIDOC_CLIENT_ID,
    //     client_secret: process.env.VERIDOC_CLIENT_SECRET,
    //     audience: 'veridocid'
    // });
    // const veridocRes = await api.post('/auth/token',params);
    // const veridoc_token = veridocRes.data.access_token;
    ////////////////////////////////////////////////////////

    user.tokens = user.tokens.concat( { token  } )

    // user.tokens = user.tokens.concat( { token, veridoc_token  } )
    await user.save()

    return token
}

userSchema.statics.passwordHashing = async (password) => {
    return bcrypt.hash(password,8)
}

userSchema.methods.toJSON = function(){
    const user = this

    const userPublic = user.toObject()
    
    delete userPublic._id;
    delete userPublic.password
    delete userPublic.tokens
    delete userPublic.selfi
    delete userPublic.code
    delete userPublic.datecode

    return userPublic

    
}

userSchema.statics.findUserByCredentials = async ( email, password ) => {
    
    const user = await User.findOne( {email} )

    if( !user ){
        throw new Error('Username does not exist...')
    }

    const isMatch = await bcrypt.compare( password, user.password )

    if( !isMatch ){
        throw new Error ('Verify your password...')
    }

    return user
}

const User = mongoose.model('User',userSchema )

module.exports = User