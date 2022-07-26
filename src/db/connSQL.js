const SQL = require('mssql')

const sqlConfig = {
    user: process.env.SQL_SERVER_USERNAME,
    password: process.env.SQL_SERVER_PASSWORD,
    database: process.env.SQL_SERVER_DATABASE,
    server: process.env.SQL_SERVER_NAME,
    port: parseInt(process.env.SQL_SERVER_PORT),
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000,
    },
    options: {
        encrypt: true, // for azure
        trustServerCertificate: true, // change to true for local dev / self-signed certs
    },
};

async function connectionSQL() {
    try {
        const pool = await SQL.connect(sqlConfig);
        console.log('SQL Connected correctly!...')
        return pool;
    } catch (err) {
        console.error(err);
    }
}

module.exports = { sqlConfig , connectionSQL}