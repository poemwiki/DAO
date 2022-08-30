import { IMintProposal, MintProposal } from './schema'

function getMintProposals(offset: number, limit: number) {
  return new Promise((resolve, reject) => {
    MintProposal.find()
      .sort({ _id: -1 })
      .skip(offset)
      .limit(limit)
      .exec((err, proposals) => {
        if (err) reject(err)
        resolve(proposals)
      })
  })
}


function updateProposal(proposal: IMintProposal) {
  return new Promise((resolve, reject) => {
    MintProposal.findOneAndUpdate({ proposalId: proposal.proposalId }, proposal)
      .then(r => resolve(r))
      .catch((err) => reject(err))
  })
}



function findProposal(proposal: IMintProposal) {
  return new Promise((resolve, reject) => {
    MintProposal.findOne(proposal).exec((err, found) => {
      if (err) reject(err)
      resolve(found)
    })
  })
}

function createBatchMintProposal(
  proposalId: IMintProposal['proposalId'],
  proposer: IMintProposal['proposer'],
  receivers: IMintProposal['receivers'],
  amounts: IMintProposal['amounts'],
  description: IMintProposal['description'],
  proposeTime: IMintProposal['proposeTime'],
  proposeTx: IMintProposal['proposeTx']
) {
  return new Promise((resolve, reject) => {
    MintProposal.findOne()
      .select({ serialId: 1 })
      .sort({ serialId: -1 })
      .exec((err, pmax) => {
        if (err) reject(err)
        let serialId = 1
        if (pmax !== undefined && pmax !== null) {
          serialId = pmax.serialId + 1
        }
        new MintProposal({
          type: 'batchmint',
          proposalId,
          serialId,
          proposer,
          receivers,
          amounts,
          description,
          proposeTx,
          proposeTime
        })
          .save()
          .then(r => resolve(r))
          .catch((err) => reject(err))
      })
  })
}

function createMintProposal(
  proposalId: IMintProposal['proposalId'],
  proposer: IMintProposal['proposer'],
  receiver: IMintProposal['receivers'],
  amount: IMintProposal['amounts'],
  description: IMintProposal['description'],
  proposeTime: IMintProposal['proposeTime'],
  proposeTx: IMintProposal['proposeTx']
) {
  return new Promise((resolve, reject) => {
    MintProposal.findOne()
      .select({ serialId: 1 })
      .sort({ serialId: -1 })
      .exec((err, pmax) => {
        if (err) reject(err)
        let serialId = 1
        if (pmax !== undefined && pmax !== null) {
          serialId = pmax.serialId + 1
        }
        new MintProposal({
          type: 'mint',
          proposalId,
          serialId,
          proposer,
          receiver,
          amount,
          description,
          proposeTx,
          proposeTime
        })
          .save()
          .then(r => resolve(r))
          .catch((err) => reject(err))
      })
  })
}

export default {
  getMintProposals,
  createMintProposal,
  findProposal,
  updateProposal,
  createBatchMintProposal
}
