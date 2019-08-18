const mongoose = require("mongoose")
const Schema = mongoose.Schema

const CommentSchema = new Schema({
    story: {
        type: Schema.Types.ObjectId,
        ref: "Story",
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
    },
    likes: [
        {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
    ],
    dislikes: [
        {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
    ],
    text: {
        type: String,
        required: true,
    },
    date: {
        type: Date,
        default: Date.now,
    },
})

module.exports = Comment = mongoose.model("Comment", CommentSchema)
