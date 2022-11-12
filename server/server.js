const app = require("./app")
const http = require("http")
server = http.createServer(app)
require("dotenv").config()

const PORT = process.env.NODE_ENV === "prod" ? process.env.PROD_PORT : process.env.DEV_PORT

server.listen(PORT, () => {
    console.log(`Started server on ${PORT}`)
})
