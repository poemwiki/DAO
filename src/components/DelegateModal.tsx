import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import {
  useAccount,
  useWriteContract,
  useSimulateContract,
  useWaitForTransactionReceipt,
  useConfig,
} from 'wagmi'
import { useQuery } from '@tanstack/react-query'
import { getTokenHolders, type TokenHoldersResponseData } from '@/graphql'
import { config } from '@/config'
import { tokenABI } from '@/abis'
import { Modal } from '@/components/ui/modal'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Member } from '@/types'
import { useDisplayName } from '@/hooks/useDisplayName'
import { short } from '@/utils/format'

interface DelegateModalProps {
  open: boolean
  onClose: () => void
}

export default function DelegateModal({ open, onClose }: DelegateModalProps) {
  const { t } = useTranslation()
  const { address } = useAccount()
  const wagmiConfig = useConfig()
  const [selectedDelegate, setSelectedDelegate] = useState<string>('')
  const [txHash, setTxHash] = useState<string>('')
  const [selectOpen, setSelectOpen] = useState(false)

  // Query token holders
  const { data: tokenHoldersData, isLoading: isLoadingHolders } = useQuery<TokenHoldersResponseData>({
    queryKey: ['tokenHolders'],
    queryFn: getTokenHolders,
  })

  const members: Member[] = tokenHoldersData?.members || []

  // Get block explorer URL
  const blockExplorer = wagmiConfig.chains[0].blockExplorers?.default

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

  const { writeContractAsync, isPending: isWritePending } = useWriteContract()

  // Watch transaction status
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash as `0x${string}`,
  })

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
      setTxHash(hash)
    } catch (error) {
      console.error('Delegation error:', error)
    }
  }

  const handleClose = () => {
    onClose()
    setTxHash('')
    setSelectedDelegate('')
  }

  const getButtonText = () => {
    if (isWritePending) return t('common.submitting')
    if (isConfirming) return t('delegate.confirming')
    if (isConfirmed) return t('delegate.confirmed')
    return t('delegate.submit')
  }

  const getButtonDisabled = () => {
    return !selectedDelegate || isWritePending || isConfirming || isConfirmed
  }

  return (
    <Modal
      open={open}
      onClose={!txHash ? handleClose : undefined}
      title={t('delegate.title')}
      description={t('delegate.description')}
    >
      <div className="grid gap-4 py-4">
        <div className="space-y-2">
          <Select
            value={selectedDelegate}
            onValueChange={setSelectedDelegate}
            open={selectOpen}
            onOpenChange={setSelectOpen}
          >
            <SelectTrigger
              disabled={isWritePending || isConfirming || isLoadingHolders}
              className="max-h-12"
            >
              <SelectValue placeholder={t('delegate.selectPlaceholder')} />
            </SelectTrigger>
            <SelectContent className="max-h-64 overflow-y-auto">
              {members.map(member => (
                <DelegateOption
                  key={member.id}
                  member={member}
                  self={member.id.toLowerCase() === address?.toLowerCase()}
                  selfLabel={t('delegate.self')}
                  selectOpen={selectOpen}
                />
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-4">
          <Button
            onClick={handleDelegate}
            disabled={getButtonDisabled()}
            className={`flex-1 ${isConfirmed ? 'bg-green-500 hover:bg-green-600' : ''}`}
          >
            {getButtonText()}
          </Button>
          {isConfirmed && (
            <Button variant="outline" onClick={handleClose}>
              {t('common.close')}
            </Button>
          )}
        </div>
        {txHash && blockExplorer && (
          <div className="text-sm text-center text-muted-foreground">
            <a
              href={`${blockExplorer.url}/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              {t('delegate.viewTransaction')}
            </a>
          </div>
        )}
      </div>
    </Modal>
  )
}

function DelegateOption({
  member,
  self,
  selfLabel,
  selectOpen,
}: {
  member: Member
  self: boolean
  selfLabel: string
  selectOpen: boolean
}) {
  const displayName = useDisplayName({ address: member.id })
  const lowerFull = member.id.toLowerCase()
  const isShortLike = displayName && displayName.includes('...')
  const isNickname = displayName && displayName.toLowerCase() !== lowerFull && !isShortLike
  const label = isNickname ? `${displayName} (${short(member.id)})` : member.id
  const selfRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (selectOpen && self && selfRef.current) {
      // Scroll so that self item is near the top/visible
      selfRef.current.scrollIntoView({ block: 'nearest' })
    }
  }, [selectOpen, self])

  return (
    <SelectItem
      ref={self ? selfRef : undefined}
      value={member.id}
      className={self ? 'font-bold' : ''}
    >
      {label}
      {self && ` (${selfLabel})`}
    </SelectItem>
  )
}
