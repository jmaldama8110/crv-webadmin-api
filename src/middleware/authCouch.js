const jwt = require('jsonwebtoken')
const UserCollection = require('../model/userCollection')

const auth = async (req, res, next ) => {

    try{
        const temp = req.header('Authorization').replace('Bearer ','')
        
        const token = req.header('Authorization').replace('Bearer ','');
        // console.log(token);
        const decoded = jwt.verify(token,process.env.JWT_SECRET_KEY)
        
        const expiresAt = new Date(decoded.expires_at);
        if( expiresAt.getTime() < new Date().getTime() ) {
            console.log('Token has expired')
            throw new Error('Token has expired');
        }
        
        const userCollection = new UserCollection();
        const user = await userCollection.findOne( { _id: decoded._id} )
        // console.log(user)
        const exists = user.tokens.map((obj) => {
            return obj.token == token;
        })
        if( !exists.includes(true)  ){
            throw new Error()
        }
        req.currentToken = token
        req.user = user;
        next()

    }
    catch(error) {    
        // res.status(401).send( {error:'No authorization!'} )
        res.status(401).send('No authorization!' )
    }

}

module.exports = auth

