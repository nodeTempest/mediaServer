const mongoose = require("mongoose")
const Schema = mongoose.Schema

const ProfileSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
    },
    skills: {
        type: [String],
    },
    bio: {
        type: String,
    },
    stories: [
        {
            type: Schema.Types.ObjectId,
            ref: "Story",
        },
    ],
})

module.exports = Profile = mongoose.model("Profile", ProfileSchema)
