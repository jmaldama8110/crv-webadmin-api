const DocumentCollection = require('./documentCollection');
const connCouch = require("./../db/connCouch");
const validador = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const EmployeeCollection = require('./employeeCollection');

class UserCollection extends DocumentCollection {
    // constructor(name, lastname, second_lastname, email, phone, password, selfi, tokens, recoverpassword, checklist, doc_verification, client_id, employee_id,veridoc, veridoc_result, rev) {
    constructor(obj = {}) {
        super()
        this._id = obj._id || Date.now().toString(),
        this._rev = obj._rev,
        this._couchdb_type = 'USER'
        this._name = obj.name,
        this._lastname = obj.lastname,
        this._second_lastname = obj.second_lastname,
        this._email = obj.email,
        this._phone = obj.phone,
        this._password = obj.password,
        this._selfi = obj.selfi,
        this._tokens = obj.tokens || [],
        this._client_id = obj.client_id,
        this._employee_id = obj.employee_id,
        this._veridoc = obj.veridoc,
        this._recoverpassword = obj.recoverpassword,
        this._checklist = obj.checklist,
        this._veridoc_result = obj.veridoc_result,
        this._doc_verification = obj.doc_verification
    }

    // save() {
    //     const db = connCouch.use(process.env.COUCHDB_NAME);

    //     return new Promise(async (resolve, reject) => {
    //         const data = this.getDataPrivate();

    //         db.insert(data)
    //             .then((doc) => resolve(doc))
    //             .catch((err) => reject(err));
    //     });
    // }

    // static findOne(find) {
    //     return new Promise(async (resolve, reject) => {
    //         try {
    //             let selector = {couchdb_type: { "$eq": 'USERS' }}

    //             for (const [key, value] of Object.entries(find)) {
    //                 selector = Object.assign(selector, { [key]: { "$eq": value } })
    //             }

    //             const db = connCouch.use(process.env.COUCHDB_NAME);
    //             const codeFounds = await db.find({ selector: selector });

    //             if (codeFounds.docs.length == 0) throw new Error('Not found');

    //             resolve(codeFounds.docs[0]);
    //         } catch (error) {
    //             reject(error)
    //         }
    //     });
    // }

    static async passwordHashing(password) {
        return bcrypt.hash(password,8)
    }

    async generateAuthToken() {
        const user = this
        /// adds 5 hours of token expiration
        const expires_at = new Date();
        expires_at.setHours(expires_at.getHours() + 5);

        /* Token requirements when the login is requested by a Loan Office for offline App */
        let sync_info = {};
        // console.log(user)
        if (user.employee_id) {
            const sync_expiration = new Date();
            sync_expiration.setHours(sync_expiration.getHours() + user.employee_id.app_session_hours);

            sync_info = {
                local_target: "local-db",
                remote_target: user.employee_id.couchdb_name,
                sync_expiration
            }
        }
        /* END */
        // FIND_ONE FOR GET THE TOKENS

        const jwt_secret_key = process.env.JWT_SECRET_KEY
        const token = jwt.sign({ _id: user._id.toString(), expires_at, sync_info }, jwt_secret_key)
        // console.log(user);
        user._tokens = user._tokens.concat({ token })
        // console.log(user);

        // user.tokens = user.tokens.concat( { token, veridoc_token  } )
        await user.save()

        return token
    };

    async findUserByCredentials( email, password ) {
    //POOPULATE ES UN JOIN
        const employeeCollection = new EmployeeCollection();
        const user = await this.findOne( {email} );
        // console.log(user)
        const employee = await employeeCollection.findOne({_id: user.employee_id})
        // console.log(employee)
        user.employee_id = employee
        // await user.populate("employee_id").execPopulate();
    
        if( !user ){
            throw new Error('The username does not exist in the employee collection...')
        }
        // TODO FALTA ENVIAR LA CONTRASEÑA ENCRIPDATA
        const isMatch = await bcrypt.compare( password, user.password )
    
        if( !isMatch ){
            throw new Error ('Verify your password...')
        }
        return user
    }

    resetChecklist() {
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
}

module.exports = UserCollection;