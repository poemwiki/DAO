export interface Proposal {
  id: string
  description: string
  status: 'active' | 'closed' | 'pending'
  createdAt: string
  updatedAt: string
}

export interface Member {
  /** address */
  id: string
  balance: string
  /** the address that the member delegate to */
  delegate: string
  /** the balance that the member be delegated, including self delegate */
  delegateBalance: string
}
