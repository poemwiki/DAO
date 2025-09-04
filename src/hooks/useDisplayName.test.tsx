import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useDisplayName, __resetAddressBookCache } from './useDisplayName'

// Mock wagmi useEnsName
vi.mock('wagmi', () => ({
  useEnsName: vi.fn().mockReturnValue({ data: undefined }),
}))

// Provide a mock fetch
const originalFetch = globalThis.fetch
// reset module between tests to clear cache
vi.mock('./useDisplayName', async orig => {
  const actual = await orig()
  return actual
})

describe('useDisplayName', () => {
  beforeEach(() => {
    __resetAddressBookCache()
    const mockFn = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa': 'Alice',
      }),
    })
    globalThis.fetch = mockFn
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  it('returns static address book name when present', async () => {
    const { result } = renderHook(() =>
      useDisplayName({ address: '0xAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAa' }),
    )
    await waitFor(() => expect(result.current).toBe('Alice'))
  })

  it('falls back to short address when no static and ENS disabled', async () => {
    const { result } = renderHook(() =>
      useDisplayName({
        address: '0x1234567890abcdef1234567890abcdef12345678',
        disableEns: true,
      }),
    )
    await waitFor(() => expect(result.current).toBe('0x1234...5678'))
  })

  it('only fetches address book once', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    const addr1 = '0xAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAa'
    const addr2 = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'
    const r1 = renderHook(() => useDisplayName({ address: addr1 }))
    await waitFor(() => expect(r1.result.current).toBe('Alice'))
    const r2 = renderHook(() => useDisplayName({ address: addr2 }))
    await waitFor(() => expect(r2.result.current).toBe('0xbbbb...bbbb'))
    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })

  it('updates multiple subscribers after fetch', async () => {
    const addr1 = '0xAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAaAa'
    const addr2 = '0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' // same different case
    const r1 = renderHook(() => useDisplayName({ address: addr1 }))
    const r2 = renderHook(() => useDisplayName({ address: addr2 }))
    await waitFor(() => {
      expect(r1.result.current).toBe('Alice')
      expect(r2.result.current).toBe('Alice')
    })
  })
})
