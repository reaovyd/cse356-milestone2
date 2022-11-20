const mongoose = require("mongoose")
const mongoosastic = require('mongoosastic')


const documentSchema = new mongoose.Schema({
    name : {
        type: String,
        "es_indexed" : true
    },
    data :[Number],
    text: {
        type: String, 
        "es_indexed" : true,
    },
}, {timestamps: true})

documentSchema.plugin(mongoosastic, {
    "index": "documents",
    forceIndexRefresh: true
})

var Document = mongoose.model("documents", documentSchema)

Document.createMapping({
    "settings" : {
        "analysis" : {
            "analyzer" : {
                "stemmer_stop_analyzer" : {
                    "tokenizer" : "whitespace",
                    "filter" : ["porter_stem", "stop"]
                }
            }
        }
    } 
})



module.exports = Document
