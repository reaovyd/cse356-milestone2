const yjs = require("yjs")
const Document = require("./models/DocumentSchema")
const word = require("./models/wordSchema")
const axios = require("axios")
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
    }
    createNewYdoc(resRoomId) {
        this.yjs_document_dict[resRoomId] = new yjs.Doc()
        this.yjs_update_array_for_doc[resRoomId] = []
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
            await this.asyncWriteToYjsDoc(roomId, [], true, false)
        }
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
    async asyncWriteToYjsDoc(roomId, update, isUpdate, isUpdateOperation) {
        if(this.yjs_document_dict[roomId] != undefined) {
            if(isUpdate) {
                const mergedUpdate = yjs.mergeUpdates(this.yjs_update_array_for_doc[roomId])
                this.yjs_update_array_for_doc[roomId] = []
                yjs.applyUpdate(this.yjs_document_dict[roomId], mergedUpdate)
                await this.writeToDatabase(roomId)
            }
        }
    }
    writeToYjsDoc(roomId, update, isUpdate, isUpdateOperation) {
        if(this.yjs_document_dict[roomId] != undefined) {
            if(isUpdateOperation) {
                var update8bit = new Uint8Array(update) 
                this.yjs_update_array_for_doc[roomId].push(update8bit)
            }
            if(isUpdate) {
                const mergedUpdate = yjs.mergeUpdates(this.yjs_update_array_for_doc[roomId])
                this.yjs_update_array_for_doc[roomId] = []
                yjs.applyUpdate(this.yjs_document_dict[roomId], mergedUpdate)
                this.writeToDatabase(roomId)
            }
        }
    }
    async writeToDatabase(roomId) {
        const updateData = {
            data : Array.from(yjs.encodeStateAsUpdate(this.yjs_document_dict[roomId])),
            text: this.yjs_document_dict[roomId].getText("quill").toString(),
        }
        // Jason Z split the text and push into wordbank 
	try { 
        let res = await axios.post("http://localhost:9200/_analyze", {"analyzer" : "standard", "text" : this.yjs_document_dict[roomId].getText("quill").toString()})
	 let data = res.data.tokens
	        for (let i of data) {
                try{
                 let newWo = new word(i)
                 await newWo.save()
                }
                catch(e){}
        }
	}
	catch(e){console.log("analyze error")}
	/*for q (let i of data){
		await word.update({token: i.token}, {
	  setOnInsert: i
	 }, {upsert: true})
	}*/
	//wait word.insertMany(data, {ordered: false}, function(err, res) {});
	//await word.insertMany(data, {ordered: false, silent: true})
        await Document.findOneAndUpdate({_id : roomId}, updateData, {new: true})
    }
}

module.exports = ResponseDataDict
