const mongoose = require("mongoose")
const Schema = mongoose.Schema

const StorySchema = new Schema({
    profile: {
        type: Schema.Types.ObjectId,
        ref: "Profile",
    },
    title: {
        type: String,
        required: true,
    },
    text: {
        type: String,
        required: true,
    },
    date: {
        type: Date,
        default: Date.now,
    },
})

module.exports = {
    StorySchema,
    Story: mongoose.model("Story", StorySchema),
}
