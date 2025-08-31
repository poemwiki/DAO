import { useEffect, useState } from 'react'
import { usePublicClient } from 'wagmi'
import { readGovernorState, parseProposalId } from '@/utils/governor'
import { config } from '@/config'
import { NUMERIC_STATUS_MAP, deriveProposalStatus, getStatusInfo } from '@/utils/proposal'
import type { GovernorStateCode } from '@/utils/governor'
import type { Proposal } from '@/types'

interface UseProposalStatesResult {
  statuses: Record<
    string,
    { code: GovernorStateCode | null; info: ReturnType<typeof getStatusInfo> | null }
  >
  loading: boolean
  error: Error | null
}

export function useProposalStates(proposals: Proposal[] | undefined): UseProposalStatesResult {
  const client = usePublicClient()
  const [statuses, setStatuses] = useState<UseProposalStatesResult['statuses']>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    // If no proposals yet, avoid clearing state repeatedly (prevents render loop)
    if (!proposals || proposals.length === 0) {
      return
    }
    if (!client || !config.contracts.governor) {
      // fallback all
      const map: UseProposalStatesResult['statuses'] = {}
      for (const p of proposals) {
        const fallback = getStatusInfo({ ...p, status: deriveProposalStatus(p) })
        map[p.id] = { code: null, info: fallback }
      }
      setStatuses(map)
      return
    }
    let mounted = true
    ;(async () => {
      try {
        setLoading(true)
        setError(null)
        const results: UseProposalStatesResult['statuses'] = {}
        for (const p of proposals) {
          try {
            // parse first to ensure validity
            parseProposalId(p.proposalId || p.id)
            const numeric = await readGovernorState(client, p.proposalId || p.id)
            results[p.id] = {
              code: numeric,
              info: NUMERIC_STATUS_MAP[numeric] || null,
            }
          } catch (_e) {
            const fallback = getStatusInfo({ ...p, status: deriveProposalStatus(p) })
            results[p.id] = { code: null, info: fallback }
          }
        }
        if (!mounted) return
        setStatuses(results)
      } catch (e) {
        if (!mounted) return
        setError(e as Error)
        // fallback all
        const map: UseProposalStatesResult['statuses'] = {}
        for (const p of proposals) {
          const fallback = getStatusInfo({ ...p, status: deriveProposalStatus(p) })
          map[p.id] = { code: null, info: fallback }
        }
        setStatuses(map)
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [proposals, client])

  return { statuses, loading, error }
}
