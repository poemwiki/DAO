import type { Member, MemberCreatedProposal, Proposal, Transfer, VoteCastEntity } from '../types'
import { GRAPHQL_PAGE_SIZES } from '../constants'
import { fetchGraphQL } from '../utils/graphql'

const PROPOSALS_QUERY = `
  query GetProposals {
    proposals(first: ${GRAPHQL_PAGE_SIZES.LARGE}, orderBy: createdAt, orderDirection: desc) {
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
      values
      calldatas
      signatures
      voteCasts { id }
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
      values
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
      first: ${GRAPHQL_PAGE_SIZES.TOKEN_HOLDERS}
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

const MEMBER_QUERY = `
  query GetMember($id: ID!) {
    member(id: $id) {
      id
      balance
      delegateBalance
      delegate
      updatedAt
    }
  }
`

const MEMBER_TRANSFERS_QUERY = `
  query GetMemberTransfers($address: String!, $skip: Int! = 0, $first: Int! = ${GRAPHQL_PAGE_SIZES.LARGE}) {
    transfersFrom: transfers(
      where: { from: $address }
      orderBy: createdAt
      orderDirection: desc
      skip: $skip
      first: $first
    ) {
      id
      from { id }
      to { id }
      value
      createdAt
      tx
    }
    transfersTo: transfers(
      where: { to: $address }
      orderBy: createdAt
      orderDirection: desc
      skip: $skip
      first: $first
    ) {
      id
      from { id }
      to { id }
      value
      createdAt
      tx
    }
  }
`

const MEMBER_VOTES_QUERY = `
  query GetMemberVotes($address: String!, $skip: Int! = 0, $first: Int! = ${GRAPHQL_PAGE_SIZES.LARGE}) {
    voteCasts(
      where: { voter: $address }
      orderBy: createdAt
      orderDirection: desc
      skip: $skip
      first: $first
    ) {
      id
      voter { id }
      support
      weight
      reason
      createdAt
      tx
      proposal {
        id
        proposalId
        description
        canceled
        executed
        createdAt
        updatedAt
        calldatas
        signatures
        proposer { id }
      }
    }
  }
`

const MEMBER_PROPOSALS_QUERY = `
  query GetMemberProposals($address: String!) {
    proposals(
      where: { proposer: $address }
      orderBy: createdAt
      orderDirection: desc
    ) {
      id
      proposalId
      description
      canceled
      executed
      createdAt
      updatedAt
      calldatas
      signatures
      proposer { id }
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

export interface MemberResponseData {
  member: Member | null
}

export interface MemberTransfersResponseData {
  transfersFrom: Transfer[]
  transfersTo: Transfer[]
}

export interface MemberVotesResponseData {
  voteCasts: VoteCastEntity[]
}

export interface MemberProposalsResponseData {
  proposals: MemberCreatedProposal[]
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

export async function getMember(id: string): Promise<MemberResponseData> {
  const query = MEMBER_QUERY
  const response = await fetchGraphQL<MemberResponseData>(query, { id })
  return response.data
}

export async function getMemberTransfers(address: string, skip = 0, first: number = GRAPHQL_PAGE_SIZES.LARGE): Promise<MemberTransfersResponseData> {
  const query = MEMBER_TRANSFERS_QUERY
  const response = await fetchGraphQL<MemberTransfersResponseData>(query, { address, skip, first })
  return response.data
}

export async function getMemberVotes(address: string, skip = 0, first: number = GRAPHQL_PAGE_SIZES.LARGE): Promise<MemberVotesResponseData> {
  const query = MEMBER_VOTES_QUERY
  const response = await fetchGraphQL<MemberVotesResponseData>(query, { address, skip, first })
  return response.data
}

export async function getMemberProposals(address: string): Promise<MemberProposalsResponseData> {
  const query = MEMBER_PROPOSALS_QUERY
  const response = await fetchGraphQL<MemberProposalsResponseData>(query, { address })
  return response.data
}

export { MEMBER_PROPOSALS_QUERY, MEMBER_QUERY, MEMBER_TRANSFERS_QUERY, MEMBER_VOTES_QUERY, PROPOSAL_QUERY, PROPOSALS_QUERY, TOKEN_HOLDERS_QUERY }
