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
                "id" : key,
                text,
                name : yds.yjs_doc_list[key].name
            }
            return ret
        })
        const operations = dataset.flatMap(doc => [{ index: { _index: 'documents', _id : doc.id} }, doc])
        if(operations.length >= 1) {
            return client.bulk({refresh : true, operations})
        }
        return Promise.resolve(undefined)
    }
    async writeToElasticSuggest() {
        const dataset = Object.keys(yds.yjs_doc_list).map((key) => {
            yds.applyUpdate(key)
            const text = yds.yjs_doc_list[key].yjs_doc.getText("quill").toString().split(/(\s+|\r?\n)/).filter(elem => elem.match(/[A-Za-z]+/))
	    return {
                "suggest" : text 
            }
        })
        // const operations = []
        // for(let data of dataset) {
        //     for(let suggest of data) {
        //         operations.push({index : {_index : "words"}})
        //         operations.push(suggest)
        //     }
        // }
        const operations = dataset.flatMap(doc => [{ index: { _index: 'words'} }, doc])
             
        if(operations.length >= 1) {
            return client.bulk({refresh : true, operations})
        }
        return Promise.resolve(undefined)
    }

}
module.exports = DatabaseIndexUpdater 
