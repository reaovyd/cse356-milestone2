const YjsDocSingleton = require("../YjsDocSingleton")
const yds = new YjsDocSingleton()

const DatabaseIndexUpdater = require("../DatabaseIndexUpdater")
const diu = new DatabaseIndexUpdater()

const connect = async(req, res) => {
    console.log(`Client ${req.session.token} has connected to ${req.params.id}`)
    const email = req.session.token
    const id = req.params.id
    await yds.createNewYjsDocWithDBWrite(id) 
    yds.createUser(email)
    yds.addRoomToUser(email, res, id, req)
    yds.addUserToRoom(id, email, res, req)
    yds.applyUpdate(id)
    await diu.writeToDoc(id)
    const ydoc = yds.getYjsDocAsUpdate(id)
    res.sse({
        "data" : JSON.stringify({
            "data" : Array.from(ydoc)
        }),
        "event" : "sync"
    })

    yds.yjs_doc_list[id].users.forEach(elem => {
	try {
            const resWrite = elem.res
            resWrite.sse({
                "data" : JSON.stringify(yds.yjs_doc_list[id].latest_presence),
                "event" : "presence"
            })
	} catch(err) {
	    console.log("problem")
	}
    })

    req.socket.on('close', () => {
        console.log(`Client ${req.session.token} has disconnected from ${req.params.id}`)
	if(yds.yjs_doc_list[id] != undefined) {
            yds.yjs_doc_list[id].users.forEach(elem => {
		try {
                    const resWrite = elem.res
                    const toSend = {
                        session_id : email,
                        name: req.session.name,
                        cursor: {}
                    }

                    resWrite.sse({
                        "data" : JSON.stringify(toSend),
                        "event" : "presence"
                    })
		} catch(err) {
		    console.log("problem")
		}
            })
	}
        yds.deleteRoomFromUser(email, id)
        yds.deleteUserFromRoom(email, id)
    });
}

const update = async(req, res) => {
    if(yds.yjs_doc_list[req.params.id] == undefined) {
        return {
            "error" : true,
            "message" : "missing document id in db"
        }
    }
    const roomId = req.params.id 

    const data = req.body.data
    const toSend = {
        data
    }
    yds.insertUpdate(roomId, data)
    yds.yjs_doc_list[roomId].users.forEach(elem => {
	try {
            const resWrite = elem.res
            resWrite.sse({
                "data" : JSON.stringify(toSend),
                "event" : "update"
            })
	} catch(err) {
	    console.log("problem")
	}
    })
    return {}
}

const presenceUpdate = async(req, res) => {
    if(yds.yjs_doc_list[req.params.id] == undefined) {
        return {
            "error" : true,
            "message" : "missing document id in db"
        }
    }
    const index = req.body.index;
    const length = req.body.length;
    if(index == undefined || length == undefined) {
        return {
            "error" : true,
            "message" : "missing payload"
        }
    }

    const roomId = req.params.id 
    const toSend = {
        session_id : req.session.token,
        name : req.session.name,
        cursor: {index, length}
    }
    yds.yjs_doc_list[roomId].latest_presence = toSend

    yds.yjs_doc_list[roomId].users.forEach(elem => {
        const resWrite = elem.res
        resWrite.sse({
            "data" : JSON.stringify(toSend),
            "event" : "presence"
        })
    })

    return {}

}

module.exports = function(api, _, done) {
    api.get("/connect/:id", connect)
    api.post("/op/:id", update)
    api.post("/presence/:id", presenceUpdate)
    done()
}
