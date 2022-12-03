const mongoose = require("mongoose")

const documentSchema = new mongoose.Schema({
    name : {
        type: String,
    },
    data :[Number],
}, {timestamps: true})

var Document = mongoose.model("documents", documentSchema)

module.exports = Document
