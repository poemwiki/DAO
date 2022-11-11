import React, { useState, useEffect } from 'react'
import './pages.css'
import { Tag, Widget, Tooltip, Form, Table } from '@web3uikit/core'
import { Checkmark, ArrowCircleDown, ChevronLeft } from '@web3uikit/icons'
import { Link } from 'react-router-dom'
import { useLocation } from 'react-router'

type Vote = { votesUp: string, votesDown: string }
type Proposal = {
  vote: Vote, votesDown: string, votesUp: string,
  voter: string, votedFor: string,
}

const Proposal = () => {
  const { state: proposalDetails } = useLocation()
  const [latestVote, setLatestVote] = useState<Vote>()
  const [percUp, setPercUp] = useState('0')
  const [percDown, setPercDown] = useState('0')
  const [votes, setVotes] = useState<any[]>([])
  const [sub, setSub] = useState(false)
  const isInitialized = false

  useEffect(() => {
    if (isInitialized) {

      getVotes()

    }

    async function getVotes() {
      // const query = new Moralis.Query(Votes)
      // query.equalTo('proposal', proposalDetails.id)
      // query.descending('createdAt')
      const results: Array<{ attributes: Proposal }> = [] // await query.find()
      if (results.length > 0) {
        setLatestVote(results[0].attributes.vote)
        setPercDown(
          (
            (Number(results[0].attributes.votesDown) /
              (Number(results[0].attributes.votesDown) +
                Number(results[0].attributes.votesUp))) *
            100
          ).toFixed(0)
        )
        setPercUp(
          (
            (Number(results[0].attributes.votesUp) /
              (Number(results[0].attributes.votesDown) +
                Number(results[0].attributes.votesUp))) *
            100
          ).toFixed(0)
        )
      }


      const votesDirection = results.map((e) => [
        e.attributes.voter,
        e.attributes.votedFor
          ? <Checkmark color="#2cc40a" height={24} />
          : <ArrowCircleDown color="#d93d3d" height={24} />
      ])

      setVotes(votesDirection)

    }
  }, [isInitialized])



  async function castVote(upDown: boolean) {

    const options = {
      contractAddress: '0xF304Ddf294d05c80995FB0702b40DfEA8E48582a',
      functionName: 'voteOnProposal',
      abi: [
        {
          inputs: [
            {
              internalType: 'uint256',
              name: '_id',
              type: 'uint256',
            },
            {
              internalType: 'bool',
              name: '_vote',
              type: 'bool',
            },
          ],
          name: 'voteOnProposal',
          outputs: [],
          stateMutability: 'nonpayable',
          type: 'function',
        },
      ],
      params: {
        _id: proposalDetails.id,
        _vote: upDown,
      },
    }


  }

  return (
    <>
      <div className="contentProposal">
        <div className="proposal">
          <Link to="/">
            <div className="backHome">
              <ChevronLeft fill="#ffffff" height={20} />
              Overview
            </div>
          </Link>
          <div>{proposalDetails.description}</div>
          <div className="proposalOverview">
            <Tag color={proposalDetails.color} text={proposalDetails.text} />
            <div className="proposer">
              <span>Proposed By </span>
              <Tooltip content={proposalDetails.proposer} position={'top'}>
                {/* <Blockie seed={proposalDetails.proposer} /> */}
              </Tooltip>
            </div>
          </div>
        </div>
        {latestVote && (
          <div className="widgets">
            <Widget info={latestVote.votesUp} title="Votes For">
              <div className="extraWidgetInfo">
                <div className="extraTitle">{percUp}%</div>
                <div className="progress">
                  <div
                    className="progressPercentage"
                    style={{ width: `${percUp}%` }}
                  ></div>
                </div>
              </div>
            </Widget>
            <Widget info={latestVote.votesDown} title="Votes Against">
              <div className="extraWidgetInfo">
                <div className="extraTitle">{percDown}%</div>
                <div className="progress">
                  <div
                    className="progressPercentage"
                    style={{ width: `${percDown}%` }}
                  ></div>
                </div>
              </div>
            </Widget>
          </div>
        )}
        <div className="votesDiv">
          <Table
            columnsConfig="90% 10%"
            data={votes}
            header={[<span key={0}>Address</span>, <span key={1}>Vote</span>]}
            pageSize={5}
          />

          <Form
            id='vote'
            isDisabled={proposalDetails.text !== 'Ongoing'}
            buttonConfig={{
              isLoading: sub,
              loadingText: 'Casting Vote',
              text: 'Vote',
              theme: 'secondary',
            }}
            data={[
              {
                value: '',
                inputWidth: '100%',
                name: 'Cast Vote',
                options: ['For', 'Against'],
                type: 'radios',
                validation: {
                  required: true,
                },
              },
            ]}
            onSubmit={(e) => {
              if (e.data[0].inputResult === 'For') {
                castVote(true)
              } else {
                castVote(false)
              }
              setSub(true)
            }}
            title="Cast Vote"
          />
        </div>
      </div>
      <div className="voting"></div>
    </>
  )
}

export default Proposal
