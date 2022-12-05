const Document = require("../models/DocumentSchema")
const YjsDocSingleton = require("../YjsDocSingleton")
const { client } = require("../ElasticExports")
const yds = new YjsDocSingleton()

const create = async(req, res) => {
    if(req.body.name == null || req.body.name == undefined || req.body.name.length == 0) {
        return {
            "error" : true,
            "message" : "missing document name"
        }
    }
    var newDoc = new Document({
        name : req.body.name
    })
    const savedDoc = await newDoc.save()
    // await client.indices.refresh({ index: 'documents' })

    res.send({
        "id": savedDoc._id.toString() 
    })
    await client.index({
        "index" : "documents",
        "id" : savedDoc._id.toString(),
        "document" : {
            "id" : savedDoc._id.toString(),
            text : "",
            name : savedDoc.name 
        }

    })
}
const deleteFunc = async(req, res) => {
    if(!req.body.id) {
        return {
            "error" : true,
            "message" : "missing document id"
        } 
    }
    try {
        const findDoc = await Document.findByIdAndDelete(req.body.id)
        if(findDoc == null || findDoc == undefined) {
            throw new Error("missing doc")
        }
        await client.delete({
            index: "documents",
            id : req.body.id
        })
        // await client.indices.refresh({ index: 'documents' })
        yds.deleteYjsDoc(req.body.id)
        // rdd.deleteYdoc(req.body.id)
        // rdd.deleteRoomIdSession(req.body.id)
        return {
        } 
    } catch(e) {
        return {
            "error": true,
            "message" : "document id does not exist; can't delete"
        }
    }
}

const list = async(req, res) => {
    const topTen = await Document.find({}).sort({updatedAt :-1}).limit(10)
    return topTen.map(elem => {
        const newRet = {
            id: elem._id,
            name : elem.name
        }
        return newRet
    })
}



module.exports = function(api, _, done) {
    api.post("/create", create)
    api.post("/delete", deleteFunc)
    api.get("/list", list)
    done()
}
