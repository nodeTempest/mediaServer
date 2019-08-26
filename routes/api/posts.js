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

// @route   GET api/posts/(videos|audios|images|stories)
// @desc    Get all posts by category
// @access  Public
router.get(/\/(videos|audios|images|stories)/, async (req, res) => {
    try {
        const category = req.params[0]

        const posts = await Post.find({ "data.category": category })
            .sort("-date")
            .populate("user", ["name", "avatar"])

        res.status(200).send(posts)
    } catch (err) {
        return res.status(500).send("Server error")
    }
})

// @route   POST api/posts/(videos|audios|images|stories)
// @desc    Create a new post with category
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
            const category = req.params[0]
            const { title } = req.body
            let data = {}

            if (category === "stories") {
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
                    category,
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

// @route   PUT api/posts/:post_id
// @desc    Edit post by post id
// @access  Private
router.put("/:post_id", auth, async (req, res) => {
    try {
        const postId = req.params.post_id
        const post = await Post.findById(postId)

        if (!post) {
            return res.status(404).send({ msg: "Post doesn't exist" })
        }

        if (post.user.toString() !== req.user.id) {
            return res.status(400).send({ msg: "Not authorized" })
        }

        const { title } = req.body
        if (title) post.title = title

        const { category } = post.data
        let data = {}

        if (category === "stories") {
            const { text } = req.body
            data = { text }
        } else {
            const { url, description } = req.body
            data = { url, description }
        }

        if (data.text) post.data.text = data.text
        if (data.url) post.data.url = data.url
        if (data.description) post.data.description = data.description

        await post.save()

        res.status(200).send(post)
    } catch (err) {
        if (err.kind === "ObjectId") {
            return res.status(400).json({ msg: "Post not found" })
        }
        return res.status(500).send("Server error")
    }
})

// @route   DELETE api/posts/:post_id
// @desc    Delete post by post id
// @access  Private
router.delete("/:post_id", auth, async (req, res) => {
    try {
        const postId = req.params.post_id
        const post = await Post.findById(postId)

        if (!post) {
            return res.status(404).send({ msg: "Post doesn't exist" })
        }

        if (post.user.toString() !== req.user.id) {
            return res.status(400).send({ msg: "Not authorized" })
        }

        const profile = await Profile.findOne({ user: req.user.id })

        profile.posts = profile.posts.filter(id => id.toString() !== postId)

        await Promise.all([
            profile.save(),
            Comment.deleteMany({ post: postId }),
            post.remove(),
        ])

        res.status(200).send({ msg: "Post has been deleted" })
    } catch (err) {
        if (err.kind === "ObjectId") {
            return res.status(400).json({ msg: "Post not found" })
        }
        return res.status(500).send("Server error")
    }
})

module.exports = router
