const express = require("express")
const router = express.Router()
const auth = require("../../middleware/auth")
const Profile = require("../../models/Profile")
const Comment = require("../../models/Comment")
const { Story } = require("../../models/Story")
const { check, validationResult } = require("express-validator")
require("dotenv/config")

// @route   POST api/comments/stories/:story_id
// @desc    Comment a story by story id
// @access  Private
router.post(
    "/stories/:story_id",
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

            const { text } = req.body

            const comment = await new Comment({
                story: storyId,
                user: userId,
                text,
            }).save()

            story.comments.unshift(comment._id)
            await story.save()

            const comments = await Comment.find({ story: storyId })
                .sort("-date")
                .populate("user", ["name", "avatar"])
            res.status(200).json(comments)
        } catch (err) {
            if (err.kind === "ObjectId") {
                return res.status(400).json({ msg: "Story not found" })
            }
            return res.status(500).send("Server error")
        }
    },
)

// @route   PUT api/comments/:comment_id
// @desc    Edit comment by comment id
// @access  Private
router.put(
    "/:comment_id",
    [
        auth,
        [
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
            const commentId = req.params.comment_id
            let comment = await Comment.findById(commentId)
            if (!comment) {
                res.status(404).json({ msg: "Comment not found" })
            }

            if (comment.user.toString() !== req.user.id) {
                res.status(404).json({ msg: "Not authorised" })
            }
            comment.text = req.body.text

            await comment.save()

            const comments = await Comment.find({
                story: comment.story.toString(),
            })
                .sort("-date")
                .populate("user", ["name", "avatar"])
            res.status(200).json(comments)
        } catch (err) {
            if (err.kind === "ObjectId") {
                return res
                    .status(400)
                    .json({ msg: "Story or comment not found" })
            }
            return res.status(500).send("Server error")
        }
    },
)

// @route   DELETE api/comments/:comment_id
// @desc    Delete a comment by story id and comment id
// @access  Private
router.delete("/:comment_id", auth, async (req, res) => {
    try {
        const commentId = req.params.comment_id
        let comment = await Comment.findById(commentId)
        if (!comment) {
            res.status(404).json({ msg: "Comment not found" })
        }

        if (comment.user.toString() !== req.user.id) {
            res.status(404).json({ msg: "Not authorised" })
        }

        const story = await Story.findById(comment.story)
        story.comments = story.comments.filter(
            story => story.toString() !== comment.story.toString(),
        )

        await Promise.all([story.save(), comment.remove()])

        res.status(200).json({ msg: "Comment has been removed" })
    } catch (err) {
        if (err.kind === "ObjectId") {
            return res.status(400).json({ msg: "Story or comment not found" })
        }
        return res.status(500).send("Server error")
    }
})

// @route   PUT api/comments/like/:comment_id
// @desc    Like a comment by comment id
// @access  Private
router.put("/like/:comment_id", auth, async (req, res) => {
    try {
        const userId = req.user.id
        const commentId = req.params.comment_id
        let comment = await Comment.findById(commentId)
        if (!comment) {
            res.status(404).json({ msg: "Comment not found" })
        }
        const isLiked = comment.likes.some(
            likeUserId => userId === likeUserId.toString(),
        )
        if (!isLiked) {
            comment.likes.unshift(userId)
            comment.dislikes = comment.dislikes.filter(
                dislikeUserId => userId !== dislikeUserId.toString(),
            )
        } else {
            comment.likes = comment.likes.filter(
                likeUserId => userId !== likeUserId.toString(),
            )
        }

        await comment.save()
        res.status(200).send(comment.likes)
    } catch (err) {
        if (err.kind === "ObjectId") {
            return res.status(404).json({ msg: "Comment not found" })
        }
        return res.status(500).send("Server error")
    }
})

// @route   PUT api/comments/dislike/:comment_id
// @desc    Dislike a comment by comment id
// @access  Private
router.put("/dislike/:comment_id", auth, async (req, res) => {
    try {
        const userId = req.user.id
        const commentId = req.params.comment_id
        let comment = await Comment.findById(commentId)
        if (!comment) {
            res.status(404).json({ msg: "Comment not found" })
        }

        const isDisiked = comment.dislikes.some(
            dislikeUserId => userId === dislikeUserId.toString(),
        )
        if (!isDisiked) {
            comment.dislikes.unshift(userId)
            comment.likes = comment.likes.filter(
                likeUserId => userId !== likeUserId.toString(),
            )
        } else {
            comment.dislikes = comment.dislikes.filter(
                dislikeUserId => userId !== dislikeUserId.toString(),
            )
        }

        await comment.save()
        res.status(200).send(comment.dislikes)
    } catch (err) {
        if (err.kind === "ObjectId") {
            return res.status(404).json({ msg: "Comment not found" })
        }
        return res.status(500).send("Server error")
    }
})

module.exports = router
