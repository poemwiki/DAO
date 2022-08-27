const mongoose = require("mongoose")

// DDAO
// mongodb+srv://<user></user>:<password>@ddao.n7b87r2.mongodb.net/?retryWrites=true&w=majority
const host = process.env.MONGODB_HOST
const scheme = process.env.MONGODB_SCHEME || 'mongodb+srv'
const authDB = process.env.MONGODB_DEFAULT_AUTH_DB || ''

const connectionStr = `${scheme}://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@${host}/${authDB}?retryWrites=true&w=majority`
mongoose.connect(connectionStr)

const db = mongoose.connection
db.on("error", (err) => {
  console.error("MongoDB error: ", err.message)
  process.exit(1)
})

db.once("open", () => {
  console.log("MongoDB connection established")
})

module.exports = mongoose
