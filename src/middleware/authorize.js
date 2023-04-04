const jwt = require('jsonwebtoken')
const nano = require('../db/connCouch');

const authorize = async (req, res, next) => {
    try{
        const token = req.header('Authorization').replace('Bearer ','')    
        const decoded = jwt.verify(token,process.env.JWT_SECRET_KEY)
        const expiresAt = new Date(decoded.sync_info.sync_expiration);
        if( expiresAt.getTime() < new Date().getTime() ) {
            throw new Error('Token has expired');
        }
    
        const db = nano.use(process.env.COUCHDB_NAME);

        await db.createIndex( { index: { fields: ["couchdb_type", "token"]}});
        const tokenQuery = await db.find( { selector: { couchdb_type: "TOKEN", token: token }});
        
        if( !tokenQuery.docs.length ){
            throw new Error()
        }               
        req.currentToken = token
        req.user = decoded.user;
        next()

    }
    catch(error) {
        res.status(401).send('No authorization!' )
    }

}
module.exports = authorize