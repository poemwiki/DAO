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

const alchemyKey = import.meta.env.VITE_ALCHEMY_KEY

// wagmi init
import { configureChains, createClient, chain, allChains, WagmiConfig } from 'wagmi'
import { alchemyProvider } from 'wagmi/providers/alchemy'
import { publicProvider } from 'wagmi/providers/public'
import { InjectedConnector } from 'wagmi/connectors/injected'

const configChains = allChains.filter(chain => chain.id === parseInt(import.meta.env.VITE_CHAIN_ID, 16))
console.log(configChains)
const { chains, provider, webSocketProvider } = configureChains(configChains, [
  alchemyProvider({ apiKey: alchemyKey }),
  publicProvider(),
])

const wagmiClient = createClient({
  autoConnect: true,
  provider,
  webSocketProvider,
})


// onboard init
import { Web3OnboardProvider, init } from '@web3-onboard/react'
import injectedModule from '@web3-onboard/injected-wallets'
import { AppMetadata } from '@web3-onboard/common'
import unipassModule from '@unipasswallet/web3-onboard'

// initialize the module with options
const unipass = unipassModule({
  chainId: Number.parseInt(import.meta.env.VITE_CHAIN_ID),
  returnEmail: true,
  appSettings: {
    appName: 'web3-onboard test for unipass',
    appIcon: 'https://p-1254719278.cos.ap-hongkong.myqcloud.com/img/common/poemwiki-3x.png',
    // theme: UniPassTheme.DARK
  },
})


const wallets = [injectedModule(), unipass]

const defaultChains = [{
  id: '0x5',
  token: 'goerliETH',
  label: 'Goerli Testnet',
  rpcUrl: `https://eth-goerli.g.alchemy.com/v2/${alchemyKey}`
},
{
  id: '0x89',
  token: 'MATIC',
  label: 'Matic Mainnet',
  rpcUrl: 'https://matic-mainnet.chainstacklabs.com'
}]
console.log('NODE_ENV', import.meta.env.NODE_ENV)
const onboardChains = defaultChains.filter(chain => chain.id === import.meta.env.VITE_CHAIN_ID)

const appMetadata: AppMetadata = {
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
  chains: onboardChains,
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
  const connectedWallets = wallets.map(({ label }) => label)
  console.log('wallets sub:', connectedWallets)
  window.localStorage.setItem(
    'connectedWallets',
    JSON.stringify(connectedWallets)
  )
})


import { ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client'
const apolloClient = new ApolloClient({
  uri: import.meta.env.VITE_SUBGRAPH_ENDPOINT,
  cache: new InMemoryCache(),
})

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ApolloProvider client={apolloClient}>
      <ChakraProvider theme={theme}>
        <WagmiConfig client={wagmiClient}>
          <Web3OnboardProvider web3Onboard={web3Onboard}>
            <App />
          </Web3OnboardProvider>
        </WagmiConfig>
      </ChakraProvider>
    </ApolloProvider>
  </React.StrictMode>
)

// const previouslyConnectedWallets = JSON.parse(
//   window.localStorage.getItem('connectedWallets') || '[]'
// )
// if (previouslyConnectedWallets.length) {
//   await web3Onboard.connectWallet({
//     autoSelect: {
//       label: previouslyConnectedWallets[0],
//       disableModals: true
//     },
//   })
// }