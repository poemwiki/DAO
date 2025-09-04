# Copilot Project Instructions

Purpose: Enable AI agents to work productively across the mono-repo (frontend dApp, subgraph, smart contracts, legacy server). Keep responses concise and follow these conventions.

## Common Development Commands

- `pnpm run dev` - Start development server (Vite)
- `pnpm run build` - Build for production (TypeScript compilation + Vite build)
- `pnpm run preview` - Preview production build
- `pnpm run lint` - Run ESLint with auto-fix
- `pnpm run format` - Format code with Prettier
- `pnpm run test` - Run tests with Vitest (single run)
- `pnpm run test:watch` - Run tests in watch mode

Never run `pnpm run dev` or `pnpm run preview` because the dev is already running in a separate terminal.

**Note**: Use `pnpm` (not `npm`) as specified in package.json engines.

## Project Architecture

### Monorepo Context

This is the frontend React dApp (`govzero/`) that's part of a larger ecosystem:

- **`../subgraph-Governor-PWR/`** - The Graph subgraph for blockchain data indexing
- **`../dao-poemwiki-contracts/`** - Hardhat smart contracts (Governor + Reputation token)
- **`statics/js/` and `views/index.ejs`** - Legacy code (reference only, don't modify unless explicitly requested)

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

## Linus-Inspired Pragmatic Principles

- Simplicity first: prefer a straightforward function + plain objects over abstractions/classes until duplication is proven (rule of 3).
  - Refactor components if it exceeds 300 lines or has multiple long conditional branches.
  - Avoid unnecessary new entities (functions / types / components). Reuse existing ones after a quick search before adding anything new; duplication reduction only when a clear second/third use appears. (如无必要, 勿增实体)
- YAGNI: do not add config flags, params, or generic layers until a concrete second use-case exists.
- Avoid duplication consciously: extract shared hook/utility only after 3 similar call sites (before that, duplication is cheaper than premature abstraction).
- Small, cohesive edits: each change set should do one logical thing (easier to review, revert, or bisect).
- Readability > cleverness: favor explicit variable names, early returns, flat control flow.
- Justify necessary complexity: add a brief top-of-file comment starting with `WHY:` when introducing non-obvious logic or performance trade-offs.
- Kill dead and repeated code quickly.
- Revert fast if regression risk appears; a clean revert beats layering hotfixes.
- Stable boundaries: UI (components) stays declarative; side-effects & async live in hooks; config in `config/` or `constants/`; data shape transformations near their source.
- No silent failures: surface errors at hook boundary (return `{ error }`) and let UI decide presentation; don't console.log-and-swallow.
- Prefer narrow TypeScript types early—avoid `any`; leverage inference and discriminated unions for status objects.
- Keep react-query cache coherent; never manually mutate internal cache shapes—always rely on `invalidateQueries` on mutation success.
- Optimize last: measure before refactoring for performance; rely on browser profiler & React DevTools, not guesswork.
- Prefer explicit, precise types everywhere; do not use `any` where a concrete shape (interface, union, literal) can be stated. Treat stray `any` as technical debt to eliminate promptly. (可以写明确类型的地方, 不可以使用 any)

## React Query Key Pattern

- Use tuple keys: `['proposals', { chainId, status }]`, `['proposal', { chainId, id }]`, `['member', address]`.
- Always keep stable ordering & object key shape to avoid accidental cache misses.
- Derive keys in a single `keys` helper module if growth increases (only when duplication emerges).

## Address / ABI / Contract Update Checklist

1. Modify / deploy contracts (`dao-poemwiki-contracts/`).
2. Commit new `deployments/` artifacts (ensure network name consistency).
3. Export ABI (or rely on TypeChain) → copy to `govzero/src/abis/` (only the minimal interface needed if large).
4. Update `public/addressBook.json` with new addresses (keep old under a versioned key if still referenced).
5. If events changed: update subgraph `schema.graphql` + `subgraph.yaml` dataSources → run `pnpm run codegen && pnpm run build` in subgraph project.
6. Adjust frontend GraphQL queries in `src/graphql/` to reflect schema changes; regenerate types if using codegen (future enhancement).
7. Update / add hooks wrapping new contract calls (invalidate proper query keys on success).
8. Add/extend tests (contract unit tests + frontend hook test happy/failure path).
9. Run: contracts tests, subgraph build, frontend `pnpm run build` & `pnpm run test` before merging.

## Error & Loading Handling Conventions

- Hooks return `{ data, isLoading, error }` (react-query standard) – components branch on those; avoid embedding UI decisions inside the hook.
- For multi-step transactions: expose a status enum (`'idle' | 'signing' | 'pending' | 'success' | 'error'`).
- Propagate user-cancellable actions (sign rejection) distinctly (`UserRejectedRequestError`) so UI can show a neutral message (not an error banner).

## i18n & Text

- Add new keys to the appropriate namespace file; do not inline raw strings (search first before adding).
- Use descriptive keys: `proposal.status.executed`, `wallet.connect.button`.

## When Unsure

- If a change spans layers (contract + subgraph + frontend) and requirements are ambiguous: pause and request clarification instead of guessing schema/event names.

Keep changes minimal, purposeful, and reversible.

## Frontend Governance Addenda (Working Knowledge)

These refinements capture patterns established during recent governance UI and logic work. Follow them to stay consistent and avoid regressions.

### Local ABI Source of Truth
- Never import ABIs from artifacts or external packages inside the frontend.
- Use only the curated minimal ABIs in `src/abis/`; trim unused functions to reduce bundle size.
- When contracts change: copy only required fragments (events + functions actually read / written by hooks).

### Hooks Conventions (Governance)
- Read-only chain data: `useXyz` with react-query `queryKey` tuple: `['xyz', dependencyA, dependencyB]`.
- Mutations (transactions): dedicated hook returning `{ actionFn, status, error, result }` where `status` ∈ `idle|building|signing|pending|success|error`.
- On mutation success: `invalidateQueries` for the narrow keys impacted (e.g. `['proposal', id]`). Avoid broad cache clears.
- Quorum & snapshot helpers: `useGovernorQuorum(blockNumber)`, `useQuorumNumerator()`, `usePastTotalSupply(blockNumber)` kept lightweight and cached (`staleTime ~60s`).
- Never swallow errors; log *once* (warn) in hook layer and surface via returned `error`.

### Quorum & Snapshot Mechanics
- Snapshot block = proposal start block (`Governor.proposalSnapshot`).
- Quorum value = `quorum(snapshotBlock)` which internally: `(getPastTotalSupply(snapshotBlock) * quorumNumerator()) / quorumDenominator()`.
- Display quorum as an absolute vote count (no percent). Percentage is implied by comparing `(for + abstain)` to quorum.
- Undelegated tokens increase quorum (they are in total supply) but cannot vote directly; this is intentional and documented.
- Debug panel exposes: snapshotBlock, pastTotalSupply(snapshot), quorum(raw), quorumNumerator() for transparency.

### Voting UI Guidelines
- Buttons for `For / Against / Abstain` (support 1/0/2) with distinct colors (green/red/yellow) + disabled states covering: not active, already voted, signing, pending.
- After a successful vote: trigger targeted re-fetch and short polling (e.g. 5 attempts every 3s) to mitigate subgraph lag.
- Execute button only when state ∈ Succeeded | Queued and not yet executed.
- Progress bar segments ordered: For / Abstain / Against (stable ordering) with quorum marker line.

### Subgraph Lag Mitigation
- After sending a vote tx, delay 2.5s then poll specific proposal query up to a small capped number of retries.
- Avoid optimistic manual tally adjustments—prefer waiting for indexer to reflect chain truth.

### i18n Conventions
- No raw user-facing strings; search existing keys before adding.
- Namespace grouping: `proposal.vote.*`, `proposal.results`, `proposal.timeline`, `proposal.actions`, `proposal.events.created` etc.
- Keep Chinese & English keys in sync; add Chinese first if sourced from legacy code, then mirror in English.
- Use concise declarative keys (avoid tense or punctuation in keys themselves).

### Debug Mode
- `?debug=1` query param enables lightweight diagnostics (raw blocks, snapshot values, quorum internals, config URL).
- Keep debug output text-only & monospace; never rely on it for core UX.
- Safe to leave in production (no sensitive data, only on-chain reads & environment URL echo).

### Formatting & Quality Gates (Pre-Commit)
- Run in order: `pnpm run lint` → `pnpm run build` → `pnpm run test`.
- Ensure no unused i18n keys newly added (prefer incremental adoption rather than speculative keys).
- Keep added hooks under 60 lines unless justified (add a `WHY:` comment if longer due to complexity).

### Timeline Events
- Event labels sourced from i18n (`proposal.events.*`).
- Insert vote events chronologically with consistent icon styling; do not recompute ordering logic elsewhere.

### Action Summaries
- Use `ActionSummary` + parsed actions; batch mint displays a table, governor setting shows raw value chip.
- Avoid duplicating encode/decode logic outside `parseProposalActions`—extend that utility when new action types appear.

### Performance Notes
- Avoid running multiple public clients; reuse a shared `publicClient` per hook file (lazy construction + try/catch fallback).
- Set conservative `staleTime` (e.g. 60s) for static-at-snapshot reads (quorum, numerator) to reduce RPC pressure.

### When Adding New Governance Parameters
- Extend ABI only if required function/event absent.
- Add i18n keys, update README Voting section if semantics impact quorum or threshold logic.
- Provide a debug field if value influences calculations (snapshot-dependent or dynamic over time).

---
These addenda summarize current working best practices; revisit and trim if patterns change or abstractions emerge.
