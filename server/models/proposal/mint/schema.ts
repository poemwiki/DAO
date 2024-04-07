import { Schema, model } from 'mongoose'

export const MINT_PROPOSAL_MODEL_NAME = 'MintProposal'

export interface IMintProposal {
  serialId: number,
  proposalId: string,
  type: 'mint' | 'batchMint' | 'governorSetting' | 'budget',
  proposer: string,
  receiver: string|null,
  amount: number|null,
  startBlock: string,
  endBlock: string,
  receivers: string[],
  amounts: [string],
  description: string,
  proposeTime: number,
  proposeTx: string,
  queueTx: string|null,
  executeTx: string|null,
  updateGovernorSetting?: string
}

const mintProposalSchema = new Schema<IMintProposal>({
  serialId: { type: Number, unique: true },
  type: { type: String, enum: ['mint', 'batchMint', 'governorSetting', 'budget'], required: true },
  proposalId: String,
  proposer: String,
  receiver: String,
  amount: Number,
  receivers: [String],
  amounts: [String],
  startBlock: String,
  endBlock: String,
  description: String,
  proposeTime: Number,
  proposeTx: String,
  queueTx: String,
  executeTx: String,
})

export const MintProposal = model<IMintProposal>(
  MINT_PROPOSAL_MODEL_NAME,
  mintProposalSchema,
  MINT_PROPOSAL_MODEL_NAME
)
