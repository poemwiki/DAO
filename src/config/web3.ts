import injectedModule from '@web3-onboard/injected-wallets'
import { init } from '@web3-onboard/react'
import { config } from './index'

const injected = injectedModule()

export const web3Onboard = init({
  wallets: [injected],
  chains: [
    {
      id: config.network.chainId,
      token: config.network.token,
      label: config.network.name,
      rpcUrl: config.network.rpcUrl,
    },
  ],
  appMetadata: {
    name: config.app.name,
    icon: import.meta.env.VITE_APP_LOGO || undefined,
    description: 'DAO governance platform',
  },
})
