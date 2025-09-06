import type { ProposalForm } from '@/hooks/useProposalForm'
import { useCallback, useEffect, useState } from 'react'
import { useCreateProposal } from '@/hooks/useCreateProposal'
import { buildCreateProposalPayload } from '@/utils/buildProposalPayload'

export interface UseProposalSubmissionParams {
  proposerAddress?: string
  formatDescription: (form: ProposalForm) => string
  validate: (form: ProposalForm) => string[]
  onSuccess?: (proposalId?: string) => void
  t: (k: string, opts?: Record<string, unknown>) => string
}

export function useProposalSubmission({
  proposerAddress,
  formatDescription,
  validate,
  onSuccess,
  t,
}: UseProposalSubmissionParams) {
  const [errors, setErrors] = useState<string[]>([])
  const [friendlyError, setFriendlyError] = useState<string | null>(null)

  const { create, status, error } = useCreateProposal({
    onSuccess: r => onSuccess?.(r.proposalId),
  })

  // Derive friendly error only when status === 'error'; prevents old error flashing after submit.
  useEffect(() => {
    if (status !== 'error' || !error) return
    const e = error as unknown as {
      shortMessage?: string
      message?: string
    }
    let raw = e.shortMessage || e.message || String(error)
    if (/User rejected/i.test(raw) || /denied transaction signature/i.test(raw)) {
      raw = t('wallet.userRejected')
    }
    else {
      raw = raw.replace(/0x[0-9a-fA-F]{120,}/g, m => `${m.slice(0, 20)}…`)
      if (raw.length > 360)
        raw = `${raw.slice(0, 360)}…`
    }
    if (friendlyError === raw) return
    queueMicrotask(() => setFriendlyError(raw))
  }, [status, error, t, friendlyError])

  const submit = useCallback(
    async (form: ProposalForm) => {
      setErrors([])
      setFriendlyError(null)
      const errs = validate(form)
      if (errs.length) {
        setErrors(errs)
        return
      }
      const payload = buildCreateProposalPayload(form, {
        proposerAddress,
      })
      const description = formatDescription(form)
      await create({ ...payload, description })
    },
    [validate, proposerAddress, create, formatDescription],
  )

  return {
    submit,
    status,
    errors,
    friendlyError,
    reset: () => {
      setErrors([])
      setFriendlyError(null)
    },
  }
}
