const api = require("express").Router()
const Document = require("../models/DocumentSchema")
const ResponseDataDict = require("../responseDataDict")
const rdd = new ResponseDataDict()

api.post("/create", async(req, res) => {
    if(req.body.name == null || req.body.name == undefined || req.body.name.length == 0) {
        return res.json({
            "error" : true,
            "message" : "missing document name"
        })
    }
    var newDoc = new Document({
        name : req.body.name
    })
    const savedDoc = await newDoc.save()
    rdd.createNewYdoc(savedDoc._id.toString())

    return res.json({
        "id": savedDoc._id.toString()
    })
})

api.post("/delete", async(req, res) => {
    if(!req.body.id) {
        return res.json({
            "error" : true,
            "message" : "missing document id"
        })
    }
    try {
        const findDoc = await Document.findByIdAndDelete(req.body.id)
        if(findDoc == null || findDoc == undefined) {
            throw new Error("missing doc")
        }
        rdd.deleteYdoc(req.body.id)
        rdd.deleteRoomIdSession(req.body.id)
        return res.json({
        })
    } catch(e) {
        return res.json({
            "error": true,
            "message" : "document id does not exist; can't delete"
        })
    }
})

api.get("/list", async(req, res) => {
    const topTen = await Document.find({}).sort({updatedAt :-1}).limit(10)
    return res.json(topTen.map(elem => {
        const newRet = {
            id: elem._id,
            name : elem.name
        }
        return newRet
    }))
})

module.exports = api 
