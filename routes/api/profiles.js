const express = require("express")
const router = express.Router()
const auth = require("../../middleware/auth")
const Profile = require("../../models/Profile")
const Post = require("../../models/Post")
const User = require("../../models/User")
require("dotenv/config")

// @route   PUT api/profiles
// @desc    Update profile for current user
// @access  Private
router.put("/", auth, async (req, res) => {
    try {
        const user = req.user.id
        const { skills, bio } = req.body

        const profile = await Profile.findOne({ user })

        if (skills) profile.skills = skills
        if (bio) profile.bio = bio

        await profile.save()

        const populatedProfile = await profile
            .populate([
                {
                    path: "user",
                    select: "avatar name",
                },
                {
                    path: "posts",
                    select: "title date",
                },
            ])
            .execPopulate()

        res.status(200).send(populatedProfile)
    } catch (err) {
        res.status(500).send("Server error")
    }
})

// @route   GET api/profiles
// @desc    Get all profiles
// @access  Public
router.get("/", async (req, res) => {
    try {
        const profiles = await Profile.find().populate([
            {
                path: "user",
                select: "avatar name",
            },
            {
                path: "posts",
                select: "title data",
            },
        ])
        res.status(200).send(profiles)
    } catch (err) {
        res.status(500).send("Server error")
    }
})

// @route   GET api/profiles/me
// @desc    Get profile for current user
// @access  Private
router.get("/me", auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id }).populate([
            {
                path: "user",
                select: "avatar name",
            },
            {
                path: "posts",
                select: "title data",
            },
        ])

        res.status(200).send(profile)
    } catch (err) {
        res.status(500).send("Server error")
    }
})

// @route   GET api/profiles/users/:user_id
// @desc    Get profile by user id
// @access  Public
router.get("/users/:user_id", async (req, res) => {
    try {
        const profile = await Profile.findOne({
            user: req.params.user_id,
        }).populate([
            {
                path: "user",
                select: "avatar name",
            },
            {
                path: "posts",
                select: "title data",
            },
        ])
        res.status(200).send(profile)
    } catch (err) {
        if (err.kind === "ObjectId") {
            return res.status(400).json({ msg: "Profile not found" })
        }
        res.status(500).send("Server error")
    }
})

// @route   DELETE api/profiles
// @desc    Delete current user with his content
// @access  Private
router.delete("/", auth, async (req, res) => {
    const userId = req.user.id
    try {
        const comments = await Comment.find({ user: userId })

        await Promise.all(
            comments.map(async comment => {
                const commentedPost = await Post.findById(comment.post)
                commentedPost.comments = commentedPost.comments.filter(
                    commentId =>
                        commentId.toString() !== comment.post.toString(),
                )
            }),
        )
        await Promise.all([
            Comment.deleteMany({ user: userId }),
            Post.deleteMany({ user: userId }),
            Profile.findOneAndDelete({ user: userId }),
            User.findByIdAndDelete(userId),
        ])
        res.status(200).send({ msg: "User has been deleted" })
    } catch (err) {
        res.status(500).send("Server error")
    }
})

module.exports = router
