import { ActionSummary } from '@/components/ActionSummary'
import { formatTokenAmount } from '@/utils/format'
import { useDisplayName } from '@/hooks/useDisplayName'
import { ParsedAction } from '@/utils/parseProposalActions'

export interface ParsedActionRecipient {
  address: string
  amount: bigint
}

interface ProposalActionsProps {
  actions: ParsedAction[]
  tokenDecimals: number
  tokenSymbol?: string
  title: string
}

export function ProposalActions({
  actions,
  tokenDecimals,
  tokenSymbol,
  title,
}: ProposalActionsProps) {
  if (!actions.length) {
    return null
  }
  return (
    <section className="mt-4 space-y-4">
      <h3 className="text-lg font-semibold">{title}</h3>
      <ul className="space-y-2 text-sm">
        {actions.map((a, i) => {
          const isBatch =
            a.type === 'batchMint' && a.recipients && a.recipients.length > 0
          const fullBatchCall = isBatch
            ? `${a.functionName}([${a.recipients!.map(r => `"${r.address}"`).join(', ')}], [${a.recipients!.map(r => r.amount.toString()).join(', ')}])`
            : ''
          return (
            <li
              key={i}
              className="p-4 flex flex-col gap-2 border rounded-md bg-card"
            >
              <div className="font-medium flex flex-wrap gap-2 items-center">
                <ActionSummary action={a} />
                {a.type === 'governorSetting' && a.rawValue !== undefined && (
                  <span className="text-[10px] px-1 py-0.5 rounded bg-background border font-mono opacity-80">
                    raw: {a.rawValue.toString()}
                  </span>
                )}
              </div>
              {!isBatch && (
                <div className="text-xs font-mono text-secondary break-all mb-1">
                  {a.functionName}(
                  {a.args
                    .map(x =>
                      typeof x === 'bigint'
                        ? x.toString()
                        : Array.isArray(x)
                          ? `[${x.length}]`
                          : x,
                    )
                    .join(', ')}
                  )
                </div>
              )}
              {isBatch && (
                <div className="overflow-auto mt-2 space-y-2">
                  <table className="min-w-full text-xs border rounded">
                    <thead>
                      <tr className="bg-card text-left">
                        <th className="px-2 py-1 font-medium">Recipient</th>
                        <th className="px-2 py-1 font-medium">Address</th>
                        <th className="px-2 py-1 font-medium text-right">
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {a.recipients!.map(r => (
                        <BatchRecipientRow
                          key={r.address + r.amount.toString()}
                          address={r.address}
                          amount={r.amount}
                          decimals={tokenDecimals}
                          symbol={tokenSymbol}
                        />
                      ))}
                    </tbody>
                  </table>
                  <div className="text-xs opacity-70 break-all font-mono">
                    {fullBatchCall}
                  </div>
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function BatchRecipientRow({
  address,
  amount,
  decimals,
  symbol,
}: {
  address: string
  amount: bigint
  decimals: number
  symbol?: string
}) {
  const name = useDisplayName({ address })
  return (
    <tr className="border-t last:border-b align-top">
      <td className="px-2 py-1 whitespace-nowrap font-mono">
        {name || `${address.slice(0, 6)}…`}
      </td>
      <td className="px-2 py-1 font-mono break-all max-w-[160px]">{address}</td>
      <td className="px-2 py-1 text-right">
        {formatTokenAmount(amount, decimals)} {symbol || ''}
      </td>
    </tr>
  )
}
