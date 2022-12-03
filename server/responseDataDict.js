const yjs = require("yjs")
const Word = require("./models/WordSchema")
const Document = require("./models/DocumentSchema")

const segmenterEn = new Intl.Segmenter('en', { granularity: 'word' });

class ResponseDataDict {
    constructor() {
        if(ResponseDataDict._instance) {
            return ResponseDataDict._instance
        }
        ResponseDataDict._instance = this
        this.response_dct_lst = {}
        // this.writeQueueDict = {}
        this.user_response_lst = {}
        this.yjs_document_dict = {}
        this.presence_cursor = {}
        this.yjs_update_array_for_doc = {}
        this.yjs_counter = {}
        // this.yjs_last_update = {}
        this.k = 25
    }
    createNewYdoc(resRoomId) {
        this.yjs_document_dict[resRoomId] = new yjs.Doc()
        this.yjs_update_array_for_doc[resRoomId] = []
        this.yjs_counter[resRoomId] = 0
        // this.yjs_last_update[resRoomId] = undefined
    }
    createNewRoom(resRoomId, email, response) {
        if(this.response_dct_lst[resRoomId] == undefined) {
            // this.writeQueueDict[resRoomId] = [] 
            this.response_dct_lst[resRoomId] = []
            this.presence_cursor[resRoomId] = {}
        }
        if(this.user_response_lst[email] == undefined) {
            this.user_response_lst[email] = []
        }

        this.response_dct_lst[resRoomId].push({email, response})
        this.user_response_lst[email].push({resRoomId, response})
    }
    deleteYdoc(resRoomId) {
        if(this.yjs_document_dict[resRoomId] != undefined) {
            this.yjs_document_dict[resRoomId].destroy()
            delete this.yjs_document_dict[resRoomId] 
            delete this.yjs_update_array_for_doc[resRoomId]
            delete this.yjs_counter[resRoomId]
            // delete this.yjs_last_update[resRoomId]
        }
    }
    deleteRoomIdSession(resRoomId) {
        const responseMap = []
        for(let value of Object.values(this.user_response_lst)) {
            for(let dictUser of value) {
                if(dictUser.resRoomId == resRoomId) {
                    responseMap.push(dictUser.response)
                }
            }
        }
        responseMap.forEach(res => {
            res.emit("close")
        })
        // console.log(this.response_dct_lst)
    }
    deleteUser(email) {
        if(this.user_response_lst[email] != undefined) {
            const responseMap = this.user_response_lst[email].map(elem => elem.response)
            responseMap.forEach(res => {
                res.emit("close")
            })
        }
        // console.log(this.user_response_lst[email])
    }
    async writeToAllDocs() {
        // can do a Promise.all() here
        for(let roomId of Object.keys(this.yjs_document_dict)) {
            // await this.asyncWriteToYjsDoc(roomId, [], true, false)
            this.updateYjsDocMemory(roomId)
        }
        return Promise.all(Object.keys(this.yjs_document_dict).map(async(roomId) => {
            return this.writeToDatabase(roomId)
        }))
        // await Promise.all(Object.keys(this.yjs_document_dict).map((roomId) => {
        //     return this.asyncWriteToYjsDoc(roomId, [], true, false)
        // }))
        // await Document.bulkWrite(Object.keys(this.yjs_document_dict).map(docId => ({
        //     updateOne : {
        //         filter : {id : docId},
        //         update : {}
        //     }
        // })))
    }
    // async asyncWriteToYjsDoc(roomId, update, isUpdate, isUpdateOperation) {
    //     if(this.yjs_document_dict[roomId] != undefined) {
    //         if(isUpdate) {
    //             const mergedUpdate = yjs.mergeUpdates(this.yjs_update_array_for_doc[roomId])
    //             this.yjs_update_array_for_doc[roomId] = []
    //             yjs.applyUpdate(this.yjs_document_dict[roomId], mergedUpdate)
    //             await this.writeToDatabase(roomId)
    //         }
    //     }
    // }
    updateYjsDocMemory(roomId) {
        if(this.yjs_document_dict[roomId] != undefined) {
            const mergedUpdate = yjs.mergeUpdates(this.yjs_update_array_for_doc[roomId])
            // this.yjs_last_update[roomId] = this.yjs_document_dict[roomId]
            this.yjs_update_array_for_doc[roomId] = []
            yjs.applyUpdate(this.yjs_document_dict[roomId], mergedUpdate)
            // console.log("updateYjsDocMemory", this.yjs_document_dict[roomId].getText("quill").toString())
        }
    }
    writeToYjsDocMemory(roomId, update) {
        if(this.yjs_document_dict[roomId] != undefined) {
            var update8bit = new Uint8Array(update) 
            this.yjs_update_array_for_doc[roomId].push(update8bit)
            this.yjs_counter[roomId] += 1
            if(this.yjs_update_array_for_doc[roomId].length >= this.k) {
                this.updateYjsDocMemory(roomId)
            }
        }
    }
    async writeForSearch(roomId) {
        if(this.yjs_document_dict[roomId] != undefined) {
            // const tempYjsDoc = new yjs.Doc()
            // yjs.applyUpdate(tempYjsDoc, this.yjs_last_update[roomId]) 
            const iterator = segmenterEn.segment(this.yjs_document_dict[roomId].getText("quill").toString())[Symbol.iterator]()
            let obj = iterator.next()
            const promiseArray = []
            while(!obj.done) {
                if(obj.value.isWordLike) {
                    //const newWordSave = new Word({
                    //    word: obj.value.segment
                    //})
                    promiseArray.push(Word.findOneAndUpdate({word : obj.value.segment}, {$setOnInsert : {word : obj.value.segment}}, {upsert: true}))
                }
                obj = iterator.next()
            }
            // tempYjsDoc.destroy()
            // this.yjs_last_update[roomId] = undefined
            return Promise.all(promiseArray)
        }
        return Promise.resolve("No update exists")
    }
    async writeToDatabase(roomId) {
        if(this.yjs_document_dict[roomId] != undefined) {
            const updateData = {
                data : Array.from(yjs.encodeStateAsUpdate(this.yjs_document_dict[roomId])),
                text: this.yjs_document_dict[roomId].getText("quill").toString(),
            }

            return Promise.all([Document.findOneAndUpdate({_id : roomId}, updateData, {new: true}), this.writeForSearch(roomId)])
        }
    }
    // writeToYjsDoc(roomId, update, isUpdate, isUpdateOperation) {
    //     if(this.yjs_document_dict[roomId] != undefined) {
    //         if(isUpdateOperation) {
    //             var update8bit = new Uint8Array(update) 
    //             this.yjs_update_array_for_doc[roomId].push(update8bit)
    //         }
    //         if(isUpdate) {
    //             const mergedUpdate = yjs.mergeUpdates(this.yjs_update_array_for_doc[roomId])
    //             this.yjs_update_array_for_doc[roomId] = []
    //             yjs.applyUpdate(this.yjs_document_dict[roomId], mergedUpdate)
    //             this.writeToDatabase(roomId)
    //         }
    //     }
    // }
}

module.exports = ResponseDataDict
