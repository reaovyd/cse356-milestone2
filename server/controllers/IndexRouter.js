const { client } = require("../ElasticExports")
const DatabaseIndexUpdater = require("../DatabaseIndexUpdater")
const diu = new DatabaseIndexUpdater()

const search = async(req, res) => {
    if(req.query.q == undefined || req.query.q.length == 0) {
        return []
    }
    await diu.writeToElastic()
    const results = await client.search({
        index: "documents",
        query : {
            "multi_match" : {
                "query" : req.query.q,
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
    if(results.hits.hits.length == 0) {
        return []
    } else {
        const ans = results.hits.hits.map(elem => {
            const ret = {
                docid : elem._id,
                name : elem._source.name,
                snippet : elem.highlight.text == undefined ? elem.highlight.name[0] : elem.highlight.text[0]
            }
            return ret
        })
        return ans
    }
}

const suggest = async(req, res) => {
    if(req.query.q == undefined || req.query.q.length < 4) {
        return []
    }
    await diu.writeToElasticSuggest()
    const result = await client.search({
        index: "words",
        query: {
            match_phrase_prefix: {
                suggest: {
                    "query" : req.query.q
                }
            }
        },
        "sort" : {
            "_score" : "desc"
        }
    })
    const ret = result.hits.hits.filter(elem => elem._source.suggest.length >= req.query.q.length + 1).map(elem => {
        return elem._source.suggest
    })
    return [...new Set(ret)]
}

module.exports = function(api, _, done) {
    api.get("/search", search)
    api.get("/suggest", suggest)
    done()
}