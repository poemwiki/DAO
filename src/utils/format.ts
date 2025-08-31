export const formatAddress = (address: string): string => {
  if (!address) return ''
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('en-US', {
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
  return d.toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' })
}

export const formatAmount = (amount: string, decimals = 18): string => {
  const value = parseFloat(amount) / Math.pow(10, decimals)
  return value.toFixed(4)
}
