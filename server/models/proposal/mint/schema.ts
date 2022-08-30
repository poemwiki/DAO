import { Schema, model } from 'mongoose'

export const MINT_PROPOSAL_MODEL_NAME = 'MintProposal'

export interface IMintProposal {
  serialId: number,
  proposalId: string,
  type: 'mint' | 'batchMint',
  proposer: string,
  receiver: string,
  amount: string,
  receivers: string[],
  amounts: [string],
  description: string,
  proposeTime: number,
  proposeTx: string,
  queueTx: string,
  executeTx: string
}

const mintProposalSchema = new Schema<IMintProposal>({
  serialId: { type: Number, unique: true },
  type: { type: String, enum: ['mint', 'batchmint'], required: true },
  proposalId: String,
  proposer: String,
  receiver: String,
  amount: String,
  receivers: [String],
  amounts: [String],
  description: String,
  proposeTime: Number,
  proposeTx: String,
  queueTx: String,
  executeTx: String
})

export const MintProposal = model<IMintProposal>(
  MINT_PROPOSAL_MODEL_NAME,
  mintProposalSchema,
  MINT_PROPOSAL_MODEL_NAME
)
