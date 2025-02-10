import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAccount, useReadContract, useWriteContract, useSimulateContract } from 'wagmi'
import { useQuery } from '@apollo/client'
import { TOKEN_HOLDERS_QUERY } from '@/graphql'
import { config } from '@/config'
import { tokenABI } from '@/abis'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Member } from '@/types'

interface DelegateModalProps {
  open: boolean
  // eslint-disable-next-line no-unused-vars
  onOpenChange: (open: boolean) => void
}

export default function DelegateModal({ open, onOpenChange }: DelegateModalProps) {
  const { t } = useTranslation()
  const { address } = useAccount()
  const [selectedDelegate, setSelectedDelegate] = useState<string>('')
  const { data: members = { members: [] } } = useQuery<{ members: Member[] }>(TOKEN_HOLDERS_QUERY)

  // eslint-disable-next-line no-unused-vars
  const { data: _delegateAddress } = useReadContract({
    address: config.contracts.token as `0x${string}`,
    abi: tokenABI,
    functionName: 'delegates',
    args: [address as `0x${string}`],
    query: { enabled: !!address },
  })

  // Prepare the contract write
  const { data: simulateData, error: simulateError } = useSimulateContract({
    address: config.contracts.token as `0x${string}`,
    abi: tokenABI,
    functionName: 'delegate',
    args: selectedDelegate ? [selectedDelegate as `0x${string}`] : undefined,
    account: address,
  })

  // Add debug log for simulation data
  useEffect(() => {
    console.log('Simulate data:', {
      selectedDelegate,
      simulateData,
      simulateError,
      tokenAddress: config.contracts.token,
    })
  }, [selectedDelegate, simulateData, simulateError])

  const { writeContractAsync, isPending, isSuccess } = useWriteContract()

  const handleDelegate = async () => {
    console.log('Handle delegate called', {
      selectedDelegate,
      simulateData,
      hasRequest: !!simulateData?.request,
    })

    if (!selectedDelegate || !simulateData?.request) {
      console.log('Early return due to:', {
        hasDelegate: !!selectedDelegate,
        hasRequest: !!simulateData?.request,
      })
      return
    }

    console.log('Delegating to:', selectedDelegate)
    try {
      const hash = await writeContractAsync(simulateData.request)
      console.log('Delegation transaction sent, hash:', hash)
      // Don't close modal yet, wait for success
    } catch (error) {
      console.error('Delegation error:', error)
    }
  }

  // Close modal when transaction succeeds
  useEffect(() => {
    if (isSuccess) {
      console.log('Transaction successful, closing modal')
      onOpenChange(false)
    }
  }, [isSuccess, onOpenChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-fit">
        <DialogHeader>
          <DialogTitle>{t('delegate.title')}</DialogTitle>
          <DialogDescription>{t('delegate.description')}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Select value={selectedDelegate} onValueChange={setSelectedDelegate}>
              <SelectTrigger>
                <SelectValue placeholder={t('delegate.selectPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {members.members?.map((member: Member) => (
                  <SelectItem
                    key={member.id}
                    value={member.id}
                    className={
                      member.id.toLowerCase() === address?.toLowerCase() ? 'font-bold' : ''
                    }
                  >
                    {member.id}
                    {member.id.toLowerCase() === address?.toLowerCase() &&
                      ` (${t('delegate.self')})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleDelegate} disabled={!selectedDelegate || isPending}>
            {isPending ? t('common.submitting') : t('delegate.submit')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
