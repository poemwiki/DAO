import { useReadContract } from 'wagmi'
import { tokenABI } from '@/abis'
import { config } from '@/config'

export function useDelegate(address?: string) {
  const {
    data: delegateAddress,
    error: readError,
    isLoading,
  } = useReadContract({
    address: config.contracts.token as `0x${string}`,
    abi: tokenABI,
    functionName: 'delegates',
    args: address ? [address as `0x${string}`] : undefined,
    query: {
      enabled: !!address,
    },
  })

  // Add debug logs
  console.log('useDelegate:', {
    address,
    delegateAddress,
    readError,
    isLoading,
    tokenAddress: config.contracts.token,
  })

  return {
    delegateAddress,
    readError,
    isLoading,
  }
}
