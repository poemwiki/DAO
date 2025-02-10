import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useConnectWallet, useSetChain } from '@web3-onboard/react'
import { useAccount, useReadContract } from 'wagmi'
import { Account } from '@web3-onboard/core/dist/types'
import { SlWallet } from 'react-icons/sl'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import DelegateModal from '@/components/DelegateModal'
import { config } from '@/config'

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

// ABI for checking delegate
const tokenABI = ['function delegates(address account) view returns (address)'] as const

export default function ConnectWallet() {
  const { t } = useTranslation()
  const [{ wallet, connecting }, connect, disconnect] = useConnectWallet()
  const [{ chains }, setChain] = useSetChain()
  const { address, isConnected } = useAccount()
  const [account, setAccount] = useState<Account | null>(null)
  const [showDelegateModal, setShowDelegateModal] = useState(false)

  // Check delegate status
  const { data: _delegateAddress } = useReadContract({
    address: config.contracts.token as `0x${string}`,
    abi: tokenABI,
    functionName: 'delegates',
    args: address ? [address as `0x${string}`] : undefined,
    query: { enabled: !!address },
  })

  // Watch delegate status and show modal
  useEffect(() => {
    console.log('Delegate check:', {
      isConnected,
      address,
      delegateAddress: _delegateAddress,
      isZeroAddress: _delegateAddress === ZERO_ADDRESS,
    })

    if (isConnected && address && (!_delegateAddress || _delegateAddress === ZERO_ADDRESS)) {
      console.log('Opening delegate modal')
      setShowDelegateModal(true)
    }
  }, [isConnected, address, _delegateAddress])

  // Add debug log for modal state
  useEffect(() => {
    console.log('Modal state:', showDelegateModal)
  }, [showDelegateModal])

  async function login() {
    let connected = await autoConnect()
    if (!connected.length) connected = await connect()
    if (!connected.length) return

    const chain = chains[0]
    await setChain({ chainId: chain.id })
  }

  async function autoConnect() {
    const previouslyConnectedWallets = JSON.parse(
      window.localStorage.getItem('connectedWallets') || '[]'
    )
    if (previouslyConnectedWallets.length) {
      return await connect({
        autoSelect: {
          label: previouslyConnectedWallets[0],
          disableModals: true,
        },
      })
    }
    return previouslyConnectedWallets
  }

  async function handleDisconnect() {
    if (wallet) {
      await disconnect(wallet)
      window.localStorage.removeItem('connectedWallets')
      setAccount(null)
    }
  }

  useEffect(() => {
    const init = async () => {
      const connected = await autoConnect()
      if (connected.length) {
        const chain = chains[0]
        await setChain({ chainId: chain.id })
      }
    }
    init()
  }, [])

  useEffect(() => {
    if (wallet && wallet?.provider) {
      const walletAccount = wallet?.accounts[0]
      setAccount({
        address: walletAccount.address,
        balance: walletAccount.balance,
        ens: walletAccount.ens,
        uns: null,
      })
      // 保存连接的钱包信息到 localStorage
      window.localStorage.setItem('connectedWallets', JSON.stringify([wallet.label]))
    }
  }, [wallet])

  function formatAddress(address: string) {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  if (wallet?.provider && account) {
    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="w-[160px]">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-sm font-medium">
                  {account.ens?.name || formatAddress(account.address)}
                </span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleDisconnect}>
              {t('accountCenter.disconnectWallet')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <DelegateModal open={showDelegateModal} onOpenChange={setShowDelegateModal} />
      </>
    )
  }

  return (
    <Button variant="outline" size="lg" className="w-[230px]" disabled={connecting} onClick={login}>
      <SlWallet className="mr-2 h-4 w-4" />
      {t('accountCenter.connectWallet')}
    </Button>
  )
}
