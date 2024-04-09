/* eslint-disable @typescript-eslint/no-var-requires */
require('dotenv').config()

import path from 'path'
import express from 'express'
import bodyParser from 'body-parser'
import connect from './db'

connect()
const app = express()

import mintProposalModel from './models/proposal/mint/model'
import holderModel from './models/holder/model'

const port = process.env.PORT || 3000

app.use(express.static(path.join(__dirname, '../../../public')))

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

const mode = process.argv[2]
let serverUrl = `http://localhost:${port}`
if (mode === 'prod') serverUrl = process.env.SERVER_URL ? process.env.SERVER_URL : serverUrl

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, '../../public/index.html'))
})

app.get('/api/hello', function (req, res) {
  res.json({
    message: 'success',
    data: 'hello world'
  }) 
})

app.post('/api/holder/update', (req, res) => {
  holderModel
    .updateHolder(req.body)
    .then(() =>
      res.json({
        message: 'success'
      })
    )
    .catch((err) => res.status(400).json({ message: err }))
})

app.post('/api/holder/all', (req, res) => {
  holderModel
    .getAllHolders()
    .then((holders) =>
      res.json({
        message: 'success',
        data: holders
      })
    )
    .catch((err) => res.status(400).json({ error: err.message }))
})

app.post('/api/proposal/update', (req, res) => {
  mintProposalModel
    .updateProposal(req.body)
    .then(() =>
      res.json({
        message: 'success'
      })
    )
    .catch((err) => res.status(400).json({ error: err.message }))
})


app.post('/api/proposal/find', (req, res) => {
  const errors: string[] = []
  if (req.body.proposalId === undefined) errors.push('No proposal id specified')
  if (errors.length) {
    res.status(400).json({ error: errors.join(',') })
    return
  }
  mintProposalModel
    .findProposal(req.body)
    .then((proposal) =>
      res.json({
        message: 'success',
        data: proposal
      })
    )
    .catch((err) => res.status(400).json({ error: err.message }))
})

app.post('/api/proposal/', (req, res) => {
  const errors: string[] = []
  const { offset, limit } = req.body
  if (offset === undefined) errors.push('No offset specified')
  if (limit === undefined) errors.push('No limit specified')
  if (errors.length) {
    res.status(400).json({ error: errors.join(',') })
    return
  }
  mintProposalModel
    .getMintProposals(offset, limit)
    .then((proposals) =>
      res.json({
        message: 'success',
        data: proposals
      })
    )
    .catch((err) => res.status(400).json({ error: err.message }))
})

app.post('/api/proposal/mint/create', async (req, res) => {
  const errors: string[] = []
  //const data = JSON.parse(Object.keys(req.body)[0])
  const {
    proposal_id,
    proposer,
    receiver,
    amount,
    description,
    transaction_hash,
    propose_time,
    propose_type
  } = req.body
  if (!proposal_id) errors.push('No proposal id specified')
  if (!proposer) errors.push('No proposer specified')
  if (!receiver) errors.push('No receiver specified')
  if (!amount) errors.push('No amount specified')
  if (!description) errors.push('No description specified')
  if (!propose_time) errors.push('No propose time specified')
  if (!transaction_hash) errors.push('No transaction hash specified')

  if (errors.length) {
    res.status(400).json({ error: errors.join(',') })
    return
  }

  try {
    await mintProposalModel.createMintProposal(
      propose_type ? propose_type : 'mint',
      proposal_id,
      proposer,
      receiver,
      amount,
      description,
      Number(propose_time),
      transaction_hash
    )

    if (!propose_type || propose_type === 'mint') {
      const receivers = [receiver]
      const newHolders = await holderModel.getNewHolders(receivers)

      await holderModel.addHolders(newHolders.addresses, newHolders.names)
    }
    return res.json({
      message: 'success'
    })
  } catch (err) {
    res.status(400).json({ error: err.message })
    return
  }
})

app.post('/api/proposal/batchMint/create', async (req, res) => {
  const errors: string[] = []
  //const data = JSON.parse(Object.keys(req.body)[0])
  const {
    proposalId,
    proposer,
    receivers,
    amounts,
    description,
    proposeTx,
    proposeTime
  } = req.body
  if (!proposalId) errors.push('No proposal id specified')
  if (!proposer) errors.push('No proposer specified')
  if (!receivers) errors.push('No receivers specified')
  if (!amounts) errors.push('No amounts specified')
  if (!description) errors.push('No description specified')
  if (!proposeTime) errors.push('No propose time specified')
  if (!proposeTx) errors.push('No transaction hash specified')

  if (errors.length) {
    res.status(400).json({ error: errors.join(',') })
    return
  }

  try {
    await mintProposalModel.createBatchMintProposal(
      proposalId,
      proposer,
      receivers,
      amounts,
      description,
      Number(proposeTime),
      proposeTx
    )

    const newHolders = await holderModel.getNewHolders(receivers)
    await holderModel.addHolders(newHolders.addresses, newHolders.names)

    return res.json({
      message: 'success'
    })
  } catch (err) {
    res.status(400).json({ error: err.message })
    return
  }

})

// app.post("/api/scoreProposal/create", (req, res, next) => {
//   var errors = []
//   //const data = JSON.parse(Object.keys(req.body)[0])
//   const {
//     proposal_id,
//     proposer,
//     receiver,
//     amount,
//     description,
//     transaction_hash,
//     propose_time
//   } = req.body
//   if (!proposal_id) errors.push("No proposal id specified")
//   if (!proposer) errors.push("No proposer specified")
//   if (!receiver) errors.push("No receiver specified")
//   if (!amount) errors.push("No amount specified")
//   if (!description) errors.push("No description specified")
//   if (!propose_time) errors.push("No propose time specified")
//   if (!transaction_hash) errors.push("No transaction hash specified")

//   if (errors.length) {
//     res.status(400).json({ error: errors.join(",") })
//     return
//   }
//   var sql =
//     "INSERT INTO scoreProposal (proposal_id, proposer, receiver, amount, description, transaction_hash, propose_time) VALUES (?,?,?,?,?,?,?)"
//   var params = [
//     proposal_id,
//     proposer,
//     receiver,
//     amount,
//     description,
//     transaction_hash,
//     propose_time
//   ]
//   console.log("params:", JSON.stringify(params))

//   var db = new sqlite3.Database("./main.db")
//   db.run(sql, params, function (err) {
//     console.log("err:", JSON.stringify(err))
//     if (err) {
//       res.status(400).json({ error: err.message })
//       db.close()
//       return
//     }
//     res.json({
//       message: "success"
//     })
//     db.close()
//   })
// })

app.listen(port, function () {
  console.log(`Example app listening on: ${serverUrl}`)
})

export default app