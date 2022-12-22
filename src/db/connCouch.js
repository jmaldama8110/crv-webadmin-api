
const nano = require("nano")(`${process.env.COUCHDB_PROTOCOL}://${process.env.COUCHDB_USER}:${process.env.COUCHDB_PASS}@${process.env.COUCHDB_HOST}:${process.env.COUCHDB_PORT}`);

nano.db.list().then( dbs =>{
  console.log('CouchDB connected correctly...!',dbs);
}).catch(e => console.log(e))

module.exports = nano
