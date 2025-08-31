import { useState, useEffect } from 'react'
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
import { ZERO_ADDRESS } from '@/constants'

interface DelegateModalProps {
  open: boolean
  onClose: () => void
  onDelegated?: (delegate: string, txHash: string) => void
}

export default function DelegateModal({ open, onClose, onDelegated }: DelegateModalProps) {
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
  const selfMember = members.find(m => m.id.toLowerCase() === address?.toLowerCase())

  // initialize selection: existing delegate if set (and not zero & not self), else blank
  useEffect(() => {
    if (!selfMember) return
    if (
      selfMember.delegate &&
      selfMember.delegate !== ZERO_ADDRESS
    ) {
      setSelectedDelegate(prev => (prev ? prev : selfMember.delegate))
    }
  }, [selfMember])

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
    console.log('Simulate data:', { selectedDelegate, simulateData, simulateError })
  }, [selectedDelegate, simulateData, simulateError])

  const { writeContractAsync, isPending: isWritePending } = useWriteContract()

  // Watch transaction status
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash as `0x${string}`,
  })

  // trigger callback when confirmed
  useOnDelegatedEffect(isConfirmed, selectedDelegate, txHash, onDelegated)

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

  // find self member to check delegation status
  // hide entirely if user not a member
  if (!selfMember) return null

  // reorder so self is first
  const orderedMembers = [selfMember, ...members.filter(m => m.id.toLowerCase() !== selfMember.id.toLowerCase())]

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
              <div className="px-1 py-1 space-y-1">
                {orderedMembers.map(member => {
                  const isSelf = member.id.toLowerCase() === address?.toLowerCase()
                  const displayName = useDisplayName({ address: member.id })
                  const primaryLabel = isSelf ? t('delegate.self') : (displayName || short(member.id))
                  const secondary = isSelf ? short(member.id) : member.id
                  return (
                    <SelectItem
                      key={member.id}
                      value={member.id}
                      className={`flex flex-col items-start gap-0 p-3 leading-tight border rounded-md cursor-pointer data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground ${isSelf ? 'border-primary/50' : 'border-transparent'}`}
                    >
                      <span className={`text-sm font-medium ${isSelf ? 'text-primary' : ''}`}>{primaryLabel}</span>
                      <span className="text-[11px] mt-0.5 font-mono text-muted-foreground tracking-tight">{secondary}</span>
                      {member.delegate && member.delegate !== ZERO_ADDRESS && member.delegate !== member.id && (
                        <span className="mt-1 inline-block text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                          {t('delegate.currentDelegateShort', 'Delegating to')} {short(member.delegate)}
                        </span>
                      )}
                    </SelectItem>
                  )
                })}
              </div>
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
        {/* onDelegated side-effect handled in effect below */}
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

// invoke onDelegated through effect to avoid JSX return type issues
// (placed after component to keep component body cleaner)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function useOnDelegatedEffect(
  isConfirmed: boolean,
  selectedDelegate: string,
  txHash: string,
  onDelegated?: (delegate: string, txHash: string) => void
) {
  useEffect(() => {
    if (isConfirmed && selectedDelegate && txHash && onDelegated) {
      onDelegated(selectedDelegate, txHash)
    }
  }, [isConfirmed, selectedDelegate, txHash, onDelegated])
}
