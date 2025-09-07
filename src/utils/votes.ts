export const SUPPORT = {
  AGAINST: 0,
  FOR: 1,
  ABSTAIN: 2,
} as const

export type SupportType = typeof SUPPORT[keyof typeof SUPPORT]

export function normalizeSupport(support: number): keyof typeof SUPPORT | 'UNKNOWN' {
  switch (support) {
    case SUPPORT.AGAINST:
      return 'AGAINST'
    case SUPPORT.FOR:
      return 'FOR'
    case SUPPORT.ABSTAIN:
      return 'ABSTAIN'
    default:
      return 'UNKNOWN'
  }
}

export function formatVoteSupport(support: number, t: (key: string) => string): string {
  switch (support) {
    case SUPPORT.FOR:
      return t('proposal.vote.for')
    case SUPPORT.AGAINST:
      return t('proposal.vote.against')
    case SUPPORT.ABSTAIN:
      return t('proposal.vote.abstain')
    default:
      return t('proposal.vote.unknown')
  }
}

export function supportColor(support: number): string {
  switch (support) {
    case SUPPORT.FOR:
      return 'text-primary border bold dark:text-green-300'
    case SUPPORT.AGAINST:
      return 'text-red border bold dark:text-red-300'
    case SUPPORT.ABSTAIN:
      return 'text-yellow border bold dark:text-yellow-300'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
  }
}

export function supportIcon(support: number): string {
  switch (support) {
    case SUPPORT.FOR:
      return '✓'
    case SUPPORT.AGAINST:
      return '✗'
    case SUPPORT.ABSTAIN:
      return '◦'
    default:
      return '?'
  }
}
