import type {
  BatchMintForm,
  BudgetForm,
  GovernorSettingForm,
  MintForm,
  ProposalForm,
} from '@/hooks/useProposalForm'
import { PROPOSAL_TYPE } from '@/constants'

export function validateProposalForm(
  form: ProposalForm,
  t: (k: string, opts?: Record<string, unknown>) => string,
): string[] {
  const errors: string[] = []
  switch (form.type) {
    case PROPOSAL_TYPE.MINT: {
      const f = form as MintForm
      if (!isAddress(f.address))
        errors.push(t('proposal.err.badSingleAddress'))
      if (!isPositiveNumber(f.amount))
        errors.push(t('proposal.err.badSingleAmount'))
      break
    }
    case PROPOSAL_TYPE.BUDGET: {
      const f = form as BudgetForm
      if (!isAddress(f.address))
        errors.push(t('proposal.err.badSingleAddress'))
      if (!isPositiveNumber(f.amount))
        errors.push(t('proposal.err.badSingleAmount'))
      break
    }
    case PROPOSAL_TYPE.BATCH_MINT: {
      const f = form as BatchMintForm
      const filtered = f.batch.filter(r => r.address || r.amount)
      if (!filtered.length)
        errors.push(t('proposal.err.noBatchRows'))
      filtered.forEach((r, idx) => {
        if (!isAddress(r.address))
          errors.push(t('proposal.err.badAddress', { idx: idx + 1 }))
        if (!isPositiveNumber(r.amount))
          errors.push(t('proposal.err.badAmount', { idx: idx + 1 }))
      })
      if (filtered.length > 100)
        errors.push(t('proposal.err.tooManyRows'))
      break
    }
    case PROPOSAL_TYPE.GOVERNOR_SETTING: {
      const f = form as GovernorSettingForm
      if (!f.governorFunction)
        errors.push(t('proposal.err.missingGovFunction'))
      if (!f.governorValue) {
        errors.push(t('proposal.err.missingGovValue'))
      }
      else if (f.governorFunction === 'updateQuorumNumerator') {
        const num = Number(f.governorValue)
        if (!Number.isFinite(num) || num <= 0 || num > 100)
          errors.push(t('proposal.err.badQuorumPercentRange', { range: '(0, 100]' }))
      }
      else if (!isNonNegativeBigInt(f.governorValue)) {
        errors.push(t('proposal.err.badGovValue'))
      }
      break
    }
  }
  return errors
}

export function validateProposalField(
  form: ProposalForm,
  fieldName: string,
  t: (k: string, opts?: Record<string, unknown>) => string,
): { name: string, error: string | null } | null {
  switch (form.type) {
    case PROPOSAL_TYPE.MINT: {
      if (fieldName === 'address')
        return { name: 'address', error: isAddress(form.address) ? null : t('proposal.err.badSingleAddress') }
      if (fieldName === 'amount')
        return { name: 'amount', error: isPositiveNumber(form.amount) ? null : t('proposal.err.badSingleAmount') }
      break
    }
    case PROPOSAL_TYPE.BUDGET: {
      if (fieldName === 'address')
        return { name: 'address', error: isAddress(form.address) ? null : t('proposal.err.badSingleAddress') }
      if (fieldName === 'amount')
        return { name: 'amount', error: isPositiveNumber(form.amount) ? null : t('proposal.err.badSingleAmount') }
      break
    }
    case PROPOSAL_TYPE.BATCH_MINT: {
      if (fieldName.startsWith('batch.')) {
        const [, idxStr, inner] = fieldName.split('.')
        const idx = Number(idxStr) - 1
        if (Number.isNaN(idx))
          return null
        const row = (form as BatchMintForm).batch[idx]
        if (!row)
          return null
        if (inner === 'address')
          return { name: fieldName, error: isAddress(row.address) ? null : t('proposal.err.badAddress', { idx: idx + 1 }) }
        if (inner === 'amount')
          return { name: fieldName, error: isPositiveNumber(row.amount) ? null : t('proposal.err.badAmount', { idx: idx + 1 }) }
      }
      break
    }
    case PROPOSAL_TYPE.GOVERNOR_SETTING: {
      if (fieldName === 'governorValue') {
        const f = form as GovernorSettingForm
        if (f.governorFunction === 'updateQuorumNumerator') {
          const num = Number(f.governorValue)
          const ok = Number.isFinite(num) && num > 0 && num <= 100
          return { name: 'governorValue', error: ok ? null : t('proposal.err.badQuorumPercentRange', { range: '(0, 100]' }) }
        }
        const ok = isNonNegativeBigInt(f.governorValue || '0')
        return { name: 'governorValue', error: ok ? null : t('proposal.err.badGovValue') }
      }
      break
    }
  }
  return null
}

// Helpers (kept internal – export only if a second module needs them)
function isAddress(addr: string | undefined): boolean {
  return !!addr && /^0x[a-fA-F0-9]{40}$/.test(addr)
}
function isPositiveNumber(v: string | undefined): boolean {
  return !!v && Number(v) > 0
}
function isNonNegativeBigInt(v: string): boolean {
  try {
    return BigInt(v) >= 0n
  }
  catch {
    return false
  }
}
