import { useEffect, useMemo, useSyncExternalStore } from 'react'
import { useEnsName } from 'wagmi'
import { config } from '@/config'
import { short } from '@/utils/format'

// Normalize address to lowercase checksum-insensitive key
function normalize(addr?: string | null) {
  return addr ? addr.toLowerCase() : ''
}

export interface DisplayNameOptions {
  address: string
  disableEns?: boolean
}

// simple in-memory cache
const addressBookCache: {
  data?: Record<string, string>
  loading?: boolean
  error?: unknown
  subscribers?: Set<() => void>
} = {}

// test helper
export function __resetAddressBookCache() {
  addressBookCache.data = undefined
  addressBookCache.loading = false
  addressBookCache.error = undefined
  addressBookCache.subscribers = new Set()
}

export function useDisplayName({ address, disableEns }: DisplayNameOptions) {
  // Expose addressBook names via useSyncExternalStore to avoid setState-in-effect warnings.
  const lower = normalize(address)

  const subscribe = (onStoreChange: () => void) => {
    if (!addressBookCache.subscribers) {
      addressBookCache.subscribers = new Set()
    }
    addressBookCache.subscribers.add(onStoreChange)
    return () => addressBookCache.subscribers?.delete(onStoreChange)
  }

  const getSnapshot = () => {
    if (!lower)
      return undefined
    return addressBookCache.data?.[lower]
  }

  const getServerSnapshot = () => undefined

  const staticName = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  // Load addressBook lazily on first consumer mount (once globally)
  useEffect(() => {
    let ignore = false
    if (addressBookCache.data || addressBookCache.loading)
      return
    addressBookCache.loading = true
    ;(async () => {
      try {
        const res = await fetch(config.features.addressBookUrl)
        if (!res.ok)
          throw new Error('addressBook fetch failed')
        const json = (await res.json()) as Record<string, string>
        addressBookCache.data = Object.fromEntries(
          Object.entries(json).map(([k, v]) => [k.toLowerCase(), v]),
        )
        if (!ignore) {
          addressBookCache.subscribers?.forEach(cb => cb())
        }
      }
      catch (e) {
        addressBookCache.error = e
      }
      finally {
        addressBookCache.loading = false
      }
    })()
    return () => {
      ignore = true
    }
  }, [])

  const ensEnabled = config.features?.enableEns && !disableEns && !staticName

  const { data: ensName } = useEnsName({
    address: ensEnabled && address ? (address as `0x${string}`) : undefined,
    query: { enabled: !!(ensEnabled && address) },
    chainId: 1,
  })

  const name = useMemo(() => {
    if (staticName)
      return staticName
    if (ensName)
      return ensName
    return short(address)
  }, [staticName, ensName, address])

  return name
}

// Lightweight synchronous lookup (address book only, no ENS) for cases where
// we need a display name outside React (e.g., during pure parsing).
export function lookupAddressBookName(address?: string) {
  if (!address) {
    return undefined
  }
  const lower = address.toLowerCase()
  return addressBookCache.data?.[lower]
}
