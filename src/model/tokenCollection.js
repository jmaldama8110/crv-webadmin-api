const DocumentCollection = require('./documentCollection');
const jwt = require('jsonwebtoken')

class TokenCollection extends DocumentCollection {
    constructor(obj = {}) {
        super()
        this._id = obj._id || Date.now().toString(),
        this._rev = obj._rev,
        this._couchdb_type = 'TOKEN',
        this._token = obj.token
    }

    checkExpiration(token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY)
        // console.log(decoded);
        const expiresAt = new Date(decoded.sync_info.sync_expiration);
        // console.log(expiresAt.getTime());
        console.log(new Date().getTime());

        return expiresAt.getTime() < new Date().getTime();
        // if (expiresAt.getTime() < new Date().getTime()) {
        //     console.log('Token has expired')
        //     // throw new Error('Token has expired');
        // }
    }
}

module.exports = TokenCollection;