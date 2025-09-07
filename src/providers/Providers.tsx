import type { ReactNode } from 'react'
import * as RadixTooltip from '@radix-ui/react-tooltip'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Web3OnboardProvider } from '@web3-onboard/react'
import { Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { WagmiProvider } from 'wagmi'
import Loading from '@/components/Loading'
import { wagmiConfig } from '@/config/wagmi'
import { web3Onboard } from '@/config/web3'
import { TokenInfoProvider } from '@/context/TokenInfoContext'
import { routeObjects } from '@/routes/config'

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
  const { t } = useTranslation('common')
  return (
    <QueryClientProvider client={queryClient}>
      <Web3OnboardProvider web3Onboard={web3Onboard}>
        <WagmiProvider config={wagmiConfig}>
          <TokenInfoProvider>
            <RadixTooltip.Provider
              delayDuration={150}
              skipDelayDuration={300}
            >
              <Suspense fallback={<Loading text={t('loading')} />}>
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
