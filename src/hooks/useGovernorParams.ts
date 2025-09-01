import { useQuery } from '@tanstack/react-query'
import { governorABI } from '@/abis/governorABI'
import { config } from '@/config'
import { usePublicClient } from 'wagmi'

export function useGovernorParams() {
  const publicClient = usePublicClient()
  return useQuery({
    queryKey: ['governorParams', config.contracts.governor],
    enabled: !!publicClient && !!config.contracts.governor,
    queryFn: async () => {
      const address = config.contracts.governor as `0x${string}`
      const [votingDelay, votingPeriod, proposalThreshold, quorumNum, quorumDen, token] =
        await Promise.all([
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          publicClient!.readContract({ address, abi: governorABI, functionName: 'votingDelay' }),
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          publicClient!.readContract({ address, abi: governorABI, functionName: 'votingPeriod' }),
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          publicClient!.readContract({
            address,
            abi: governorABI,
            functionName: 'proposalThreshold',
          }),
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          publicClient!.readContract({
            address,
            abi: governorABI,
            functionName: 'quorumNumerator',
          }),
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          publicClient!.readContract({
            address,
            abi: governorABI,
            functionName: 'quorumDenominator',
          }),
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          publicClient!.readContract({ address, abi: governorABI, functionName: 'token' }),
        ])
      return { votingDelay, votingPeriod, proposalThreshold, quorumNum, quorumDen, token }
    },
  })
}
