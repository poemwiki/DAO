import React from 'react'
import { PROPOSAL_TYPE } from '@/constants'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useTranslation } from 'react-i18next'
import { ProposalForm } from '@/hooks/useProposalForm'

interface Props {
  form: ProposalForm
  batchTotal: number
  symbol?: string
  addRow: () => void
  updateRow: (idx: number, key: 'address' | 'amount', value: string) => void
  removeRow: (idx: number) => void
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void
  fieldErrors?: Record<string, string>
}

export const BatchMintFields: React.FC<Props> = ({
  form,
  batchTotal,
  symbol,
  addRow,
  updateRow,
  removeRow,
  onBlur,
  fieldErrors,
}) => {
  const { t } = useTranslation()
  if (form.type !== PROPOSAL_TYPE.BATCH_MINT) return null
  return (
    <div className="space-y-3">
      <Label>{t('proposal.batchMintRows')}</Label>
      <div className="space-y-2">
        {form.batch.map((row, i) => {
          const addrKey = `batch.${i + 1}.address`
          const amtKey = `batch.${i + 1}.amount`
          return (
            <div key={i} className="flex gap-2 items-start">
              <div className="flex-1 space-y-1">
                <Input
                  value={row.address}
                  onChange={e => updateRow(i, 'address', e.target.value)}
                  onBlur={e => {
                    if (onBlur) onBlur({ ...e, target: { ...e.target, name: addrKey } } as any)
                  }}
                  placeholder={t('proposal.enterAddress')}
                  className={(fieldErrors?.[addrKey] ? 'border-destructive focus-visible:ring-destructive ' : '') + 'placeholder:text-muted-foreground'}
                />
                {fieldErrors?.[addrKey] && (
                  <p className="text-xs text-destructive">{fieldErrors[addrKey]}</p>
                )}
              </div>
              <div className="w-40 space-y-1">
                <Input
                  type="number"
                  value={row.amount}
                  onChange={e => updateRow(i, 'amount', e.target.value)}
                  onBlur={e => {
                    if (onBlur) onBlur({ ...e, target: { ...e.target, name: amtKey } } as any)
                  }}
                  placeholder={t('proposal.enterAmount')}
                  className={(fieldErrors?.[amtKey] ? 'border-destructive focus-visible:ring-destructive ' : '') + 'placeholder:text-muted-foreground'}
                  min="0"
                  step="0.000000000000000001"
                />
                {fieldErrors?.[amtKey] && (
                  <p className="text-xs text-destructive">{fieldErrors[amtKey]}</p>
                )}
              </div>
              <Button
                type="button"
                variant="ghost"
                onClick={() => removeRow(i)}
                disabled={form.batch.length === 1}
                className="px-2"
              >
                {t('common.remove')}
              </Button>
            </div>
          )
        })}
        <div>
          <Button type="button" variant="outline" onClick={addRow} size="sm">
            {t('proposal.addRow')}
          </Button>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">{t('proposal.batchMintHint')}</p>
      <p className="text-xs">
        {t('proposal.batchTotal', { total: batchTotal, symbol: symbol || '' })}
      </p>
    </div>
  )
}
