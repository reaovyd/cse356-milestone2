const User = require("../models/UserSchema")
const bcrypt = require("bcrypt")
const crypto = require("crypto")
const YjsDocSingleton = require("../YjsDocSingleton")
const yds = new YjsDocSingleton()
const { exec } = require("child_process")
const signup = async(req, res) => {
    if(!req.body.name || !req.body.email || !req.body.password) {
        return {
            "error" : true,
            "message" : "missing one or more payload elements"
        }
    }
    const findUser = await User.findOne({"email" : req.body.email}) 
    if(findUser != null && findUser != undefined) {
        return {
            "error" : true,
            "message" : "user has already signed up"
        }
    }
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

        
        const url = `http://209.94.58.45/users/verify?email=${encodeURIComponent(email)}&key=${key}`
        console.log(`echo \"${url}\" | mail -s \"Verify\" --encoding=quoted-printable ${email}`)
        
        exec(`echo \"${url}\" | mail -s \"Verify\" --encoding=quoted-printable ${email}`, function(err, stdout, stderr) {
                if(err) {
                        return;
                }
                console.log(stderr)
        })
      

        return {
            url : `http://localhost:8080/users/verify?email=${email}&key=${key}`
        }


    } catch(e) {
        return {
            "error" : true,
            "message" : e
        }
    }
}

const verify = async(req, res) => {
    if(!req.query.email || !req.query.key) {
        return {
            "error" : true,
            "message" : "missing one or more payload elements"
        }
    }

    const findUser = await User.findOne({"email" : req.query.email})
    if(findUser == undefined || findUser == null) {
        return {
            "error" : true,
            "message" : "user cannot be found"
        }
    }
    if(findUser.key != req.query.key) {
        return {
            "error" : true,
            "message" : "invalid key"
        } 
    }

    if(findUser.activated) {
        return {
            "error" : true,
            "message" : "this account has already been activated"
        }
    }

    findUser.activated = true
    await User.findByIdAndUpdate(findUser._id, findUser, {new: true})
    return {
        "status": "OK",
        "message" : "user has been activated"
    }
}

const login = async(req, res) => {
    if(!req.body.email || !req.body.password) {
        return {
            error: true,
            "message" : "missing one or more payload elements"
        }
    }
    const findUser = await User.findOne({email : req.body.email})
    if(findUser == null || findUser == undefined) {
        return {
            error: true,
            "message" : "user does not exist"
        }
    }
    const isEqualPasswords = await bcrypt.compare(req.body.password, findUser.password)

    if(!isEqualPasswords || !findUser.activated) {
        return {
            error: true,
            "message" : "user has not activated or invalid pass"
        }
    }
    req.session.token = findUser.email
    req.session.name = findUser.name
    return {
        "name": findUser.name
    }
}

const logout = async(req, res) => {
    if(req.session.token == undefined || req.session.token == null) {
        return {
            error: true,
            "message" : "user is not logged in"
        }
    }
    const email = req.session.token 
    yds.deleteUser(email)
    //rdd.deleteUser(email)
    await req.session.destroy()
    return {}
}

module.exports = function(api, _, done) {
    api.post("/signup", signup)
    api.get("/verify", verify)
    api.post("/login", login) 
    api.post("/logout", logout)
    done()
}
