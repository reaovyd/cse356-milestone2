const { client } = require("../ElasticExports")
const DatabaseIndexUpdater = require("../DatabaseIndexUpdater")
const diu = new DatabaseIndexUpdater()

const search = async(req, res) => {
    console.log(await diu.writeToElastic())
    return {}
}

const suggest = async(req, res) => {
    return {}
}

module.exports = function(api, _, done) {
    api.get("/search", search)
    api.get("/suggest", suggest)
    done()
}