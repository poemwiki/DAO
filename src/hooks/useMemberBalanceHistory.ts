import { useMemo } from 'react'
import { GRAPHQL_PAGE_SIZES } from '../constants'
import { useMember } from './useMember'
import { useMemberTransfers } from './useMemberTransfers'

interface BalancePoint {
  timestamp: number
  balance: string
  cumulativeBalance: bigint
  event?: {
    type: 'receive' | 'send'
    amount: string
    from?: string
    to?: string
    tx: string
  }
}

interface BalanceHistoryResult {
  balanceHistory: BalancePoint[]
  isLoading: boolean
  error: Error | null
  isIncomplete: boolean
  warningMessage?: string
}

// WHY: This hook reconstructs balance history by working backwards from current balance.
// LIMITATIONS:
// 1. Only accurate if we have complete transfer history (no pagination gaps)
// 2. Assumes subgraph timestamps are in milliseconds (GraphQL spec allows seconds or ms)
// 3. Cannot show balance before first recorded transfer
const MAX_TRANSFERS = GRAPHQL_PAGE_SIZES.MAX_TRANSFERS

export function useMemberBalanceHistory(address: string | undefined): BalanceHistoryResult {
  const { data: member } = useMember(address)
  const { transfers, isLoading: transfersLoading, error: transfersError } = useMemberTransfers(address, 0, MAX_TRANSFERS)

  const result = useMemo(() => {
    if (!transfers.length || !member) {
      return {
        balanceHistory: [],
        isIncomplete: false,
        warningMessage: undefined,
      }
    }

    const points: BalancePoint[] = []
    let cumulativeBalance = BigInt(member.balance)
    let hasNegativeBalance = false
    let warningMessage: string | undefined

    // Check if we might have incomplete data
    const isIncomplete = transfers.length >= MAX_TRANSFERS

    // Validate timestamp format - check if any timestamp looks like seconds instead of ms
    const normalizeTimestamp = (timestamp: string): number => {
      const parsed = new Date(timestamp).getTime()
      // If timestamp is a number and < 1e12, it's likely seconds, multiply by 1000
      const numericTimestamp = Number(timestamp)
      if (!Number.isNaN(numericTimestamp) && numericTimestamp > 0 && numericTimestamp < 1e12) {
        return numericTimestamp * 1000
      }
      return parsed
    }

    // Start with current balance
    points.push({
      timestamp: Date.now(),
      balance: member.balance,
      cumulativeBalance,
    })

    // Work backwards through transfers to rebuild history
    for (let i = 0; i < transfers.length; i++) {
      const transfer = transfers[i]
      const isReceiving = transfer.to.id.toLowerCase() === address?.toLowerCase()
      const amount = BigInt(transfer.value)

      // Reverse the transaction to get previous balance
      if (isReceiving) {
        cumulativeBalance -= amount
      }
      else {
        cumulativeBalance += amount
      }

      // Check for negative balance (indicates missing earlier transfers)
      if (cumulativeBalance < 0n) {
        hasNegativeBalance = true
      }

      points.unshift({
        timestamp: normalizeTimestamp(transfer.createdAt),
        balance: cumulativeBalance.toString(),
        cumulativeBalance,
        event: {
          type: isReceiving ? 'receive' : 'send',
          amount: transfer.value,
          from: transfer.from.id,
          to: transfer.to.id,
          tx: transfer.tx,
        },
      })
    }

    // Set warning message based on data completeness issues
    if (isIncomplete && hasNegativeBalance) {
      warningMessage = 'Chart shows limited history due to pagination limits and missing earlier transfers'
    }
    else if (isIncomplete) {
      warningMessage = `Chart shows last ${MAX_TRANSFERS} transfers only - earlier history may be missing`
    }
    else if (hasNegativeBalance) {
      warningMessage = 'Chart may be incomplete - detected negative balance indicating missing earlier transfers'
    }

    return {
      balanceHistory: points,
      isIncomplete: isIncomplete || hasNegativeBalance,
      warningMessage,
    }
  }, [transfers, member, address])

  return {
    ...result,
    isLoading: transfersLoading,
    error: transfersError,
  }
}
