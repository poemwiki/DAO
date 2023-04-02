import React, { ReactElement, useEffect, useState } from 'react'
import './pages.css'
import { TabList, Tab, Widget, Tag, Table, Form, type TagProps } from '@web3uikit/core'
import { Link } from 'react-router-dom'
import { etherscanBlockExplorers, allChains } from 'wagmi'
import { useQuery, gql } from '@apollo/client'
import { Heading } from '@chakra-ui/react'
import Proposals from '../components/Proposals'

type ChainOption = 'eth' | '0x1' | 'ropsten' | '0x3' | 'rinkeby' | '0x4' | 'goerli' | '0x5' | 'kovan' | '0x2a' | 'polygon' | '0x89' | 'mumbai' | '0x13881' | 'bsc' | '0x38' | 'bsc testnet' | '0x61' | 'avalanche' | '0xa86a' | 'avalanche testnet' | '0xa869' | 'fantom' | '0xfa' | 'cronos' | '0x19' | 'cronos testnet' | '0x152' | undefined

type ProposalState = 'Passed' | 'Rejected' | 'Ongoing'

const Home = () => {
  const [passRate, setPassRate] = useState(0)
  const [totalP, setTotalP] = useState<number>(0)
  const [counted, setCounted] = useState(0)
  const [voters, setVoters] = useState<string[]>()
  const [proposals, setProposals] = useState<[string, string, ReactElement][]>()
  const [sub, setSub] = useState<boolean>()

  return <>
    <Heading as='h1' textAlign='left'>All Proposals</Heading>
    <Proposals />
  </>

  async function getStatus(proposalId: string): Promise<{
    color: TagProps['color'], text: ProposalState
  } | null> {
    if (data.all.proposals.length <= 0) return null
    const result = data.all.proposals.find((p: { id: string }) => p.id === proposalId)
    if (result !== undefined) {
      if (result.attributes.passed) {
        return { color: 'green', text: 'Passed' }
      } else {
        return { color: 'red', text: 'Rejected' }
      }
    } else {
      return { color: 'blue', text: 'Ongoing' }
    }
  }

}

export default Home
