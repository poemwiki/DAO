import type { ReactNode } from 'react'
import * as RadixTooltip from '@radix-ui/react-tooltip'
import { Web3OnboardProvider } from '@web3-onboard/react'
import { web3Onboard } from '@/config/web3'
import { WagmiProvider } from 'wagmi'
import { wagmiConfig } from '@/config/wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TokenInfoProvider } from '@/context/TokenInfoContext'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { routeObjects } from '@/routes/config'
import { Suspense } from 'react'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'


// Central place to register all app-wide providers.
// Add future providers here (Theme, i18n already side-effect imported in main).

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, retry: 1 },
  },
})

interface ProvidersProps {
  children?: ReactNode
}

// Data router built from centralized lazy route objects
const router = createBrowserRouter(routeObjects)

export function Providers({ children }: ProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <Web3OnboardProvider web3Onboard={web3Onboard}>
        <WagmiProvider config={wagmiConfig}>
          <TokenInfoProvider>
            <RadixTooltip.Provider
              delayDuration={150}
              skipDelayDuration={300}
            >
              <Suspense fallback={null}>
                <RouterProvider router={router} />
              </Suspense>
              {children /* slot for global overlays if needed */}
            </RadixTooltip.Provider>
          </TokenInfoProvider>
        </WagmiProvider>
      </Web3OnboardProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}

export default Providers
