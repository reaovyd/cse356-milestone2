const path = require("path")
const { upload } = require("./uploadUtils")
const fs = require("fs")

const uploadFile = async(req, res) => {
    if(req.file === undefined || req.file === null) {
        return {
            error : true,
            message : "no file was found to be uploaded"
        } 
    }
    return {
        mediaid : req.file.filename
    }
}

const accessMediaId = async(req, res) => {
    const fileName = path.dirname(__dirname) + `/images/${req.params.mediaid}`
    if(fs.existsSync(fileName)) {
        return res.sendFile(fileName)
    } else {
        return {
            error: true,
            message: "file does not exist"
        }
    }
}

module.exports = function(api, _, done) {
    api.get("/access/:mediaid", accessMediaId)
    api.post("/upload", {preHandler: upload.single("file")}, uploadFile)
    done()
}
