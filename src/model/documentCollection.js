const connCouch = require("./../db/connCouch");

class DocumentCollection {
    constructor(obj = {}) {
        this._id = obj._id || Date.now().toString(),
        this._rev = obj._rev,
        // this._couchdb_type = couchdb_type,
        this._createdAt = new Date(Date.now()).toISOString()
        this._updatedAt = new Date(Date.now()).toISOString()
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
        const db = connCouch.use(process.env.COUCHDB_NAME);

        return new Promise(async (resolve, reject) => {
            const data = this.getDataPrivate();
            // console.log('saving: ', data)

            db.insert(data)
                .then((doc) => {
                    this._rev = doc.rev;
                    resolve(doc)
                })
                .catch((err) => reject(err));
        });
    }

    findOne(data) {
        return new Promise(async (resolve, reject) => {
            try {
                let selector = { couchdb_type: { "$eq": this._couchdb_type } }
                for (const [key, value] of Object.entries(data)) {
                    selector = Object.assign(selector, { [key]: { "$eq": value } })
                }
                // console.log(selector)
                const db = connCouch.use(process.env.COUCHDB_NAME);
                const codeFounds = await db.find({ selector: selector });

                resolve(codeFounds.docs[0]);
            } catch (error) {
                reject(error)
            }
        });
    }

    async find(data) {
        try {
            let selector = { couchdb_type: { "$eq": this._couchdb_type } };

            for (const [key, value] of Object.entries(data)) {
                selector = Object.assign(selector, { [key]: { "$eq": value } })
            };
            // console.log({selector})
            const db = connCouch.use(process.env.COUCHDB_NAME);
            // const codeFounds = await db.find({ selector: selector });
            const codeFounds = await db.find({ selector});
            // console.log(codeFounds.docs)

            return codeFounds.docs;

        } catch (error) {
            throw new Error(error)
        }
    }
}

module.exports = DocumentCollection;