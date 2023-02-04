const DocumentCollection = require('./documentCollection');
const connCouch = require("./../db/connCouch");

class SignupCollection extends DocumentCollection {
    // constructor(code, email, name, lastname, second_lastname, phone, password, coordinates) {
    constructor(obj = {}) {
        super()
        this._id = obj._id || Date.now().toString(),
        this._rev = obj._rev,
        this._couchdb_type = 'SIGNUP',
        this._code = obj.code,
        this._email = obj.email,
        this._name = obj.name,
        this._lastname = obj.lastname,
        this._second_lastname = obj.second_lastname,
        this._phone = obj.phone,
        this._password = obj.password,
        this._coordinates = obj.coordinates
    }

    // getData() {
    //     const data = {
    //         _id: this._id,
    //         createdAt: this._createdAt,
    //         updatedAt: this._updatedAt,
    //         couchdb_type: this._couchdb_type,
    //         code: this._code,
    //         email: this._email,
    //         name: this._name,
    //         lastname: this._lastname,
    //         second_lastname: this._second_lastname,
    //         phone: this._phone,
    //         password: this._password,
    //         coordinates: this._coordinates
    //     }

    //     return data;
    // }
    // getDataPublic() {
    //     const data = {
    //         name: this._name,
    //         lastname: this._lastname,
    //         second_lastname: this._second_lastname,
    //         email: this._email,
    //         code: this._code
    //     }

    //     return data;
    // }

    // save() {
    //     const db = connCouch.use(process.env.COUCHDB_NAME);
    //     return new Promise(async (resolve, reject) => {
    //         try {
    //             const dataToInsert = this.getDataPrivate();
    //             // TODO: BUSCAR EN USERCOLLECTION
    //             const emailsFounds = await db.find({ selector: { email: { "$eq": dataToInsert.email }, couchdb_type: { "$eq": dataToInsert.couchdb_type } } })

    //             if (emailsFounds.docs.length > 0) throw new Error('The email is already linked to an account')

    //             db.insert(dataToInsert)
    //                 .then((doc) => {
    //                     const dataReturned = {
    //                         name: dataToInsert.name,
    //                         lastname: dataToInsert.lastname,
    //                         second_lastname: dataToInsert.second_lastname,
    //                         email: dataToInsert.email,
    //                         code: dataToInsert.code
    //                     }
    //                     resolve(dataReturned)
    //                 })
    //                 .catch((err) => { throw new Error(err) });
    //         } catch (error) {
    //             reject(error)
    //         }
    //     });
    // }

    // static findOne(find) {
    //     return new Promise(async (resolve, reject) => {
    //         try {
    //             let selector = {
    //                 couchdb_type: { "$eq": 'SIGNUPS' }
    //             }

    //             for (const [key, value] of Object.entries(find)) {
    //                 selector = Object.assign(selector, { [key]: { "$eq": value } })
    //             }

    //             const db = connCouch.use(process.env.COUCHDB_NAME);
    //             const codeFounds = await db.find({ selector: selector });

    //             if (codeFounds.docs.length == 0) throw new Error('Not able to find the confirmation code');

    //             resolve(codeFounds.docs[0]);

    //         } catch (error) {
    //             console.log(error)
    //             reject(error)
    //         }

    //     });
    // }
}

module.exports = SignupCollection;