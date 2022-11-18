const mongoose = require("mongoose")
const mongoosastic = require('mongoosastic')


const documentSchema = new mongoose.Schema({
    name : {
        type: String
    },
    data :[Number],
    text: {
        type: String
    }
}, {timestamps: true})

documentSchema.plugin(mongoosastic, {
    forceIndexRefresh: true
})

var Document = mongoose.model("documents", documentSchema)

Document.createMapping({
    "settings" : {
        "analysis" : {
            "analyzer" : {
                "stemmer_stop_analyzer" : {
                    "tokenizer" : "whitespace",
                    "filter" : ["stemmer", "stop"]
                }
            }
        }
    }
})



module.exports = Document
