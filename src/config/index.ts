export const config = {
  api: {
    baseUrl:
      import.meta.env.VITE_SUBGRAPH_URL || 'https://api.thegraph.com/subgraphs/name/your-subgraph',
  },
  app: {
    name: import.meta.env.VITE_DAO_NAME || 'DAO',
    description: import.meta.env.VITE_DAO_DESCRIPTION || 'A decentralized autonomous organization',
  },
  network: {
    chainId: import.meta.env.VITE_CHAIN_ID || '1',
    name: import.meta.env.VITE_NETWORK_NAME || 'mainnet',
    token: import.meta.env.VITE_NETWORK_TOKEN_NAME || 'ETH',
    explorerTxBase: import.meta.env.VITE_EXPLORER_TX_BASE || '',
  },
  contracts: {
    token: import.meta.env.VITE_TOKEN_ADDRESS || '',
    governor: import.meta.env.VITE_GOVERNOR_ADDRESS || '',
  },
}

// Helper to guess explorer base if not explicitly provided
function guessExplorerTxBase(chainIdHexOrDec: string): string {
  const id = chainIdHexOrDec.startsWith('0x')
    ? parseInt(chainIdHexOrDec, 16)
    : Number(chainIdHexOrDec)
  switch (id) {
    case 1:
      return 'https://etherscan.io/tx/'
    case 11155111: // sepolia
      return 'https://sepolia.etherscan.io/tx/'
    case 137:
      return 'https://polygonscan.com/tx/'
    case 80002: // polygon amoy
      return 'https://amoy.polygonscan.com/tx/'
    default:
      return ''
  }
}

if (!config.network.explorerTxBase) {
  config.network.explorerTxBase = guessExplorerTxBase(config.network.chainId)
}

export const getExplorerTxUrl = (tx?: string | null) =>
  tx && config.network.explorerTxBase ? `${config.network.explorerTxBase}${tx}` : undefined
