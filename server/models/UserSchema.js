const mongoose = require("mongoose")
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    activated: {
        type: Boolean,
        default: false
   },
    key:{
        type: String
    }
})
module.exports = mongoose.model("users", userSchema)

