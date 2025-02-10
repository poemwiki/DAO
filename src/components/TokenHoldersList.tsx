import React from 'react'
import { useTranslation } from 'react-i18next'
import { formatAddress } from '@/utils/format'
import { useQuery } from '@apollo/client'
import { TOKEN_HOLDERS_QUERY } from '@/graphql'
import { formatEther } from 'viem'

interface Member {
  id: string // address
  balance: string // BigInt string
  delegateBalance: string // BigInt string
  delegate: string // address
  updatedAt: string // BigInt string
}

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

export default function TokenHoldersList() {
  const { t } = useTranslation()
  const { loading, error, data } = useQuery(TOKEN_HOLDERS_QUERY)

  if (error) {
    console.error('Error fetching token holders:', error)
    return (
      <section className="mt-8">
        <h2 className="text-2xl font-bold mb-4">{t('tokenHolders.title')}</h2>
        <div className="text-red-500">{t('common.error')}</div>
      </section>
    )
  }

  const members = (data?.members || []).filter(
    (member: Member) => member.id !== ZERO_ADDRESS && BigInt(member.balance) > 0n
  ) as Member[]

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
          <thead className="text-xs uppercase bg-muted/50">
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
              <th scope="col" className="px-6 py-3">
                {t('tokenHolders.delegateAddress')}
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
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
                <tr key={member.id} className="bg-background border-b hover:bg-muted/50">
                  <td className="px-6 py-4">{formatAddress(member.id)}</td>
                  <td className="px-6 py-4">{formatDelegateAddress(member.delegate)}</td>
                  <td className="px-6 py-4">{formatEther(BigInt(member.balance))}</td>
                  <td className="px-6 py-4">{formatEther(BigInt(member.delegateBalance))}</td>
                  <td className="px-6 py-4">{member.id}</td>
                  <td className="px-6 py-4">{formatFullDelegateAddress(member.delegate)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
