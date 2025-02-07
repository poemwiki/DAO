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
    token: import.meta.env.VITE_NETWORK_TOKEN_NAME || '',
  },
}
