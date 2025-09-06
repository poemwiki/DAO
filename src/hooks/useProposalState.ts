import type { GovernorStateCode } from '@/utils/governor'
import { useQuery } from '@tanstack/react-query'
import { usePublicClient } from 'wagmi'
import { readGovernorState, safeParseProposalId } from '@/utils/governor'
import { NUMERIC_STATUS_MAP } from '@/utils/proposal'

interface UseProposalStateOptions {
  /** proposal id string started with 0x */
  proposalId?: string | null
}

export function useProposalState({ proposalId }: UseProposalStateOptions) {
  const client = usePublicClient()

  const enabled = !!proposalId && !!client
  const query = useQuery({
    queryKey: ['proposalState', proposalId],
    enabled,
    queryFn: async (): Promise<GovernorStateCode> => {
      const parsed = safeParseProposalId(proposalId as string)
      return readGovernorState(client!, parsed)
    },
    staleTime: 15_000,
    refetchOnWindowFocus: true,
  })

  const stateCode = (query.data ?? null) as GovernorStateCode | null
  const statusInfo = stateCode !== null ? NUMERIC_STATUS_MAP[stateCode] || null : null

  return {
    stateCode,
    statusInfo,
    loading: query.isLoading,
    error: query.error as Error | null,
    refetch: query.refetch,
  }
}
