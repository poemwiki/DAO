import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { GRAPHQL_PAGE_SIZES } from '@/constants'
import { getMemberTransfers } from '@/graphql'
import { memberQueryKeys } from '@/queries/member'

export function useMemberTransfers(address: string | undefined, page = 0, pageSize: number = GRAPHQL_PAGE_SIZES.DEFAULT) {
  const query = useQuery({
    queryKey: memberQueryKeys.transfers(address || '', page),
    enabled: !!address,
    queryFn: async () => {
      if (!address)
        return { transfersFrom: [], transfersTo: [] }
      return getMemberTransfers(address.toLowerCase(), page * pageSize, pageSize)
    },
    staleTime: 30_000, // 30 seconds
    gcTime: 5 * 60_000, // 5 minutes
  })

  // Merge and sort transfers from both directions
  const mergedTransfers = useMemo(() => {
    if (!query.data)
      return []

    const allTransfers = [...query.data.transfersFrom, ...query.data.transfersTo]

    // Sort by timestamp (newest first)
    return allTransfers.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
  }, [query.data])

  return {
    ...query,
    transfers: mergedTransfers,
  }
}
