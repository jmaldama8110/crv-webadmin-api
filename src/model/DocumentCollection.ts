import * as Nano from 'nano';
let nano = Nano.default(`${process.env.COUCHDB_PROTOCOL}://${process.env.COUCHDB_USER}:${process.env.COUCHDB_PASS}@${process.env.COUCHDB_HOST}:${process.env.COUCHDB_PORT}`);


export class DocumentCollection {
    _id: string;
    _rev: string;
    created_at: string;
    updated_at: string;
    couchdb_type?: string;
    branch?: [number, string];

    constructor(obj = {} as any) {
        this._id = obj._id || Date.now().toString(),
        this._rev = obj._rev
        this.branch = obj.branch
        this.created_at = new Date(Date.now()).toISOString()
        this.updated_at = obj.updated_at || new Date(Date.now()).toISOString()
    }

    getDataPrivate() {
        return {...this }
    }

    getDataPublic() {
        return { ...this }
    }

    save() {
        const branchName = this.branch ? `-${this.branch[1].replace(/ /g,'').toLowerCase()}` : ""
        const db = nano.use(process.env.COUCHDB_NAME ? `${process.env.COUCHDB_NAME}${branchName}` : '');
        return new Promise(async (resolve, reject) => {
            const data = this.getDataPrivate();
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
                
                const branchName = this.branch ? `-${this.branch[1].replace(/ /g,'').toLowerCase()}` : ""
                const db = nano.use(process.env.COUCHDB_NAME ? `${process.env.COUCHDB_NAME}${branchName}` : '');
                const localDocument = await db.get(data._id);

                resolve(localDocument);
            } catch (error) {
                reject(error)
            }
        });
    }

    async find(data:any) {
            let selector = { couchdb_type: { "$eq": this.couchdb_type } };

            for (const [key, value] of Object.entries(data)) {
                selector = Object.assign(selector, { [key]: { "$eq": value } })
            };
            // console.log({selector})
            const branchName = this.branch ? `-${this.branch[1].replace(/ /g,'').toLowerCase()}` : ""
            const db = nano.use(process.env.COUCHDB_NAME ? `${process.env.COUCHDB_NAME}${branchName}` : '');
        // const codeFounds = await db.find({ selector: selector });
            const codeFounds = await db.find({ selector});
            // console.log(codeFounds.docs)

            return codeFounds.docs;

    
    }

    async delete(){
        try {
            const branchName = this.branch ? `-${this.branch[1].replace(/ /g,'').toLowerCase()}` : ""
            const db = nano.use(process.env.COUCHDB_NAME ? `${process.env.COUCHDB_NAME}${branchName}` : '');
            const result = await db.destroy(this._id, this._rev);

            return result;
        } catch (error:any) {
            throw new Error(error);
        }
    }
}
