# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

Govo (GovZero) is a decentralized governance dApp: proposal lifecycle (create → vote → succeed → execute), real-time data via The Graph, and on-chain interactions through wagmi/viem. Current adopter: PoemWiki DAO. Focus points: accurate snapshot-based voting power, clear quorum display, fast post-transaction consistency (targeted refetch + light polling), and strict separation of UI vs side-effect logic.

### Core Feature Domains (Quick Map)
- Governance proposals: listing, detail, creation (arrays: targets/values/calldatas + description hash)
- Voting: for / against / abstain (CountingSimple), delegation-aware weights
- Quorum visualization: absolute threshold derived at snapshot block
- Wallet + Network: address book mapping + multi-chain readiness
- Internationalization: all user text via i18n resources (no raw strings)
- The Graph integration: proposals, votes, members, transfers

## Directory Structure (Frontend `src/`)

```
├── abis/            # Curated minimal ABIs (do not import artifacts directly)
├── assets/          # Static assets (SVG, images)
├── components/      # Reusable presentational + UI primitives (Tailwind + Radix)
├── config/          # Wagmi / network / web3 config modules
├── constants/       # Network constants, enums, feature flags
├── context/         # React Context providers
├── graphql/         # Raw GraphQL documents & fragments
├── hooks/           # Custom compositional hooks (stateful logic, side-effects)
├── layouts/         # Layout wrappers
├── pages/           # Route-level containers (thin)
├── queries/         # React Query key helpers + composed data hooks (query orchestration)
├── routes/          # Route definitions / loader wrappers
├── types/           # Shared TS types & interfaces
└── utils/           # Pure helpers (formatting, parsing, math)
```

Distinction: `hooks/` may include contract mutations / side-effects; `queries/` centralizes stable query key factories & higher-level data composition to reduce duplication and enforce key shape discipline.

## Common Development Commands

- `pnpm run dev` - Start development server (Vite)
- `pnpm run build` - Build for production (TypeScript compilation + Vite build)
- `pnpm run preview` - Preview production build
- `pnpm run lint` - Run ESLint with auto-fix
- `pnpm run format` - Format code with Prettier
- `pnpm run test` - Run tests with Vitest (single run)
- `pnpm run test:watch` - Run tests in watch mode

## Project Architecture

### Monorepo Context

This is the frontend React dApp (`govzero/`) that's part of a larger ecosystem:

- **`../subgraph-Governor-PWR/`** - The Graph subgraph for blockchain data indexing
- **`../dao-poemwiki-contracts/`** - Hardhat smart contracts (Governor + Reputation token)

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
- Query key definitions consolidated under `src/queries/` (see React Query Key Pattern)

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
- Query key + composition utilities in `src/queries/`

### Important Conventions

#### Development Workflow

1. Contract changes → update ABIs in `src/abis/`
2. Subgraph schema changes → update GraphQL operations in `src/graphql/`
3. After mutation hooks → invalidate related react-query keys
4. All user-facing text → add to i18n resource bundles (no raw strings)
5. Always run `pnpm run lint` and `pnpm run build` before commits

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

## i18n Conventions

- No raw user-facing strings: add to resource bundles first; prefix domain (`proposal.`, `member.`, `wallet.`)
- Keep Chinese & English entries aligned; use descriptive, tense-agnostic keys
- Prefer nouns / short phrases (`proposal.status.executed`, `member.balance`)

## Address / ABI Update Checklist

1. Deploy/upgrade contracts (external repo)
2. Copy minimal required ABI fragments into `src/abis/` (trim unused functions/events)
4. If events/schema changed: update subgraph & regenerate types
5. Adjust GraphQL queries in `src/graphql/`
6. Update / add hooks wrapping new calls; invalidate only relevant query keys
7. Add i18n keys where new UI labels appear
8. Run: `pnpm run lint` → `pnpm run build` → `pnpm run test`

## Performance & Consistency Notes

- Cache semi-static snapshot-derived data with modest `staleTime` (e.g. quorum components)
- After transactions: delay briefly then poll specific queries (bounded retries) rather than broad invalidation
- Avoid multiple public clients; reuse configured wagmi client
