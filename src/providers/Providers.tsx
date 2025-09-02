import { ReactNode } from 'react'
import * as RadixTooltip from '@radix-ui/react-tooltip'
import { Web3OnboardProvider } from '@web3-onboard/react'
import { web3Onboard } from '@/config/web3'
import { WagmiProvider } from 'wagmi'
import { wagmiConfig } from '@/config/wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TokenInfoProvider } from '@/context/TokenInfoContext'
import { BrowserRouter } from 'react-router-dom'

// Central place to register all app-wide providers.
// Add future providers here (Theme, i18n already side-effect imported in main).

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, retry: 1 },
  },
})

interface ProvidersProps {
  children: ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <Web3OnboardProvider web3Onboard={web3Onboard}>
          <WagmiProvider config={wagmiConfig}>
            <TokenInfoProvider>
              <RadixTooltip.Provider delayDuration={150} skipDelayDuration={300}>
                {children}
              </RadixTooltip.Provider>
            </TokenInfoProvider>
          </WagmiProvider>
        </Web3OnboardProvider>
      </QueryClientProvider>
    </BrowserRouter>
  )
}

export default Providers
