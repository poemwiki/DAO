import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useConfig,
  useChainId,
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
import type { Member } from '@/types'
import { useDisplayName } from '@/hooks/useDisplayName'
import { short } from '@/utils/format'
import { ZERO_ADDRESS } from '@/constants'

interface DelegateModalProps {
  open: boolean
  onClose: () => void
  onDelegated?: (delegate: string, txHash: string) => void
}

export default function DelegateModal({
  open,
  onClose,
  onDelegated,
}: DelegateModalProps) {
  const { t } = useTranslation()
  const { address } = useAccount()
  const chainId = useChainId()
  const wagmiConfig = useConfig()
  const [selectedDelegate, setSelectedDelegate] = useState<string>('')
  const [txHash, setTxHash] = useState<string>('')
  const [selectOpen, setSelectOpen] = useState(false)
  const [txStatus, setTxStatus] = useState<
    'idle' | 'signing' | 'pending' | 'success' | 'error'
  >('idle')
  const [txError, setTxError] = useState<string | null>(null)

  // Query token holders
  const { data: tokenHoldersData, isLoading: isLoadingHolders } =
    useQuery<TokenHoldersResponseData>({
      queryKey: ['tokenHolders'],
      queryFn: getTokenHolders,
    })

  const members: Member[] = tokenHoldersData?.members || []
  const selfMember = members.find(
    m => m.id.toLowerCase() === address?.toLowerCase(),
  )

  // initialize selection: existing delegate if set (and not zero & not self), else blank
  useEffect(() => {
    if (!selfMember) {
      return
    }
    if (selfMember.delegate && selfMember.delegate !== ZERO_ADDRESS) {
      setSelectedDelegate(prev => (prev ? prev : selfMember.delegate))
    }
  }, [selfMember])

  // Get block explorer URL
  const blockExplorer = wagmiConfig.chains[0].blockExplorers?.default

  // Prepare the contract write
  const activeChain = wagmiConfig.chains[0]
  console.log('Active chain:', activeChain)

  const { writeContractAsync, isPending: isWritePending } = useWriteContract()

  // Watch transaction status
  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    isError: isTxError,
  } = useWaitForTransactionReceipt({
    hash: txHash as `0x${string}`,
  })

  // derive unified txStatus
  useEffect(() => {
    if (isConfirmed) {
      setTxStatus('success')
    } else if (isConfirming && txStatus !== 'success') {
      setTxStatus('pending')
    } else if (isTxError && txStatus === 'pending') {
      setTxStatus('error')
    }
  }, [isConfirming, isConfirmed, isTxError])

  // trigger callback when confirmed
  useOnDelegatedEffect(isConfirmed, selectedDelegate, txHash, onDelegated)

  const handleDelegate = async () => {
    console.log('Handle delegate called', {
      selectedDelegate,
      walletChainId: chainId,
      activeChainId: activeChain?.id,
      chainMatch: chainId === activeChain?.id,
    })

    // If already delegated to this target, short-circuit to success UI
    if (
      selfMember?.delegate &&
      selfMember.delegate.toLowerCase() === selectedDelegate.toLowerCase()
    ) {
      setTxStatus('success')
      return
    }

    if (!selectedDelegate) {
      console.log('No delegate selected')
      return
    }

    console.log('Delegating to:', selectedDelegate)
    setTxError(null)
    setTxStatus('signing')
    try {
      const hash = await writeContractAsync({
        address: config.contracts.token as `0x${string}`,
        abi: tokenABI,
        functionName: 'delegate',
        args: [selectedDelegate as `0x${string}`],
        chainId: activeChain?.id,
        chain: activeChain,
      })
      setTxHash(hash)
      setTxStatus('pending')
    } catch (error: any) {
      console.error('Delegation error:', error)
      setTxError(error?.shortMessage || error?.message || 'Unknown error')
      setTxStatus('error')
    }
  }

  const handleClose = () => {
    onClose()
    setTxHash('')
    setSelectedDelegate('')
    setTxStatus('idle')
    setTxError(null)
  }

  const getButtonText = () => {
    switch (txStatus) {
      case 'signing':
        return t('delegate.signing', 'Signing…')
      case 'pending':
        return t('delegate.confirming')
      case 'success':
        return t('delegate.confirmed')
      case 'error':
        return t('delegate.retry', 'Retry')
      default:
        return t('delegate.submit')
    }
  }

  const getButtonDisabled = () => {
    if (txStatus === 'success') {
      return true
    }
    if (txStatus === 'signing' || txStatus === 'pending') {
      return true
    }
    return !selectedDelegate || isWritePending
  }

  // find self member to check delegation status
  // hide entirely if user not a member
  if (!selfMember) {
    return null
  }

  // reorder so self is first
  const orderedMembers = [
    selfMember,
    ...members.filter(m => m.id.toLowerCase() !== selfMember.id.toLowerCase()),
  ]

  // derive selected member for display
  const selectedMember = useMemo(
    () =>
      orderedMembers.find(
        m => m.id.toLowerCase() === selectedDelegate.toLowerCase(),
      ),
    [orderedMembers, selectedDelegate],
  )

  return (
    <Modal
      open={open}
      onClose={!txHash ? handleClose : undefined}
      title={t('delegate.title')}
      description={t('delegate.description')}
    >
      <div className="grid gap-4 pb-4">
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
              {selectedMember ? (
                <SelectedDelegateDisplay
                  member={selectedMember}
                  selfAddress={address}
                />
              ) : (
                <SelectValue placeholder={t('delegate.selectPlaceholder')} />
              )}
            </SelectTrigger>
            <SelectContent className="max-h-64 overflow-y-auto border border-input">
              <div className="space-y-1">
                {orderedMembers.map(member => (
                  <MemberSelectItem
                    key={member.id}
                    member={member}
                    selfAddress={address}
                  />
                ))}
              </div>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-4">
          <Button
            onClick={txStatus === 'error' ? handleDelegate : handleDelegate}
            disabled={getButtonDisabled()}
            className={`flex-1 relative ${txStatus === 'success' ? 'bg-green-500 hover:bg-green-600' : ''}`}
          >
            {getButtonText()}
            {(txStatus === 'signing' || txStatus === 'pending') && (
              <span className="ml-2 h-4 w-4 animate-spin border-2 border-current border-t-transparent rounded-full" />
            )}
          </Button>
          {txStatus === 'success' && (
            <Button variant="outline" onClick={handleClose}>
              {t('common.close')}
            </Button>
          )}
        </div>
        {txStatus === 'error' && txError && (
          <div className="text-xs text-red-500 whitespace-pre-wrap break-all">
            {txError}
          </div>
        )}
        {/* onDelegated side-effect handled in effect below */}
        {txHash && blockExplorer && (
          <div className="text-sm text-center text-secondary">
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

function useOnDelegatedEffect(
  isConfirmed: boolean,
  selectedDelegate: string,
  txHash: string,
  onDelegated?: (delegate: string, txHash: string) => void,
) {
  useEffect(() => {
    if (isConfirmed && selectedDelegate && txHash && onDelegated) {
      onDelegated(selectedDelegate, txHash)
    }
  }, [isConfirmed, selectedDelegate, txHash, onDelegated])
}

// Separate component for member item to safely use hooks
function MemberSelectItem({
  member,
  selfAddress,
}: {
  member: Member
  selfAddress?: string
}) {
  const { t } = useTranslation()
  const isSelf = member.id.toLowerCase() === selfAddress?.toLowerCase()
  const displayName = useDisplayName({ address: member.id })
  const primaryLabel = isSelf
    ? t('delegate.self')
    : displayName || short(member.id)
  const secondary = member.id
  return (
    <SelectItem
      value={member.id}
      className={`flex flex-col items-start gap-0 leading-tight border rounded-md cursor-pointer data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground border-transparent`}
    >
      <div className="w-full flex items-center justify-between gap-2">
        <span className={`text-sm font-medium ${isSelf ? 'text-primary' : ''}`}>
          {primaryLabel}
        </span>
        <span className="text-sm mt-0.5 font-mono text-secondary tracking-tight">
          {secondary}
        </span>
        {member.delegate &&
          member.delegate !== ZERO_ADDRESS &&
          member.delegate !== member.id && (
            <span className="mt-1 inline-block text-[10px] px-1.5 py-0.5 rounded bg-card text-secondary">
              {t('delegate.currentDelegateShort', 'Delegating to')}{' '}
              {short(member.delegate)}
            </span>
          )}
      </div>
    </SelectItem>
  )
}

function SelectedDelegateDisplay({
  member,
  selfAddress,
}: {
  member: Member
  selfAddress?: string
}) {
  const { t } = useTranslation()
  const isSelf = member.id.toLowerCase() === selfAddress?.toLowerCase()
  const displayName = useDisplayName({ address: member.id })
  const primaryLabel = isSelf
    ? t('delegate.self')
    : displayName || short(member.id)
  return (
    <div className="flex items-center gap-2 truncate">
      <span className="text-sm font-medium truncate">{primaryLabel}</span>
      <span className="text-xs font-mono text-secondary truncate">
        {short(member.id)}
      </span>
    </div>
  )
}
