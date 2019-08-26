const express = require("express")
const router = express.Router()
const auth = require("../../middleware/auth")
const Profile = require("../../models/Profile")
const Comment = require("../../models/Comment")
const Story = require("../../models/Story")
const { check, validationResult } = require("express-validator")
require("dotenv/config")

// @route   GET api/stories
// @desc    Get all stories
// @access  Public
router.get("/", async (req, res) => {
    try {
        const stories = await Story.find()
            .sort("-date")
            .populate("user", ["name", "avatar"])
        res.status(200).send(stories)
    } catch (err) {
        return res.status(500).send("Server error")
    }
})

// @route   GET api/stories/:story_id
// @desc    Get story by story id
// @access  Public
router.get("/:story_id", async (req, res) => {
    try {
        const storyId = req.params.story_id
        const story = await Story.findById(storyId).populate([
            {
                path: "user",
                select: "name avatar",
            },
            {
                path: "comments",
                select: "text date likes dislikes",
                populate: {
                    path: "user",
                    select: "name avatar",
                },
            },
        ])
        res.status(200).send(story)
    } catch (err) {
        if (err.kind === "ObjectId") {
            return res.status(400).json({ msg: "Story not found" })
        }
        return res.status(500).send("Server error")
    }
})

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
        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() })
        }
        try {
            const { title, text } = req.body
            const profile = await Profile.findOne({ user: req.user.id })
            if (!profile) {
                return res.status(404).send({
                    msg: "Profile for this user doesn't exist yet",
                })
            }

            let story = await new Story({
                user: req.user.id,
                title,
                text,
            }).save()

            profile.stories.unshift(story._id)
            await profile.save()

            story.populate(
                {
                    path: "user",
                    select: "name avatar",
                },
                (err, story) => {
                    if (err) throw err
                    res.status(200).send(story)
                },
            )
        } catch (err) {
            return res.status(500).send("Server error")
        }
    },
)

// @route   PUT api/stories/:story_id
// @desc    Edit story by story id
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

        res.status(200).send(story)
    } catch (err) {
        if (err.kind === "ObjectId") {
            return res.status(400).json({ msg: "Story not found" })
        }
        return res.status(500).send("Server error")
    }
})

// @route   DELETE api/stories/:story_id
// @desc    Delete story by story id
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
            id => id.toString() !== storyId,
        )

        await Promise.all([
            profile.save(),
            Comment.deleteMany({ story: storyId }),
            story.remove(),
        ])

        res.status(200).send({ msg: "Story has been deleted" })
    } catch (err) {
        if (err.kind === "ObjectId") {
            return res.status(400).json({ msg: "Story not found" })
        }
        return res.status(500).send("Server error")
    }
})

// @route   PUT api/stories/like/:story_id
// @desc    Like a story by sotry id
// @access  Private
router.put("/like/:story_id", auth, async (req, res) => {
    try {
        const userId = req.user.id
        const storyId = req.params.story_id
        const story = await Story.findById(storyId)
        if (!story) {
            res.status(404).json({ msg: "Story not found" })
        }
        const isLiked = story.likes.some(
            likeUserId => userId === likeUserId.toString(),
        )
        if (!isLiked) {
            story.likes.unshift(userId)
            story.dislikes = story.dislikes.filter(
                dislikeUserId => userId !== dislikeUserId.toString(),
            )
        } else {
            story.likes = story.likes.filter(
                likeUserId => userId !== likeUserId.toString(),
            )
        }
        await story.save()
        res.send(story.likes)
    } catch (err) {
        if (err.kind === "ObjectId") {
            return res.status(400).json({ msg: "Story not found" })
        }
        return res.status(500).send("Server error")
    }
})

// @route   PUT api/stories/dislike/:story_id
// @desc    Dislike a story by story id
// @access  Private
router.put("/dislike/:story_id", auth, async (req, res) => {
    try {
        const userId = req.user.id
        const storyId = req.params.story_id
        const story = await Story.findById(storyId)
        if (!story) {
            res.status(404).json({ msg: "Story not found" })
        }
        const isDisiked = story.dislikes.some(
            dislikeUserId => userId === dislikeUserId.toString(),
        )
        if (!isDisiked) {
            story.dislikes.unshift(userId)
            story.likes = story.likes.filter(
                likeUserId => userId !== likeUserId.toString(),
            )
        } else {
            story.dislikes = story.dislikes.filter(
                dislikeUserId => userId !== dislikeUserId.toString(),
            )
        }
        await story.save()
        res.send(story.dislikes)
    } catch (err) {
        if (err.kind === "ObjectId") {
            return res.status(400).json({ msg: "Story not found" })
        }
        return res.status(500).send("Server error")
    }
})

module.exports = router
