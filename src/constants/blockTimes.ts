// WHY: Centralized mapping of average block times for different chains,
// reused by hooks & formatting utilities. Values are approximate and can be tuned.
export const AVERAGE_BLOCK_TIME_SECONDS: Record<number, number> = {
  1: 12, // Ethereum mainnet
  11155111: 12, // Sepolia
  137: 2, // Polygon
  80002: 2, // Polygon Amoy
}

export function getAverageBlockTime(chainId: number, fallback = 12): number {
  return AVERAGE_BLOCK_TIME_SECONDS[chainId] || fallback
}
