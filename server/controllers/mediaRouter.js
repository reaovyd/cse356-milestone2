const api = require("express").Router()
const multer = require("multer")
const path = require("path")
const fs = require("fs")

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, './images');
    },
    filename: function(req, file, cb) {
        cb(null, new Date().toISOString() + "-" + file.originalname)
    }
})

const fileFilter = (req, file, cb) => {
    if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
        cb(null, true);
    } else {
        cb(null, false);
    }
}
const upload = multer({
    storage: storage,
    fileFilter: fileFilter
})


api.post("/upload", upload.single("file"), async(req, res) => {
    if(req.file === undefined || req.file === null) {
        return res.json({
            error : true,
            message : "no file was found to be uploaded"
        })
    }
    return res.json({
        mediaid : req.file.filename
    })
})

api.get("/access/:mediaid", async(req, res) => {
    const fileName = path.dirname(__dirname) + `/images/${req.params.mediaid}`
    if(fs.existsSync(fileName)) {
        return res.sendFile(fileName)
    } else {
        return res.json({
            error: true,
            message: "file does not exist"
        })
    }
})

module.exports = api
