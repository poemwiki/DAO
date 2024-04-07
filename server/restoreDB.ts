import { Alchemy, Filter, Log, Network } from 'alchemy-sdk'
import connect from './db'
import dotenv from 'dotenv'
import Web3 from 'web3'
import { IMintProposal, MintProposal } from './models/proposal/mint/schema'
dotenv.config()

// read events from GOVERNOR_ADDRESS contract, extract proposals from events

const GOVERNOR_ADDRESS = process.env.GOVERNOR_ADDRESS
const apiKey = process.env.ALCHEMY_KEY

const alchemy = new Alchemy({
  apiKey: apiKey,
  network: Network.MATIC_MAINNET,
  requestTimeout: 3000,
  maxRetries: 3
})

interface ProposalCreatedParams {
  proposalId: string
  proposer: string
  targets: string[]
  values: string[]
  signatures: string[]
  calldatas: string[]
  startBlock: string
  endBlock: string
  description: string
}

const web3 = new Web3()

const restoreProposals = async () => {
  const filter: Filter = {
    fromBlock: 'earliest',
    toBlock: 'latest',
    // fromBlock: '0x' + Number(33415379).toString(16), // 'earliest',
    // toBlock: '0x' + Number(41138227).toString(16),
    address: GOVERNOR_ADDRESS,
    topics: [
      '0x7d84a6263ae0d98d3329bd7b46bb4e8d6f98cd35a7adb45c274c8b7fd5ebd5e0', // ProposalCreated
    ],
  }

  const logs = await alchemy.core.getLogs(filter)

  for (let i=0; i<logs.length; i++) {
    await processProposalCreated(i, logs[i])
  }

  console.log(`restored ${logs.length} proposals`)
}

const processProposalCreated = async (index: number, log: Log) => {

  const abi = [
    {
      indexed: false,
      internalType: 'uint256',
      name: 'proposalId',
      type: 'uint256',
    },
    {
      indexed: false,
      internalType: 'address',
      name: 'proposer',
      type: 'address',
    },
    {
      indexed: false,
      internalType: 'address[]',
      name: 'targets',
      type: 'address[]',
    },
    {
      indexed: false,
      internalType: 'uint256[]',
      name: 'values',
      type: 'uint256[]',
    },
    {
      indexed: false,
      internalType: 'string[]',
      name: 'signatures',
      type: 'string[]',
    },
    {
      indexed: false,
      internalType: 'bytes[]',
      name: 'calldatas',
      type: 'bytes[]',
    },
    {
      indexed: false,
      internalType: 'uint256',
      name: 'startBlock',
      type: 'uint256',
    },
    {
      indexed: false,
      internalType: 'uint256',
      name: 'endBlock',
      type: 'uint256',
    },
    {
      indexed: false,
      internalType: 'string',
      name: 'description',
      type: 'string',
    },
  ]

  const outputTypes = abi.map(({ type }) => type)
  const data = log.data

  // extract log.data using abi
  const decodedData = web3.eth.abi.decodeParameters(outputTypes, data)
  const params: ProposalCreatedParams = {} as ProposalCreatedParams
  for (let index = 0;index < abi.length;index++) {
    const { name } = abi[index]
    // console.log(`${name}: ${decodedData[index]}`)
    params[name as keyof ProposalCreatedParams] = decodedData[index]
  }

  const functionSig = params.calldatas[0].slice(0, 10)
  console.log({ functionSig, tx: log.transactionHash })

  const serialId = index + 1
  let proposal
  switch (functionSig) {
  case '0x40c10f19':
    proposal = await extractMintParams(serialId, params, log)
    break
  case '0x68573107':
    proposal = await extractBatchMintParams(serialId, params, log)
    break
  case '0x28fe6947':
    proposal = await extractBudgetParams(serialId, params, log)
    break
  case '0x06f3f9e6':
    proposal = await extractUpdateQuorumNumeratorParams(serialId, params, log)
    break
  default:
    console.error('unknown functionSig')
    process.exit(1)
    break
  }

  console.log({ proposal })
  await MintProposal.findOneAndUpdate({ proposalId: proposal.proposalId }, proposal, {
    new: true, // return the updated document rather than the original document
    upsert: true
  })
}

const processProposalExecuted = async (log: Log) => {
  const abi = [
    {
      indexed: false,
      internalType: 'uint256',
      name: 'proposalId',
      type: 'uint256',
    },
  ]

  const outputTypes = abi.map(({ type }) => type)
  const data = log.data

  // extract log.data using abi
  const decodedData = web3.eth.abi.decodeParameters(outputTypes, data)
  const proposalId = decodedData[0]
  console.log('executed: ', { proposalId, tx: log.transactionHash })
 
  await MintProposal.updateOne({ proposalId }, {
    executeTx: log.transactionHash
  })
}

const updateProposals = async () => {
  const filter: Filter = {
    fromBlock: 'earliest',
    toBlock: 'latest',
    address: GOVERNOR_ADDRESS,
    topics: [
      '0x712ae1383f79ac853f8d882153778e0260ef8f03b504e2866e0593e04d2b291f', // ProposalExecuted
    ],
  }

  const logs = await alchemy.core.getLogs(filter)

  for (const log of logs) {
    await processProposalExecuted(log)
  }

  console.log(`updated ${logs.length} proposals`)
}

const runMain = async () => {
  try {
    const db = await connect()

    // await restoreProposals()
    await updateProposals()

    return db.close()
    
  } catch (error) {
    console.log(error)
    process.exit(1)
  }
}

runMain()

async function extractMintParams(serialId: number, params: ProposalCreatedParams, log: Log): Promise<IMintProposal> {
  const mintAbi = {
    inputs: [
      {
        internalType: 'address',
        name: 'to',
        type: 'address'
      },
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256'
      }
    ],
    name: 'mint',
    stateMutability: 'nonpayable',
    type: 'function'
  }

  console.log('call params: ', params.calldatas[0].slice(10))
  const decoded = web3.eth.abi.decodeParameters(
    mintAbi.inputs.map(input => input.type),
    params.calldatas[0].slice(10))
  console.log('decoded mint parameters', decoded)
  const receiver = decoded[0]
  const amount = decoded[1]

  // get block time
  const block = await alchemy.core.getBlock(log.blockNumber)
  const proposeTime = block.timestamp * 1000
  // console.log('tx time:', proposeTime)

  // write to db MintProposal table
  const proposalId = params.proposalId
  return {
    serialId,
    proposalId,
    proposer: params.proposer,
    receiver,
    amount: web3.utils.toBN(amount).div(web3.utils.toBN(web3.utils.toWei('1', 'ether'))).toNumber(),
    receivers: null,
    amounts: null,
    startBlock: params.startBlock,
    endBlock: params.endBlock,
    description: params.description,
    proposeTime,
    proposeTx: log.transactionHash,
    queueTx: null,
    executeTx: null,
    type: 'mint'
  }
}

async function extractBatchMintParams(serialId: number, params: ProposalCreatedParams, log: Log): Promise<IMintProposal> {
  const mintAbi = {
    inputs: [
      {
        internalType: 'address[]',
        name: 'toArray',
        type: 'address[]'
      },
      {
        internalType: 'uint256[]',
        name: 'amountArray',
        type: 'uint256[]'
      }
    ],
    name: 'batchMint',
    stateMutability: 'nonpayable',
    type: 'function'
  }

  // console.log('batchMint call params: ', params.calldatas[0].slice(10))

  const decoded = web3.eth.abi.decodeParameters(
    mintAbi.inputs.map(input => input.type),
    params.calldatas[0].slice(10))
  // console.log('decoded batch mint parameters', decoded)
  const receivers = decoded[0]
  const amounts = decoded[1]

  // get block time
  const block = await alchemy.core.getBlock(log.blockNumber)
  const proposeTime = block.timestamp * 1000
  // console.log('proposeTime:', proposeTime)

  // write to db MintProposal table
  const proposalId = params.proposalId
  return {
    serialId,
    proposalId,
    proposer: params.proposer,
    receiver: null,
    amount: null,
    receivers,
    amounts: amounts.map((amount: string) => web3.utils.toBN(amount).div(web3.utils.toBN(web3.utils.toWei('1', 'ether'))).toNumber()),
    startBlock: params.startBlock,
    endBlock: params.endBlock,
    description: params.description,
    proposeTime,
    proposeTx: log.transactionHash,
    queueTx: null,
    executeTx: null,
    type: 'mint'
  }
}

async function extractBudgetParams(serialId: number, params: ProposalCreatedParams, log: Log): Promise<IMintProposal> {
  // abi of mintAndApprove function
  const mintAbi = {
    inputs: [
      {
        internalType: 'address',
        name: 'spender',
        type: 'address'
      },
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256'
      }
    ],
    name: 'mintAndApprove',
    stateMutability: 'nonpayable',
    type: 'function'
  }

  // console.log('batchMint call params: ', params.calldatas[0].slice(10))

  const decoded = web3.eth.abi.decodeParameters(
    mintAbi.inputs.map(input => input.type),
    params.calldatas[0].slice(10))
  // console.log('decoded batch mint parameters', decoded)
  const spender = decoded[0]
  const amount = decoded[1]

  // get block time
  const block = await alchemy.core.getBlock(log.blockNumber)
  const proposeTime = block.timestamp * 1000
  // console.log('proposeTime:', proposeTime)

  // write to db MintProposal table
  const proposalId = params.proposalId
  return {
    serialId,
    proposalId,
    proposer: params.proposer,
    receiver: spender,
    amount,
    receivers: null,
    amounts: null,
    startBlock: params.startBlock,
    endBlock: params.endBlock,
    description: params.description,
    proposeTime,
    proposeTx: log.transactionHash,
    queueTx: null,
    executeTx: null,
    type: 'budget'
  }
}

async function extractUpdateQuorumNumeratorParams(serialId: number, params: ProposalCreatedParams, log: Log): Promise<IMintProposal> {
  // abi of updateQuorumNumerator function
  const mintAbi = {
    inputs: [
      {
        internalType: 'uint256',
        name: 'newQuorumNumerator',
        type: 'uint256',
      },
    ],
    name: 'updateQuorumNumerator',
    stateMutability: 'nonpayable',
    type: 'function',
  }

  // console.log('batchMint call params: ', params.calldatas[0].slice(10))

  const decoded = web3.eth.abi.decodeParameters(
    mintAbi.inputs.map(input => input.type),
    params.calldatas[0].slice(10))
  // console.log('decoded batch mint parameters', decoded)
  const newQuorumNumerator = decoded[0]

  // get block time
  const block = await alchemy.core.getBlock(log.blockNumber)
  const proposeTime = block.timestamp * 1000
  // console.log('proposeTime:', proposeTime)

  // write to db MintProposal table
  const proposalId = params.proposalId
  return {
    serialId,
    proposalId,
    proposer: params.proposer,
    receiver: null,
    amount: null,
    receivers: null,
    amounts: null,
    startBlock: params.startBlock,
    endBlock: params.endBlock,
    description: params.description,
    proposeTime,
    proposeTx: log.transactionHash,
    queueTx: null,
    executeTx: null,
    updateGovernorSetting: JSON.stringify({updateQuorumNumerator: newQuorumNumerator}),
    type: 'governorSetting'
  }
}