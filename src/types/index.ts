export interface Proposal {
  id: string
  title: string
  description: string
  status: 'active' | 'closed' | 'pending'
  createdAt: string
  updatedAt: string
}

export interface User {
  address: string
  balance: string
}
