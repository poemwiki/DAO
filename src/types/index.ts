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
  support: number // 0 against,1 for,2 abstain
  weight: string
  reason: string
  createdAt: string
  tx: string
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
  targets?: string[]
  calldatas?: string[]
  signatures?: string[]
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
