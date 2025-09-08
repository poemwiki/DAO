export type RequiredNotNull<T> = {
  [P in keyof T]: NonNullable<T[P]>
}

export type Ensure<T, K extends keyof T> = T & RequiredNotNull<Pick<T, K>>
export type RequiredPick<T, K extends keyof T> = Required<Pick<T, K>>

export interface ProposalActivity {
  id: string
  activity: 'CREATE' | 'CANCEL' | 'EXECUTE'
  member: { id: string }
  createdAt: string
  tx: string
}

export interface VoteCastEntity {
  id: string
  voter: { id: string }
  support: 0 | 1 | 2 // 0 against,1 for,2 abstain
  weight: string
  reason: string
  createdAt: string
  tx: string
  proposal?: MemberCreatedProposal
}

export interface Proposal {
  id: string
  proposalId?: string
  description: string
  proposer?: { id: string }
  voteCasts?: VoteCastEntity[]
  proposalActivities?: ProposalActivity[]
  status?:
    | 'pending'
    | 'active'
    | 'canceled'
    | 'defeated'
    | 'succeeded'
    | 'queued'
    | 'expired'
    | 'executed'
    | 'closed'
  canceled?: boolean
  executed?: boolean
  startBlock?: string
  endBlock?: string
  proposeTx?: string
  executeTx?: string | null
  executeBlock?: string | null
  executeTime?: string | null
  cancelTx?: string | null
  cancelBlock?: string | null
  cancelTime?: string | null
  createdAt: string
  updatedAt: string
  /**
   * Parallel arrays describing each action in the proposal exactly as passed to Governor.propose / execute.
   * Length of all four arrays must match on-chain.
   *
   * targets[i]    : contract address to call.
   * values[i]     : (stringified uint256) native token amount (wei) to send with the call. Usually "0"; non‑zero only if the action transfers ETH.
   * calldatas[i]  : ABI‑encoded function call data (bytes hex string beginning 0x...) OR empty 0x if using signatures[] with separate encoding.
   * signatures[i] : (Optional legacy OZ pattern) function signature like "transfer(address,uint256)"; if present and calldatas[i] is 0x, UI/code may need to encode before execution.
   */
  targets?: string[]
  values?: string[]
  calldatas: string[]
  signatures: string[]
}

// Narrow shape returned by MEMBER_PROPOSALS_QUERY (creation list per member)
export type MemberCreatedProposal = Pick<Proposal, 'id' | 'proposalId' | 'description' | 'canceled' | 'executed' | 'createdAt' | 'updatedAt' | 'calldatas' | 'signatures'> & { proposer?: { id: string } }

export interface BlockEstimateInfo {
  timestamp?: number | string
  isEstimated?: boolean
}

export interface Member {
  /** address */
  id: string
  balance: string
  /** the address that the member delegate to */
  delegate: string
  /** the balance that the member be delegated, including self delegate */
  delegateBalance: string
  /** last updated timestamp (subgraph) */
  updatedAt?: string
}

export interface Transfer {
  id: string
  from: { id: string }
  to: { id: string }
  value: string
  createdAt: string
  tx: string
}
