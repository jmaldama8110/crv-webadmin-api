const mongoose = require('mongoose')
const validador = require('validator')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const axios = require('axios');
const url = require('url');
const mongoose_delete = require('mongoose-delete');
class userModel {
    constructor(name, lastname, second_lastname, email, phone, password, selfi, tokens, recoverpassword,checklist, doc_verification) {
        this.name = name,
        this.lastname = lastname,
        this.second_lastname = second_lastname,
        this.email = email,
        this.phone = phone,
        this.password = password,
        this.selfi = selfi,
        this.tokens = tokens,
        this.recoverpassword = recoverpassword,
        this.checklist = checklist,
        this.doc_verification = doc_verification

    }
}

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        uppercase: true,
        required: false
    },
    lastname: {
        type: String,
        trim: true,
        uppercase: true,
        required: false
    },
    second_lastname: {
        type: String,
        trim: true,
        uppercase: true,
        required: false
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
    phone: {
        type: String,
        required: false,
        trim: true,
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
        type: String,
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
    recoverpassword: [{
        recoverpasswordcode:{
            type: String,
            required: false
        },
        codedate:{
            type: Date,
            required: false
        }
    }],
    client_id: {type: mongoose.Schema.Types.ObjectId, ref: 'Client'},
    employee_id: {type: mongoose.Schema.Types.ObjectId, ref: 'Employee'},
    veridoc: { type: mongoose.Schema.Types.ObjectId, ref: 'Identityimg'},
    veridoc_result: {},
    checklist: [
      {
        action: { type: String, required: true },
        mobile_path: { type: String, required: true },
        priority: { type: Number, required: true, default: 1 },
        checked: { type: Boolean, required: true, default: false },
        message: { type: String, required: true },
        item_text: { type: String, required: true },
      },
    ],
    doc_verification: {}
},
{ timestamps: true } )


userSchema.methods.generateAuthToken = async function () {
    const user = this

    /// adds 24 hours of token expiration
    const expires_at = new Date();
    expires_at.setHours( expires_at.getHours() + 24);
    // expires_at.setMinutes( expires_at.getMinutes() + 1);
    ///////////
    /**
     * Token requirements when the login is requested by a Loan Office for offline App
     * 
     * 
     */
    let sync_info = {};    
    
    if( user.employee_id ){
        const sync_expiration = new Date();
        sync_expiration.setHours( sync_expiration.getHours() + user.employee_id.app_session_hours );

        sync_info = {
            local_target: "local-db",
            remote_target: user.employee_id.couchdb_name,
            sync_expiration
        }
    }
    /**
     * END
     */
    const jwt_secret_key = process.env.JWT_SECRET_KEY
    const token  = jwt.sign( {   _id : user._id.toString(), expires_at, sync_info } , jwt_secret_key)

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
    
    // delete userPublic._id;
    delete userPublic.password
    delete userPublic.tokens
    // delete userPublic.selfi
    delete userPublic.recoverpassword
    // delete userPublic.deleted
    delete userPublic.deletedAt
    delete userPublic.createdAt
    delete userPublic.updatedAt
    delete userPublic.__v

    return userPublic
}

userSchema.statics.findUserByCredentials = async ( email, password ) => {
    
    const user = await User.findOne( {email} );
    await user.populate("employee_id").execPopulate();
    // const user = await User.findOne({$and : [{email}, {"employee_id" : {$exists: true}}]}).populate('employee_id',{role: 1, branch: 1, hierarchy_id: 1 });

    if( !user ){
        throw new Error('The username does not exist in the employee collection...')
    }

    const isMatch = await bcrypt.compare( password, user.password )

    if( !isMatch ){
        throw new Error ('Verify your password...')
    }

    return user
}

userSchema.methods.resetChecklist = function(){
    const user = this;
    user.checklist = [
      { action: 'phone_validation', mobile_path: '/phonevalidation', priority: 1, checked: false, message: 'Confirma tu numero de celular', item_text: 'Verificar'  },
      { action: 'scan_identity', mobile_path: '/identity-validation', priority: 2, checked: false, message: 'Escanea tu INE, como se se indica para poder validar tu identidad', item_text: 'Iniciar Proceso' },
      { action: 'identity_checkup', mobile_path: '/identity-validation', priority: 3, checked: false, message: 'Estamos verificando tu identidad, verifica aqui.. el estato del proceso', item_text: 'Ver Estado' },
      { action: 'client_completion', mobile_path: '/iwanttobeclient', priority: 4, checked: false, message: 'Completa tu informacion como cliente. Por que nos importa mucho conocerte, por favor completa todos tus datos', item_text: 'Completar Mis Datos' },
      { action: 'new_loan_application', mobile_path: '/loans/add', priority: 5, checked: false, message: 'Solicita tu tu credito, es muy facil!', item_text: 'Registrar Solicitud' },
      { action: 'contract_signature', mobile_path: '/dashboard', priority: 6, checked: false, message: 'Tienes un credito aprobado, deber completar el proceso ingresando tu firma electronica. Es muy sencillo', item_text: 'Acepto Condiciones'},
      { action: 'guarantee_deposit', mobile_path: '/wheretopay', priority: 7, checked: false, message: 'Debes realizar el deposito de tu garantia liquida, ver la seccion aqui..', item_text: 'Medios de Pago' },
    ]
}

userSchema.methods.restartCheckList = function (action_id) {
    const user = this;
    user.checklist = user.checklist.map( (chk) =>
    chk.action === action_id
      ? {
          action: chk.action,
          mobile_path: chk.mobile_path,
          message: chk.message,
          item_text: chk.item_text,
          priority: chk.priority,
          checked: false,
        }
      : {
          action: chk.action,
          mobile_path: chk.mobile_path,
          message: chk.message,
          item_text: chk.item_text,
          priority: chk.priority,
          checked: chk.checked,
        }
    );
    
}

userSchema.methods.updateCheckList = function (action_id) {
    const user = this;
    user.checklist = user.checklist.map( (chk) =>
    chk.action === action_id
      ? {
          action: chk.action,
          mobile_path: chk.mobile_path,
          message: chk.message,
          item_text: chk.item_text,
          priority: chk.priority,
          checked: true,
        }
      : {
          action: chk.action,
          mobile_path: chk.mobile_path,
          message: chk.message,
          item_text: chk.item_text,
          priority: chk.priority,
          checked: chk.checked,
        }
    );
    
}

userSchema.plugin(mongoose_delete, { deletedAt: true, deletedBy : true, overrideMethods: 'all'});

const User = mongoose.model('User',userSchema )

module.exports = User