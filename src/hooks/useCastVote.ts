import { useCallback, useState } from 'react'
import { usePublicClient, useWalletClient } from 'wagmi'
import { governorABI } from '@/abis/governorABI'
import { config } from '@/config'

type Status = 'idle' | 'building' | 'signing' | 'pending' | 'success' | 'error'

interface UseCastVoteOptions {
  onSuccess?: (_data: { txHash: `0x${string}` }) => void
  onError?: (_err: unknown) => void
}

export function useCastVote({ onSuccess, onError }: UseCastVoteOptions = {}) {
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<unknown>(null)
  const [result, setResult] = useState<{ txHash: `0x${string}` } | null>(null)

  const cast = useCallback(
    async (proposalId: string | bigint, support: 0 | 1 | 2) => {
      if (!publicClient || !walletClient) {
        return
      }
      try {
        setStatus('building')
        setError(null)
        const pid
          = typeof proposalId === 'bigint' ? proposalId : BigInt(proposalId)
        // Build calldata via walletClient write
        setStatus('signing')
        const hash = await walletClient.writeContract({
          address: config.contracts.governor as `0x${string}`,
          abi: governorABI,
          functionName: 'castVote',
          args: [pid, support],
        })
        setStatus('pending')
        await publicClient.waitForTransactionReceipt({ hash })
        setResult({ txHash: hash })
        setStatus('success')
        onSuccess?.({ txHash: hash })
      }
      catch (e) {
        setError(e)
        setStatus('error')
        onError?.(e)
      }
    },
    [publicClient, walletClient, onSuccess, onError],
  )

  return { cast, status, error, result }
}
