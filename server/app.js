const express = require("express")
const cors = require("cors")
const app = express()
const mongoose = require("mongoose")
const expressSession = require("express-session")
// const cookieParser = require("cookie-parser")
const indexRouter = require("./controllers/indexRouter")
const Document = require("./models/DocumentSchema")
const userRouter = require("./controllers/userRouter")
const mediaRouter = require("./controllers/mediaRouter")
const collectionRouter = require("./controllers/collectionRouter")
const MongoStore = require("connect-mongo")
const secret = "e3ca82b3a76ca310030e9e0a72d75d6929d08f09ba38700dba4c835e31243a14"
const ResponseDataDict = require("./responseDataDict")
const eventStreamRouter = require("./controllers/api")
const yjs = require("yjs")
const rdd = new ResponseDataDict() // set so we get initial dicts and stuff


mongoose.connect("mongodb://127.0.0.1:27017/cse356").then(res => {
    console.log("Successfully connected to Mongo instance")
    Document.find({}).then(data => {
        data.map(elem => {
            rdd.createNewYdoc(elem._id.toString())
            if(elem.data.length != 0)
                yjs.applyUpdate(rdd.yjs_document_dict[elem._id], new Uint8Array(elem.data))
        })
    })
}).catch(err => {
    console.error("Could not connect to Mongo instance", err.message)
})
app.use(async(req, res, next) => {
    res.setHeader("X-CSE356", "630a8972047a1139b66dbc48")
    next()
})

app.use(express.json())
app.use(cors({
    credentials: true,
    origin: true
}))
app.use(expressSession({
    secret: secret, 
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 72 },
    resave: false,
    store: MongoStore.create({ mongoUrl: 'mongodb://localhost/cse356' })
}))
app.get("/library/crdt.js", async(req, res) => {
    res.sendFile(__dirname + "/dist/crdt.js")
})

app.use("/users", userRouter)
const tokenMiddleware = async (req, res, next) => {
    if(!(req.originalUrl.startsWith("/home") || req.originalUrl.startsWith("/edit") || req.originalUrl.startsWith("/api") || req.originalUrl.startsWith("/collection") ||
    req.originalUrl.startsWith("/media") || req.originalUrl.startsWith("/index"))){
        return next()
    }
    if(req.session.token) {
        return next()
    } else {
        return res.json({
            "error" : true,
            "message": "token does not exist"  
        })
    }
}
app.use("/", tokenMiddleware, express.static("build"))
app.use("/edit", tokenMiddleware, express.static("build"))
app.use("/edit/:id", tokenMiddleware, express.static("build"))
app.use("/home", tokenMiddleware, express.static("build"))

app.use("/api", tokenMiddleware, eventStreamRouter) 
app.use("/media", tokenMiddleware, mediaRouter)
app.use("/collection", tokenMiddleware, collectionRouter)
app.use("/index", tokenMiddleware, indexRouter)

module.exports = app
