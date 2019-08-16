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
            if (!profile) {
                res.status(404).send({
                    msg: "Profile for this user doesn't exist yet",
                })
            }

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

// @route   DELETE api/stories/:story_id
// @desc    Delete story by id
// @access  Private
router.delete("/:story_id", auth, async (req, res) => {
    try {
        const storyId = req.params.story_id
        const story = await Story.findById(storyId)
        const profile = await Profile.findById(story.profile)

        if (!story) {
            return res.status(404).send({ msg: "Story doesn't exist" })
        }

        if (profile.user.toString() !== req.user.id) {
            return res.status(400).send({ msg: "Not authorized" })
        }

        profile.stories = profile.stories.filter(
            story => story._id.toString() !== storyId
        )

        await profile.save()
        await story.remove()

        res.status(200).send({ msg: "Story has been deleted" })
    } catch (err) {
        return res.status(500).send("Server error")
    }
})

module.exports = router
