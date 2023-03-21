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

        await db.createIndex( { index: { fields: ["couchdb_type"]}});
        const tokens = await db.find( { selector: { couchdb_type: "TOKEN" }});
        
        const tokenFound = tokens.docs.find((i) => i.token === token );
        if( !tokenFound ){
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