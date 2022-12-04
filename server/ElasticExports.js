const { Client } = require("@elastic/elasticsearch")
const client = new Client({
	node: `http://${process.env.NODE_ENV === "prod" ? "209.151.154.134" : "127.0.0.1"}:9200`
})

module.exports = { client }
