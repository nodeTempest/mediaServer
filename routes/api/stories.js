const express = require("express")
const router = express.Router()
const auth = require("../../middleware/auth")
const Profile = require("../../models/Profile")
const User = require("../../models/User")
const { Story } = require("../../models/Story")
const { check, validationResult } = require("express-validator")
require("dotenv/config")

// @route   POST api/stories
// @desc    Post new story
// @access  Private
router.post(
    "/",
    [
        auth,
        [
            check("title", "Title is required")
                .not()
                .isEmpty(),
            check("text", "Text is required")
                .not()
                .isEmpty(),
        ],
    ],
    async (req, res) => {
        const errors = validationResult(req)
        if (!errors.isEmpty())
            return res.status(422).json({ errors: errors.array() })

        try {
            const { title, text } = req.body
            const profile = await Profile.findOne({ user: req.user.id })
            const story = await new Story({
                profile: profile._id,
                title,
                text,
            }).save()

            profile.stories.unshift(story)
            await profile.save()
            res.status(200).send(story)
        } catch (err) {
            return res.status(500).send("Server error")
        }
    }
)

module.exports = router
