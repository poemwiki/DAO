import React, { ReactElement, useEffect, useState } from 'react'
import { gql } from '@apollo/client'
import { useQuery } from '@apollo/client/react/hooks'
import { OrderedList, ListItem, ListIcon, Box, Image, Badge, Heading } from '@chakra-ui/react'
import { SlClock } from 'react-icons/sl'
import { short, timestampToDate, trimDescription } from '../libs/utils'

const GET_INDEX_DATA = gql`
    fragment MemberDetail on Member {
    id
    block
    delegate
    balance
    delegateBalance
    updatedAt
  }

  fragment ProposalDetail on Proposal {
    id
    description
    createdAt
    proposer {
      ...MemberDetail
    }
    voteCasts {
      id
      voter {id}
      support
      weight
      reason
      createdAt
      tx
    }
    proposalActivities {
      id
      activity
      member {id}
      createdAt
    }
    block
  }

  query all {
    proposals {
      ...ProposalDetail
    }
    members {
      ...MemberDetail
    }
  }
`

export function Porposal({ proposal }: { proposal: Proposal }) {
  console.log('proposer', proposal, proposal.proposer)
  return (
    <Box borderWidth='1px' borderRadius='lg' overflow='hidden' width='full'>
      <Box p='6'>
        <Box display='flex' alignItems='baseline'>
          <Badge borderRadius='full' px='2' colorScheme='teal'>
            <ListIcon as={SlClock} color='green.500' />
          </Badge>
          <Box
            color='gray.500'
            fontWeight='semibold'
            letterSpacing='wide'
            fontSize='xs'
            textTransform='uppercase'
            ml='2'
          >
            {short(proposal.id)} &bull; {timestampToDate(proposal.createdAt as unknown as string)}
          </Box>
        </Box>

        <Box
          mt='1'
          fontWeight='semibold'
          as='h4'
          lineHeight='tight'
          noOfLines={1}
          textAlign='left'
        >
          {trimDescription(proposal.description)}
        </Box>
      </Box>
    </Box>
  )
}

interface Member {
  id: string
  block: number
  delegate: string
  balance: number
  delegateBalance: number
  updatedAt: number
}
interface Proposal {
  id: string
  description: string
  proposer: Member
  createdAt: number
  block: number
}
interface IndexData {
  members: Member[]
  proposals: Proposal[]
}

export default function Proposals() {
  const { loading, error, data } = useQuery<IndexData>(GET_INDEX_DATA)
  console.log({ loading, error, data })
  if (loading) return <p>Loading...</p>
  if (error) return <p className='error'>{error.message}</p>
  console.log('data', { data })

  if (!data) return <p>暂时没有提案</p>
  const { members, proposals } = data

  return (<Box display="flex" py={4} justifyContent="space-between">
    <OrderedList styleType="none" w="65%">
      {proposals.map(proposal => (
        <ListItem key={proposal.id} display="flex">
          <Porposal proposal={proposal} />
        </ListItem>
      ))}
    </OrderedList>
    <Box w="30%" borderRadius='lg' border='1px' borderColor='gray.200'>
      <p>About Proposals</p>
    </Box>
  </Box>)
}