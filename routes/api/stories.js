const express = require("express")
const router = express.Router()
const auth = require("../../middleware/auth")
const Profile = require("../../models/Profile")
const { Story } = require("../../models/Story")
const { check, validationResult } = require("express-validator")
require("dotenv/config")

// @route   GET api/stories
// @desc    Get all stories
// @access  Public
router.get("/", async (req, res) => {
    try {
        const stories = await Story.find().populate("user", ["name", "avatar"])
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
        const story = await Story.findById(storyId).populate("user", [
            "name",
            "avatar",
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
        if (!errors.isEmpty())
            return res.status(422).json({ errors: errors.array() })

        try {
            const { title, text } = req.body
            const profile = await Profile.findOne({ user: req.user.id })
            if (!profile) {
                return res.status(404).send({
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
// @desc    Update story by story id
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

// @route   PUT api/stories/like/:story_id
// @desc    Like a story by sotry id
// @access  Private
router.put("/like/:story_id", auth, async (req, res) => {
    try {
        const userId = req.user.id
        const storyId = req.params.story_id
        const story = await Story.findById(storyId)
        const isLiked = story.likes.some(
            likeUserId => userId === likeUserId.toString()
        )
        if (!isLiked) {
            story.likes.unshift(userId)
            story.dislikes = story.dislikes.filter(
                dislikeUserId => userId !== dislikeUserId.toString()
            )
        } else {
            story.likes = story.likes.filter(
                likeUserId => userId !== likeUserId.toString()
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
        const isDisiked = story.dislikes.some(
            dislikeUserId => userId === dislikeUserId.toString()
        )
        if (!isDisiked) {
            story.dislikes.unshift(userId)
            story.likes = story.likes.filter(
                likeUserId => userId !== likeUserId.toString()
            )
        } else {
            story.dislikes = story.dislikes.filter(
                dislikeUserId => userId !== dislikeUserId.toString()
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

// @route   POST api/stories/comments/:story_id
// @desc    Comment a story by story id
// @access  Private
router.post(
    "/comments/:story_id",
    [
        auth,
        [
            check("text", "Text is required")
                .not()
                .isEmpty(),
        ],
    ],
    async (req, res) => {
        try {
            const userId = req.user.id
            const storyId = req.params.story_id
            const story = await Story.findById(storyId)
            const user = await User.findById(userId)

            const { text } = req.body
            const { name, avatar } = user

            const commnet = {
                user: userId,
                text,
                name,
                avatar,
            }
            story.comments.unshift(commnet)

            await story.save()
            res.send(story.comments)
        } catch (err) {
            if (err.kind === "ObjectId") {
                return res.status(400).json({ msg: "Story not found" })
            }
            return res.status(500).send("Server error")
        }
    }
)

// @route   PUT api/stories/comments/:story_id/:comment_id
// @desc    Edit comment by story id and comment id
// @access  Private
router.put(
    "/comments/:story_id/:comment_id",
    [
        auth,
        [
            check("text", "Text is required")
                .not()
                .isEmpty(),
        ],
    ],
    async (req, res) => {
        try {
            const storyId = req.params.story_id
            const commentId = req.params.comment_id

            const story = await Story.findById(storyId)
            if (!story) {
                return res.status(404).send({ msg: "Story not found" })
            }

            const comment = story.comments.find(
                comment => comment.id === commentId
            )
            if (!comment) {
                return res.status(404).send({ msg: "Comment not found" })
            }

            comment.text = req.body.text

            await story.save()
            res.send(story.comments)
        } catch (err) {
            if (err.kind === "ObjectId") {
                return res
                    .status(400)
                    .json({ msg: "Story or comment not found" })
            }
            return res.status(500).send("Server error")
        }
    }
)

// @route   DELETE api/stories/comments/:story_id/:comment_id
// @desc    Delete a comment by story id and comment id
// @access  Private
router.delete("/comments/:story_id/:comment_id", auth, async (req, res) => {
    try {
        const storyId = req.params.story_id
        const commentId = req.params.comment_id

        const story = await Story.findById(storyId)
        if (!story) {
            return res.status(404).send({ msg: "Story not found" })
        }

        const comment = story.comments.find(comment => comment.id === commentId)
        if (!comment) {
            return res.status(404).send({ msg: "Comment not found" })
        }

        story.comments = story.comments.filter(
            comment => comment.id !== commentId
        )

        await story.save()
        res.send(story.comments)
    } catch (err) {
        if (err.kind === "ObjectId") {
            return res.status(400).json({ msg: "Story or comment not found" })
        }
        return res.status(500).send("Server error")
    }
})

module.exports = router
