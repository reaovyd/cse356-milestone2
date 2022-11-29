const mongoose = require("mongoose")
const mongoosastic = require('mongoosastic')


const wordSchema = new mongoose.Schema({
    word: {
        type: String, 
        unique : true,
        "es_indexed" : true,
    },

}, {timestamps: true})

documentSchema.plugin(mongoosastic, {
    "index": "wordBank",
    forceIndexRefresh: true
})
var word= mongoose.model("wordBank", wordSchema)
word.createMapping({
    "settings" : {
        "analysis" : {
            "analyzer" : {
                "stemmer_stop_analyzer" : {
                    "tokenizer" : "standard",
                    "filter" : ["stemmer", "stop"]
                }
            }
        }
    },
    "mappings" : {
        "properties" : {
            "word" : {
                "type" : "completion",
                "analyzer" : "stemmer_stop_analyzer"
            }
        }
    } 
})

module.exports = word