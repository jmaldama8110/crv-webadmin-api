import * as Nano from 'nano';
let nano = Nano.default(`${process.env.COUCHDB_PROTOCOL}://${process.env.COUCHDB_USER}:${process.env.COUCHDB_PASS}@${process.env.COUCHDB_HOST}:${process.env.COUCHDB_PORT}`);


export class DocumentCollection {
    _id: string;
    _rev: string;
    _created_at: string;
    _updated_at: string;
    _couchdb_type?: string;

    constructor(obj = {} as any) {
        this._id = obj._id || Date.now().toString(),
        this._rev = obj._rev
        // this._couchdb_type = couchdb_type,
        this._created_at = new Date(Date.now()).toISOString()
        this._updated_at = obj.updated_at || new Date(Date.now()).toISOString()
    }

    getDataPrivate() {
        const data = this;
        let obj = {};
        for (let [key, value] of Object.entries(data)) {
            if (key != '_id' && key != '_rev') key = key.replace('_', '');
            obj = Object.assign(obj, { [key]: value });
        }
        return obj;
    }

    getDataPublic() {
        const data = this;
        let obj = {};
        for (let [key, value] of Object.entries(data)) {
            if (key != '_id') key = key.replace('_', '');
            obj = Object.assign(obj, { [key]: value });
        }
        return obj;
    }

    save() {

        const db = nano.use(process.env.COUCHDB_NAME ? process.env.COUCHDB_NAME : '');
        return new Promise(async (resolve, reject) => {
            const data = this.getDataPrivate();
            // console.log('saving: ', data)

            db.insert(data)
                .then((doc:any) => {
                    this._rev = doc.rev;
                    resolve(doc)
                })
                .catch((err:any) => reject(err));
        });
    }

    async findOne(data:any) {
        return new Promise(async (resolve, reject) => {
            try {
                let selector = { couchdb_type: { "$eq": this._couchdb_type } }
                for (const [key, value] of Object.entries(data)) {
                    selector = Object.assign(selector, { [key]: { "$eq": value } })
                }
                // console.log(selector)
                const db = nano.use(process.env.COUCHDB_NAME ? process.env.COUCHDB_NAME : '');
                const codeFounds = await db.find({ selector: selector });

                resolve(codeFounds.docs[0]);
            } catch (error) {
                reject(error)
            }
        });
    }

    async find(data:any) {
            let selector = { couchdb_type: { "$eq": this._couchdb_type } };

            for (const [key, value] of Object.entries(data)) {
                selector = Object.assign(selector, { [key]: { "$eq": value } })
            };
            // console.log({selector})
            const db = nano.use(process.env.COUCHDB_NAME ? process.env.COUCHDB_NAME : '');
            // const codeFounds = await db.find({ selector: selector });
            const codeFounds = await db.find({ selector});
            // console.log(codeFounds.docs)

            return codeFounds.docs;

    
    }

    async delete(){
        try {
            const db = nano.use(process.env.COUCHDB_NAME ? process.env.COUCHDB_NAME : '');
            const result = await db.destroy(this._id, this._rev);

            return result;
        } catch (error:any) {
            throw new Error(error);
        }
    }
}
