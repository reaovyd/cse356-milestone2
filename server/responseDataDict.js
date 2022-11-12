const yjs = require("yjs")

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
    }
    createNewYdoc(resRoomId) {
        this.yjs_document_dict[resRoomId] = new yjs.Doc()
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
}

module.exports = ResponseDataDict
