const { client } = require("../ElasticExports")
const DatabaseIndexUpdater = require("../DatabaseIndexUpdater")
const diu = new DatabaseIndexUpdater()

const search = async(req, res) => {
    //console.log("QUERYAAAAAAAAAAAAAAAAAAA", req.query.q)
    if(req.query.q == undefined || req.query.q.length == 0) {
        return []
    }
    const cond = await diu.writeToElastic()
    if(cond == undefined)
	await client.indices.refresh({ index : "documents" })
    const results = await client.search({
        index: "documents",
        query : {
            "multi_match" : {
                "query" : req.query.q,
		"type" : "phrase",
                "fields" : ["name", "text"]
            },
        },
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
            "_score" : "desc"
        },
        size : 10
    })
    //console.log(results.hits)
    if(results.hits.hits.length == 0) {
	//console.log(req.query.q, "NOTHING")
        return []
    } else {
        const ans = results.hits.hits.map(elem => {
	    //console.log("WE IN A LOOP", req.query.q, elem.highlight.text)
            const ret = {
                docid : elem._id,
                name : elem._source.name,
                snippet : elem.highlight.text == undefined ? elem.highlight.name.join(" ") : elem.highlight.text.join(" ")
            }
            return ret
        })
	//console.log("THIS IS WHAT YOU'RE RETURNING", req.query.q, ans)
        return ans
    }
}

const suggest = async(req, res) => {
    if(req.query.q == undefined || req.query.q.length < 4) {
        return []
    }
    //console.log("STARTING A SUGGEST", req.query.q)
    const startTime = performance.now()
    await diu.writeToElasticSuggest()
   //console.log("WRITE TIME:", performance.now() - startTime)
    const results = await client.search({
        index: "words",
        suggest: {
            autocomplete: {
                prefix: req.query.q,
                completion: {
                    field: "suggest"
                }
            }
        }
    })
    if(results.suggest == undefined){
	return []
    }
    // console.log(result.suggest.autocomplete[0].options)
    const realRet = []
    results.suggest.autocomplete.forEach(elem => {
	elem.options.forEach(val => {
	    realRet.push(val.text)
	})
    })
    return realRet

    //const result = await client.search({
    //    index: "words",
    //    query: {
    //        match_phrase_prefix: {
    //            suggest: {
    //                "query" : req.query.q
    //            }
    //        }
    //    },
    //    "sort" : {
    //        "_score" : "desc"
    //    }
    //})
    // const endTime = performance.now()
    // console.log("WOW SUGGEST ENDED", req.query.q, endTime-startTime)
    // const ret = result.hits.hits.filter(elem => elem._source.suggest.length >= req.query.q.length + 1).map(elem => {
    //     return elem._source.suggest
    // })
    // return [...new Set(ret)]
}
module.exports = function(api, _, done) {
    api.get("/search", search)
    api.get("/suggest", suggest)
    done()
}
