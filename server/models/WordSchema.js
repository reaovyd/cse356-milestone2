const mongoose = require("mongoose")
const mongoosastic = require("mongoosastic")

const wordSchema = new mongoose.Schema({
    word : {
        type : String,
        "es_indexed": true,
        "es_type" : "completion",
        "es_analyzer" : "simple",
        "unique" : true
    } 
})

wordSchema.plugin(mongoosastic, {
    "index" : "words",
    "forceIndexRefresh" : true
})

var Words = mongoose.model("words", wordSchema)


module.exports = Words 