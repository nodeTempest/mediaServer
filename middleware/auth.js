const jwt = require("jsonwebtoken")
require("dotenv/config")

const auth = (req, res, next) => {
    const token = req.header("x-auth-token")
    if (!token)
        return res.status(401).json({ msg: "No token, authorization deinied" })
    try {
        const decoded = jwt.decode(token, process.env.JWT_KEY)
        req.user = decoded.user
        next()
    } catch (err) {
        return res.status(400).json({ msg: "Token is invalid" })
    }
}

module.exports = auth
