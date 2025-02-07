import React from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@apollo/client'
import { PROPOSAL_QUERY } from '@/graphql'
import { ROUTES } from '@/constants'

export default function Proposal() {
  const { id } = useParams()
  const { loading, error, data } = useQuery(PROPOSAL_QUERY, {
    variables: { id },
  })

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>
  if (!data?.proposal) return <div>Proposal not found</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link to={ROUTES.HOME} className="text-sm text-muted-foreground hover:text-primary">
          ← Back to proposals
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold mb-6">{data.proposal.serialId}</h1>
        <div className="space-y-6">
          <div className="p-4 border rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Description</h2>
            <p className="text-muted-foreground">{data.proposal.description}</p>
          </div>

          <div className="p-4 border rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Status</h2>
            <p className="text-muted-foreground">{data.proposal.status}</p>
          </div>

          <div className="p-4 border rounded-lg">
            <h2 className="text-xl font-semibold mb-2">Timeline</h2>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Created: {new Date(data.proposal.createdAt).toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground">
                Updated: {new Date(data.proposal.updatedAt).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
