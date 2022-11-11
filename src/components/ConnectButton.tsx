import React, { useEffect, useState } from 'react'
import { useConnectWallet, useSetChain } from '@web3-onboard/react'
import { Account } from '@web3-onboard/core/dist/types'
import { ethers } from 'ethers'
import { Box, Button, IconButton } from '@chakra-ui/react'
import { SlWallet } from 'react-icons/sl'

export default function ConnectWallet() {
  const [{ wallet, connecting }, connect, disconnect, updateBalances, setWalletModules, setPrimaryWallet] = useConnectWallet()
  const [
    {
      chains, // the list of chains that web3-onboard was initialized with
      connectedChain, // the current chain the user's wallet is connected to
      settingChain // boolean indicating if the chain is in the process of being set
    },
    setChain // function to call to initiate user to switch chains in their wallet
  ] = useSetChain()
  const [ethersProvider, setProvider] = useState<ethers.providers.Web3Provider | null>(null)
  const [account, setAccount] = useState<Account | null>(null)

  async function login() {
    let connected = await autoConnect()
    console.log('connected', connected)
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
      console.log('previouslyConnectedWallets', previouslyConnectedWallets)
      return await connect({
        autoSelect: {
          label: previouslyConnectedWallets[0],
          disableModals: true
        },
      })
    }
    return previouslyConnectedWallets
  }

  console.log({ wallet, connecting })

  // auto connect wallet on load
  useEffect(() => {
    autoConnect()
  }, [])


  useEffect(() => {
    if (wallet && wallet?.provider) {
      // const { name, avatar } = wallet.accounts[0].ens ?? {}
      const address = wallet?.accounts[0].address
      setAccount({
        address: address,
        balance: wallet.accounts[0].balance,
        ens: wallet.accounts[0].ens
      })
    }
  }, [wallet])

  useEffect(() => {
    // If the wallet has a provider than the wallet is connected
    if (wallet?.provider) {
      setProvider(new ethers.providers.Web3Provider(wallet.provider, 'any'))
    }
  }, [wallet])

  if (wallet?.provider && account) {
    return (
      <div>
        <Box id='account-center' sx={{ width: '60px' }}></Box>
        {/* <img src={account.ens?.avatar?.url} alt="ENS Avatar" />
        <div>{account.ens?.name ? account.ens.name : account.address}</div>
        <div>Connected to {wallet.label}</div>
        <Button onClick={() => disconnect({ label: wallet.label })}>Disconnect</Button> */}
      </div>
    )
  }

  return (
    <Button sx={{ width: '160px' }}
      size='lg'
      variant="outline"
      leftIcon={<SlWallet />}
      aria-label="连接钱包"
      disabled={connecting}
      onClick={login}
    >
      连接钱包
    </Button>
  )
}
