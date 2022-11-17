const mongoose = require("mongoose")
// const mongoosastic = require('mongoosastic')


const documentSchema = new mongoose.Schema({
    name : {
        type: String
    },
    data :[Number],
    text: {
        type: String
    }
}, {timestamps: true})


module.exports = mongoose.model("documents", documentSchema)
