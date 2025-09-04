export const PROPOSAL_STATUS = {
  ACTIVE: 'active',
  CLOSED: 'closed',
  PENDING: 'pending',
} as const

export const PROPOSAL_TYPE = {
  MINT: 'mint',
  BUDGET: 'budget',
  BATCH_MINT: 'batchMint',
  GOVERNOR_SETTING: 'governorSetting',
} as const

export const ROUTES = {
  HOME: '/',
  PROPOSAL: '/proposal/:id',
  CREATE_PROPOSAL: '/proposals/create',
} as const

export const CHAIN_IDS = {
  MAINNET: '1',
  TESTNET: '5',
} as const

export const ZERO_ADDRESS
  = '0x0000000000000000000000000000000000000000' as const
