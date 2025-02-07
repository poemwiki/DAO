export function short(str: string) {
  return str.slice(0, 6) + '...' + str.slice(-4)
}

export function timestampToDate(timestamp: string) {
  return new Date(parseInt(timestamp) * 1000).toLocaleString()
}

export function trimDescription(description: string) {
  return description.replace(/^\[\d+\]/, '')
}
