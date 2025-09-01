# GovZero

GovZero is a modern, decentralized governance platform that enables DAOs to manage their proposals and voting processes efficiently. Built with React and integrated with The Graph protocol, it provides a seamless interface for interacting with on-chain governance.

## Features

- 🏛️ **DAO Governance**: Create, view, and manage governance proposals
- 🗳️ **Voting System**: Participate in governance with secure on-chain voting
- 📊 **Real-time Updates**: Live data synchronization through The Graph protocol
- 🌓 **Dark/Light Mode**: Customizable UI theme for better user experience
- 🔗 **Multi-chain Support**: Compatible with multiple EVM networks
- 💼 **Wallet Integration**: Seamless connection with Web3 wallets
- 📱 **Responsive Design**: Optimized for both desktop and mobile devices

## Tech Stack

- **Frontend Framework**: React + TypeScript + Vite
- **Styling**: TailwindCSS
- **Data Layer**: The Graph Protocol
- **Web3 Integration**: viem + wagmi
- **State Management**: React Context + Hooks
- **Routing**: React Router v6
- **Development Tools**: ESLint + Prettier

## Project Structure

```
src/
├── graphql/          # GraphQL queries and operations
├── assets/           # Static assets
├── components/       # Reusable UI components
├── config/           # App configuration
├── constants/        # Constants and enums
├── hooks/            # Custom React hooks
├── layouts/          # Layout components
├── pages/            # Page components
├── routes/           # Route configurations
├── store/            # State management
├── types/            # TypeScript type definitions
└── utils/            # Utility functions
```

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- pnpm (v7 or higher)
- A Web3 wallet (e.g., MetaMask)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/your-username/govzero.git
cd govzero
```

2. Install dependencies:

```bash
pnpm install
```

3. Create environment variables:

```bash
cp .env.example .env
```

4. Update the environment variables in `.env` with your configuration:

```bash
# App
VITE_APP_NAME=GovZero

# Network
VITE_CHAIN_ID=0x13882
VITE_NETWORK_NAME=polygon-amoy

# The Graph
VITE_SUBGRAPH_URL=your_subgraph_url

# Web3
VITE_TOKEN_ADDRESS=your_token_address
VITE_GOVERNOR_ADDRESS=your_governor_address
```

5. Start the development server:

```bash
pnpm dev
```

### Building for Production

To create a production build:

```bash
pnpm build
```

## Architecture

### Data Flow

1. **The Graph Integration**

   - Subgraph indexes blockchain events
   - Frontend queries data through GraphQL
   - Real-time updates through subscriptions

2. **State Management**

   - React Context for global state
   - Custom hooks for data fetching and caching
   - Local storage for user preferences

3. **Web3 Integration**
   - Direct interaction with smart contracts
   - Wallet connection management
   - Transaction handling and monitoring

### Key Components

- **Proposal System**

  - Create and view proposals
  - Vote on active proposals
  - Track proposal status and results

- **User Interface**

  - Responsive layout system
  - Component-based architecture
  - Theme customization

- **Authentication**
  - Web3 wallet integration
  - Address resolution and ENS support
  - Permission management

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, please open an issue in the GitHub repository or contact the team at [your-email].
