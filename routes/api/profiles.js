const express = require("express")
const router = express.Router()
const auth = require("../../middleware/auth")
const Profile = require("../../models/Profile")
const User = require("../../models/User")
require("dotenv/config")

// @route   POST api/profiles
// @desc    Create or update profile for current user
// @access  Private
router.post("/", auth, async (req, res) => {
    try {
        const user = req.user.id
        const { skills, bio } = req.body
        let profile = await Profile.findOne({ user })
        if (!profile) {
            profile = await new Profile({
                user,
                skills,
                bio,
            }).save()
        } else {
            profile = await Profile.findOneAndUpdate(
                { user },
                { skills, bio },
                { new: true }
            )
        }
        res.status(200).send(profile)
    } catch (err) {
        res.status(500).send("Server error")
    }
})

// @route   GET api/profiles
// @desc    Get all profiles
// @access  Public
router.get("/", async (req, res) => {
    try {
        const profiles = await Profile.find().populate("user", [
            "name",
            "avatar",
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
        const profile = await Profile.findOne({ user: req.user.id }).populate(
            "user",
            ["name", "avatar"]
        )
        res.status(200).send(profile)
    } catch (err) {
        res.status(500).send("Server error")
    }
})

// @route   GET api/profiles/:profile_id
// @desc    Get profile by profile id
// @access  Public
router.get("/:profile_id", async (req, res) => {
    try {
        const profile = await Profile.findById(req.params.profile_id).populate(
            "user",
            ["name", "avatar"]
        )
        res.status(200).send(profile)
    } catch (err) {
        res.status(500).send("Server error")
    }
})

// @route   DELETE api/profiles
// @desc    Delete current user with his content
// @access  Private
router.delete("/", auth, async (req, res) => {
    const id = req.user.id
    try {
        await Profile.findOneAndDelete({ user: id })
        await User.findByIdAndDelete(id)
        res.status(200).send({ msg: "User has been deleted" })
    } catch (err) {
        res.status(500).send("Server error")
    }
})

module.exports = router
