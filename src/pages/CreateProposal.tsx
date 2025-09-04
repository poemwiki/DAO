import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useConnectWallet } from '@web3-onboard/react'
import { useGovernorParams } from '@/hooks/useGovernorParams'
import { tokenABI } from '@/abis/tokenABI'
import { ROUTES, PROPOSAL_TYPE } from '@/constants'
import { getAverageBlockTime } from '@/constants/blockTimes'
import { useCreateProposal } from '@/hooks/useCreateProposal'
import { usePublicClient } from 'wagmi'
import { config } from '@/config'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ProposalTypeSelect } from '@/components/ProposalTypeSelect'
import {
  formatTokenAmount,
  estimateDurationFromBlocks,
  cn,
} from '@/utils/format'
import { useTokenInfo } from '@/hooks/useTokenInfo'

// NOTE: This page will be extended to include batch mint & governor setting later.

export default function CreateProposal() {
  return <CreateProposalOuter />
}

const CreateProposalOuter = React.memo(function CreateProposalOuter() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [{ wallet }] = useConnectWallet()
  const { data: gov } = useGovernorParams()
  const [proposalType, setProposalType] = useState<
    (typeof PROPOSAL_TYPE)[keyof typeof PROPOSAL_TYPE]
  >(PROPOSAL_TYPE.MINT)
  const [formData, setFormData] = useState({
    title: '',
    address: '',
    amount: '',
    description: '',
  })
  // batch mint rows
  const [batchRows, setBatchRows] = useState<
    Array<{ address: string; amount: string }>
  >([{ address: '', amount: '' }])
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const { data: tokenInfo } = useTokenInfo()
  const batchTotal = useMemo(() => {
    if (proposalType !== PROPOSAL_TYPE.BATCH_MINT) {
      return 0
    }
    return batchRows.reduce((sum, r) => {
      const v = Number(r.amount)
      if (v > 0) {
        return sum + v
      }
      return sum
    }, 0)
  }, [batchRows, proposalType])
  function addBatchRow() {
    setBatchRows(r => [...r, { address: '', amount: '' }])
  }
  function updateBatchRow(
    idx: number,
    key: 'address' | 'amount',
    value: string,
  ) {
    setBatchRows(r =>
      r.map((row, i) => (i === idx ? { ...row, [key]: value } : row)),
    )
  }
  function removeBatchRow(idx: number) {
    setBatchRows(r => (r.length === 1 ? r : r.filter((_, i) => i !== idx)))
  }
  const {
    create: createProposal,
    status: createStatus,
    error: createError,
    result: createResult,
  } = useCreateProposal({
    onSuccess: () => {
      setTimeout(() => navigate(ROUTES.HOME), 1500)
    },
  })

  const proposerAddress = wallet?.accounts?.[0]?.address as
    | `0x${string}`
    | undefined

  // Fetch proposer current token balance (ERC20 balance as proxy for threshold check; later may switch to getVotes snapshot >0 logic if needed)
  const { balance, meetsThreshold, thresholdFormatted, loadingBalance } =
    useProposalThresholdCheck({
      proposer: proposerAddress,
      proposalThreshold: gov?.proposalThreshold,
    })

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
      return t('proposalThreshold.notEnough', { needed: thresholdFormatted })
    }
    return null
  }, [wallet, gov, loadingBalance, meetsThreshold, thresholdFormatted, t])

  // Friendly error mapping
  let createErrorMessage: string | null = null
  if (createError) {
    const raw =
      (createError as any)?.shortMessage ||
      (createError as any)?.message ||
      String(createError)
    if (
      /User rejected/i.test(raw) ||
      /denied transaction signature/i.test(raw)
    ) {
      createErrorMessage = t('wallet.userRejected')
    } else {
      // Remove long calldata blobs (hex longer than 120 chars)
      createErrorMessage = raw.replace(
        /0x[0-9a-fA-F]{120,}/g,
        (m: string) => `${m.slice(0, 20)}…`,
      )
      if (createErrorMessage && createErrorMessage.length > 360) {
        createErrorMessage = `${createErrorMessage.slice(0, 360)}…`
      }
    }
  }

  function onChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = e.target
    setFormData(p => ({ ...p, [name]: value }))
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (
      disabledReason ||
      !wallet ||
      !gov ||
      ['building', 'signing', 'pending'].includes(createStatus)
    ) {
      return
    }

    // Clear old errors
    setValidationErrors([])

    // Validation per type
    const newErrors: string[] = []
    if (proposalType === PROPOSAL_TYPE.BATCH_MINT) {
      const filtered = batchRows.filter(r => r.address || r.amount)
      if (!filtered.length) {
        newErrors.push(t('proposal.err.noBatchRows'))
      }
      filtered.forEach((r, idx) => {
        if (!/^0x[a-fA-F0-9]{40}$/.test(r.address)) {
          newErrors.push(t('proposal.err.badAddress', { idx: idx + 1 }))
        }
        const num = Number(r.amount)
        if (!(num > 0)) {
          newErrors.push(t('proposal.err.badAmount', { idx: idx + 1 }))
        }
      })
      if (filtered.length > 100) {
        newErrors.push(t('proposal.err.tooManyRows'))
      }
      if (newErrors.length) {
        setValidationErrors(newErrors)
        return
      }
    } else if (proposalType === PROPOSAL_TYPE.GOVERNOR_SETTING) {
      const fn = (formData as any).governorFunction
      const valStr = (formData as any).governorValue
      if (!fn) {
        newErrors.push(t('proposal.err.missingGovFunction'))
      }
      if (!valStr) {
        newErrors.push(t('proposal.err.missingGovValue'))
      } else {
        try {
          const big = BigInt(valStr)
          if (big < 0n) {
            newErrors.push(t('proposal.err.badGovValue'))
          }
        } catch {
          newErrors.push(t('proposal.err.badGovValue'))
        }
      }
      if (newErrors.length) {
        setValidationErrors(newErrors)
        return
      }
    } else {
      // single mint/budget validation
      if (
        !/^0x[a-fA-F0-9]{40}$/.test(
          proposalType === PROPOSAL_TYPE.BUDGET
            ? proposerAddress || ''
            : formData.address,
        )
      ) {
        newErrors.push(t('proposal.err.badSingleAddress'))
      }
      const num = Number(formData.amount)
      if (!(num > 0)) {
        newErrors.push(t('proposal.err.badSingleAmount'))
      }
      if (newErrors.length) {
        setValidationErrors(newErrors)
        return
      }
    }
    const addr =
      proposalType === PROPOSAL_TYPE.BUDGET
        ? proposerAddress || ''
        : formData.address
    // Build markdown description with optional custom H1 title.
    // If user-specified title equals the fallback implicit title derived from type, we omit the H1 to keep description clean.
    const fallbackTitleMap: Record<string, string> = {
      [PROPOSAL_TYPE.MINT]: t('proposal.fallbackTitle.mint'),
      [PROPOSAL_TYPE.BUDGET]: t('proposal.fallbackTitle.mintAndApprove'),
    }
    const userTitle = formData.title.trim()
    const fallbackTitle = fallbackTitleMap[proposalType]
    let finalDescription = formData.description
    if (userTitle && userTitle !== fallbackTitle) {
      // Prepend markdown H1 (# Title) and a blank line.
      finalDescription = `# ${userTitle}  \n${finalDescription}`
    }
    if (proposalType === PROPOSAL_TYPE.BATCH_MINT) {
      await createProposal({
        type: proposalType,
        address: '0x0000000000000000000000000000000000000000', // ignored by backend for batch
        amount: '0',
        batch: batchRows.filter(r => r.address && r.amount),
        description: finalDescription,
      })
    } else if (proposalType === PROPOSAL_TYPE.GOVERNOR_SETTING) {
      await createProposal({
        type: proposalType,
        address: '0x0000000000000000000000000000000000000000',
        amount: '0',
        governorSetting: {
          function: (formData as any).governorFunction,
          value: (formData as any).governorValue,
        },
        description: finalDescription,
      })
    } else {
      await createProposal({
        type: proposalType,
        address: addr,
        amount: formData.amount,
        description: finalDescription,
      })
    }
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
          <p className="text-sm text-muted-foreground">
            {t('proposal.createDescription')}
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate(ROUTES.HOME)}>
          {t('common.cancel')}
        </Button>
      </div>

      {disabledReason ? (
        <div className="p-6 border rounded-md bg-muted/30 space-y-2">
          <p className="text-sm">{disabledReason}</p>
          {balance !== null && thresholdFormatted && (
            <p className="text-xs text-muted-foreground">
              {t('proposalThreshold.currentVsNeeded', {
                current: balance,
                needed: thresholdFormatted,
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
                value={formData.title}
                onChange={onChange}
                placeholder={t('proposal.enterTitle')}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>{t('proposal.type')}</Label>
              <ProposalTypeSelect
                value={proposalType}
                onChange={setProposalType}
              />
            </div>
            {proposalType === PROPOSAL_TYPE.BATCH_MINT ? (
              <div className="space-y-3">
                <Label>{t('proposal.batchMintRows')}</Label>
                <div className="space-y-2">
                  {batchRows.map((row, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <Input
                        value={row.address}
                        onChange={e =>
                          updateBatchRow(i, 'address', e.target.value)
                        }
                        placeholder={t('proposal.enterAddress')}
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        value={row.amount}
                        onChange={e =>
                          updateBatchRow(i, 'amount', e.target.value)
                        }
                        placeholder={t('proposal.enterAmount')}
                        className="w-40"
                        min="0"
                        step="0.000000000000000001"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => removeBatchRow(i)}
                        disabled={batchRows.length === 1}
                        className="px-2"
                      >
                        {t('common.remove')}
                      </Button>
                    </div>
                  ))}
                  <div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addBatchRow}
                      size="sm"
                    >
                      {t('proposal.addRow')}
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('proposal.batchMintHint')}
                </p>
                <p className="text-xs">
                  {t('proposal.batchTotal', {
                    total: batchTotal,
                    symbol: tokenInfo?.symbol || '',
                  })}
                </p>
              </div>
            ) : proposalType === PROPOSAL_TYPE.GOVERNOR_SETTING ? (
              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <Label>{t('proposal.governorFunction')}</Label>
                  <select
                    className="border rounded px-2 py-2 bg-background"
                    name="governorFunction"
                    value={
                      (formData as any).governorFunction || 'setVotingDelay'
                    }
                    onChange={e =>
                      setFormData(p => ({
                        ...p,
                        governorFunction: e.target.value as any,
                      }))
                    }
                  >
                    <option value="setVotingDelay">
                      {t('proposal.govFn.setVotingDelay')}
                    </option>
                    <option value="setVotingPeriod">
                      {t('proposal.govFn.setVotingPeriod')}
                    </option>
                    <option value="setProposalThreshold">
                      {t('proposal.govFn.setProposalThreshold')}
                    </option>
                    <option value="updateQuorumNumerator">
                      {t('proposal.govFn.updateQuorumNumerator')}
                    </option>
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label>{t('proposal.newValue')}</Label>
                  <Input
                    name="governorValue"
                    type="number"
                    value={(formData as any).governorValue || ''}
                    onChange={e =>
                      setFormData(p => ({
                        ...p,
                        governorValue: e.target.value,
                      }))
                    }
                    min="0"
                    step="1"
                    required
                    placeholder={t('proposal.enterNewValue')}
                  />
                  <p className="hidden text-xs text-muted-foreground">
                    {t('proposal.governorSettingHint')}
                  </p>
                  {(() => {
                    const fn = (formData as any).governorFunction
                    const raw = (formData as any).governorValue
                    if (!raw) {
                      return null
                    }
                    try {
                      const blocks = BigInt(raw)
                      if (blocks <= 0n) {
                        return null
                      }
                      if (fn === 'setVotingPeriod' || fn === 'setVotingDelay') {
                        const chainIdHex = config.network.chainId
                        const chainId = chainIdHex.startsWith('0x')
                          ? parseInt(chainIdHex, 16)
                          : Number(chainIdHex)
                        const avgSecPerBlock = getAverageBlockTime(chainId)
                        const human = estimateDurationFromBlocks(
                          Number(blocks),
                          avgSecPerBlock,
                        )
                        return (
                          <p className="text-xs text-muted-foreground">
                            {t('proposal.estimatedDuration', { human })}
                          </p>
                        )
                      }
                    } catch {}
                    return null
                  })()}
                </div>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-2">
                  <Label>
                    {proposalType === PROPOSAL_TYPE.BUDGET
                      ? t('proposal.requestAddress')
                      : t('proposal.recipientAddress')}
                  </Label>
                  <Input
                    name="address"
                    value={
                      proposalType === PROPOSAL_TYPE.BUDGET
                        ? proposerAddress || ''
                        : formData.address
                    }
                    onChange={onChange}
                    disabled={proposalType === PROPOSAL_TYPE.BUDGET}
                    placeholder={t('proposal.enterAddress')}
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>{t('proposal.amount')}</Label>
                  <Input
                    name="amount"
                    type="number"
                    value={formData.amount}
                    onChange={onChange}
                    min="0"
                    step="0.000000000000000001"
                    required
                    placeholder={t('proposal.enterAmount')}
                  />
                </div>
              </>
            )}
            <div className="flex flex-col gap-2">
              <Label>{t('proposal.description')}</Label>
              <Textarea
                name="description"
                value={formData.description}
                onChange={onChange}
                required
                placeholder={t('proposal.enterDescription')}
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex flex-col items-center justify-start">
              {validationErrors.length > 0 && (
                <ul className="mb-2 list-disc pl-5 space-y-1 text-xs text-destructive">
                  {validationErrors.map((er, i) => (
                    <li key={i}>{er}</li>
                  ))}
                </ul>
              )}

              <p
                className={cn('text-xs text-destructive break-words', {
                  invisible: !createErrorMessage,
                })}
              >
                {createErrorMessage}
              </p>

              {createResult?.proposalId && (
                <p className="text-xs text-right break-words">
                  {t('proposal.status.proposalId', {
                    id: createResult.proposalId,
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
                {['idle', 'error'].includes(createStatus) &&
                  t('proposal.submit')}
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

function useProposalThresholdCheck({
  proposer,
  proposalThreshold,
}: {
  proposer?: `0x${string}`
  proposalThreshold?: bigint
}) {
  const publicClient = usePublicClient()
  const { data: tokenInfo } = useTokenInfo()
  const [balance, setBalance] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    let cancelled = false
    async function load() {
      if (!publicClient || !proposer || proposalThreshold === undefined) {
        return
      }
      setLoading(true)
      try {
        const bal = (await publicClient.readContract({
          address: config.contracts.token as `0x${string}`,
          abi: tokenABI,
          functionName: 'balanceOf',
          args: [proposer],
        })) as bigint
        if (!cancelled) {
          setBalance((Number(bal) / 1e18).toString())
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [publicClient, proposer, proposalThreshold])

  const thresholdFormatted =
    proposalThreshold !== undefined
      ? formatTokenAmount(BigInt(proposalThreshold), tokenInfo?.decimals || 18)
      : null

  const meetsThreshold =
    balance !== null && thresholdFormatted !== null
      ? Number(balance) >= Number(thresholdFormatted)
      : false
  return {
    balance,
    meetsThreshold,
    thresholdFormatted,
    loadingBalance: loading,
  }
}
