import { useState, useEffect } from 'react'
import { getProposal } from '../api'
import type { Proposal } from '../types'

export const useProposal = (id: string) => {
  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchProposal = async () => {
      try {
        setLoading(true)
        const data = await getProposal(id)
        setProposal(data)
      } catch (err) {
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchProposal()
    }
  }, [id])

  return { proposal, loading, error }
}
