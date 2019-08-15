const express = require("express")
const router = express.Router()
const auth = require("../../middleware/auth")
const User = require("../../models/User")
const jwt = require("jsonwebtoken")
const bcrypt = require("bcryptjs")
const { check, validationResult } = require("express-validator")

// @route   GET api/auth
// @desc    Get user by token
// @access  Public
router.get("/", auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("-password")
        res.status(200).json({ user })
    } catch (err) {
        return res.status(500).send({ msg: "Server error" })
    }
})

// @route   Post api/auth
// @desc    Login user
// @access  Public
router.post(
    "/",
    [
        check("email", "Email is required").isEmail(),
        check("password", "Password is required").exists(),
    ],
    async (req, res) => {
        const errors = validationResult(req)
        if (!errors.isEmpty())
            return res.status(422).json({ errors: errors.array() })

        try {
            const { email, password } = req.body

            const user = await User.findOne({ email })

            if (!user)
                return res
                    .status(400)
                    .json({ errors: [{ msg: "Invalid credentials" }] })

            const match = await bcrypt.compare(password, user.password)

            if (!match)
                return res
                    .status(400)
                    .json({ errors: [{ msg: "Invalid credentials" }] })

            const payload = {
                user: {
                    id: user.id,
                },
            }

            jwt.sign(
                payload,
                process.env.JWT_KEY,
                { expiresIn: 3600 },
                (err, token) => {
                    if (err) throw err
                    return res.status(200).json({
                        user: {
                            name: user.name,
                            avatar: user.avatar,
                            date: user.date,
                            email,
                        },
                        token,
                    })
                }
            )
        } catch (err) {
            return res.status(500).json({ errors: [{ msg: "Server error" }] })
        }
    }
)

module.exports = router
