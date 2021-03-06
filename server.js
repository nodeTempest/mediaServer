const express = require("express")
const connectDB = require("./db")
const cors = require("cors")

const app = express()

connectDB()

app.use(cors())
app.use(express.json())

app.use("/api/auth", require("./routes/api/auth"))
app.use("/api/users", require("./routes/api/users"))
app.use("/api/profiles", require("./routes/api/profiles"))
app.use("/api/posts", require("./routes/api/posts"))
app.use("/api/comments", require("./routes/api/comments"))

app.get("/", (req, res) => res.send("Hello from the other side"))

const PORT = process.env.PORT || 6000

app.listen(PORT, () => {
    console.log(`Listening to port ${PORT}`)
})
