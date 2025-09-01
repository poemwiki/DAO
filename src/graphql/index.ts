import { fetchGraphQL } from '../utils/graphql'
import type { Proposal, Member } from '../types'

const PROPOSALS_QUERY = `
  query GetProposals {
    proposals(first: 100, orderBy: createdAt, orderDirection: desc) {
      id
      proposalId
      description
      canceled
      executed
      startBlock
      endBlock
      proposeTx
      executeTx
      executeBlock
      executeTime
      cancelTx
      cancelBlock
      cancelTime
      createdAt
      updatedAt
      targets
      calldatas
      signatures
    }
  }
`

const PROPOSAL_QUERY = `
  query GetProposal($id: ID!) {
    proposal(id: $id) {
      id
      proposalId
      description
      canceled
      executed
      startBlock
      endBlock
      proposeTx
      executeTx
      executeBlock
      executeTime
      cancelTx
      cancelBlock
      cancelTime
      createdAt
      updatedAt
      proposer { id }
      targets
      calldatas
      signatures
      voteCasts(orderBy: createdAt, orderDirection: asc) {
        id
        voter { id }
        support
        weight
        reason
        createdAt
        tx
      }
      proposalActivities(orderBy: createdAt, orderDirection: asc) {
        id
        activity
        member { id }
        createdAt
        tx
      }
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

export interface TokenHoldersResponseData {
  members: Member[]
}

export interface ProposalsResponseData {
  proposals: Proposal[]
}

export interface ProposalResponseData {
  proposal: Proposal
}

export async function getTokenHolders(): Promise<TokenHoldersResponseData> {
  const query = TOKEN_HOLDERS_QUERY
  const response = await fetchGraphQL<TokenHoldersResponseData>(query)
  return response.data
}

export async function getProposals(): Promise<ProposalsResponseData> {
  const query = PROPOSALS_QUERY
  const response = await fetchGraphQL<ProposalsResponseData>(query)
  return response.data
}

export async function getProposal(id: string): Promise<ProposalResponseData> {
  const query = PROPOSAL_QUERY
  const response = await fetchGraphQL<ProposalResponseData>(query, { id })
  return response.data
}

export { TOKEN_HOLDERS_QUERY, PROPOSALS_QUERY, PROPOSAL_QUERY }
