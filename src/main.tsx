import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Web3OnboardProvider } from '@web3-onboard/react'
import { web3Onboard } from './config/web3'
import { config } from './config'
import { wagmiConfig } from './config/wagmi'
import './i18n'
import App from './App'
import { TokenInfoProvider } from '@/context/TokenInfoContext'
import './index.css'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Log the configuration
console.log('App configuration:', {
  baseUrl: config.api.baseUrl,
  daoName: config.app.name,
  network: config.network,
})

// Create QueryClient instance with default options
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // 禁用窗口聚焦时自动重新获取
      retry: 1, // 失败时最多重试1次
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <Web3OnboardProvider web3Onboard={web3Onboard}>
          <WagmiProvider config={wagmiConfig}>
            <TokenInfoProvider>
              <App />
            </TokenInfoProvider>
          </WagmiProvider>
        </Web3OnboardProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
)
