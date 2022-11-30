const mongoose = require("mongoose")
const mongoosastic = require('mongoosastic')


const wordSchema = new mongoose.Schema({
    token: {
        type: String,
	unique: true,
	dropDups: true, 
        "es_indexed" : true,
        "es_type": 'completion',
       "es_analyzer": 'simple',
    }
}, {timestamps: true})

wordSchema.plugin(mongoosastic, {
    forceIndexRefresh: true
})
var word= mongoose.model("words", wordSchema)
word.createMapping()
module.exports = word
