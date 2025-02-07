import injectedModule from '@web3-onboard/injected-wallets'
import { init } from '@web3-onboard/react'
import { config } from './index'
import logo from '../assets/poemWiki.svg'

const injected = injectedModule()

export const web3Onboard = init({
  wallets: [injected],
  chains: [
    {
      id: config.network.chainId,
      token: config.network.token,
      label: config.network.name,
      rpcUrl: `https://eth-${config.network.name}.g.alchemy.com/v2/${import.meta.env.VITE_ALCHEMY_KEY}`,
    },
  ],
  appMetadata: {
    name: config.app.name,
    icon: logo,
    description: 'DAO governance platform',
  },
})
