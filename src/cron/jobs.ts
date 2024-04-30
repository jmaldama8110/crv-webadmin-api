import cron from 'node-cron';
import * as Nano from 'nano';

let nano = Nano.default(`${process.env.COUCHDB_PROTOCOL}://${process.env.COUCHDB_USER}:${process.env.COUCHDB_PASS}@${process.env.COUCHDB_HOST}:${process.env.COUCHDB_PORT}`);

cron.schedule('* 23 * * *', async () => {
    // se ejecutara a las 23 horas de cada dia
    try{
        const db = nano.use(process.env.COUCHDB_NAME ? process.env.COUCHDB_NAME : '');
        const queryActions = await db.find({ selector: {
            couchdb_type: "LOANAPP_GROUP"
        }});

        console.log(queryActions.docs.length)
    }
    catch(e:any){
        console.log(`NODE-CRON: ${e.message}`);
    }
});