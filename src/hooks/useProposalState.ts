import type { GovernorStateCode } from '@/utils/governor'
import type { StatusInfo } from '@/utils/proposal'
import { useEffect, useState } from 'react'
import { usePublicClient } from 'wagmi'
import { config } from '@/config'
import { readGovernorState, safeParseProposalId } from '@/utils/governor'
import { NUMERIC_STATUS_MAP } from '@/utils/proposal'

interface UseProposalStateOptions {
  /** proposal transaction hash (for future use / debugging) */
  tx?: string | null
  /** proposal id string started with 0x */
  proposalId?: string | null
  // fallback?: () => StatusInfo | null (disabled per current requirement)
}

export function useProposalState({ proposalId, tx }: UseProposalStateOptions) {
  const client = usePublicClient()
  const [stateCode, setStateCode] = useState<GovernorStateCode | null>(null)
  const [statusInfo, setStatusInfo] = useState<StatusInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    // Require numeric proposalId (tx alone not sufficient for Governor.state(uint256)).
    if (!proposalId || !client || !config.contracts.governor) {
      return
    }
    let mounted = true
    ;(async () => {
      try {
        setLoading(true)
        setError(null)
        const parsed = safeParseProposalId(proposalId)
        const numeric = await readGovernorState(client, parsed)
        if (!mounted) {
          return
        }
        setStateCode(numeric)
        setStatusInfo(NUMERIC_STATUS_MAP[numeric] || null)
      }
      catch (e) {
        if (!mounted) {
          return
        }
        setError(e as Error)
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
  }, [proposalId, tx, client])

  return { stateCode, statusInfo, loading, error }
}
