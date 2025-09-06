import type { ProposalForm } from '@/hooks/useProposalForm'
import { describe, expect, it } from 'vitest'
import { PROPOSAL_TYPE } from '@/constants'
import { buildCreateProposalPayload } from '../buildProposalPayload'

// helper base form (omit discriminant specific fields)
function base(): { title: string, description: string } {
  return { title: '', description: '' }
}

describe('buildCreateProposalPayload', () => {
  it('builds mint payload', () => {
    const form: ProposalForm = { ...base(), type: PROPOSAL_TYPE.MINT, address: '0x000000000000000000000000000000000000dEaD', amount: '123' }
    const p = buildCreateProposalPayload(form, {})
    expect(p).toEqual({ type: PROPOSAL_TYPE.MINT, address: form.address, amount: '123' })
  })

  it('builds budget payload falls back to proposer', () => {
    const form: ProposalForm = { ...base(), type: PROPOSAL_TYPE.BUDGET, address: '', amount: '5' }
    const p = buildCreateProposalPayload(form, { proposerAddress: '0x000000000000000000000000000000000000BEEF' })
    expect(p.address).toBe('0x000000000000000000000000000000000000BEEF')
    expect(p.amount).toBe('5')
  })

  it('builds batch mint payload filtering empty rows', () => {
    const form: ProposalForm = {
      ...base(),
      type: PROPOSAL_TYPE.BATCH_MINT,
      batch: [
        { address: '0x000000000000000000000000000000000000dEaD', amount: '1' },
        { address: '', amount: '' },
      ],
    }
    const p = buildCreateProposalPayload(form, {})
    expect(p.batch?.length).toBe(1)
    expect(p.batch?.[0].amount).toBe('1')
  })

  it('builds governor setting payload', () => {
    const form: ProposalForm = { ...base(), type: PROPOSAL_TYPE.GOVERNOR_SETTING, governorFunction: 'setVotingDelay', governorValue: '10' }
    const p = buildCreateProposalPayload(form, {})
    expect(p.governorSetting).toEqual({ function: 'setVotingDelay', value: '10' })
  })
})
