import { useEffect, useState } from 'react'
import { config } from '@/config'
import { useEnsName } from 'wagmi'
import { short } from '@/utils/format'

// Normalize address to lowercase checksum-insensitive key
function normalize(addr?: string | null) {
  return addr ? addr.toLowerCase() : ''
}

export interface DisplayNameOptions {
  address?: string
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
  const [name, setName] = useState<string | undefined>()
  const [staticName, setStaticName] = useState<string | undefined>()
  const lower = normalize(address)

  // load address book once
  useEffect(() => {
    let cancelled = false
    if (!addressBookCache.subscribers) addressBookCache.subscribers = new Set()

    const notify = () => {
      if (cancelled) return
      if (lower && addressBookCache.data) setStaticName(addressBookCache.data[lower])
    }

    addressBookCache.subscribers.add(notify)

    async function load() {
      if (addressBookCache.data || addressBookCache.loading) return
      addressBookCache.loading = true
      try {
        const res = await fetch(config.features.addressBookUrl)
        if (!res.ok) throw new Error('addressBook fetch failed')
        const json = (await res.json()) as Record<string, string>
        addressBookCache.data = Object.fromEntries(
          Object.entries(json).map(([k, v]) => [k.toLowerCase(), v])
        )
        // notify all
        addressBookCache.subscribers?.forEach(cb => cb())
      } catch (e) {
        addressBookCache.error = e
      } finally {
        addressBookCache.loading = false
      }
    }
    load()
    // run once immediately in case data already there
    notify()
    return () => {
      cancelled = true
      addressBookCache.subscribers?.delete(notify)
    }
  }, [lower])

  // update staticName when cache already present
  useEffect(() => {
    if (lower && addressBookCache.data) {
      setStaticName(addressBookCache.data[lower])
    }
  }, [lower])

  const ensEnabled = config.features?.enableEns && !disableEns && !staticName

  const { data: ensName } = useEnsName({
    address: ensEnabled && address ? (address as `0x${string}`) : undefined,
    query: { enabled: !!(ensEnabled && address) },
    chainId: 1,
  })

  useEffect(() => {
    if (staticName) setName(staticName)
    else if (ensName) setName(ensName)
    else if (address) setName(short(address))
    else setName(undefined)
  }, [staticName, ensName, address])

  return name
}
