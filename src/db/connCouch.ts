const nano = require("nano")(`${process.env.COUCHDB_PROTOCOL}://${process.env.COUCHDB_USER}:${process.env.COUCHDB_PASS}@${process.env.COUCHDB_HOST}:${process.env.COUCHDB_PORT}`);
const dbRequired = process.env.COUCHDB_NAME;

nano.db.list().then((dbs:any) => {

  if (!dbs.includes(dbRequired)) {
    nano.db.create(dbRequired)
    .then((response:any) => {console.log(`BD created ${dbRequired}`);})
    .catch((err:any) => console.log(err.message))
  }
  
  console.log('Apache couchdb connected correctly...!', dbRequired);
}).catch((e:any) => console.log(e))


module.exports = nano
