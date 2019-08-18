const mongoose = require("mongoose")
const Schema = mongoose.Schema

const ProfileSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
    },
    stories: [
        {
            type: Schema.Types.ObjectId,
            ref: "Story",
        },
    ],
    bio: String,
    skills: [String],
})

module.exports = Profile = mongoose.model("Profile", ProfileSchema)
