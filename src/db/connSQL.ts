import SQL from 'mssql';

const sqlConfig: SQL.config = {
    user: process.env.SQL_SERVER_USERNAME,
    password: process.env.SQL_SERVER_PASSWORD,
    database: process.env.SQL_SERVER_DATABASE,
    server: process.env.SQL_SERVER_NAME ? process.env.SQL_SERVER_NAME: '',
    port: process.env.SQL_SERVER_PORT ? parseInt(process.env.SQL_SERVER_PORT) : 0,
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000,
    },
    options: {
        encrypt: false, // for azure
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

export { sqlConfig , connectionSQL}