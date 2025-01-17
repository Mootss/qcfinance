const express = require("express")

const router = express.Router()

router.get("/", (req, res) => {
    console.log("test")
    res.render("login")
    console.log("(GET LOGIN)")
}) 
router.post("/", (req, res) => {
    
    const crypto = require("crypto")
    const hash = crypto.createHash('sha256').update(req.body.password).digest('hex')
    
    if (hash === process.env.PASSWORD_HASH) {
        req.session.isLoggedIn = true
        res.redirect("/")
        console.log("(POST LOGIN) Success")
    } else {
        res.render('login', { incorrectPass: true })
        console.log("(POST LOGIN) Fail")
        // TODO: fix this rendering bug, maybe replace alert() with success/error modal
    }
}) 

module.exports = router