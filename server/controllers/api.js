const api = require("express").Router()
const ResponseDataDict = require("../responseDataDict")
const yjs = require("yjs")
const rdd = new ResponseDataDict()
const k = 250

api.get("/connect/:id", async (req, res) => {
    if(rdd.yjs_document_dict[req.params.id] == undefined) {
        return res.json({
            "error" : true,
            "message" : "missing document id in db"
        })
    }
    const email = req.session.token
    const roomId = req.params.id
    rdd.writeToYjsDoc(roomId, [], true, false)  
    const ydoc = rdd.yjs_document_dict[roomId]
    console.log(`Client ${email} connected to ${roomId}`)
    rdd.createNewRoom(roomId, email, res)

    res.writeHead(200, {
        'Connection': 'keep-alive',
        'Content-Type': 'text/event-stream',
        'Cache-Control' : 'no-cache'
    });
    res.flushHeaders()
    // TODO when sync here
    // send ydoc of course
    // but we can update to database here
    // 
    const syncData = {
        data : Array.from(yjs.encodeStateAsUpdate(ydoc))
    }
    res.write(`data:${JSON.stringify(syncData)}\nevent:sync`)
    res.write("\n\n")

    rdd.response_dct_lst[roomId].forEach(elem => {
        const resWrite = elem.response
        resWrite.write(`data:${JSON.stringify(rdd.presence_cursor[roomId])}\nevent:presence`)
        resWrite.write("\n\n")
    })
    res.on("close", () => {
        console.log(`Client ${email} disconnected from`, roomId)


        rdd.response_dct_lst[roomId].forEach((elem) => {
            const resWrite = elem.response
            const toSend = {
                session_id : req.session.token,
                name: req.session.name,
                cursor: {}
            }
            resWrite.write(`data:${JSON.stringify(toSend)}\nevent:presence`)
            resWrite.write("\n\n")
        })
        rdd.user_response_lst[email] = rdd.user_response_lst[email].filter(elem => elem.response !== res) 
        rdd.response_dct_lst[roomId] = rdd.response_dct_lst[roomId].filter(elem => elem.email != email && elem.response !== res) 
        if(rdd.response_dct_lst[roomId].length == 0) {
            rdd.writeToYjsDoc(roomId, [], true, false)
        }
        res.end()
    })
})


api.post("/op/:id", async(req, res) => {
    if(rdd.yjs_document_dict[req.params.id] == undefined) {
        return res.json({
            "error" : true,
            "message" : "missing document id in db"
        })
    }
    // TODO when hit 'k' writes for that particular ydoc
    // update the ydoc
    const roomId = req.params.id 
    const ydoc = rdd.yjs_document_dict[roomId]
    const updateCount = rdd.yjs_update_array_for_doc[roomId].length

    const data = req.body.data
    const toSend = {
        data
    }
    await rdd.writeToYjsDoc(roomId, data, updateCount >= k, true)
    //const data8bit = new Uint8Array(data) 
    //yjs.applyUpdate(ydoc, data8bit)
    //console.log(data8bit)
    rdd.response_dct_lst[roomId].forEach(elem => {
        const resWrite = elem.response
        resWrite.write(`data:${JSON.stringify(toSend)}\nevent:update`)
        resWrite.write("\n\n")
    })

    return res.json({})
})

api.post("/presence/:id", async(req, res) => {
    if(rdd.yjs_document_dict[req.params.id] == undefined) {
        return res.json({
            "error" : true,
            "message" : "missing document id in db"
        })
    }
    const index = req.body.index;
    const length = req.body.length;
    if(index == undefined || length == undefined) {
        return res.json({
            "error" : true,
            "message" : "missing payload"
        })
    }

    const roomId = req.params.id

    const toSend = {
        session_id : req.session.token,
        name : req.session.name,
        cursor: {index, length}
    }
    rdd.presence_cursor[roomId] = toSend

    rdd.response_dct_lst[roomId].forEach(elem => {
        const resWrite = elem.response
        resWrite.write(`data:${JSON.stringify(toSend)}\nevent:presence`)
        resWrite.write("\n\n")
    })

    return res.json({})
})


//const getText = ydoc.getText("text")
//getText.insert(0, "aaaa")
//getText.insert(0, "bbbb")
//getText.insert(0, "cccc")

////res.writeHead(200, {
////    'Connection': 'keep-alive',
////    'Content-Type': 'text/event-stream',
////    'Cache-Control': 'no-cache'
////});
//const testDoc = new yjs.Doc()
//const getTextDoc = testDoc.getText("text")
//var update = yjs.encodeStateAsUpdate(ydoc)

//yjs.applyUpdate(testDoc, update)
//console.log(getTextDoc.toDelta())
//console.log(update)

//getText.insert(0, "aaaa")
//getText.insert(0, "bbbb")
//getText.insert(0, "cccc")

//var update = yjs.encodeStateAsUpdate(ydoc)

//yjs.applyUpdate(testDoc, update)
//console.log(getTextDoc.toDelta())
//console.log(update)
//console.log(rdd.yjs_document_dict)
//return res.json(rdd.yjs_document_dict)


module.exports = api
