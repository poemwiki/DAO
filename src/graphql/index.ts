import { fetchGraphQL } from '../utils/graphql'
import type { Proposal, Member } from '../types'

const PROPOSALS_QUERY = `
  query GetProposals {
    proposals(first: 100, orderBy: createdAt, orderDirection: desc) {
      id
      description
      createdAt
      updatedAt
    }
  }
`

const PROPOSAL_QUERY = `
  query GetProposal($id: ID!) {
    proposal(id: $id) {
      id
      description
      createdAt
      updatedAt
    }
  }
`

const TOKEN_HOLDERS_QUERY = `
  query GetTokenHolders {
    members(
      first: 100
      orderBy: balance
      orderDirection: desc
      where: { id_not: "0x0000000000000000000000000000000000000000", balance_gt: "0" }
    ) {
      id
      balance
      delegateBalance
      delegate
      updatedAt
    }
  }
`

interface TokenHoldersResponse {
  data: {
    members: Member[]
  }
}

export interface ProposalsResponseData {
  proposals: Proposal[]
}

interface ProposalResponse {
  data: {
    proposal: Proposal
  }
}

export async function getTokenHolders() {
  const query = TOKEN_HOLDERS_QUERY
  const response = await fetchGraphQL<TokenHoldersResponse>(query)
  return response.data
}

export async function getProposals(): Promise<ProposalsResponseData> {
  const query = PROPOSALS_QUERY
  const response = await fetchGraphQL<ProposalsResponseData>(query)
  return response.data
}

export async function getProposal(id: string) {
  const query = PROPOSAL_QUERY
  const response = await fetchGraphQL<ProposalResponse>(query, { id })
  return response.data
}

export { TOKEN_HOLDERS_QUERY, PROPOSALS_QUERY, PROPOSAL_QUERY }
