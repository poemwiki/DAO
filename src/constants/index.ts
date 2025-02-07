export const PROPOSAL_STATUS = {
  ACTIVE: 'active',
  CLOSED: 'closed',
  PENDING: 'pending',
} as const

export const ROUTES = {
  HOME: '/',
  PROPOSAL: '/proposal/:id',
} as const

export const CHAIN_IDS = {
  MAINNET: '1',
  TESTNET: '5',
} as const
