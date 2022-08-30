import mongoose from 'mongoose'

// DDAO
// mongodb+srv://<user></user>:<password>@ddao.n7b87r2.mongodb.net/?retryWrites=true&w=majority
const host = process.env.MONGODB_HOST
const scheme = process.env.MONGODB_SCHEME || 'mongodb+srv'
const database = process.env.MONGODB_DB
const authDB = process.env.MONGODB_DEFAULT_AUTH_DB || ''

let connectionStr: string
if (authDB && process.env.MONGODB_USER && process.env.MONGODB_PASSWORD) {
  connectionStr = `${scheme}://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@${host}/${database}?authSource=${authDB}&retryWrites=true&w=majority`
} else {
  connectionStr = `${scheme}://${host}/${database}?retryWrites=true&w=majority`
}

export default async function connect() {
  const db = mongoose.connection
  db.on('error', (err) => {
    console.error('MongoDB error: ', err.message)
    process.exit(1)
  })

  db.once('open', () => {
    console.log('MongoDB connection established')
  })
  await mongoose.connect(connectionStr)
}

