import { useQuery } from '@tanstack/react-query'
import { usePublicClient } from 'wagmi'
import { governorABI } from '@/abis/governorABI'
import { config } from '@/config'

export function useGovernorParams() {
  const publicClient = usePublicClient()
  return useQuery({
    queryKey: ['governorParams', config.contracts.governor],
    enabled: !!publicClient && !!config.contracts.governor,
    queryFn: async () => {
      const address = config.contracts.governor as `0x${string}`
      const [
        votingDelay,
        votingPeriod,
        proposalThreshold,
        quorumNum,
        quorumDen,
        token,
      ] = await Promise.all([
        publicClient!.readContract({
          address,
          abi: governorABI,
          functionName: 'votingDelay',
        }),

        publicClient!.readContract({
          address,
          abi: governorABI,
          functionName: 'votingPeriod',
        }),

        publicClient!.readContract({
          address,
          abi: governorABI,
          functionName: 'proposalThreshold',
        }),

        publicClient!.readContract({
          address,
          abi: governorABI,
          functionName: 'quorumNumerator',
        }),

        publicClient!.readContract({
          address,
          abi: governorABI,
          functionName: 'quorumDenominator',
        }),

        publicClient!.readContract({
          address,
          abi: governorABI,
          functionName: 'token',
        }),
      ])
      return {
        votingDelay,
        votingPeriod,
        proposalThreshold,
        quorumNum,
        quorumDen,
        token,
      }
    },
  })
}
