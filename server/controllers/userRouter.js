const api = require("express").Router()
const User = require("../models/UserSchema")
const bcrypt = require("bcrypt")
const crypto = require("crypto")
 const { exec } = require("child_process")
const ResponseDataDict = require("../responseDataDict")
const rdd = new ResponseDataDict() // set so we get initial dicts and stuff


api.post("/signup", async(req, res) => {
	console.log("in")
    if(!req.body.name || !req.body.email || !req.body.password) {
        return res.json({
            "error" : true,
            "message" : "missing one or more payload elements"
        })
    }
    // TODO The /users/signup request must send an email to the user's email address which instructs the user to access a verification URL.
    const findUser = await User.findOne({"email" : req.body.email}) 
    if(findUser != null && findUser != undefined) {
        return res.json({
            "error" : true,
            "message" : "user has already signed up"
        })
    }
   console.log("sign")
    const passwordHash = await bcrypt.hash(req.body.password, 10) 
    var newUser = {
        "name" : req.body.name,
        "email" : req.body.email,
        "password" : passwordHash 
    } 
    try {
        const email = newUser.email
        const key = crypto.createHash("md5").update(newUser.email).digest("hex") 
        newUser.key = key

        const user = new User(newUser)
        await user.save()

        
        
        const url = `http://jasons.cse356.compas.cs.stonybrook.edu/users/verify?email=${encodeURIComponent(email)}&key=${key}`
        console.log(`echo \"${url}\" | mail -s \"Verify\" --encoding=quoted-printable ${email}`)
        
        exec(`echo \"${url}\" | mail -s \"Verify\" --encoding=quoted-printable ${email}`, function(err, stdout, stderr) {
                if(err) {
                        return;
                }
                console.log(stderr)
        })
	console.log("done")



        return res.json({
           // url : `http://localhost:80/users/verify?email=${email}&key=${key}`
        })

A
    } catch(e) {
	console.log(e)
        return res.json({
            "error" : true,
            "message" : e
        })
    }
})

api.get("/verify", async(req, res) => {
	console.log("verify")
    if(!req.query.email || !req.query.key) {
        return res.json({
            "error" : true,
            "message" : "missing one or more payload elements"
        })
    }

    const findUser = await User.findOne({"email" : req.query.email})
    if(findUser == undefined || findUser == null) {
        return res.json({
            "error" : true,
            "message" : "user cannot be found"
        })
    }
    if(findUser.key != req.query.key) {
        return res.json({
            "error" : true,
            "message" : "invalid key"
        })
    }

    if(findUser.activated) {
        return res.json({
            "error" : true,
            "message" : "this account has already been activated"
        })
    }

    findUser.activated = true
    await User.findByIdAndUpdate(findUser._id, findUser, {new: true})
    res.status(200).json({
        "status": "OK",
        "message" : "user has been activated"
    })
})


api.post("/login", async(req, res) => {
    if(!req.body.email || !req.body.password) {
        return res.json({
            error: true,
            "message" : "missing one or more payload elements"
        })
    }
    const findUser = await User.findOne({email : req.body.email})
    if(findUser == null || findUser == undefined) {
        return res.json({
            error: true,
            "message" : "user does not exist"
        })
    }

    const isEqualPasswords = await bcrypt.compare(req.body.password, findUser.password)

    if(!isEqualPasswords || !findUser.activated) {
        return res.json({
            error: true,
            "message" : "user has not activated or invalid pass"
        })
    }
     /*
    if(req.session.token != null || req.session.token != undefined) {
        return res.json({
            error: true,
            "message" : "user is already logged in"
        })
    }*/

    // const token = jwt.sign(findUser.email, secret)
    req.session.token = findUser.email
    req.session.name = findUser.name
    // console.log(req.session)
    return res.json({
        "name": findUser.name
    })

})

api.post("/logout", async(req, res) => {
    if(req.session.token == undefined || req.session.token == null) {
        return res.json({
            error: true,
            "message" : "user is not logged in"
        })
    }
    const email = req.session.token 
    rdd.deleteUser(email)
    req.session.destroy()
    return res.json({
    })
})





module.exports = api
