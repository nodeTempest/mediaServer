const express = require("express")
const router = express.Router()
const auth = require("../../middleware/auth")
const Profile = require("../../models/Profile")
const Comment = require("../../models/Comment")
const Post = require("../../models/Post")
const { check, validationResult } = require("express-validator")
require("dotenv/config")

// @route   GET api/posts
// @desc    Get all posts
// @access  Public
router.get("/", async (req, res) => {
    try {
        const posts = await Post.find()
            .sort("-date")
            .populate("user", ["name", "avatar"])

        res.status(200).send(posts)
    } catch (err) {
        return res.status(500).send("Server error")
    }
})

// @route   GET api/posts
// @desc    Get all posts by collection type
// @access  Public
router.get(/\/(videos|audios|images|stories)/, async (req, res) => {
    try {
        const collectionType = req.params[0]

        const posts = await Post.find({ "data.collectionType": collectionType })
            .sort("-date")
            .populate("user", ["name", "avatar"])

        res.status(200).send(posts)
    } catch (err) {
        return res.status(500).send("Server error")
    }
})

// @route   POST api/posts/(videos|audios|images|stories)
// @desc    Create a new post with collection type
// @access  Private
router.post(
    /\/(videos|audios|images|stories)/,
    [
        auth,
        [
            check("title", "Title is required")
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
            const collectionType = req.params[0]
            const { title } = req.body
            let data = {}

            if (collectionType === "stories") {
                const { text } = req.body
                if (!text) {
                    return res.status(422).send({
                        msg: "Text is required",
                    })
                }
                data = { text }
            } else {
                const { url, description } = req.body
                if (!url) {
                    return res.status(422).send({
                        msg: "URL is required",
                    })
                }
                data = { url, description }
            }

            const profile = await Profile.findOne({ user: req.user.id })

            let post = await new Post({
                user: req.user.id,
                title,
                data: {
                    collectionType,
                    ...data,
                },
            }).save()

            profile.posts.unshift(post._id)
            await profile.save()

            const populatedPost = await post
                .populate({
                    path: "user",
                    select: "name avatar",
                })
                .execPopulate()

            res.status(200).send(populatedPost)
        } catch (err) {
            return res.status(500).send("Server error")
        }
    },
)

module.exports = router
