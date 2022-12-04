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
    	const buffer = fs.readFileSync(fileName)
	const extName = path.extname(fileName)
	const type = `image/${extName == "png" ? "png" : extName == "jpg" ? "jpeg" : "gif"}`

        return res.type(type).send(buffer)
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
