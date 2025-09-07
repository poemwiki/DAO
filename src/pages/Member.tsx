import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { MemberBalanceChart } from '@/components/member/MemberBalanceChart'
import { MemberHeader } from '@/components/member/MemberHeader'
import { MemberSection } from '@/components/member/MemberSection'
import { MemberStats } from '@/components/member/MemberStats'
import { MemberTransferHistory } from '@/components/member/MemberTransferHistory'
import { MemberVoteHistory } from '@/components/member/MemberVoteHistory'

export default function Member() {
  const { address } = useParams<{ address: string }>()
  const { t } = useTranslation()

  if (!address) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">{t('common.notFound.title')}</h1>
          <p className="text-secondary">{t('member.invalidAddress')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="space-y-10">
        <MemberHeader address={address} />

        <MemberStats address={address} />

        <MemberSection
          title={t('member.balance.chart.title')}
          description={t('member.balance.chart.description')}
        >
          <MemberBalanceChart address={address} />
        </MemberSection>

        <MemberSection
          title={t('member.transfers.title')}
          description={t('member.transfers.description')}
        >
          <MemberTransferHistory address={address} />
        </MemberSection>

        <MemberSection
          title={t('member.votes.title')}
          description={t('member.votes.description')}
        >
          <MemberVoteHistory address={address} />
        </MemberSection>
      </div>
    </div>
  )
}
