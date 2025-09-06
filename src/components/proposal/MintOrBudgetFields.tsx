import React from 'react'
import { PROPOSAL_TYPE } from '@/constants'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { ProposalForm } from '@/hooks/useProposalForm'
import { useTranslation } from 'react-i18next'

interface Props {
  form: ProposalForm
  proposerAddress?: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void
  fieldErrors?: Record<string, string>
}

export const MintOrBudgetFields: React.FC<Props> = ({
  form,
  proposerAddress,
  onChange,
  onBlur,
  fieldErrors,
}) => {
  const { t } = useTranslation()
  if (form.type === PROPOSAL_TYPE.BATCH_MINT || form.type === PROPOSAL_TYPE.GOVERNOR_SETTING) {
    return null
  }
  return (
    <>
      <div className="flex flex-col gap-2">
        <Label>
          {form.type === PROPOSAL_TYPE.BUDGET
            ? t('proposal.requestAddress')
            : t('proposal.recipientAddress')}
        </Label>
        <Input
          name="address"
          value={
            form.type === PROPOSAL_TYPE.BUDGET
              ? form.address || proposerAddress || ''
              : form.address
          }
          onChange={onChange}
          onBlur={onBlur}
          className={(fieldErrors?.address ? 'border-destructive focus-visible:ring-destructive ' : '') + 'placeholder:text-muted-foreground'}
          placeholder={t('proposal.enterAddress')}
          required
        />
        {fieldErrors?.address && (
          <p className="text-xs text-destructive">{fieldErrors.address}</p>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <Label>{t('proposal.amount')}</Label>
        <Input
          name="amount"
          type="number"
            value={form.amount}
          onChange={onChange}
          onBlur={onBlur}
          className={(fieldErrors?.amount ? 'border-destructive focus-visible:ring-destructive ' : '') + 'placeholder:text-muted-foreground'}
          min="0"
          step="0.000000000000000001"
          required
          placeholder={t('proposal.enterAmount')}
        />
        {fieldErrors?.amount && (
          <p className="text-xs text-destructive">{fieldErrors.amount}</p>
        )}
      </div>
    </>
  )
}
