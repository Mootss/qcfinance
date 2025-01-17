
function authLogin(req, res, next) { // to force the user log in
    if (req.session.isLoggedIn) {
        next()
    } else { res.redirect("/login") }
}

module.exports = { authLogin }