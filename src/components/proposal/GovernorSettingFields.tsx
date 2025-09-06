import React from 'react'
import { PROPOSAL_TYPE } from '@/constants'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { useTranslation } from 'react-i18next'
import { ProposalForm, GovernorFunction } from '@/hooks/useProposalForm'
import { estimateDurationFromBlocks } from '@/utils/format'
import { getAverageBlockTime } from '@/constants/blockTimes'
import { config } from '@/config'

interface Props {
  form: ProposalForm
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  setGovernorFunction: (fn: GovernorFunction) => void
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void
  fieldErrors?: Record<string, string>
}

export const GovernorSettingFields: React.FC<Props> = ({
  form,
  onChange,
  setGovernorFunction,
  onBlur,
  fieldErrors,
}) => {
  const { t } = useTranslation()
  if (form.type !== PROPOSAL_TYPE.GOVERNOR_SETTING) return null
  const fn = form.governorFunction
  const raw = form.governorValue
  let duration: string | null = null
  if (raw && (fn === 'setVotingPeriod' || fn === 'setVotingDelay')) {
    try {
      const blocks = BigInt(raw)
      if (blocks > 0n) {
        const chainIdHex = config.network.chainId
        const chainId = chainIdHex.startsWith('0x')
          ? Number.parseInt(chainIdHex, 16)
          : Number(chainIdHex)
        const avgSecPerBlock = getAverageBlockTime(chainId)
        duration = estimateDurationFromBlocks(Number(blocks), avgSecPerBlock)
      }
    } catch {
      // ignore
    }
  }
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2">
        <Label>{t('proposal.governorFunction')}</Label>
        <Select
          value={form.governorFunction}
          onValueChange={(v: GovernorFunction) => {
            if (v !== form.governorFunction) setGovernorFunction(v)
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="border border-input">
            <SelectItem value="setVotingDelay">{t('proposal.govFn.setVotingDelay')}</SelectItem>
            <SelectItem value="setVotingPeriod">{t('proposal.govFn.setVotingPeriod')}</SelectItem>
            <SelectItem value="setProposalThreshold">{t('proposal.govFn.setProposalThreshold')}</SelectItem>
            <SelectItem value="updateQuorumNumerator">{t('proposal.govFn.updateQuorumNumerator')}</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-secondary">
          {t(`proposal.govFnHelp.${form.governorFunction}` as const)}
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <Label>{t('proposal.newValue')}</Label>
        <div className="flex items-center gap-2">
          <Input
            name="governorValue"
            type="number"
            value={form.governorValue}
            onChange={onChange}
            onBlur={onBlur}
            min={fn === 'updateQuorumNumerator' ? '1' : '0'}
            max={fn === 'updateQuorumNumerator' ? '100' : undefined}
            step={fn === 'updateQuorumNumerator' ? '1' : '1'}
            required
            className={(fieldErrors?.governorValue ? 'border-destructive focus-visible:ring-destructive ' : '') + 'placeholder:text-muted-foreground'}
            placeholder={t('proposal.enterNewValue')}
          />
          {fn === 'updateQuorumNumerator' && <span className="text-sm font-medium">%</span>}
        </div>
        {fieldErrors?.governorValue && (
          <p className="text-xs text-destructive">{fieldErrors.governorValue}</p>
        )}
        <p className="hidden text-xs text-muted-foreground">
          {t('proposal.governorSettingHint')}
        </p>
        {duration && (
          <p className="text-xs text-muted-foreground">
            {t('proposal.estimatedDuration', { human: duration })}
          </p>
        )}
      </div>
    </div>
  )
}
