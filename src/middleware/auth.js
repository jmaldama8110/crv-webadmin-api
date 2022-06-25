const jwt = require('jsonwebtoken')
const User = require('../model/user')

const auth = async (req, res, next ) => {

    try{
        const temp = req.header('Authorization').replace('Bearer ','')
        // console.log(temp);
        
        const token = req.header('Authorization').replace('Bearer ','')
        
        const decoded = jwt.verify(token,process.env.JWT_SECRET_KEY)

        const expiresAt = new Date(decoded.expires_at);
        if( expiresAt.getTime() < new Date().getTime() ) {
            throw new Error('Token has expired');
        }

        const user = await User.findOne( { _id: decoded._id, 'tokens.token': token  } )

        if( !user  ){
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

