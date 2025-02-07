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

export const formatAmount = (amount: string, decimals = 18): string => {
  const value = parseFloat(amount) / Math.pow(10, decimals)
  return value.toFixed(4)
}
