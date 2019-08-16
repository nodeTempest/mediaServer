const express = require("express")
const router = express.Router()
const { check, validationResult } = require("express-validator")
const bcrypt = require("bcryptjs")
const User = require("../../models/User")
const jwt = require("jsonwebtoken")
require("dotenv/config")

// @route   Post api/users
// @desc    Register new user
// @access  Public
router.post(
    "/",
    [
        check("name", "Name is required")
            .not()
            .isEmpty(),
        check("email", "Please enter valid email").isEmail(),
        check(
            "password",
            "Please password with at least 6 charactrers"
        ).isLength({ min: 6 }),
    ],
    async (req, res) => {
        const errors = validationResult(req)
        if (!errors.isEmpty())
            return res.status(422).json({ errors: errors.array() })

        try {
            const { name, email, password } = req.body
            let user = await User.findOne({ email })
            if (user)
                return res
                    .status(400)
                    .json({ errors: [{ msg: "User already exists" }] })

            const avatar = null

            user = new User({ name, email, password, avatar })

            const salt = await bcrypt.genSalt(10)
            user.password = await bcrypt.hash(password, salt)
            await user.save()

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
                            name,
                            email,
                            avatar,
                            date: user.date,
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
