const api = require("express").Router()
const Document = require("../models/DocumentSchema")

// when doing search/suggest
// we can also write to database here

api.get("/search", async(req, res)=> {

})

api.get("/suggest", async(req, res)=> {

})

module.exports = api 