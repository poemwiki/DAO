import injectedModule from '@web3-onboard/injected-wallets'
import { init } from '@web3-onboard/react'
import { config } from './index'
import { type ThemingMap } from '@web3-onboard/core/dist/types'

const injected = injectedModule()

export const web3Onboard = init({
  theme: 'system',
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

const customTheme: ThemingMap = {
  '--w3o-background-color': 'oklch(1 0 0)',
  '--w3o-foreground-color': 'oklch(0.9784 0.0011 197.1387)',
  // '--w3o-text-color': '#fff',
  '--w3o-border-color': 'oklch(0.9317 0.0118 145)',
  '--w3o-action-color': 'oklch(68.801% 0.22066 144.266)',
  '--w3o-border-radius': '5px',
}

web3Onboard.state.actions.updateTheme(customTheme)
