const express = require("express")
const router = express.Router()
const auth = require("../../middleware/auth")
const Profile = require("../../models/Profile")
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
                user: req.user.id,
                title,
                text,
            }).save()

            profile.stories.unshift(story._id)
            await profile.save()

            profile.populate(
                [
                    {
                        path: "user",
                        select: "avatar name",
                    },
                    {
                        path: "stories",
                        select: "title text",
                    },
                ],
                (err, profile) => {
                    if (err) throw err
                    res.status(200).send(profile)
                }
            )
        } catch (err) {
            return res.status(500).send("Server error")
        }
    }
)

// @route   PUT api/stories/:story_id
// @desc    Update story by id
// @access  Private
router.put("/:story_id", auth, async (req, res) => {
    try {
        const storyId = req.params.story_id
        const story = await Story.findById(storyId)

        if (!story) {
            return res.status(404).send({ msg: "Story doesn't exist" })
        }

        if (story.user.toString() !== req.user.id) {
            return res.status(400).send({ msg: "Not authorized" })
        }

        const { title, text } = req.body

        if (title) story.title = title
        if (text) story.text = text

        await story.save()

        const profile = await Profile.findOne({ user: req.user.id }).populate([
            {
                path: "user",
                select: "avatar name",
            },
            {
                path: "stories",
                select: "title text",
            },
        ])

        res.status(200).send(profile)
    } catch (err) {
        if (err.kind === "ObjectId") {
            return res.status(400).json({ msg: "Story not found" })
        }
        return res.status(500).send("Server error")
    }
})

// @route   DELETE api/stories/:story_id
// @desc    Delete story by id
// @access  Private
router.delete("/:story_id", auth, async (req, res) => {
    try {
        const storyId = req.params.story_id
        const story = await Story.findById(storyId)

        if (!story) {
            return res.status(404).send({ msg: "Story doesn't exist" })
        }

        if (story.user.toString() !== req.user.id) {
            return res.status(400).send({ msg: "Not authorized" })
        }

        const profile = await Profile.findOne({ user: req.user.id })

        profile.stories = profile.stories.filter(
            id => id.toString() !== storyId
        )

        await profile.save()
        await story.remove()

        profile.populate(
            [
                {
                    path: "user",
                    select: "avatar name",
                },
                {
                    path: "stories",
                    select: "title text",
                },
            ],
            (err, profile) => {
                if (err) throw err
                res.status(200).send(profile)
            }
        )
    } catch (err) {
        if (err.kind === "ObjectId") {
            return res.status(400).json({ msg: "Story not found" })
        }
        return res.status(500).send("Server error")
    }
})

module.exports = router
