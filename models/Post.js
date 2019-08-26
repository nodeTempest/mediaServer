const mongoose = require("mongoose")
const Schema = mongoose.Schema

const PostSchema = Schema({
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
    comments: [
        {
            type: Schema.Types.ObjectId,
            ref: "Comment",
        },
    ],
    title: {
        type: String,
        required: true,
    },
    data: Schema({}, { discriminatorKey: "category" }),
    date: {
        type: Date,
        default: Date.now,
    },
})

const mediaData = {
    url: {
        type: String,
        required: true,
    },
    description: String,
}

const textData = {
    text: { type: String, required: true },
}

PostSchema.path("data").discriminator("videos", Schema(mediaData))
PostSchema.path("data").discriminator("audios", Schema(mediaData))
PostSchema.path("data").discriminator("images", Schema(mediaData))
PostSchema.path("data").discriminator("stories", Schema(textData))

module.exports = Post = mongoose.model("Post", PostSchema)
