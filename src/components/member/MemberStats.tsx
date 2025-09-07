import { useTranslation } from 'react-i18next'
import { formatUnits } from 'viem'
import { useMember } from '@/hooks/useMember'
import { useMemberProposals } from '@/hooks/useMemberProposals'
import { useTokenInfo } from '@/hooks/useTokenInfo'
import { MemberStatsCard } from './MemberStatsCard'

interface MemberStatsProps {
  address: string
}

export function MemberStats({ address }: MemberStatsProps) {
  const { t } = useTranslation()
  const { data: member, isLoading: memberLoading } = useMember(address)
  const { createdProposalsCount, isLoading: proposalsLoading } = useMemberProposals(address)
  const { data: tokenInfo } = useTokenInfo()

  const balance = member && tokenInfo
    ? formatUnits(BigInt(member.balance), tokenInfo.decimals)
    : '0'

  // Current voting power is the delegate balance (what this address can vote with)
  const votingPower = member && tokenInfo
    ? formatUnits(BigInt(member.delegateBalance), tokenInfo.decimals)
    : '0'

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      <MemberStatsCard
        title={t('member.balance.chart.currentBalance')}
        value={Number.parseFloat(balance).toFixed(2)}
        suffix={tokenInfo?.symbol}
        isLoading={memberLoading}
      />
      <MemberStatsCard
        title={t('member.votes.votingPower')}
        value={Number.parseFloat(votingPower).toFixed(2)}
        suffix={tokenInfo?.symbol}
        isLoading={memberLoading}
      />
      <MemberStatsCard
        title={t('member.votes.createdProposals')}
        value={createdProposalsCount}
        isLoading={proposalsLoading}
      />
    </div>
  )
}