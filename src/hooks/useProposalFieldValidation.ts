import type { ProposalForm } from '@/hooks/useProposalForm'
import { useCallback, useState } from 'react'
import { validateProposalField } from '@/utils/proposalValidation'

export interface UseProposalFieldValidationOptions {
  form: ProposalForm
  t: (k: string, opts?: Record<string, unknown>) => string
}

export interface UseProposalFieldValidationResult {
  fieldErrors: Record<string, string>
  validateField: (name: string) => void
  setFieldError: (name: string, msg: string | null) => void
  resetFieldErrors: () => void
}

export function useProposalFieldValidation({ form, t }: UseProposalFieldValidationOptions): UseProposalFieldValidationResult {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const setFieldError = useCallback((name: string, msg: string | null) => {
    setFieldErrors((prev) => {
      if (!msg) {
        const { [name]: _omit, ...rest } = prev
        return rest
      }
      if (prev[name] === msg)
        return prev
      return { ...prev, [name]: msg }
    })
  }, [])

  const validateField = useCallback((name: string) => {
    const res = validateProposalField(form, name, t)
    if (res)
      setFieldError(res.name, res.error)
  }, [form, t, setFieldError])

  const resetFieldErrors = useCallback(() => setFieldErrors({}), [])

  return { fieldErrors, validateField, setFieldError, resetFieldErrors }
}
