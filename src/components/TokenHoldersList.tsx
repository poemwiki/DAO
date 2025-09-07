import type { TokenHoldersResponseData } from '@/graphql'
import type { Member } from '@/types'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { ZERO_ADDRESS } from '@/constants'
import { getTokenHolders } from '@/graphql'
import { useDisplayName } from '@/hooks/useDisplayName'
import { formatAddress, formatTokenAmount } from '@/utils/format'
import DelegateButton from './DelegateButton'

export default function TokenHoldersList() {
  const { t } = useTranslation()
  const { data, isLoading, error } = useQuery<TokenHoldersResponseData>({
    queryKey: ['tokenHolders'],
    queryFn: getTokenHolders,
  })

  if (error) {
    console.error('Error fetching token holders:', error)
    return (
      <section className="mt-8">
        <h2 className="text-2xl font-bold mb-4">{t('tokenHolders.title')}</h2>
        <div className="text-red-500">{t('common.error')}</div>
      </section>
    )
  }

  const members: Member[] = (data?.members || []).filter(
    m => m.id !== ZERO_ADDRESS && BigInt(m.balance) > 0n,
  )

  // Totals for percentage calculation (avoid division by zero later)
  const totalBalance = members.reduce(
    (acc, m) => acc + BigInt(m.balance),
    0n,
  )

  const formatDelegateAddress = (delegate: string) => {
    return delegate === ZERO_ADDRESS
      ? t('tokenHolders.notSet')
      : formatAddress(delegate)
  }

  return (
    <section className="mt-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold mb-4">
          {t('tokenHolders.title')}
          <span className="ml-2 text-sm text-secondary">
            {members.length}
            {' '}
            {t('tokenHolders.totalHolders')}
          </span>
        </h2>
        <DelegateButton />
      </div>
      <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
        <table className="w-full text-sm text-left">
          <thead className="text-xs pt-2 uppercase bg-card">
            <tr>
              <th scope="col" className="px-6 py-3">
                {t('tokenHolders.holder')}
              </th>
              <th scope="col" className="px-6 py-3">
                {t('tokenHolders.delegate')}
              </th>
              <th scope="col" className="px-6 py-3 text-right">
                {t('tokenHolders.balance')}
              </th>
              <th scope="col" className="px-6 py-3 text-right">
                {t('tokenHolders.votes')}
              </th>
              <th scope="col" className="px-6 py-3">
                {t('tokenHolders.holderAddress')}
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center">
                      {t('common.loading')}
                    </td>
                  </tr>
                )
              : members.length === 0
                ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center">
                        {t('tokenHolders.noData')}
                      </td>
                    </tr>
                  )
                : (
                    members.map(member => (
                      <MemberRow
                        key={member.id}
                        member={member}
                        formatDelegateAddress={formatDelegateAddress}
                        totalBalance={totalBalance}
                      />
                    ))
                  )}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function MemberRow({
  member,
  formatDelegateAddress,
  totalBalance,
}: {
  member: Member
  formatDelegateAddress: (a: string) => string
  totalBalance: bigint
}) {
  const displayName = useDisplayName({ address: member.id })
  const delegateDisplayName = useDisplayName({ address: member.delegate })

  // Assume token decimals = 18 (governance token). If variable, pass via props later.
  const DECIMALS = 18
  const bal = BigInt(member.balance)
  const votes = BigInt(member.delegateBalance)
  const pct = totalBalance === 0n ? 0 : Number((bal * 10000n) / totalBalance) / 100
  // votesPct: use totalBalance (total supply represented in table) as denominator
  // to show direct share of overall supply that this delegate controls (helps reason about quorum reach).
  const votesPct = totalBalance === 0n ? 0 : Number((votes * 10000n) / totalBalance) / 100

  return (
    <tr className="font-mono text-xs bg-background border-b hover:bg-card">
      <td className="px-6 py-4">{displayName}</td>
      <td className="px-6 py-4">
        {member.delegate === ZERO_ADDRESS
          ? formatDelegateAddress(member.delegate)
          : delegateDisplayName}
      </td>
      <td className="px-6 py-4 text-right">
        <span>{formatTokenAmount(bal, DECIMALS)}</span>
        <span className="inline-block w-12 text-right text-xs text-secondary ml-2">
          {pct.toFixed(2)}
          %
        </span>
      </td>
      <td className="px-6 py-4 text-right">
        <span>{formatTokenAmount(votes, DECIMALS)}</span>
        <span className="inline-block w-12 text-right text-xs text-secondary ml-2">
          {votesPct.toFixed(2)}
          %
        </span>
      </td>
      <td className="px-6 py-4">{member.id}</td>
    </tr>
  )
}
