exports.config = {
    dsClientId: process.env.DOCUSIGN_INTEGRATION_KEY || "",
    dsClientSecret: process.env.DOCUSIGN_SECRET_KEY || "",
    dsAccessToken: "",
    dsAccountId: "",
    appUrl: process.env.DS_APP_URL || 'http://localhost:8090',
    production: false,
    debug: true, // Send debugging statements to console
    sessionSecret: process.env.SESSION_SECRET ||'',
    tokenSecret :  process.env.JWT_SECRET_KEY || '', 
    allowSilentAuthentication: true,

    targetAccountId: null

}

exports.config.dsOauthServer = exports.config.production ?
    'https://account.docusign.com' : 'https://account-d.docusign.com';

exports.config.refreshTokenFile =  require('path').resolve(__dirname,'./refreshTokenFile');