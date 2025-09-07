import type { ParsedAction } from '@/lib/parseProposalActions'
import { useTranslation } from 'react-i18next'

interface ActionSummaryProps {
  action: ParsedAction
}

export function ActionSummary({ action }: ActionSummaryProps) {
  const { t } = useTranslation()

  // Use i18n key if available, otherwise fallback to summary
  if (action.summaryKey && action.summaryParams) {
    return <span>{t(action.summaryKey, action.summaryParams)}</span>
  }

  if (action.summaryKey) {
    return <span>{t(action.summaryKey)}</span>
  }

  // Fallback to hardcoded summary
  return <span>{action.summary}</span>
}
