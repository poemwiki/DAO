import { useAccount } from 'wagmi'
import { useQuery } from '@tanstack/react-query'
import { getTokenHolders, type TokenHoldersResponseData } from '@/graphql'
import { ZERO_ADDRESS } from '@/constants'

export function useIsDelegated() {
  const { address } = useAccount()
  const { data, isLoading } = useQuery<TokenHoldersResponseData>({
    queryKey: ['tokenHolders'],
    queryFn: getTokenHolders,
  })
  const members = data?.members || []
  const selfMember = members.find(m => m.id.toLowerCase() === address?.toLowerCase())
  const isMember = !!selfMember
  const isDelegated = !!selfMember && selfMember.delegate && selfMember.delegate !== ZERO_ADDRESS
  return { isMember, isDelegated, isLoading }
}
