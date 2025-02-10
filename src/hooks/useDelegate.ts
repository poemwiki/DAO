import { useReadContract } from 'wagmi'
import { config } from '@/config'
import { tokenABI } from '@/abis'

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

  return {
    delegateAddress,
    // delegateAddress: undefined,
    readError,
    isLoading,
  }
}
