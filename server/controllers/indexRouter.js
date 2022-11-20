const api = require("express").Router()
const Document = require("../models/DocumentSchema")
const ResponseDataDict= require("../responseDataDict")
const axios = require("axios")
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
    await axios.post("http://localhost:9200/_refresh")
    //const data = await axios.get("http://localhost:9200/_search")
    //console.log(data.data.hits.hits)
    const results = await Document.search({
        query_string: {
            query:req.query.q,
        }
    }, {
        highlight : {
            "fields" : {
                "text" : {
                    "fragment_size" : 100
                },
                "name" : {
                    "fragment_size" : 100
                }
            },
             
        },
        sort : {
            "_score": "desc"
        },
        "size": 10,
    })
    if(results.body.hits.hits.length == 0) {
        return res.json([])
    } else {
        const ans = results.body.hits.hits.map(elem => {
            const ret = {
                docid : elem._id,
                name : elem._source.name,
                snippet : elem.highlight.text == undefined ? elem.highlight.name[0] : elem.highlight.text[0]
            }
            return ret
        })
        return res.json(ans)
    }
})

api.get("/suggest", async(req, res)=> {

    return res.json({})
})

module.exports = api 