import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useState } from 'react'
import { keccak256, stringToHex } from 'viem'
import { usePublicClient, useWalletClient } from 'wagmi'
import { governorABI } from '@/abis/governorABI'
import { config } from '@/config'

type Status = 'idle' | 'building' | 'signing' | 'pending' | 'success' | 'error'

interface UseExecuteProposalOptions {
  onSuccess?: () => void
  /** detail cache id, to target invalidate + poll */
  proposalId?: string | bigint | null
  /** how many polling attempts after success (default 5) */
  pollAttempts?: number
  /** delay before first poll ms (default 2000) */
  initialDelayMs?: number
  /** interval between polls ms (default 2500) */
  pollIntervalMs?: number
}

export function useExecuteProposal(opts: UseExecuteProposalOptions = {}) {
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<unknown>(null)
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null)

  const execute = useCallback(
    async (
      _proposalId: bigint | string, // API compat (Governor.execute doesn't need it)
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
        // Immediate targeted invalidation
        try {
          if (opts.proposalId) {
            queryClient.invalidateQueries({
              queryKey: ['proposal', String(opts.proposalId)],
            })
          }
          queryClient.invalidateQueries({ queryKey: ['proposal'] })
        }
        catch {}
        // Lightweight polling to pick up executed flag (subgraph lag)
        if (opts.proposalId) {
          const attempts = opts.pollAttempts ?? 5
          ;(async () => {
            const delay = (ms: number) => new Promise(r => setTimeout(r, ms))
            await delay(opts.initialDelayMs ?? 2000)
            for (let i = 0; i < attempts; i++) {
              queryClient.invalidateQueries({
                queryKey: ['proposal', String(opts.proposalId)],
              })
              await delay(opts.pollIntervalMs ?? 2500)
            }
          })()
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
