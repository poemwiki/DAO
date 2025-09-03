import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useConnectWallet, useSetChain } from '@web3-onboard/react'
import { Account } from '@web3-onboard/core/dist/types'
import { SlWallet } from 'react-icons/sl'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { short } from '@/utils/format'
// Removed DelegateModal and delegation gating per requirement

export default function ConnectWallet() {
  const { t } = useTranslation()
  const [{ wallet, connecting }, connect, disconnect] = useConnectWallet()
  const [{ chains }, setChain] = useSetChain()
  const [account, setAccount] = useState<Account | null>(null)
  // Removed delegate related state/effects

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

  // auto connect on mount if connected before
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
      // 保存连接的钱包信息到 localStorage (used for optional future UX like showing last used label)
      window.localStorage.setItem('connectedWallets', JSON.stringify([wallet.label]))
    }
  }, [wallet])

  if (wallet?.provider && account) {
    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="w-fit md:w-[130px] shadow-none">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-sm font-medium">
                  {account.ens?.name || short(account.address)}
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
      </>
    )
  }

  return (
    <Button
      variant="outline"
      size="lg"
      className="w-fit shadow-none px-6"
      disabled={connecting}
      onClick={login}
    >
      <SlWallet className="hidden md:inline h-4 w-4" />
      {t('accountCenter.connectWallet')}
    </Button>
  )
}
