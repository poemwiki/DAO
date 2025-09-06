import type { ProposalForm } from '@/hooks/useProposalForm'
import { PROPOSAL_TYPE } from '@/constants'

export interface BuildPayloadOptions {
  proposerAddress?: string
}

export function buildCreateProposalPayload(
  form: ProposalForm,
  opts: BuildPayloadOptions,
) {
  const proposer = opts.proposerAddress
  switch (form.type) {
    case PROPOSAL_TYPE.BATCH_MINT:
      return {
        type: form.type,
        address: '0x0000000000000000000000000000000000000000',
        amount: '0',
        batch: form.batch.filter(r => r.address && r.amount),
      }
    case PROPOSAL_TYPE.GOVERNOR_SETTING:
      return {
        type: form.type,
        address: '0x0000000000000000000000000000000000000000',
        amount: '0',
        governorSetting: {
          function: form.governorFunction,
          value: form.governorValue,
        },
      }
    case PROPOSAL_TYPE.BUDGET:
      return {
        type: form.type,
        address: form.address || proposer || '',
        amount: form.amount,
      }
    case PROPOSAL_TYPE.MINT:
    default:
      return {
        type: PROPOSAL_TYPE.MINT,
        address: form.address,
        amount: form.amount,
      }
  }
}
