// Token supply & balance related query helpers.
// NOTE: Uses sharedPublicClient from clients/publicClient.
import { tokenABI } from '@/abis/tokenABI'
import { sharedPublicClient } from '@/clients/publicClient'
import { config } from '@/config'

export const tokenAddress = () => config.contracts.token as `0x${string}`

export const qkPastTotalSupply = (block?: number) => ['tokenPastTotalSupply', tokenAddress(), block]
export const qkBalanceOf = (address?: string) => ['tokenBalanceOf', tokenAddress(), address]

export async function fetchPastTotalSupply(blockNumber: number, client = sharedPublicClient) {
  if (!client || blockNumber === undefined)
    return undefined
  try {
    return (await client.readContract({
      address: tokenAddress(),
      abi: tokenABI,
      functionName: 'getPastTotalSupply',
      args: [BigInt(blockNumber)],
    })) as bigint
  }
  catch (e) {
    console.warn('getPastTotalSupply read failed', e)
    return undefined
  }
}

export async function fetchBalanceOf(holder: `0x${string}`, client = sharedPublicClient) {
  if (!client)
    return undefined
  try {
    return (await client.readContract({
      address: tokenAddress(),
      abi: tokenABI,
      functionName: 'balanceOf',
      args: [holder],
    })) as bigint
  }
  catch (e) {
    console.warn('balanceOf read failed', e)
    return undefined
  }
}
