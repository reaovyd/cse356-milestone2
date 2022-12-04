const fastify = require("fastify")
const process = require("process")
const fs = require("fs")
const mongoose = require("mongoose")
const cors = require("@fastify/cors")
const {FastifySSEPlugin} = require("fastify-sse-v2");
const MongoStore = require("connect-mongo")
const userRoute = require("./controllers/UserRoute.js")
const mediaRoute = require("./controllers/MediaRoute.js")
const collectionRoute = require("./controllers/CollectionRoute.js")
const eventRoute = require("./controllers/EventRouter.js")
const indexRoute = require("./controllers/IndexRouter.js")
const { multer } = require("./controllers/uploadUtils")
const path = require('path')
const fastifySession = require('@fastify/session');
const fastifyCookie = require('@fastify/cookie');
const fastifyStatic = require('@fastify/static')
const Document = require("./models/DocumentSchema")
const YjsDocSingleton = require("./YjsDocSingleton")
const DatabaseIndexUpdater = require("./DatabaseIndexUpdater")
const yds = new YjsDocSingleton()
const diu = new DatabaseIndexUpdater()
//const { Client } = require("@elastic/elasticsearch")
const { client } = require("./ElasticExports")

const secret = "e3ca82b3a76ca310030e9e0a72d75d6929d08f09ba38700dba4c835e31243a14"
require("dotenv").config()
const PORT = process.env.NODE_ENV == "dev" ? process.env.DEV : process.env.PROD 

async function build() {
    const app = fastify()
    const existsDocuments = await client.indices.exists({index : "documents"});
    const existsWords = await client.indices.exists({index : "words"})
    if(!existsDocuments) {  
        await client.indices.create({
            index : "documents",
            settings : {
                "analysis" : {
                    "analyzer" : {
                        "stemmer_stop_analyzer" : {
                            "tokenizer" : "standard",
                            "filter" : ["stemmer", "stop"]
                        }
                    }
                }
            },
            body : {
                "mappings" : {
                    "properties" : {
                        "name" : {
                            "type" : "text",
                            "analyzer" : "stemmer_stop_analyzer"
                        },
                        "text" : {
                            "type" : "text",
                            "analyzer" : "stemmer_stop_analyzer"
                        }
                    }
                }
            }
        })
    }
    if(!existsWords) {
        await client.indices.create({
            index: "words",
            body : {
                "mappings" : {
                    "properties" : {
                        "suggest" : {
                            "type" : "completion",
                        },
                    }
                }
            }
        })
    }
    // TODO experimental
    // setInterval(async() => {
    //     await diu.writeToAllDocs()
    // }, 3000)
    await app.register(fastifyCookie);
    await app.register(require('@fastify/express'));
    app.register(cors, {
        credentials: true,
        origin: true
    })
    app.use(async(req, res, next) => {
        res.setHeader("X-CSE356", "630a8972047a1139b66dbc48")
        next()
    })

    await app.register(require("@fastify/formbody"))
    await app.register(fastifySession, {
        secret: secret, 
        saveUninitialized: false,
        cookie: { secure: false , maxAge:1000 * 60 * 60 * 72, httpOnly: false},
        resave: false,
        store: MongoStore.create({ mongoUrl: 'mongodb://127.0.0.1:27017/cse356' }),
        expires : 1000 * 60 * 60 * 72
    });
    await app.register(FastifySSEPlugin);
    await app.register(multer.contentParser)
    await app.register(userRoute, { prefix: "users"})

    app.addHook('preHandler', (req, res, next) => {
        if(!(req.url.startsWith("/home") || req.url.startsWith("/edit") || req.url.startsWith("/api") || req.url.startsWith("/collection") ||
        req.url.startsWith("/media") || req.url.startsWith("/index"))){
            return next()
        }
        if(req.session.token) {
            return next()
        } else {
            return res.send({
                "error" : true,
                "message": "token does not exist"  
            })
        }
    })
    async function crdtLocation(req, res) {
    	const buffer = fs.readFileSync(__dirname + "/dist/crdt.js")
	res.type("text/javascript").send(buffer)
    }
    
    function libRoute(api, _, done) {
	api.get("/crdt.js", crdtLocation)
	done()
    }
    app.register(libRoute, {prefix: "library"}) 
    await app.register(fastifyStatic, {
        root: path.join(__dirname, 'build'),
        prefix: '/' // optional: default '/'
    })
    app.get('/', function (req, reply) {
        reply.sendFile('index.html') 
    })
    app.get('/home', function (req, reply) {
        reply.sendFile('index.html')
    })
    app.get('/edit/:id', function (req, reply) {
        reply.sendFile('index.html')
    })
    await app.register(mediaRoute, { prefix: "media"})
    await app.register(collectionRoute, { prefix: "collection"})
    await app.register(eventRoute, { prefix: "api"})
    await app.register(indexRoute, { prefix: "index"})

    await mongoose.connect("mongodb://127.0.0.1:27017/cse356")
    console.log("Connected to MongoDB")
    return app
}
build()
  .then(fastify => {
        console.log(`Server started on port ${PORT}`)
        process.on(process.env.NODE_ENV=="dev" ? "SIGUSR2" : "SIGINT", (code) => {
            console.log("UPDATING ALL YJS DOCS TO DATABASES")
            yds.applyUpdateToAll().then(res => {
                diu.writeToAllDocs().then(res => {
                    diu.writeToElastic().then(res => {
                        diu.writeToElasticSuggest().then(res => {
                            fastify.close()
                            process.exit(0)
                        })
                    })
                })      
            })
        })
        return fastify.listen({ host : process.env.NODE_ENV == "dev" ? "127.0.0.1" : "209.94.58.45", port: PORT})
    })
  .catch(console.log)
