const api = require("express").Router()
const Document = require("../models/DocumentSchema")
const ResponseDataDict= require("../responseDataDict")
const axios = require("axios")
const word = require("../models/wordSchema")
const rdd = new ResponseDataDict()

// when doing search/suggest
// we can also write to database here
let map = new Map()
api.get("/search", async(req, res)=> {
	console.log("search")
    if(req.query.q == undefined) {
        return res.json({
            error: true,
            message: "empty search argument"
        })
    }
    await rdd.writeToAllDocs() 
	try{
    await axios.post("http://localhost:9200/_refresh")
	}
	catch(e){console.log("refresh error")}
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
	console.log("empty")
        return res.json([])
    } else {
	console.log("sucess")
        const ans = results.body.hits.hits.map(elem => {
            const ret = {
                docid : elem._id,
                name : elem._source.name,
                snippet : elem.highlight.text == undefined ? elem.highlight.name[0] : elem.highlight.text[0]
            }
            return ret
        })
	console.log(ans)
        return res.json(ans)
    }
})

api.get("/suggest", async(req, res)=> {
    console.log("in Sug")
    await rdd.writeToAllDocs() 
    await axios.post("http://localhost:9200/_refresh")
    if (map.has(req.query.q)){
	res.json(map.get(req.query.q))
	}
	else{
    const results = await word.search({
        match_all: {}
      }, {
        suggest: {
          wordsuggest: {
            text: req.query.q,
            completion: {
              field: 'token'
            }
          }
        }
      })
	let output = results.body.suggest.wordsuggest[0].options.map(a=>a.text)
	map.set(req.query.q, output)
    return res.json(output)
	}
    /*  
    const data = await Document.search({}, {
        suggest : {
            "text-suggest" : {
                "prefix" : req.query.q,
                "completion" : {
                    "field" : "text_suggest"
                }
            }
        }
    })
    console.log(data)
    return res.json({})
    */
})

module.exports = api 
