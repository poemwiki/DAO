import { describe, expect, it } from 'vitest'
import { validateBatchRows } from '../validateBatch'

describe('validateBatchRows', () => {
  it('returns NO_ROWS when empty', () => {
    const res = validateBatchRows([{ address: '', amount: '' }])
    expect(res.errors).toContain('NO_ROWS')
  })
  it('validates good rows', () => {
    const res = validateBatchRows([
      { address: '0x0000000000000000000000000000000000000001', amount: '1.5' },
      { address: '0x0000000000000000000000000000000000000002', amount: '2' },
    ])
    expect(res.errors.length).toBe(0)
    expect(res.cleaned.length).toBe(2)
    expect(res.total).toBeCloseTo(3.5)
  })
  it('flags bad address and amount', () => {
    const res = validateBatchRows([
      { address: '0xBAD', amount: '0' },
      { address: '0x0000000000000000000000000000000000000003', amount: '-1' },
    ])
    expect(res.errors.some(e => e.startsWith('BAD_ADDR_'))).toBe(true)
    expect(res.errors.some(e => e.startsWith('BAD_AMT_'))).toBe(true)
  })
})
