import { mainnet, polygon, polygonAmoy, sepolia } from 'viem/chains'
import { createConfig, http } from 'wagmi'
import { config } from '.'

// WHY: Previously we always parsed the env chain id as hex which breaks when a
// user supplies a decimal string (e.g. "80002") – it was interpreted as hex
// and produced an invalid id (524290). We now detect format explicitly.
const rawChainId = config.network.chainId.trim()
const chainId = rawChainId.startsWith('0x')
  ? Number.parseInt(rawChainId.slice(2), 16)
  : Number.parseInt(rawChainId, 10)

// Get the chain configuration from viem's built-in chains
const supportedChains = [mainnet, polygon, polygonAmoy, sepolia]
const chain = supportedChains.find(c => c.id === chainId)

if (!chain) {
  throw new Error(
    `Chain ID ${chainId} (${config.network.chainId}) not found in supported chains`,
  )
}

// Create wagmi config
export const wagmiConfig = createConfig({
  chains: [chain],
  transports: {
    [mainnet.id]: http(),
    [polygon.id]: http(),
    [polygonAmoy.id]: http(
      chain.id === polygonAmoy.id && config.network.rpcUrl
        ? config.network.rpcUrl
        : undefined,
    ),
    [sepolia.id]: http(),
    // override active chain with custom rpc if provided (works for any selected chain)
    [chain.id]: http(config.network.rpcUrl ? config.network.rpcUrl : undefined),
  },
})
