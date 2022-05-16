const mongoose = require('mongoose')
const validador = require('validator')
const bcrypt = require('bcryptjs')

const signupSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        unique: true,
        required: true,
        validate(value) {
            if (!(validador.isEmail(value))) {
                throw new Error('Correo electronico no valido..')
            }
        }

    },
    name: {
        type: String,
        required: true
    },
    lastname: {
        type: String,
        required: true
    },
    password:{
        type: String,
        trim: true,
        validate(pass){
            if( ! (validador.isLength( pass, { min:6 } ) )  ){
                throw new Error('Longitud minimo 6 ')
            }

        }
    }


}, { timestamps: true })


signupSchema.pre('save', async function (next) {
    const signup = this

    if ( signup.isModified('password') ){
        signup.password = await bcrypt.hash(signup.password,8)
    }
    
    next();
})

const Signup = mongoose.model('Signup', signupSchema)

module.exports = Signup