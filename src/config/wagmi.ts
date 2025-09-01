import { createConfig, http } from 'wagmi'
import { mainnet, polygon, polygonAmoy, sepolia } from 'viem/chains'
import { config } from '.'

// Parse chain ID from environment variable (remove '0x' prefix if present)
const chainId = parseInt(config.network.chainId.replace('0x', ''), 16)

// Get the chain configuration from viem's built-in chains
const supportedChains = [mainnet, polygon, polygonAmoy, sepolia]
const chain = supportedChains.find(c => c.id === chainId)

if (!chain) {
  throw new Error(`Chain ID ${chainId} (${config.network.chainId}) not found in supported chains`)
}

// Create wagmi config
export const wagmiConfig = createConfig({
  chains: [chain],
  transports: {
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [polygonAmoy.id]: http(
      chain.id === polygonAmoy.id && config.network.rpcUrl ? config.network.rpcUrl : undefined
    ),
    [sepolia.id]: http(),
    // override active chain with custom rpc if provided (works for any selected chain)
    [chain.id]: http(config.network.rpcUrl ? config.network.rpcUrl : undefined),
  },
})
