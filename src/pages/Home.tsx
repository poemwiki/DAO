import React from 'react'
import { useQuery } from '@apollo/client'
import { Link, useNavigate } from 'react-router-dom'
import { PROPOSALS_QUERY } from '@/graphql'
import { ROUTES } from '@/constants'
import { config } from '@/config'
import type { Proposal } from '@/types'

export default function Home() {
  const navigate = useNavigate()
  const { loading, error, data } = useQuery<{ proposals: Proposal[] }>(PROPOSALS_QUERY, {
    onError: error => {
      console.error('GraphQL error:', error)
    },
    onCompleted: data => {
      console.log('GraphQL data:', data)
    },
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-lg">Loading proposals...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-lg text-red-500">Error loading proposals</div>
          <div className="text-sm text-muted-foreground">{error.message}</div>
        </div>
      </div>
    )
  }

  // Add debug log
  console.log('Rendering Home with data:', { config, data })

  return (
    <div className="space-y-8">
      {/* DAO Overview */}
      <section className="space-y-4">
        <h1 className="text-4xl font-bold">{config.app.name}</h1>
        <p className="text-xl text-muted-foreground">{config.app.description}</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-6 border rounded-lg bg-card">
            <div className="text-2xl font-bold">{data?.proposals?.length || 0}</div>
            <div className="text-sm text-muted-foreground">Total Proposals</div>
          </div>
          <div className="p-6 border rounded-lg bg-card">
            <div className="text-2xl font-bold">
              {data?.proposals?.filter((p: Proposal) => p.status === 'active').length || 0}
            </div>
            <div className="text-sm text-muted-foreground">Active Proposals</div>
          </div>
          <div className="p-6 border rounded-lg bg-card">
            <div className="text-2xl font-bold">
              {data?.proposals?.filter((p: Proposal) => p.status === 'closed').length || 0}
            </div>
            <div className="text-sm text-muted-foreground">Closed Proposals</div>
          </div>
        </div>
      </section>

      {/* Proposals List */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Governance Proposals</h2>
          <button
            onClick={() => navigate(ROUTES.CREATE_PROPOSAL)}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
          >
            Create Proposal
          </button>
        </div>
        <div className="grid gap-4">
          {data?.proposals?.map((proposal: Proposal) => (
            <Link
              key={proposal.id}
              to={ROUTES.PROPOSAL.replace(':id', proposal.id)}
              className="block p-6 border rounded-lg hover:border-primary transition-colors bg-card"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="text-xl font-semibold">{proposal.serialId}</h3>
                  <p className="text-muted-foreground line-clamp-2">{proposal.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${proposal.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : proposal.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                  >
                    {proposal.status}
                  </span>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                <span>Created: {new Date(proposal.createdAt).toLocaleDateString()}</span>
                <span>•</span>
                <span>Updated: {new Date(proposal.updatedAt).toLocaleDateString()}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
