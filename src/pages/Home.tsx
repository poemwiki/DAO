import React, { ReactElement, useEffect, useState } from 'react'
import './pages.css'
import { TabList, Tab, Widget, Tag, Table, Form, type TagProps } from '@web3uikit/core'
import { Link } from 'react-router-dom'

type ChainOption = 'eth' | '0x1' | 'ropsten' | '0x3' | 'rinkeby' | '0x4' | 'goerli' | '0x5' | 'kovan' | '0x2a' | 'polygon' | '0x89' | 'mumbai' | '0x13881' | 'bsc' | '0x38' | 'bsc testnet' | '0x61' | 'avalanche' | '0xa86a' | 'avalanche testnet' | '0xa869' | 'fantom' | '0xfa' | 'cronos' | '0x19' | 'cronos testnet' | '0x152' | undefined

type ProposalState = 'Passed' | 'Rejected' | 'Ongoing'

const Home = () => {
  const [passRate, setPassRate] = useState(0)
  const [totalP, setTotalP] = useState<number>(0)
  const [counted, setCounted] = useState(0)
  const [voters, setVoters] = useState<string[]>()
  const [proposals, setProposals] = useState<[string, string, ReactElement][]>()
  const [sub, setSub] = useState<boolean>()

  const isInitialized = false

  async function createProposal(newProposal: string) {
    const options = {
      contractAddress: '0xF304Ddf294d05c80995FB0702b40DfEA8E48582a',
      functionName: 'createProposal',
      abi: [
        {
          inputs: [
            {
              internalType: 'string',
              name: '_description',
              type: 'string',
            },
            {
              internalType: 'address[]',
              name: '_canVote',
              type: 'address[]',
            },
          ],
          name: 'createProposal',
          outputs: [],
          stateMutability: 'nonpayable',
          type: 'function',
        },
      ],
      params: {
        _description: newProposal,
        _canVote: voters,
      },
    }


    await contractProcessor.fetch({
      params: options,
      onSuccess: () => {
        console.log('Proposal Succesful')
        setSub(false)
      },
      onError: (error) => {
        alert(error.message)
        setSub(false)
      },
    })


  }


  async function getStatus(proposalId: string): Promise<{
    color: TagProps['color'], text: ProposalState
  }> {
    // const ProposalCounts = Moralis.Object.extend('ProposalCounts')
    // const query = new Moralis.Query(ProposalCounts)
    // query.equalTo('uid', proposalId)
    const result = []//await query.first()
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

  useEffect(() => {
    if (isInitialized) {


      const fetchTokenIdOwners = async () => {
        const options = {
          address: '0x2953399124F0cBB46d2CbACD8A89cF0599974963',
          token_id:
            '34885103611559094078416375598166902696017567311370712658413208238551126245396',
          chain: 'mumbai' as ChainOption,
        }
        // const tokenIdOwners = await Web3Api.token.getTokenIdOwners(options)
        // if (tokenIdOwners) {
        //   const addresses = tokenIdOwners.result?.map((e) => e.owner_of)
        //   setVoters(addresses)
        // }
      }


      fetchTokenIdOwners()
      getProposals()
      getPassRate()

    }

    async function getProposals() {
      // const Proposals = Moralis.Object.extend('Proposals')
      // const query = new Moralis.Query(Proposals)
      // query.descending('uid_decimal')
      const results = []//await query.find()
      const table = await Promise.all(
        results.map(async (e, index): Promise<[string, string, ReactElement]> => [
          e.attributes.uid,
          e.attributes.description,
          <Link to="/proposal" key={index} state={{
            description: e.attributes.description,
            color: (await getStatus(e.attributes.uid)).color,
            text: (await getStatus(e.attributes.uid)).text,
            id: e.attributes.uid,
            proposer: e.attributes.proposer

          }}>
            <Tag
              color={(await getStatus(e.attributes.uid)).color}
              text={(await getStatus(e.attributes.uid)).text}
            />
          </Link>,
        ])
      )
      setProposals(table)
      setTotalP(results.length)
    }


    async function getPassRate() {
      // const ProposalCounts = Moralis.Object.extend('ProposalCounts')
      // const query = new Moralis.Query(ProposalCounts)
      const results = []//await query.find()
      let votesUp = 0

      results.forEach((e) => {
        if (e.attributes.passed) {
          votesUp++
        }
      })

      setCounted(results.length)
      setPassRate((votesUp / results.length) * 100)
    }
  }, [isInitialized])


  return (
    <>
      <div className="content">

        {proposals && (
          <div className="tabContent">
            Governance Overview
            <div className="widgets">
              <Widget
                info={totalP as unknown as string}
                title="Proposals Created"
              >
                <div className="extraWidgetInfo">
                  <div className="extraTitle">Pass Rate</div>
                  <div className="progress">
                    <div
                      className="progressPercentage"
                      style={{ width: `${passRate}%` }}
                    ></div>
                  </div>
                </div>
              </Widget>
              <Widget info={voters?.length + ''} title="Eligible Voters" />
              <Widget info={totalP - counted + ''} title="Ongoing Proposals" />
            </div>
            Recent Proposals
            <div style={{ marginTop: '30px' }}>
              <Table
                columnsConfig="10% 70% 20%"
                data={proposals}
                header={[
                  <span key={0}>ID</span>,
                  <span key={1}>Description</span>,
                  <span key={2}>Status</span>,
                ]}
                pageSize={5}
              />
            </div>

            <Form
              id='submit-proposal'
              buttonConfig={{
                isLoading: sub,
                loadingText: 'Submitting Proposal',
                text: 'Submit',
                theme: 'secondary',
              }}
              data={[
                {
                  inputWidth: '100%',
                  name: 'New Proposal',
                  type: 'textarea',
                  validation: {
                    required: true,
                  },
                  value: '',
                },
              ]}
              onSubmit={(e) => {
                setSub(true)
                // createProposal(e.data[0].inputResult)
              }}
              title="Create a New Proposal"
            />


          </div>
        )}
      </div>
      <div className="voting"></div>
    </>
  )
}

export default Home
