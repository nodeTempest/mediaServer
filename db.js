const mongoose = require("mongoose")
require("dotenv/config")

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useCreateIndex: true,
            useFindAndModify: false,
        })
        console.log("Connected to MongoDB")
    } catch (err) {
        process.exit(1)
    }
}

module.exports = connectDB
