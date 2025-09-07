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
  MEMBER: '/member/:address',
} as const

export const CHAIN_IDS = {
  MAINNET: '1',
  TESTNET: '5',
} as const

export const ZERO_ADDRESS
  = '0x0000000000000000000000000000000000000000' as const

// GraphQL pagination constants
export const GRAPHQL_PAGE_SIZES = {
  DEFAULT: 50,
  LARGE: 100,
  MAX_TRANSFERS: 1000,
  MAX_VOTES: 1000,
  TOKEN_HOLDERS: 100,
} as const
