import type { Abi } from 'viem'
import { governorABI } from '@/abis/governorABI'
import { tokenABI } from '@/abis/tokenABI'

export const combinedABI = [...governorABI, ...tokenABI] as Abi

export * from './governorABI'
export * from './tokenABI'
