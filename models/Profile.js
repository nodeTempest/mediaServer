const mongoose = require("mongoose")
const Schema = mongoose.Schema
const { StorySchema } = require("./Story")

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
    stories: {
        type: [StorySchema],
    },
})

module.exports = Profile = mongoose.model("Profile", ProfileSchema)
