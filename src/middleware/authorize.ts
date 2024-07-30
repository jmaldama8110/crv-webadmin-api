import jwt from 'jsonwebtoken';
import * as Nano from 'nano';

export const authorize  = async (req:any, res:any, next:any) => {
    
    let nano = Nano.default(`${process.env.COUCHDB_PROTOCOL}://${process.env.COUCHDB_USER}:${process.env.COUCHDB_PASS}@${process.env.COUCHDB_HOST}:${process.env.COUCHDB_PORT}`);

    try{

        const token = req.header('Authorization').replace('Bearer ','')    
        const decoded:any = jwt.verify(token,process.env.JWT_SECRET_KEY ? process.env.JWT_SECRET_KEY: '');
        const expiresAt = new Date(decoded.sync_info.sync_expiration);
        if( expiresAt.getTime() < new Date().getTime() ) {
            throw new Error('Token has expired');
        }
        /// uses default DB
        const db = nano.use(process.env.COUCHDB_NAME ? process.env.COUCHDB_NAME : '');
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
        console.log(error);
        res.status(401).send('No authorization!' )
    }

}
