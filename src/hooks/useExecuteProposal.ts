import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useState } from 'react'
import { keccak256, stringToHex } from 'viem'
import { usePublicClient, useWalletClient } from 'wagmi'
import { governorABI } from '@/abis/governorABI'
import { config } from '@/config'

type Status = 'idle' | 'building' | 'signing' | 'pending' | 'success' | 'error'

export function useExecuteProposal(opts: { onSuccess?: () => void } = {}) {
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<unknown>(null)
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null)

  const execute = useCallback(
    async (
      _proposalId: bigint | string, // kept for API compatibility; Governor.execute doesn't take the id
      targets: `0x${string}`[],
      values: bigint[],
      calldatas: `0x${string}`[],
      description: string,
    ) => {
      if (!publicClient || !walletClient) {
        return
      }
      try {
        setStatus('building')
        setError(null)
        // Governor execute requires descriptionHash = keccak256(bytes(description))
        // viem helpers: stringToHex gives UTF-8 bytes hex; keccak256 hashes it.
        const descHash = keccak256(stringToHex(description))
        setStatus('signing')
        const hash = await walletClient.writeContract({
          address: config.contracts.governor as `0x${string}`,
          abi: governorABI,
          functionName: 'execute',
          args: [targets, values, calldatas, descHash],
        })
        setTxHash(hash)
        setStatus('pending')
        await publicClient.waitForTransactionReceipt({ hash })
        setStatus('success')
        // Invalidate proposal-related queries (detail + list) so UI refreshes like after vote
        try {
          queryClient.invalidateQueries({ queryKey: ['proposal'] })
          // If caller knows a specific proposal id, they can still manually invalidate outside.
        }
        catch {
          // ignore cache invalidation error (unlikely)
        }
        opts.onSuccess?.()
      }
      catch (e) {
        setError(e)
        setStatus('error')
      }
    },
    [publicClient, walletClient, opts, queryClient],
  )

  return { execute, status, error, txHash }
}
