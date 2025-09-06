import { useMemo, useState } from 'react'
import { PROPOSAL_TYPE } from '@/constants'
import { validateProposalForm } from '@/utils/proposalValidation'

// Strongly typed discriminated union for proposal form state
export type GovernorFunction
  = | 'setVotingDelay'
    | 'setVotingPeriod'
    | 'setProposalThreshold'
    | 'updateQuorumNumerator'

export interface BaseForm {
  title: string
  description: string
}
export interface MintForm extends BaseForm {
  type: typeof PROPOSAL_TYPE.MINT
  address: string
  amount: string
}
export interface BudgetForm extends BaseForm {
  type: typeof PROPOSAL_TYPE.BUDGET
  address: string // resolved to connected wallet when submitting
  amount: string
}
export interface BatchMintForm extends BaseForm {
  type: typeof PROPOSAL_TYPE.BATCH_MINT
  batch: Array<{ address: string, amount: string }>
}
export interface GovernorSettingForm extends BaseForm {
  type: typeof PROPOSAL_TYPE.GOVERNOR_SETTING
  governorFunction: GovernorFunction
  governorValue: string
}
export type ProposalForm
  = | MintForm
    | BudgetForm
    | BatchMintForm
    | GovernorSettingForm

function makeInitialForm(
  type: ProposalForm['type'],
  prev?: ProposalForm,
): ProposalForm {
  const base: BaseForm = {
    title: prev?.title || '',
    description: prev?.description || '',
  }
  switch (type) {
    case PROPOSAL_TYPE.MINT:
      return { ...base, type, address: '', amount: '' }
    case PROPOSAL_TYPE.BUDGET:
      return { ...base, type, address: '', amount: '' }
    case PROPOSAL_TYPE.BATCH_MINT:
      return { ...base, type, batch: [{ address: '', amount: '' }] }
    case PROPOSAL_TYPE.GOVERNOR_SETTING:
      return {
        ...base,
        type,
        governorFunction: 'setVotingDelay',
        governorValue: '',
      }
    default:
      return { ...base, type: PROPOSAL_TYPE.MINT, address: '', amount: '' }
  }
}

export interface UseProposalFormResult {
  form: ProposalForm
  setForm: React.Dispatch<React.SetStateAction<ProposalForm>>
  setType: (next: ProposalForm['type']) => void
  addBatchRow: () => void
  updateBatchRow: (
    idx: number,
    key: 'address' | 'amount',
    value: string,
  ) => void
  removeBatchRow: (idx: number) => void
  batchTotal: number
  validate: (
    form: ProposalForm,
    t: (key: string, opts?: Record<string, unknown>) => string,
    proposerAddress?: string,
  ) => string[]
}

export function useProposalForm(): UseProposalFormResult {
  const [form, setForm] = useState<ProposalForm>(() =>
    makeInitialForm(PROPOSAL_TYPE.MINT),
  )

  const batchTotal = useMemo(() => {
    if (form.type !== PROPOSAL_TYPE.BATCH_MINT)
      return 0
    return form.batch.reduce((sum, r) => {
      const v = Number(r.amount)
      return v > 0 ? sum + v : sum
    }, 0)
  }, [form])

  function setType(next: ProposalForm['type']) {
    setForm(f => makeInitialForm(next, f))
  }
  function addBatchRow() {
    setForm(f =>
      f.type === PROPOSAL_TYPE.BATCH_MINT
        ? { ...f, batch: [...f.batch, { address: '', amount: '' }] }
        : f,
    )
  }
  function updateBatchRow(
    idx: number,
    key: 'address' | 'amount',
    value: string,
  ) {
    setForm(f =>
      f.type === PROPOSAL_TYPE.BATCH_MINT
        ? {
            ...f,
            batch: f.batch.map((row, i) =>
              i === idx ? { ...row, [key]: value } : row,
            ),
          }
        : f,
    )
  }
  function removeBatchRow(idx: number) {
    setForm(f =>
      f.type === PROPOSAL_TYPE.BATCH_MINT
        ? {
            ...f,
            batch:
              f.batch.length === 1
                ? f.batch
                : f.batch.filter((_, i) => i !== idx),
          }
        : f,
    )
  }

  const validate = (
    formIn: ProposalForm,
    t: (k: string, opts?: Record<string, unknown>) => string,
  ): string[] => validateProposalForm(formIn, t)

  return {
    form,
    setForm,
    setType,
    addBatchRow,
    updateBatchRow,
    removeBatchRow,
    batchTotal,
    validate,
  }
}

export { makeInitialForm }
