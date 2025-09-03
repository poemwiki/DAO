import React from 'react'
import { useTranslation } from 'react-i18next'
import { PROPOSAL_TYPE } from '@/constants'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'

export interface ProposalTypeSelectProps {
  value: (typeof PROPOSAL_TYPE)[keyof typeof PROPOSAL_TYPE]
  onChange: (v: (typeof PROPOSAL_TYPE)[keyof typeof PROPOSAL_TYPE]) => void
}

// Memoized select so hover / internal highlight state inside Radix does not force parent page re-render
const ProposalTypeSelectComponent: React.FC<ProposalTypeSelectProps> = ({ value, onChange }) => {
  const { t } = useTranslation()
  return (
    <Select
      value={value}
      onValueChange={(v: any) => {
        if (v === value) return
        onChange(v)
      }}
    >
      <SelectTrigger>
        <SelectValue placeholder={t('proposal.typePlaceholder')} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={PROPOSAL_TYPE.MINT}>{t('proposal.types.mint')}</SelectItem>
        <SelectItem value={PROPOSAL_TYPE.BUDGET}>{t('proposal.types.budget')}</SelectItem>
      </SelectContent>
    </Select>
  )
}

export const ProposalTypeSelect = React.memo(
  ProposalTypeSelectComponent,
  (prev, next) => prev.value === next.value
)

ProposalTypeSelect.displayName = 'ProposalTypeSelect'
