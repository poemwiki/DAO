export const formatAddress = (address: string): string => {
  if (!address) return ''
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs))

// short() duplicate merged here for consistency
export const short = (str: string): string => {
  if (!str) return ''
  if (str.length <= 10) return str
  return `${str.slice(0, 6)}...${str.slice(-4)}`
}

// Normalize a locale string to something the Intl APIs accept. Fallback to 'en-US'.
const normalizeLocale = (maybe: string | undefined | null): string => {
  const candidate = (maybe || '').trim()
  if (!candidate) return 'en-US'
  try {
    // Constructing an Intl.DateTimeFormat will throw if invalid.
    // Use resolvedOptions to get a canonical tag (e.g. zh -> zh-Hans or similar).
    return new Intl.DateTimeFormat(candidate).resolvedOptions().locale || 'en-US'
  } catch {
    return 'en-US'
  }
}

export const formatDate = (date: string, locale = 'en-US'): string => {
  const loc = normalizeLocale(locale)
  return new Date(date).toLocaleDateString(loc, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

// Graph returns unix timestamp seconds as string (e.g. "1666874545").
// Convert seconds (or ms) to Date safely.
export const toDateFromGraph = (
  value: string | number | bigint | null | undefined
): Date | null => {
  if (value === null || value === undefined) return null
  const str = value.toString().trim()
  if (!str) return null
  // Detect if seconds (10 digits) or milliseconds (13+ digits)
  const num = Number(str)
  if (Number.isNaN(num)) return null
  const ms = str.length <= 10 ? num * 1000 : num
  const d = new Date(ms)
  return isNaN(d.getTime()) ? null : d
}

export const formatGraphTimestamp = (
  value: string | number | bigint | null | undefined,
  locale = 'en-US'
): string => {
  const d = toDateFromGraph(value)
  if (!d) return '-'
  const loc = normalizeLocale(locale)
  return d.toLocaleDateString(loc, { year: 'numeric', month: 'short', day: 'numeric' })
}

// Relative time (e.g., 3h ago). Falls back to date if far.
let cachedLocale = 'en'
let rtf = new Intl.RelativeTimeFormat(cachedLocale, { numeric: 'auto' })
export const setRelativeTimeLocale = (locale: string) => {
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

export const formatRelativeTime = (
  value: string | number | bigint | null | undefined,
  locale?: string,
  weekThresholdMs: number = 7 * 24 * 60 * 60 * 1000
): string => {
  if (locale) setRelativeTimeLocale(locale)
  const date = toDateFromGraph(value)
  if (!date) return '-'
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
  const units = ['second', 'minute', 'hour', 'day', 'week', 'month', 'year'] as const
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

export const formatGraphTimestampWithRelative = (
  value: string | number | bigint | null | undefined,
  locale = 'en-US'
): string => {
  const absolute = formatGraphTimestamp(value, locale)
  const relative = formatRelativeTime(value)
  if (relative === '-') return absolute
  return `${absolute} (${relative})`
}

export const formatAmount = (amount: string, decimals = 18): string => {
  const value = parseFloat(amount) / Math.pow(10, decimals)
  return value.toFixed(4)
}

// timestampToDate duplicate logic (prefer locale aware functions above)
export const timestampToDate = (timestamp: string): string => {
  if (!timestamp) return ''
  const d = toDateFromGraph(timestamp)
  return d ? d.toLocaleString() : ''
}

// trimDescription from libs/utils.ts
export const trimDescription = (description: string): string => {
  if (!description) return ''
  return description.replace(/^\[\d+\]\s*/, '')
}
