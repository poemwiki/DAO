import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useConnectWallet } from '@web3-onboard/react'
import { useGovernorParams } from '@/hooks/useGovernorParams'
import { tokenABI } from '@/abis/tokenABI'
import { ROUTES, PROPOSAL_TYPE } from '@/constants'
import { useCreateProposal } from '@/hooks/useCreateProposal'
import { usePublicClient } from 'wagmi'
import { config } from '@/config'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ProposalTypeSelect } from '@/components/ProposalTypeSelect'
import { formatTokenAmount } from '@/utils/format'
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
  const [formData, setFormData] = useState({ title: '', address: '', amount: '', description: '' })
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

  const proposerAddress = wallet?.accounts?.[0]?.address as `0x${string}` | undefined

  // Fetch proposer current token balance (ERC20 balance as proxy for threshold check; later may switch to getVotes snapshot >0 logic if needed)
  const { balance, meetsThreshold, thresholdFormatted, loadingBalance } = useProposalThresholdCheck(
    {
      proposer: proposerAddress,
      proposalThreshold: gov?.proposalThreshold,
    }
  )

  const disabledReason = useMemo(() => {
    if (!wallet) return t('proposal.connectWalletFirst')
    if (!gov) return t('common.loading')
    if (loadingBalance) return t('common.loading')
    if (!meetsThreshold) return t('proposalThreshold.notEnough', { needed: thresholdFormatted })
    return null
  }, [wallet, gov, loadingBalance, meetsThreshold, thresholdFormatted, t])

  // Friendly error mapping
  let createErrorMessage: string | null = null
  if (createError) {
    const raw =
      (createError as any)?.shortMessage || (createError as any)?.message || String(createError)
    if (/User rejected/i.test(raw) || /denied transaction signature/i.test(raw)) {
      createErrorMessage = t('wallet.userRejected')
    } else {
      // Remove long calldata blobs (hex longer than 120 chars)
      createErrorMessage = raw.replace(/0x[0-9a-fA-F]{120,}/g, (m: string) => m.slice(0, 20) + '…')
      if (createErrorMessage && createErrorMessage.length > 360)
        createErrorMessage = createErrorMessage.slice(0, 360) + '…'
    }
  }

  function onChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
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
    )
      return
    const addr = proposalType === PROPOSAL_TYPE.BUDGET ? proposerAddress || '' : formData.address
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
    await createProposal({
      type: proposalType,
      address: addr,
      amount: formData.amount,
      description: finalDescription,
    })
  }

  if (!wallet) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <p className="text-lg">{t('proposal.connectWalletFirst')}</p>
          <Button onClick={() => navigate(ROUTES.HOME)}>{t('common.backToHome')}</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">{t('proposal.create')}</h2>
          <p className="text-sm text-muted-foreground">{t('proposal.createDescription')}</p>
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
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t('proposal.title')}</Label>
              <Input
                name="title"
                value={formData.title}
                onChange={onChange}
                placeholder={t('proposal.enterTitle')}
              />
            </div>
            <div className="space-y-2">
              <Label>{t('proposal.type')}</Label>
              <ProposalTypeSelect value={proposalType} onChange={setProposalType} />
            </div>
            <div className="space-y-2">
              <Label>
                {proposalType === PROPOSAL_TYPE.BUDGET
                  ? t('proposal.requestAddress')
                  : t('proposal.recipientAddress')}
              </Label>
              <Input
                name="address"
                value={
                  proposalType === PROPOSAL_TYPE.BUDGET ? proposerAddress || '' : formData.address
                }
                onChange={onChange}
                disabled={proposalType === PROPOSAL_TYPE.BUDGET}
                placeholder={t('proposal.enterAddress')}
                required
              />
            </div>
            <div className="space-y-2">
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
            <div className="space-y-2">
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
          <div className="space-y-2">
            {createErrorMessage && (
              <p className="text-xs text-destructive break-words">{createErrorMessage}</p>
            )}
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={['building', 'signing', 'pending'].includes(createStatus)}
                className="relative"
              >
                {createStatus === 'building' && t('wallet.txBuilding')}
                {createStatus === 'signing' && t('wallet.txSigning')}
                {createStatus === 'pending' && t('wallet.txPending')}
                {createStatus === 'success' && t('proposal.status.success')}
                {['idle', 'error'].includes(createStatus) && t('proposal.submit')}
                {['building', 'signing', 'pending'].includes(createStatus) && (
                  <span className="ml-2 h-4 w-4 animate-spin border-2 border-current border-t-transparent rounded-full" />
                )}
              </Button>
            </div>
            {createResult?.proposalId && (
              <p className="text-xs text-right break-words">
                {t('proposal.status.proposalId', { id: createResult.proposalId })}
              </p>
            )}
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
      if (!publicClient || !proposer || proposalThreshold === undefined) return
      setLoading(true)
      try {
        const bal = (await publicClient.readContract({
          address: config.contracts.token as `0x${string}`,
          abi: tokenABI,
          functionName: 'balanceOf',
          args: [proposer],
        })) as bigint
        if (!cancelled) setBalance((Number(bal) / 1e18).toString())
      } finally {
        if (!cancelled) setLoading(false)
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
  return { balance, meetsThreshold, thresholdFormatted, loadingBalance: loading }
}
