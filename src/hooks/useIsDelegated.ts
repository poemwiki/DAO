import type { TokenHoldersResponseData } from '@/graphql'
import { useQuery } from '@tanstack/react-query'
import { useAccount } from 'wagmi'
import { ZERO_ADDRESS } from '@/constants'
import { getTokenHolders } from '@/graphql'

export function useIsDelegated() {
  const { address } = useAccount()
  const { data, isLoading } = useQuery<TokenHoldersResponseData>({
    queryKey: ['tokenHolders'],
    queryFn: getTokenHolders,
  })
  const members = data?.members || []
  const selfMember = members.find(
    m => m.id.toLowerCase() === address?.toLowerCase(),
  )
  const isMember = !!selfMember
  const isDelegated
    = !!selfMember && selfMember.delegate && selfMember.delegate !== ZERO_ADDRESS
  return { isMember, isDelegated, isLoading }
}
