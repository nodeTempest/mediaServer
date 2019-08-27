const express = require("express")
const router = express.Router()
const { check, validationResult } = require("express-validator")
const bcrypt = require("bcryptjs")
const User = require("../../models/User")
const jwt = require("jsonwebtoken")
const auth = require("../../middleware/auth")
require("dotenv/config")

// @route   POST api/users
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
            "Please password with at least 6 charactrers",
        ).isLength({ min: 6 }),
    ],
    async (req, res) => {
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() })
        }
        try {
            const { name, email, password } = req.body

            let user = await User.findOne({ email })
            if (user) {
                return res
                    .status(400)
                    .json({ errors: [{ msg: "User already exists" }] })
            }

            const avatar = null

            user = new User({ name, email, password, avatar })

            const salt = await bcrypt.genSalt(10)
            user.password = await bcrypt.hash(password, salt)
            await user.save()

            profile = await new Profile({
                user: user.id,
                skills: [],
                bio: "",
            }).save()

            const payload = {
                user: {
                    id: user.id,
                },
            }

            user = await User.findById(user.id).select("-password")
            jwt.sign(
                payload,
                process.env.JWT_KEY,
                { expiresIn: 3600 },
                (err, token) => {
                    if (err) throw err
                    return res.status(200).json({
                        user,
                        token,
                    })
                },
            )
        } catch (err) {
            return res.status(500).json({ errors: [{ msg: "Server error" }] })
        }
    },
)

// @route   PUT api/users
// @desc    Update current user
// @access  Private
router.put("/", auth, async (req, res) => {
    try {
        const userId = req.user.id
        const { name, email, password, avatar } = req.body

        let user = await User.findById(userId)

        if (name) user.name = name
        if (email) user.email = email
        if (avatar) user.avatar = avatar
        if (password) {
            const salt = await bcrypt.genSalt(10)
            user.password = await bcrypt.hash(password, salt)
        }

        await user.save()
        user = await User.findById(user.id).select("-password")
        res.status(200).send({ user })
    } catch (err) {
        return res.status(500).json({ errors: [{ msg: "Server error" }] })
    }
})

module.exports = router
