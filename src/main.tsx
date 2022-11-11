import React from 'react'
import ReactDOM from 'react-dom/client'
import { ChakraProvider } from '@chakra-ui/react'

import './common.css'
import zh from './assets/zh.json'
import App from './App'

import logo from './assets/poemWiki.svg'

import { extendTheme } from '@chakra-ui/react'
import { buttonTheme } from './components/Button'
import { iconButtonTheme } from './components/IconButton'

const theme = extendTheme({
  semanticTokens: {
    colors: {
      error: 'red.500',
      success: 'green.500',
      primary: {
        default: 'tealh.500',
        _dark: 'red.400',
      },
      secondary: {
        default: 'red.800',
        _dark: 'red.700',
      },
    },
  },
  components: {
    Button: buttonTheme,
    IconButton: iconButtonTheme
  }
})

import { Web3OnboardProvider, init } from '@web3-onboard/react'
import injectedModule from '@web3-onboard/injected-wallets'
import web3authModule from '@web3-onboard/web3auth'
import { InitOptions } from '@web3-onboard/core'

const web3auth = web3authModule({
  clientId: import.meta.env.VITE_WEB3AUTH_CLIENT_ID,
  modalConfig: {
  },
  uiConfig: {
    appLogo: logo,
    theme: 'light',
  }
})
const wallets = [injectedModule(), web3auth]

const alchemyId = import.meta.env.VITE_ALCHEMY_KEY
const allChains = [{
  id: '0x5',
  token: 'goerliETH',
  label: 'Goerli Testnet',
  rpcUrl: `https://eth-goerli.g.alchemy.com/v2/${alchemyId}`
},
{
  id: '0x89',
  token: 'MATIC',
  label: 'Matic Mainnet',
  rpcUrl: 'https://matic-mainnet.chainstacklabs.com'
}]
console.log(import.meta.env.NODE_ENV)
const chains = allChains.filter(chain => chain.id === import.meta.env.VITE_CHAIN_ID)

const appMetadata: InitOptions['appMetadata'] = {
  name: 'PoemWiki',
  icon: logo,
  logo: logo,
  description: 'PoemWiki DAO',
  recommendedInjectedWallets: [
    { name: 'MetaMask', url: 'https://metamask.io' }
  ]
}

const web3Onboard = init({
  wallets,
  chains,
  appMetadata,
  accountCenter: {
    desktop: {
      enabled: true,
      minimal: true,
    },
    mobile: {
      enabled: true,
      minimal: true,
    }
  },
  // containerElements: { accountCenter: '#account-center' },
  i18n: {
    zh: zh,
  }
})

const walletsSub = web3Onboard.state.select('wallets')
const { unsubscribe } = walletsSub.subscribe(wallets => {
  console.log('wallets sub:', wallets)
  const connectedWallets = wallets.map(({ label }) => label)
  window.localStorage.setItem(
    'connectedWallets',
    JSON.stringify(connectedWallets)
  )
})

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ChakraProvider theme={theme}>
      <Web3OnboardProvider web3Onboard={web3Onboard}>
        <App />
      </Web3OnboardProvider>
    </ChakraProvider>
  </React.StrictMode>
)

// const previouslyConnectedWallets = JSON.parse(
//   window.localStorage.getItem('connectedWallets') || '[]'
// )
// if (previouslyConnectedWallets.length) {
//   console.log('previouslyConnectedWallets:', previouslyConnectedWallets)
//   await web3Onboard.connectWallet({
//     autoSelect: {
//       label: previouslyConnectedWallets[0],
//       disableModals: true
//     },
//   })
// }