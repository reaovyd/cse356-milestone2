const mongoose = require("mongoose")

const documentSchema = new mongoose.Schema({
    name : {
        type: String
    },
    data :[Number],
}, {timestamps: true})

module.exports = mongoose.model("documents", documentSchema)
