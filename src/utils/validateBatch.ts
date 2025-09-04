// Simple validation utility separated for unit testing
import type { Address } from 'viem'

export interface BatchRow {
  address: string
  amount: string
}

export interface BatchValidationResult {
  errors: string[]
  cleaned: { address: Address, amount: number }[]
  total: number
}

export function validateBatchRows(rows: BatchRow[]): BatchValidationResult {
  const errors: string[] = []
  const cleaned: { address: Address, amount: number }[] = []
  let total = 0
  const filtered = rows.filter(r => r.address || r.amount)
  if (!filtered.length) {
    return { errors: ['NO_ROWS'], cleaned: [], total: 0 }
  }
  if (filtered.length > 100) {
    errors.push('TOO_MANY')
  }
  filtered.forEach((r, idx) => {
    if (!/^0x[a-fA-F0-9]{40}$/.test(r.address)) {
      errors.push(`BAD_ADDR_${idx}`)
    }
    const num = Number(r.amount)
    if (!(num > 0)) {
      errors.push(`BAD_AMT_${idx}`)
    }
    if (
      errors.length === 0
      || (!errors.includes(`BAD_ADDR_${idx}`)
        && !errors.includes(`BAD_AMT_${idx}`))
    ) {
      if (/^0x[a-fA-F0-9]{40}$/.test(r.address) && num > 0) {
        cleaned.push({ address: r.address as Address, amount: num })
        total += num
      }
    }
  })
  return { errors, cleaned, total }
}
