import type { ProposalForm } from '@/hooks/useProposalForm'
import { useConnectWallet } from '@web3-onboard/react'
import React, { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { BatchMintFields } from '@/components/proposal/BatchMintFields'
import { ExecutionPreview } from '@/components/proposal/ExecutionPreview'
import { GovernorSettingFields } from '@/components/proposal/GovernorSettingFields'
import { MintOrBudgetFields } from '@/components/proposal/MintOrBudgetFields'
import { ProposalTypeSelect } from '@/components/ProposalTypeSelect'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { PROPOSAL_TYPE, ROUTES } from '@/constants'
import { useGovernorParams } from '@/hooks/useGovernorParams'
import { useProposalFieldValidation } from '@/hooks/useProposalFieldValidation'
import { makeInitialForm, useProposalForm } from '@/hooks/useProposalForm'
import { useProposalSubmission } from '@/hooks/useProposalSubmission'
import { useThresholdCheck } from '@/hooks/useThresholdCheck'
import { useTokenInfo } from '@/hooks/useTokenInfo'
import {
  cn,
  short,
} from '@/utils/format'

// NOTE: This page will be extended to include batch mint & governor setting later.

export default function CreateProposal() {
  return <CreateProposalOuter />
}

const CreateProposalOuter = React.memo(() => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [{ wallet }] = useConnectWallet()
  const { data: gov } = useGovernorParams()
  const {
    form,
    setForm,
    setType,
    addBatchRow,
    updateBatchRow,
    removeBatchRow,
    batchTotal,
    validate,
  } = useProposalForm()
  const { data: tokenInfo } = useTokenInfo()
  const proposerAddress = wallet?.accounts?.[0]?.address as
    | `0x${string}`
    | undefined

  const formatDescription = (f: ProposalForm) => {
    const fallbackTitleMap: Record<string, string> = {
      [PROPOSAL_TYPE.MINT]: t('proposal.fallbackTitle.mint'),
      [PROPOSAL_TYPE.BUDGET]: t('proposal.fallbackTitle.mintAndApprove'),
      [PROPOSAL_TYPE.BATCH_MINT]: t('proposal.fallbackTitle.batchMint'),
      [PROPOSAL_TYPE.GOVERNOR_SETTING]: t('proposal.fallbackTitle.governorSetting'),
    }
    const userTitle = f.title.trim()
    const fallbackTitle = fallbackTitleMap[f.type] || t('proposal.fallbackTitle.default')
    let desc = f.description.trim()
    if (userTitle && userTitle !== fallbackTitle) {
      desc = `# ${userTitle}  \n${desc}`
    }
    return desc
  }

  const [createdId, setCreatedId] = useState<string | null>(null)
  const submission = useProposalSubmission({
    proposerAddress,
    formatDescription,
    validate: (f: ProposalForm) =>
      validate(
        f.type === PROPOSAL_TYPE.BUDGET && proposerAddress
          ? { ...f, address: f.address || proposerAddress }
          : f,
        t,
        proposerAddress,
      ),
    onSuccess: (proposalId) => {
      // reset local form state immediately
      setForm(f => makeInitialForm(f.type))
      submission.reset()
      setCreatedId(proposalId || null)
      console.warn('Navigate soon to proposal', { proposalId })
      setTimeout(() => {
        if (proposalId)
          navigate(ROUTES.PROPOSAL.replace(':id', proposalId))
        else
          navigate(ROUTES.HOME)
      }, 2000)
    },
    t,
  })

  // Fetch proposer current token balance (ERC20 balance as proxy for threshold check; later may switch to getVotes snapshot >0 logic if needed)
  const { balance, formattedThreshold, meetsThreshold, loadingBalance }
    = useThresholdCheck(proposerAddress)

  const disabledReason = useMemo(() => {
    if (!wallet) {
      return t('proposal.connectWalletFirst')
    }
    if (!gov) {
      return t('common.loading')
    }
    if (loadingBalance) {
      return t('common.loading')
    }
    if (!meetsThreshold) {
      return t('proposalThreshold.notEnough', {
        needed: formattedThreshold,
      })
    }
    return null
  }, [
    wallet,
    gov,
    loadingBalance,
    meetsThreshold,
    gov?.proposalThreshold,
    tokenInfo,
    t,
  ])

  const createStatus = submission.status

  const { fieldErrors, validateField } = useProposalFieldValidation({ form, t })

  function onChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = e.target
    setForm((f) => {
      // generic field updates only for common or present keys
      if (name in f) {
        return { ...f, [name]: value } as ProposalForm
      }
      return f
    })
  }

  const onBlur = useCallback((e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name } = e.target
    validateField(name)
  }, [validateField])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    submission.reset()
    if (
      disabledReason
      || !wallet
      || !gov
      || ['building', 'signing', 'pending'].includes(createStatus)
    ) {
      return
    }
    await submission.submit(form)
  }

  if (!wallet) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <p className="text-lg">{t('proposal.connectWalletFirst')}</p>
          <Button onClick={() => navigate(ROUTES.HOME)}>
            {t('common.backToHome')}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">
            {t('proposal.create')}
          </h2>
          <p className="text-sm text-secondary">
            {t('proposal.createDescription')}
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate(ROUTES.HOME)}>
          {t('common.cancel')}
        </Button>
      </div>

      {disabledReason ? (
        <div className="p-6 border rounded-md bg-card space-y-2">
          <p className="text-sm">{disabledReason}</p>
          {balance !== null && formattedThreshold && (
            <p className="text-xs text-secondary">
              {t('proposalThreshold.currentVsNeeded', {
                current: balance,
                needed: formattedThreshold,
              })}
            </p>
          )}
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="space-y-6">
            <div className="flex flex-col gap-2">
              <Label>{t('proposal.title')}</Label>
              <Input
                name="title"
                value={form.title}
                onChange={onChange}
                onBlur={onBlur}
                placeholder={t('proposal.enterTitle')}
                className="placeholder:text-muted-foreground"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>{t('proposal.type')}</Label>
              <ProposalTypeSelect
                value={form.type}
                onChange={(next) => {
                  if (next === PROPOSAL_TYPE.BUDGET) {
                    // prefill address if empty
                    setForm((f) => {
                      if (f.type === PROPOSAL_TYPE.BUDGET)
                        return f
                      // create a fresh budget form preserving title/description via makeInitialForm
                      const base = makeInitialForm(PROPOSAL_TYPE.BUDGET, f)
                      // When switching TO BUDGET we only care about prior single-address types (MINT)
                      const prevAddress = f.type === PROPOSAL_TYPE.MINT ? f.address : ''
                      return {
                        ...base,
                        address: prevAddress || proposerAddress || '',
                      }
                    })
                  }
                  else {
                    setType(next)
                  }
                }}
              />
              <p className="text-xs text-secondary">
                {t(`proposal.typeHelp.${form.type}` as const)}
              </p>
            </div>
            <BatchMintFields
              form={form}
              batchTotal={batchTotal}
              symbol={tokenInfo?.symbol}
              addRow={addBatchRow}
              updateRow={updateBatchRow}
              removeRow={removeBatchRow}
              onBlur={onBlur}
              fieldErrors={fieldErrors}
            />
            <GovernorSettingFields
              form={form}
              onChange={onChange}
              setGovernorFunction={fn =>
                setForm(f =>
                  f.type === PROPOSAL_TYPE.GOVERNOR_SETTING
                    ? { ...f, governorFunction: fn }
                    : f,
                )}
              onBlur={onBlur}
              fieldErrors={fieldErrors}
            />
            <MintOrBudgetFields
              form={form}
              proposerAddress={proposerAddress}
              onChange={onChange}
              onBlur={onBlur}
              fieldErrors={fieldErrors}
            />
            <div className="flex flex-col gap-2">
              <Label>{t('proposal.description')}</Label>
              <Textarea
                rows={10}
                name="description"
                value={form.description}
                onChange={onChange}
                onBlur={onBlur}
                required
                placeholder={t('proposal.enterDescription')}
                className="placeholder:text-muted-foreground"
              />
            </div>
            {/* Execution preview */}
            <ExecutionPreview form={form} t={t} proposerAddress={proposerAddress} />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex-1 flex flex-col items-start justify-start">
              {submission.errors.length > 0 && (
                <ul className="mb-2 list-disc pl-5 space-y-1 text-xs text-destructive">
                  {submission.errors.map((er, i) => (
                    <li key={i}>{er}</li>
                  ))}
                </ul>
              )}

              <p
                className={cn('text-xs text-destructive break-words', {
                  invisible: !(createStatus === 'error' && submission.friendlyError),
                })}
              >
                {createStatus === 'error' ? submission.friendlyError : ''}
              </p>

              {createdId && (
                <p className="text-xs text-right break-words">
                  {t('proposal.status.proposalId', {
                    id: short(createdId || ''),
                  })}
                </p>
              )}
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={['building', 'signing', 'pending'].includes(
                  createStatus,
                )}
                className="relative"
              >
                {createStatus === 'building' && t('wallet.txBuilding')}
                {createStatus === 'signing' && t('wallet.txSigning')}
                {createStatus === 'pending' && t('wallet.txPending')}
                {createStatus === 'success' && t('proposal.status.success')}
                {['idle', 'error'].includes(createStatus)
                  && t('proposal.submit')}
                {['building', 'signing', 'pending'].includes(createStatus) && (
                  <span className="ml-2 h-4 w-4 animate-spin border-2 border-current border-t-transparent rounded-full" />
                )}
              </Button>
            </div>
          </div>
        </form>
      )}
    </div>
  )
})
