# Govo

<p align="left">
  <img src="./public/govo.svg" alt="Govo Logo" width="120" height="120" />
</p>

Govo is a modern, decentralized governance platform that enables DAOs to manage their proposals and voting processes efficiently. Built with React and integrated with The Graph protocol, it provides a seamless interface for interacting with on-chain governance.

## Features

- 🏛️ **DAO Governance**: Create, view, and manage governance proposals
- 🗳️ **Voting System**: Participate in governance with secure on-chain voting
- 📊 **Real-time Updates**: Live data synchronization through The Graph protocol
- 🌓 **Dark/Light Mode**: Customizable UI theme for better user experience
- 🔗 **Multi-chain Support**: Compatible with multiple EVM networks
- 💼 **Wallet Integration**: Seamless connection with Web3 wallets
- 📱 **Responsive Design**: Optimized for both desktop and mobile devices

## Current Adopters

Organizations / DAOs currently using Govo in production or active evaluation:

- **PoemWiki DAO** – https://dao.poemwiki.org/

## Tech Stack

- **Frontend Framework**: React + TypeScript + Vite
- **Styling**: TailwindCSS
- **Data Layer**: The Graph Protocol
- **Web3 Integration**: viem + wagmi
- **State Management**: React Context + Hooks
- **Routing**: React Router v6
- **Development Tools**: ESLint + Prettier

## Related Projects

This frontend application is part of a complete DAO governance ecosystem consisting of three main components:

### 🏗️ Smart Contracts
**Repository**: [https://github.com/poemwiki/DAO-contracts](https://github.com/poemwiki/DAO-contracts)

Contains the core governance smart contracts built on OpenZeppelin's Governor framework:
- **GovernorUpgradeable**: Main governance contract with voting and execution logic
- **ERC20Votes Token**: Reputation token with delegation and snapshot capabilities
- **Deployment Scripts**: Hardhat-based deployment and configuration tools

The contracts implement a complete governance system with proposal creation, voting periods, quorum requirements, and execution mechanisms.

### 📊 Subgraph (Data Indexing)
**Repository**: [https://github.com/star8ks/poemwiki-subgraph](https://github.com/star8ks/poemwiki-subgraph)

The Graph Protocol subgraph that indexes blockchain events and provides GraphQL API access:
- **Event Indexing**: Tracks all governance events (proposals, votes, executions, transfers)
- **Entity Relationships**: Structured data models for proposals, members, votes, and token transfers
- **Real-time Updates**: Automatic synchronization with blockchain state
- **GraphQL API**: Efficient querying interface for the frontend application

### 🎨 Frontend (This Repository)
The React-based web interface that provides:
- User-friendly proposal creation and voting interface
- Real-time governance data visualization
- Wallet integration and transaction management
- Responsive design for desktop and mobile devices

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
├── queries/          # React Query query keys & composed data hooks
├── routes/           # Route configurations
├── types/            # TypeScript type definitions
└── utils/            # Utility functions
```

## Getting Started

### Prerequisites

- Node.js (>= 22.11.0) – matches `engines.node` in package.json
- pnpm (latest v9 recommended) – project uses a modern lockfile
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

## Voting

### Snapshot & Voting Power

Each proposal has a snapshot block taken at the moment voting becomes active (`Governor.proposalSnapshot`). All voting power is read at exactly that block using `token.getPastVotes(account, snapshot)`. Delegation must be set _before_ the snapshot to count.

### Delegation Model

This [Governor](https://github.com/poemwiki/DAO-contracts/blob/b5676584e69840b3d1b48f0c87ae3487bab9c3bc/contracts/GovernorUpgradeable.sol) uses an ERC20Votes-compatible token (Votes extension). Voting weight comes from delegated balances:

- If a holder delegates to themselves (or another address) before the snapshot, their balance contributes to that delegate's voting power.
- If a holder never delegates, their tokens still exist in total supply but provide no voting weight to any voter.

### Quorum Calculation

Quorum is an absolute minimum participation threshold (FOR + ABSTAIN) based on total token supply at the snapshot block.

Formula (from OpenZeppelin GovernorVotesQuorumFraction):

```
quorum(snapshot) = getPastTotalSupply(snapshot) * quorumNumerator(snapshot) / quorumDenominator()
```

Notes:

- `snapshot` = proposal start block returned by `proposalSnapshot(proposalId)`.
- Undelegated tokens DO count in `getPastTotalSupply`, increasing the quorum requirement.
- They do NOT add to FOR / AGAINST / ABSTAIN tallies because they have no delegate.
- Required participation compares: `FOR + ABSTAIN >= quorum(snapshot)`.

### Vote Success Conditions (CountingSimple)

1. Quorum reached: `forVotes + abstainVotes >= quorum(snapshot)`
2. Support test: `forVotes > againstVotes`

If both pass after the deadline block, the proposal moves to Succeeded.

### Tally Semantics

| Type    | In quorum?      | In support test?             |
| ------- | --------------- | ---------------------------- |
| For     | Yes             | Yes (numerator)              |
| Against | No (for quorum) | Yes (denominator comparison) |
| Abstain | Yes             | No (ignored in for>against)  |

### Execution

After Succeeded (or Queued if a timelock were integrated), the proposal can be executed with the exact original arrays `(targets, values, calldatas, descriptionHash)`.

### Practical Implications

- Large undelegated supply raises quorum and can block proposals; encourage self-delegation or delegate to others.
- Changing delegation after the snapshot has no effect on that proposal.
- Updating quorum numerator affects only future proposals (historical quorum uses stored checkpoints).

### Edge Cases

- If total supply shrinks (burn) after snapshot, quorum does not adjust retroactively.
- If quorum numerator is updated mid-proposal, the snapshot's historical numerator is used.

### Recommended UX Patterns

- Prompt users to self-delegate on first visit.
- Show both absolute quorum and current participation early so stagnation is visible.
- Provide a tooltip (already implemented) explaining undelegated impact.
