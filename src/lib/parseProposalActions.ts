import { governorABI } from '@/abis/governorABI'
import { tokenABI } from '@/abis/tokenABI'
import { short, formatTokenAmount } from '@/utils/format'
import { lookupAddressBookName } from '@/hooks/useDisplayName'
import { decodeFunctionData, Abi } from 'viem'

// Known function signatures mapping to categories
export type ParsedAction = {
  target: string
  signature: string
  functionName: string
  args: unknown[]
  type: 'governorSetting' | 'mint' | 'batchMint' | 'mintAndApprove' | 'unknown'
  summary: string
  summaryKey?: string // i18n key for summary
  summaryParams?: Record<string, unknown> // parameters for i18n interpolation
  rawValue?: bigint // for governorSetting new value
  paramKey?: string // internal key (e.g., votingDelay)
  recipients?: { address: string; amount: bigint }[] // for batchMint detail
}

const FN_TYPE: Record<string, ParsedAction['type']> = {
  setVotingDelay: 'governorSetting',
  setVotingPeriod: 'governorSetting',
  setProposalThreshold: 'governorSetting',
  updateQuorumNumerator: 'governorSetting',
  mint: 'mint',
  batchMint: 'batchMint',
  mintAndApprove: 'mintAndApprove',
}

const combinedABI = [...governorABI, ...tokenABI] as Abi

export function parseProposalActions(
  targets: readonly string[] = [],
  calldatas: readonly string[] = [],
  signatures?: readonly string[],
  tokenDecimals?: number,
  tokenSymbol?: string
): ParsedAction[] {
  const actions: ParsedAction[] = []
  for (let i = 0; i < targets.length; i++) {
    const data = calldatas[i]
    if (!data) continue
    try {
      const decoded = decodeFunctionData({ abi: combinedABI, data: data as `0x${string}` })
      const fn = decoded.functionName
      const type = FN_TYPE[fn] || 'unknown'
      const symbol = tokenSymbol || 'TOKEN'
      let summary = fn
      if (type === 'mint') {
        const [to, amount] = decoded.args as [string, bigint]
        const name = lookupAddressBookName(to)
        const who = name ? `${name}(${short(to)})` : to
        summary = `发放 ${formatTokenAmount(amount, tokenDecimals ?? 18)} ${symbol} 给 ${who}`
        actions.push({
          target: targets[i],
          signature: signatures?.[i] || decoded.functionName,
          functionName: decoded.functionName,
          args: decoded.args as unknown[],
          type,
          summary,
          summaryKey: 'actions.mint',
          summaryParams: {
            amount: formatTokenAmount(amount, tokenDecimals ?? 18),
            symbol,
            who,
          },
        })
        continue
      } else if (type === 'mintAndApprove') {
        const [spender, amount] = decoded.args as [string, bigint]
        const name = lookupAddressBookName(spender)
        const who = spender ? `${name}(${short(spender)})` : spender
        summary = `申请 ${formatTokenAmount(amount, tokenDecimals ?? 18)} ${symbol} 预算给 ${who}`
        actions.push({
          target: targets[i],
          signature: signatures?.[i] || decoded.functionName,
          functionName: decoded.functionName,
          args: decoded.args as unknown[],
          type,
          summary,
          summaryKey: 'actions.mintAndApprove',
          summaryParams: {
            amount: formatTokenAmount(amount, tokenDecimals ?? 18),
            symbol,
            who,
          },
        })
        continue
      } else if (type === 'batchMint') {
        const [toArray, amountArray] = decoded.args as [string[], bigint[]]
        const total = amountArray.reduce((a, b) => a + b, 0n)
        const symbol = tokenSymbol || 'TOKEN'
        summary = `批量发放给 ${toArray.length} 人, 总计 ${formatTokenAmount(
          total,
          tokenDecimals ?? 18
        )} ${symbol}`
        actions.push({
          target: targets[i],
          signature: signatures?.[i] || decoded.functionName,
          functionName: decoded.functionName,
          args: decoded.args as unknown[],
          type,
          summary,
          summaryKey: 'actions.batchMint',
          summaryParams: {
            count: toArray.length,
            total: formatTokenAmount(total, tokenDecimals ?? 18),
            symbol,
          },
          recipients: toArray.map((addr, idx) => ({ address: addr, amount: amountArray[idx] })),
        })
        continue
      } else if (type === 'governorSetting') {
        const [val] = decoded.args as [bigint]
        const labelMap: Record<string, string> = {
          setVotingDelay: 'actions.setVotingDelay',
          setVotingPeriod: 'actions.setVotingPeriod',
          setProposalThreshold: 'actions.setProposalThreshold',
          updateQuorumNumerator: 'actions.updateQuorumNumerator',
        }
        const paramKeyMap: Record<string, string> = {
          setVotingDelay: 'votingDelay',
          setVotingPeriod: 'votingPeriod',
          setProposalThreshold: 'proposalThreshold',
          updateQuorumNumerator: 'quorumNumerator',
        }
        summary = `${labelMap[fn] || fn} => ${val.toString()}`
        actions.push({
          target: targets[i],
          signature: signatures?.[i] || decoded.functionName,
          functionName: decoded.functionName,
          args: decoded.args as unknown[],
          type,
          summary,
          summaryKey: labelMap[fn] || 'actions.unknown',
          summaryParams: {
            value: val.toString(),
          },
          rawValue: val,
          paramKey: paramKeyMap[fn],
        })
        continue
      }
      actions.push({
        target: targets[i],
        signature: signatures?.[i] || decoded.functionName,
        functionName: decoded.functionName,
        args: decoded.args as unknown[],
        type,
        summary,
        summaryKey: type === 'unknown' ? 'actions.unknown' : undefined,
      })
    } catch (_e) {
      actions.push({
        target: targets[i],
        signature: signatures?.[i] || 'unknown',
        functionName: 'unknown',
        args: [],
        type: 'unknown',
        summary: '无法解析的调用',
        summaryKey: 'actions.parseError',
      })
    }
  }
  return actions
}
