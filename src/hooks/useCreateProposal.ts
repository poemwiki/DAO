import { useState, useCallback } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { usePublicClient, useWalletClient } from 'wagmi'
import { encodeFunctionData, keccak256, stringToBytes, type Address } from 'viem'
// governor full ABI not needed; using minimal fragments below for typing
import { tokenABI } from '@/abis/tokenABI'
import { config } from '@/config'
import { PROPOSAL_TYPE } from '@/constants'

export type SimpleProposalType = (typeof PROPOSAL_TYPE)[keyof typeof PROPOSAL_TYPE]

export interface CreateProposalInput {
  type: SimpleProposalType
  address: string // recipient (MINT) or requester (BUDGET)
  amount: string // human readable amount
  description: string
}

export interface CreateProposalResult {
  proposalId?: string
  txHash?: string
}

export interface UseCreateProposalOptions {
  onSuccess?: (_result: CreateProposalResult) => void
  onError?: (_error: unknown) => void
}

export type CreateStatus = 'idle' | 'building' | 'signing' | 'pending' | 'success' | 'error'

function nowDescriptionPrefix() {
  const iso = new Date().toISOString().replace(/[^0-9]/g, '')
  return `[${iso}] `
}

export function useCreateProposal(opts: UseCreateProposalOptions = {}) {
  const publicClient = usePublicClient()
  const { data: walletClient } = useWalletClient()
  const qc = useQueryClient()
  const [status, setStatus] = useState<CreateStatus>('idle')
  const [error, setError] = useState<unknown>(null)
  const [result, setResult] = useState<CreateProposalResult | null>(null)

  const buildCalldata = useCallback((input: CreateProposalInput) => {
    const token = config.contracts.token as Address
    const amount = Number(input.amount)
    if (isNaN(amount) || amount <= 0) throw new Error('Invalid amount')
    const amountWei = BigInt(Math.round(amount * 1e18))
    const recipient = input.address as Address
    if (!recipient || !recipient.startsWith('0x') || recipient.length !== 42) {
      throw new Error('Invalid address')
    }
    let data: `0x${string}`
    if (input.type === PROPOSAL_TYPE.MINT) {
      data = encodeFunctionData({
        abi: tokenABI,
        functionName: 'mint',
        args: [recipient, amountWei],
      })
    } else if (input.type === PROPOSAL_TYPE.BUDGET) {
      data = encodeFunctionData({
        abi: tokenABI,
        functionName: 'mintAndApprove',
        args: [recipient, amountWei],
      })
    } else {
      throw new Error('Unsupported proposal type')
    }
    return { targets: [token] as Address[], values: [0n], calldatas: [data] as `0x${string}`[] }
  }, [])

  const mutation = useMutation({
    mutationFn: async (input: CreateProposalInput) => {
      if (!publicClient || !walletClient) throw new Error('Wallet not ready')
      setError(null)
      setStatus('building')
      const { targets, values, calldatas } = buildCalldata(input)
      const governor = config.contracts.governor as `0x${string}`
      const description = nowDescriptionPrefix() + (input.description || '')

      setStatus('signing')
      // submit transaction
      // Minimal ABI fragments for type-safe calls
      const proposeAbi = [
        {
          inputs: [
            { internalType: 'address[]', name: 'targets', type: 'address[]' },
            { internalType: 'uint256[]', name: 'values', type: 'uint256[]' },
            { internalType: 'bytes[]', name: 'calldatas', type: 'bytes[]' },
            { internalType: 'string', name: 'description', type: 'string' },
          ],
          name: 'propose',
          outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
          stateMutability: 'nonpayable',
          type: 'function',
        },
      ] as const
      const hash = await walletClient.writeContract({
        address: governor,
        abi: proposeAbi,
        functionName: 'propose',
        args: [targets, values, calldatas, description],
      })
      setStatus('pending')

      // wait for tx receipt and derive proposalId by calling the governor (requires event parsing or callStatic pattern).
      // Compute proposal id deterministically using hashProposal (OpenZeppelin formula)
      let proposalId: string | undefined
      try {
        const descriptionHash = keccak256(stringToBytes(description))
        const hashProposalAbi = [
          {
            inputs: [
              { internalType: 'address[]', name: 'targets', type: 'address[]' },
              { internalType: 'uint256[]', name: 'values', type: 'uint256[]' },
              { internalType: 'bytes[]', name: 'calldatas', type: 'bytes[]' },
              { internalType: 'bytes32', name: 'descriptionHash', type: 'bytes32' },
            ],
            name: 'hashProposal',
            outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
            stateMutability: 'pure',
            type: 'function',
          },
        ] as const
        const id = (await publicClient.readContract({
          address: governor,
          abi: hashProposalAbi,
          functionName: 'hashProposal',
          args: [targets, values, calldatas, descriptionHash],
        })) as bigint
        proposalId = id.toString()
      } catch (_e) {
        // ignore inability to pre-compute id
      }

      const receipt = await publicClient.waitForTransactionReceipt({ hash })

      return { proposalId, txHash: receipt.transactionHash }
    },
    onSuccess: data => {
      setStatus('success')
      setResult(data)
      // invalidate proposals list
      qc.invalidateQueries({ queryKey: ['proposals'] })
      opts.onSuccess?.(data)
    },
    onError: e => {
      setStatus('error')
      setError(e)
      opts.onError?.(e)
    },
  })

  return {
    create: mutation.mutateAsync,
    status,
    error,
    result,
    reset: () => {
      setStatus('idle')
      setError(null)
      setResult(null)
    },
    isLoading: ['building', 'signing', 'pending'].includes(status),
  }
}
