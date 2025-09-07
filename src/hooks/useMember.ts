import { useQuery } from '@tanstack/react-query'
import { getMember } from '@/graphql'
import { memberQueryKeys } from '@/queries/member'

export function useMember(address: string | undefined) {
  return useQuery({
    queryKey: memberQueryKeys.detail(address || ''),
    enabled: !!address,
    queryFn: async () => {
      if (!address)
        return null
      const result = await getMember(address.toLowerCase())
      return result.member
    },
    staleTime: 30_000, // 30 seconds
    gcTime: 5 * 60_000, // 5 minutes
  })
}
