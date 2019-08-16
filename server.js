const express = require("express")
const connectDB = require("./db")

const app = express()

connectDB()

app.use(express.json())

app.use("/api/auth", require("./routes/api/auth"))
app.use("/api/users", require("./routes/api/users"))
app.use("/api/profiles", require("./routes/api/profiles"))

app.get("/", (req, res) => res.send("Hello from the other side"))

const PORT = process.env.PORT || 6000

app.listen(PORT, () => {
    console.log(`Listening to port ${PORT}`)
})
