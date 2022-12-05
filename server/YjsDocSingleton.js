const Document = require("./models/DocumentSchema")
const Y = require("yjs")
//const UPDATE_FACTOR_HP = 100

class YjsDocSingleton {
    constructor() {
        if(YjsDocSingleton._instance) {
            return YjsDocSingleton._instance
        }
        YjsDocSingleton._instance = this
        this.yjs_doc_list = {}
        this.yjs_doc_userlst = {}
        //this.response_dct_lst = {}
        // this.writeQueueDict = {}
        //this.user_response_lst = {}
        //this.yjs_document_dict = {}
        //this.presence_cursor = {}
        //this.yjs_update_array_for_doc = {}
        //this.yjs_counter = {}
        // this.yjs_last_update = {}
        // this.k = 25
    }
    createUser(email) {
        if(this.yjs_doc_userlst[email] == undefined)
            this.yjs_doc_userlst[email] = [] // store {res, resid}
    }
    addRoomToUser(email, res, id, req) {
        if(this.yjs_doc_userlst[email] != undefined)
            this.yjs_doc_userlst[email].push({res, id, req})
    }
    deleteRoomFromUser(email, id) {
        if(this.yjs_doc_userlst[email != undefined]) {
            this.yjs_doc_userlst[email].forEach(elem => {
                if(elem.id == id) {
                    elem.req.socket.end()
                }
            })
            this.yjs_doc_userlst[email] = this.yjs_doc_userlst[email].filter(elem => elem.id != elem.id)
        }
    }
    deleteUserFromRoom(email, roomId) {
        if(this.yjs_doc_list[roomId] != undefined) {
            this.yjs_doc_list[roomId].users = this.yjs_doc_list[roomId].users.filter(userEmailRes => userEmailRes.email != email)
        }
    }
    deleteUser(email) {
	if(this.yjs_doc_userlst[email] != undefined) {
	    this.yjs_doc_userlst[email].forEach(elem => {
	        this.deleteUserFromRoom(email, elem.id)
	    })
	    this.yjs_doc_userlst[email].forEach(elem => {
	        elem.req.socket.end()
	    })
	    delete this.yjs_doc_userlst[email]
	}
    }
    createNewYjsDoc(id, name) {
        this.yjs_doc_list[id] = {
            "yjs_doc" : new Y.Doc(),
            "users" : [], // {res, email}
            "latest_presence" : {},
            "update_array" : [],
            "name" : name 
        }
    }
    async createNewYjsDocWithDBWrite(id) {
        if(this.yjs_doc_list[id] == undefined) {
            const doc = await Document.findById(id)
            this.createNewYjsDoc(id, doc.name)
            if(doc.data.length != 0) { 
                this.initialApplyUpdate(doc._id.toString(), new Uint8Array(doc.data))
            }
        }
    }
    updatePresence(id, presence) {
        this.yjs_doc_list[id].latest_presence = presence
    }
    addUserToRoom(id, email, res, req) {
	if(this.yjs_doc_list[id] != undefined)
            this.yjs_doc_list[id].users.push({email, res, req})
    }

    deleteYjsDoc(id) {
        if(this.yjs_doc_list[id] != undefined) {
            const yjsDoc = this.yjs_doc_list[id]["yjs_doc"]
            this.yjs_doc_list[id]["users"].forEach(elem => {
                this.deleteUserFromRoom(elem.email, id)
                elem.req.socket.end()
            })
            yjsDoc.destroy()
            delete this.yjs_doc_list[id]
        }
    }
    async applyUpdateToAll() {
        Object.keys(this.yjs_doc_list).map(key => {
            this.applyUpdate(key)
        })
    }

    applyUpdate(id) {
	if(this.yjs_doc_list[id] != undefined) {
	    const updateArray = this.yjs_doc_list[id]["update_array"]
	    Y.applyUpdate(this.yjs_doc_list[id]["yjs_doc"], Y.mergeUpdates(updateArray))
	    this.yjs_doc_list[id]["update_array"] = []
	}
    }

    insertUpdate(id, updateData) {
	if(this.yjs_doc_list[id] != undefined) {
	    const updateConvert = new Uint8Array(updateData)
	    const updateArray = this.yjs_doc_list[id]["update_array"]
	    updateArray.push(updateConvert)
	    //if(updateArray.length >= UPDATE_FACTOR_HP) {
	    //    this.applyUpdate(id)
	    //}
	}
    }
    getYjsDocAsUpdate(id) {
	if(this.yjs_doc_list[id] != undefined)
            return Y.encodeStateAsUpdate(this.yjs_doc_list[id].yjs_doc)
    }
    initialApplyUpdate(id, initialData) {
	if(this.yjs_doc_list[id] != undefined) {
            Y.applyUpdate(this.yjs_doc_list[id].yjs_doc, initialData)
	}
    }

}
module.exports = YjsDocSingleton
