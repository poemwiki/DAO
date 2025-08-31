import { useTranslation } from 'react-i18next'
import { formatAddress } from '@/utils/format'
import { useDisplayName } from '@/hooks/useDisplayName'
import { useQuery } from '@tanstack/react-query'
import { getTokenHolders, type TokenHoldersResponseData } from '@/graphql'
import type { Member } from '@/types'
import { formatEther } from 'viem'


const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

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

  const members: Member[] = (data?.members || [])
    .filter(m => m.id !== ZERO_ADDRESS && BigInt(m.balance) > 0n)

  const formatDelegateAddress = (delegate: string) => {
    return delegate === ZERO_ADDRESS ? t('tokenHolders.notSet') : formatAddress(delegate)
  }

  const formatFullDelegateAddress = (delegate: string) => {
    return delegate === ZERO_ADDRESS ? t('tokenHolders.notSet') : delegate
  }

  return (
    <section className="mt-8">
      <h2 className="text-2xl font-bold mb-4">
        {t('tokenHolders.title')}
        <span className="ml-2 text-sm text-muted-foreground">
          ({members.length} {t('tokenHolders.totalHolders')})
        </span>
      </h2>
      <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
        <table className="w-full text-sm text-left">
          <thead className="text-xs pt-2 uppercase bg-muted/50">
            <tr>
              <th scope="col" className="px-6 py-3">
                {t('tokenHolders.holder')}
              </th>
              <th scope="col" className="px-6 py-3">
                {t('tokenHolders.delegate')}
              </th>
              <th scope="col" className="px-6 py-3">
                {t('tokenHolders.balance')}
              </th>
              <th scope="col" className="px-6 py-3">
                {t('tokenHolders.votes')}
              </th>
              <th scope="col" className="px-6 py-3">
                {t('tokenHolders.holderAddress')}
              </th>
              <th scope="col" className="px-6 py-3">{t('tokenHolders.delegateAddress')}</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center">
                  {t('common.loading')}
                </td>
              </tr>
            ) : members.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center">
                  {t('tokenHolders.noData')}
                </td>
              </tr>
            ) : (
              members.map(member => (
                <MemberRow key={member.id} member={member} formatDelegateAddress={formatDelegateAddress} formatFullDelegateAddress={formatFullDelegateAddress} />
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
  formatFullDelegateAddress,
}: {
  member: Member
  formatDelegateAddress: (a: string) => string
  formatFullDelegateAddress: (a: string) => string
}) {
  const displayName = useDisplayName({ address: member.id })
  return (
    <tr className="bg-background border-b hover:bg-muted/50">
      <td className="px-6 py-4">{displayName}</td>
      <td className="px-6 py-4">{formatDelegateAddress(member.delegate)}</td>
      <td className="px-6 py-4">{formatEther(BigInt(member.balance))}</td>
      <td className="px-6 py-4">{formatEther(BigInt(member.delegateBalance))}</td>
      <td className="px-6 py-4">{member.id}</td>
      <td className="px-6 py-4">{formatFullDelegateAddress(member.delegate)}</td>
    </tr>
  )
}
