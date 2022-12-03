const YjsDocSingleton = require("./YjsDocSingleton")
const Document = require("./models/DocumentSchema")
const yds = new YjsDocSingleton()
const { client } = require("./ElasticExports")

class DatabaseIndexUpdater {
    constructor() {
        if(DatabaseIndexUpdater._instance) {
            return DatabaseIndexUpdater._instance
        }
        DatabaseIndexUpdater._instance = this
    }
    async writeToDoc(id) {
        const update = {
            "data" : Array.from(yds.getYjsDocAsUpdate(id))
        }
        return Document.findByIdAndUpdate(id, update, {new: true})
    }
    async writeToAllDocs() {
        return Promise.all(Object.keys(yds.yjs_doc_list).map(id => {
            return this.writeToDoc(id)
        }))
    }
    async writeToElastic() {
        const dataset = Object.keys(yds.yjs_doc_list).map((key) => {
            yds.applyUpdate(key)
            const text = yds.yjs_doc_list[key].yjs_doc.getText("quill").toString()
            const ret = { 
                "_id" : key,
                text,
                name : yds.yjs_doc_list[key].name
            }
            return ret
        })
        const operations = dataset.flatMap(doc => [{ index: { _index: 'documents' } }, doc])
        console.log(operations)
        return client.bulk({refresh : true, operations})
    }

}
module.exports = DatabaseIndexUpdater 