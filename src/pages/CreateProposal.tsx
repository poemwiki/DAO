import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useConnectWallet } from '@web3-onboard/react'
import { ROUTES, PROPOSAL_TYPE } from '@/constants'
import { useIsDelegated } from '@/hooks/useIsDelegated'
import DelegateModal from '@/components/DelegateModal'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

export default function CreateProposal() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [{ wallet }] = useConnectWallet()
  const [proposalType, setProposalType] = useState<(typeof PROPOSAL_TYPE)[keyof typeof PROPOSAL_TYPE]>(
    PROPOSAL_TYPE.MINT
  )
  const [formData, setFormData] = useState({
    address: '',
    amount: '',
    description: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { isMember, isDelegated } = useIsDelegated()
  const [delegateModalOpen, setDelegateModalOpen] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!wallet) return

    if (isMember && !isDelegated) {
      setDelegateModalOpen(true)
      return
    }
    setIsSubmitting(true)
    // TODO: Implement contract interaction
    console.log('Submitting proposal:', {
      type: proposalType,
      ...formData,
    })
    setIsSubmitting(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
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
      {delegateModalOpen && (
        <DelegateModal
          open={delegateModalOpen}
          onClose={() => setDelegateModalOpen(false)}
          onDelegated={() => setDelegateModalOpen(false)}
        />
      )}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold tracking-tight">{t('proposal.create')}</h2>
          <p className="text-sm text-muted-foreground">{t('proposal.createDescription')}</p>
        </div>
        <Button variant="outline" onClick={() => navigate(ROUTES.HOME)}>
          {t('common.cancel')}
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t('proposal.type')}</Label>
            <Select
              value={proposalType}
              onValueChange={(value: (typeof PROPOSAL_TYPE)[keyof typeof PROPOSAL_TYPE]) =>
                setProposalType(value)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={PROPOSAL_TYPE.MINT}>{t('proposal.types.mint')}</SelectItem>
                <SelectItem value={PROPOSAL_TYPE.BUDGET}>{t('proposal.types.budget')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>
              {proposalType === PROPOSAL_TYPE.BUDGET
                ? t('proposal.recipientAddress')
                : t('proposal.requestAddress')}
            </Label>
            <Input
              name="address"
              value={
                proposalType === PROPOSAL_TYPE.BUDGET
                  ? wallet.accounts[0].address
                  : formData.address
              }
              onChange={handleInputChange}
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
              onChange={handleInputChange}
              placeholder={t('proposal.enterAmount')}
              required
              min="0"
              step="0.000000000000000001"
            />
          </div>

          <div className="space-y-2">
            <Label>{t('proposal.description')}</Label>
            <Textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder={t('proposal.enterDescription')}
              required
            />
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <Button type="submit" disabled={isSubmitting} className="min-w-[200px]">
            {isSubmitting ? t('common.submitting') : t('proposal.submit')}
          </Button>
        </div>
      </form>
    </div>
  )
}
