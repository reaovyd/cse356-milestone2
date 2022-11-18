const api = require("express").Router()
const Document = require("../models/DocumentSchema")
const ResponseDataDict= require("../responseDataDict")
const rdd = new ResponseDataDict()

// when doing search/suggest
// we can also write to database here

api.get("/search", async(req, res)=> {
    if(req.query.q == undefined) {
        return res.json({
            error: true,
            message: "empty search argument"
        })
    }
    await rdd.writeToAllDocs() 
    await Document.refresh()
    const results = await Document.search({
        query_string: {
            query:req.query.q,
        }
    }, {
        highlight : {
            "fields" : {
                "text" : {},
                "name" : {}
            },
            "fragment_size" : 10
        },
        sort : {
            "_score": "desc"
        },
        "size": 10,
    })
    if(results.body.hits.hits.length == 0) {
        return res.json([])
    } else {
        return res.json(results.body.hits.hits)
    }
    return res.json({})
})

api.get("/suggest", async(req, res)=> {

})

module.exports = api 