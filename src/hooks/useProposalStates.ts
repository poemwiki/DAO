import type { Proposal } from '@/types'
import type { GovernorStateCode } from '@/utils/governor'
import { useEffect, useMemo, useRef, useState } from 'react'
import { usePublicClient } from 'wagmi'
import { config } from '@/config'
import { parseProposalId, readGovernorState } from '@/utils/governor'
import {
  deriveProposalStatus,
  getStatusInfo,
  NUMERIC_STATUS_MAP,
} from '@/utils/proposal'

interface UseProposalStatesResult {
  statuses: Record<
    string,
    {
      code: GovernorStateCode | null
      info: ReturnType<typeof getStatusInfo> | null
    }
  >
  loading: boolean
  error: Error | null
}

export function useProposalStates(
  proposals: Proposal[] | undefined,
): UseProposalStatesResult {
  const client = usePublicClient()
  const [statuses, setStatuses] = useState<UseProposalStatesResult['statuses']>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fallbackStatuses = useMemo(() => {
    if (!proposals || proposals.length === 0)
      return null
    const map: UseProposalStatesResult['statuses'] = {}
    for (const p of proposals) {
      const fallback = getStatusInfo({
        ...p,
        status: deriveProposalStatus(p),
      })
      map[p.id] = { code: null, info: fallback }
    }
    return map
  }, [proposals])

  // Track last applied fallback to avoid triggering lint rule about direct set inside effect body.
  const lastAppliedRef = useRef<UseProposalStatesResult['statuses'] | null>(null)

  useEffect(() => {
    // If no proposals yet, avoid clearing state repeatedly (prevents render loop)
    if (!proposals || proposals.length === 0)
      return
    if (!client || !config.contracts.governor) {
      if (fallbackStatuses && lastAppliedRef.current !== fallbackStatuses) {
        queueMicrotask(() => {
          lastAppliedRef.current = fallbackStatuses
          setStatuses(fallbackStatuses)
        })
      }
      return
    }
    let mounted = true
    ;(async () => {
      try {
        setLoading(true)
        setError(null)
        const results: UseProposalStatesResult['statuses'] = {}

        // Concurrency limiter (simple token bucket).
        const ids = proposals.map(p => ({
          key: p.id,
          parsed: (() => {
            try {
              return parseProposalId(p.proposalId || p.id)
            }
            catch {
              return null
            }
          })(),
          proposal: p,
        }))
        const limit = 5 // conservative to avoid RPC overload
        let index = 0
        async function worker() {
          while (index < ids.length) {
            const current = index++
            const item = ids[current]
            if (!item)
              continue

            // Fast path: executed proposals have final immutable state; avoid RPC read.
            if (item.proposal.executed) {
              results[item.key] = {
                code: 7, // OpenZeppelin Governor: Executed
                info: NUMERIC_STATUS_MAP[7] || null,
              }
              continue
            }
            if (item.parsed === null) {
              const fallback = getStatusInfo({
                ...item.proposal,
                status: deriveProposalStatus(item.proposal),
              })
              results[item.key] = { code: null, info: fallback }
              continue
            }
            try {
              // client guaranteed non-null here
              const numeric = await readGovernorState(client!, item.parsed)
              results[item.key] = {
                code: numeric,
                info: NUMERIC_STATUS_MAP[numeric] || null,
              }
            }
            catch {
              const fallback = getStatusInfo({
                ...item.proposal,
                status: deriveProposalStatus(item.proposal),
              })
              results[item.key] = { code: null, info: fallback }
            }
          }
        }
        const workers = Array.from({ length: Math.min(limit, ids.length) }, () => worker())
        await Promise.all(workers)
        if (!mounted) {
          return
        }
        setStatuses(results)
      }
      catch (e) {
        if (!mounted) {
          return
        }
        setError(e as Error)
        if (fallbackStatuses && lastAppliedRef.current !== fallbackStatuses) {
          queueMicrotask(() => {
            lastAppliedRef.current = fallbackStatuses
            setStatuses(fallbackStatuses)
          })
        }
      }
      finally {
        if (mounted) {
          setLoading(false)
        }
      }
    })()
    return () => {
      mounted = false
    }
  }, [proposals, client, fallbackStatuses])

  return { statuses, loading, error }
}
