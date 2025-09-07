import type { ClassValue } from 'clsx'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function formatAddress(address: string): string {
  if (!address) {
    return ''
  }
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs))

// short() duplicate merged here for consistency
export function short(str: string): string {
  if (!str) {
    return ''
  }
  if (str.length <= 10) {
    return str
  }
  return `${str.slice(0, 6)}...${str.slice(-4)}`
}

// Normalize a locale string to something the Intl APIs accept. Fallback to 'en-US'.
function normalizeLocale(maybe: string | undefined | null): string {
  const candidate = (maybe || '').trim()
  if (!candidate) {
    return 'en-US'
  }
  try {
    // Constructing an Intl.DateTimeFormat will throw if invalid.
    // Use resolvedOptions to get a canonical tag (e.g. zh -> zh-Hans or similar).
    return (
      new Intl.DateTimeFormat(candidate).resolvedOptions().locale || 'en-US'
    )
  }
  catch {
    return 'en-US'
  }
}

export function formatDate(date: string, locale = 'en-US'): string {
  const loc = normalizeLocale(locale)
  return new Date(date).toLocaleDateString(loc, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

// Graph returns unix timestamp seconds as string (e.g. "1666874545").
// Convert seconds (or ms) to Date safely.
export function toDateFromGraph(
  value: string | number | bigint | null | undefined,
): Date | null {
  if (value === null || value === undefined) {
    return null
  }
  const str = value.toString().trim()
  if (!str) {
    return null
  }
  // Detect if seconds (10 digits) or milliseconds (13+ digits)
  const num = Number(str)
  if (Number.isNaN(num)) {
    return null
  }
  const ms = str.length <= 10 ? num * 1000 : num
  const d = new Date(ms)
  return Number.isNaN(d.getTime()) ? null : d
}

export function formatGraphTimestamp(
  value: string | number | bigint | null | undefined,
  locale = 'en-US',
): string {
  const d = toDateFromGraph(value)
  if (!d) {
    return '-'
  }
  const loc = normalizeLocale(locale)
  return d.toLocaleDateString(loc, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

// Relative time (e.g., 3h ago). Falls back to date if far.
let cachedLocale = 'en'
let rtf = new Intl.RelativeTimeFormat(cachedLocale, { numeric: 'auto' })
export function setRelativeTimeLocale(locale: string) {
  const loc = normalizeLocale(locale)
  if (loc && loc !== cachedLocale) {
    cachedLocale = loc
    rtf = new Intl.RelativeTimeFormat(cachedLocale, { numeric: 'auto' })
  }
}
const RELATIVE_THRESHOLDS: Array<[number, Intl.RelativeTimeFormatUnit]> = [
  [60, 'second'],
  [60, 'minute'],
  [24, 'hour'],
  [7, 'day'],
  [4.34524, 'week'],
  [12, 'month'],
  [Number.POSITIVE_INFINITY, 'year'],
]

export function formatRelativeTime(
  value: string | number | bigint | null | undefined,
  locale?: string,
  weekThresholdMs: number = 7 * 24 * 60 * 60 * 1000,
): string {
  if (locale) {
    setRelativeTimeLocale(locale)
  }
  const date = toDateFromGraph(value)
  if (!date) {
    return '-'
  }
  const now = Date.now()
  // If older than threshold, return absolute date only
  if (now - date.getTime() > weekThresholdMs) {
    const loc = cachedLocale || 'en-US'
    return date.toLocaleDateString(loc, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }
  let diff = (date.getTime() - now) / 1000 // seconds
  const units = [
    'second',
    'minute',
    'hour',
    'day',
    'week',
    'month',
    'year',
  ] as const
  let unitIndex = 0
  for (let i = 0; i < RELATIVE_THRESHOLDS.length; i++) {
    const [limit] = RELATIVE_THRESHOLDS[i]
    if (Math.abs(diff) < limit) {
      unitIndex = i
      break
    }
    diff /= limit
  }
  const unit = units[unitIndex] as Intl.RelativeTimeFormatUnit
  const rounded = Math.round(diff)
  return rtf.format(rounded, unit)
}

export function formatGraphTimestampWithRelative(
  value: string | number | bigint | null | undefined,
  locale = 'en-US',
): string {
  const absolute = formatGraphTimestamp(value, locale)
  const relative = formatRelativeTime(value)
  if (relative === '-') {
    return absolute
  }
  return `${absolute} (${relative})`
}

export function formatAmount(amount: string, decimals = 18): string {
  const value = Number.parseFloat(amount) / 10 ** decimals
  return value.toFixed(4)
}

// BigInt safe token amount helpers
interface ScaledTokenAmount {
  integer: bigint
  fraction: bigint
  decimals: number
  base: bigint
  isZero: boolean
  toNumber: () => number
  format: (_maxFractionDigits?: number) => string
}

function scaleTokenAmount(amount: bigint, decimals: number): ScaledTokenAmount {
  const d = decimals >= 0 && decimals <= 36 ? decimals : 18
  const base = 10n ** BigInt(d)
  const integer = amount / base
  const fraction = amount % base
  return {
    integer,
    fraction,
    decimals: d,
    base,
    isZero: amount === 0n,
    toNumber: () => {
      if (amount === 0n) {
        return 0
      }
      // Potential precision loss for very large values, acceptable for UI summaries.
      return Number(integer) + Number(fraction) / Number(base)
    },
    format: (maxFractionDigits = 4) => {
      if (fraction === 0n) {
        return integer.toString()
      }
      const fracStrFull = (fraction + base).toString().slice(1) // zero-pad
      const trimmed = fracStrFull.replace(/0+$/, '')
      const sliced = trimmed.slice(0, maxFractionDigits)
      return sliced ? `${integer.toString()}.${sliced}` : integer.toString()
    },
  }
}

export function formatTokenAmount(
  amount: bigint,
  decimals: number,
  opts: { maxFractionDigits?: number } = {},
): string {
  const scaled = scaleTokenAmount(amount, decimals)
  return scaled.format(opts.maxFractionDigits)
}

export function toScaledNumber(amount: bigint, decimals: number): number {
  return scaleTokenAmount(amount, decimals).toNumber()
}

export function formatNumber(n: number, decimalPlaces = 1) {
  if (!Number.isFinite(n)) {
    return '0'
  }
  if (n === 0) {
    return '0'
  }
  if (n < 0.0001) {
    return n.toExponential(2)
  }
  const s = n.toLocaleString(undefined, {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  })
  return s
}

// timestampToDate duplicate logic (prefer locale aware functions above)
export function timestampToDate(timestamp: string): string {
  if (!timestamp) {
    return ''
  }
  const d = toDateFromGraph(timestamp)
  return d ? d.toLocaleString() : ''
}

export function trimDescription(description: string): string {
  if (!description) {
    return ''
  }
  return description.replace(/^\[\d+\]\s*/, '')
}

// Local time with minute precision (YYYY Mon DD, HH:MM) using browser locale
export function formatGraphTimestampLocalMinutes(
  value: string | number | bigint | null | undefined,
  locale?: string,
): string {
  const d = toDateFromGraph(value)
  if (!d) {
    return '-'
  }
  const loc = normalizeLocale(locale || cachedLocale)
  return d.toLocaleString(loc, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

// Convert block count into human readable duration using average seconds per block.
export function estimateDurationFromBlocks(
  blocks: number,
  secondsPerBlock = 2,
  opts: { maxUnits?: number } = {},
): string {
  if (!Number.isFinite(blocks) || blocks <= 0) {
    return '-'
  }
  const totalSeconds = blocks * secondsPerBlock
  const units: Array<[string, number]> = [
    ['d', 86400],
    ['h', 3600],
    ['m', 60],
    ['s', 1],
  ]
  const parts: string[] = []
  let remaining = totalSeconds
  const maxUnits = opts.maxUnits ?? 2
  for (const [label, size] of units) {
    if (remaining >= size) {
      const value = Math.floor(remaining / size)
      remaining -= value * size
      parts.push(`${value}${label}`)
    }
    if (parts.length === maxUnits) {
      break
    }
  }
  return parts.length ? parts.join(' ') : `${Math.round(totalSeconds)}s`
}

// WHY: Compact number formatting for axis labels & summaries (e.g., 1.2K 3.4M)
// Keep UI concise without pulling extra libs. Chooses decimals based on magnitude.
export function formatCompactNumber(
  value: number,
  opts: { decimals?: number } = {},
): string {
  const { decimals = 2 } = opts
  if (!Number.isFinite(value))
    return '0'
  const abs = Math.abs(value)
  const sign = value < 0 ? '-' : ''
  interface UnitDef { v: number, s: string }
  const units: UnitDef[] = [
    { v: 1e12, s: 'T' },
    { v: 1e9, s: 'B' },
    { v: 1e6, s: 'M' },
    { v: 1e3, s: 'K' },
  ]
  for (const u of units) {
    if (abs >= u.v) {
      const num = abs / u.v
      const formatted = num.toFixed(num < 10 ? decimals : num < 100 ? Math.min(1, decimals) : 0)
      return `${sign}${trimCompactTrailingZeros(formatted)}${u.s}`
    }
  }
  const base = abs.toFixed(abs < 10 ? decimals : abs < 100 ? 1 : 0)
  return `${sign}${trimCompactTrailingZeros(base)}`
}

function trimCompactTrailingZeros(str: string): string {
  if (!str.includes('.'))
    return str
  return str
    .replace(/(\.\d*[1-9])0+$/, '$1')
    .replace(/\.0+$/, '')
    .replace(/\.$/, '')
}

// --- END OF FILE ---
