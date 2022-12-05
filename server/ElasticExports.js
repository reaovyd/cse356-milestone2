const { Client } = require("@elastic/elasticsearch")
const client = new Client({
	node: `http://${process.env.NODE_ENV === "prod" ? "157.230.176.169" : "127.0.0.1"}:9200`
})

module.exports = { client }
