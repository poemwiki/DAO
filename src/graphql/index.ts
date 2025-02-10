import { gql } from '@apollo/client'
import { config } from '../config'
import type { Proposal } from '../types'

export const PROPOSALS_QUERY = gql`
  query GetProposals {
    proposals(first: 100, orderBy: createdAt, orderDirection: desc) {
      id
      description
      createdAt
      updatedAt
    }
  }
`

export const PROPOSAL_QUERY = gql`
  query GetProposal($id: ID!) {
    proposal(id: $id) {
      id
      description
      createdAt
      updatedAt
    }
  }
`

export const TOKEN_HOLDERS_QUERY = gql`
  query GetTokenHolders {
    members(
      first: 100, 
      orderBy: balance, 
      orderDirection: desc,
      where: {
        id_not: "0x0000000000000000000000000000000000000000",
        balance_gt: "0"
      }
    ) {
      id
      balance
      delegateBalance
      delegate
      updatedAt
    }
  }
`

export const getProposals = async (): Promise<Proposal[]> => {
  console.log('Fetching proposals from:', config.api.baseUrl)
  const response = await fetch(config.api.baseUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: PROPOSALS_QUERY.loc?.source.body,
    }),
  })
  const { data } = await response.json()
  console.log('Proposals data:', data)
  return data.proposals
}

export const getProposal = async (id: string): Promise<Proposal> => {
  console.log('Fetching proposal:', id)
  const response = await fetch(config.api.baseUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: PROPOSAL_QUERY.loc?.source.body,
      variables: { id },
    }),
  })
  const { data } = await response.json()
  console.log('Proposal data:', data)
  return data.proposal
}
