# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

- `npm run dev` - Start development server (Vite)
- `npm run build` - Build for production (TypeScript compilation + Vite build)
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint with auto-fix
- `npm run format` - Format code with Prettier
- `npm run test` - Run tests with Vitest (single run)
- `npm run test:watch` - Run tests in watch mode

**Note**: Use `npm` (not `pnpm`) as specified in package.json engines, despite the README mentioning pnpm.

## Project Architecture

### Monorepo Context
This is the frontend React dApp (`govzero/`) that's part of a larger ecosystem:
- **`/Users/apple/dev/wiki/subgraph-Governor-PWR/`** - The Graph subgraph for blockchain data indexing
- **`/Users/apple/dev/wiki/dao-poemwiki-contracts/`** - Hardhat smart contracts (Governor + Reputation token)
- **`statics/js/` and `views/index.ejs`** - Legacy server code (reference only, don't modify unless explicitly requested)

### Technology Stack
- **Framework**: React 18 + TypeScript + Vite
- **Styling**: TailwindCSS 4.x with CSS custom properties, Radix UI components
- **Web3**: wagmi 2.x + viem 2.x for blockchain interactions
- **Data Fetching**: @tanstack/react-query for caching and state management
- **Internationalization**: i18next + react-i18next
- **Routing**: react-router-dom v6
- **Testing**: Vitest + @testing-library/react

### Key Architectural Patterns

#### Web3 Integration
- Contract interactions isolated in custom hooks (e.g., `useVoteOnProposal`)
- Wrap wagmi mutations, invalidate react-query keys on success
- ABIs centralized in `src/abis/` directory
- Network configuration through `src/config/wagmi.ts` and `src/config/web3.ts`

#### Data Layer
- GraphQL operations in `src/graphql/` hitting the PoemWiki subgraph
- Co-locate queries with hooks, handle nullable fields defensively
- React Query for client-side caching and synchronization
- Real-time updates through The Graph protocol subscriptions

#### Component Architecture
- **Pages** (`src/pages/`): Route-level components, keep thin and delegate logic
- **Components** (`src/components/`): Reusable UI primitives using Tailwind + Radix
- **Layouts** (`src/layouts/`): Layout wrapper components
- **Hooks** (`src/hooks/`): Custom hooks composing wagmi + react-query logic

#### Configuration Management
- Network addresses and feature flags in `src/constants/` and `src/config/`
- Runtime configuration via `public/addressBook.json` for address-to-name mapping
- Environment variables prefixed with `VITE_*`
- Never hardcode addresses or network config inside components

#### State Management
- React Context providers in `src/context/` (check before adding new global state)
- Local state with React hooks for component-specific data
- React Query for server/blockchain state
- Custom hooks in `src/hooks/` for stateful logic

### Legacy Integration
- `statics/js/` contains old Web3.js-based JavaScript implementation with Chinese UI
- `views/index.ejs` is the legacy server-rendered template
- These are reference implementations for features not yet migrated to the React app
- Contains governance proposal creation, voting, and parameter management functionality

### Important Conventions

#### Development Workflow
1. Contract changes → update ABIs in `src/abis/`
2. Subgraph schema changes → update GraphQL operations in `src/graphql/`
3. After mutation hooks → invalidate related react-query keys
4. All user-facing text → add to i18n resource bundles (no raw strings)
5. Always run `npm run lint` and `npm run build` before commits

#### Cross-Layer Dependencies
- Order of implementation: contracts → subgraph → frontend
- Address book updates must be consistent across all packages
- Entity/type definitions should be single-sourced from schema or typechain
- Side effects (transactions, navigation, toasts) belong in hooks, not presentation components

## Testing Strategy

- Unit tests with Vitest and @testing-library/react
- Mock wallet/provider interactions for isolated testing
- Component tests focused on user interactions and state changes
- Integration tests for custom hooks combining wagmi + react-query

## Node.js Version Requirement

This project requires Node.js >= 22.12.0 as specified in package.json engines.