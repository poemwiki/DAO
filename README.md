# Govo

Govo is a modern, decentralized governance platform that enables DAOs to manage their proposals and voting processes efficiently. Built with React and integrated with The Graph protocol, it provides a seamless interface for interacting with on-chain governance.

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

## TODO

### DAO Member 个人页面

实现一个地址维度的详情页（示例路由：`/member/:address`），展示：

- 当前积分（token / reputation）余额、委托余额（delegateBalance）
- 余额随时间变化的折线图（基于 Transfer 事件重建）
- 每次余额变动明细：时间、方向（收到/转出）、数量、关联 proposal（若该 tx 与某个提案的 propose / execute / cancel 交易 hash 匹配）
- 该成员累计投过多少次票、累计投出的权重、涉及多少不同提案
- 每次投票详情：提案标题/ID、支持类型 (against / for / abstain)、权重、时间

数据来源（Subgraph 当前结构已可满足查询需求）：

1. Member: `member(id: address)` 获取 `balance`, `delegateBalance`。
2. Transfers: `transfers(where: { from: address } OR { to: address }, orderBy: createdAt, orderDirection: asc)` —— 前端合并 from/to 两个查询结果后按时间排序；通过对事件顺序累加/扣减构建时间序列点：

- 初始点：第一条事件时间前的余额可用首事件处理后的值回推，或直接从最新 `Member.balance` 逆序重建（若事件量不大，直接正向从 0 累加更简单）。

3. Votes: `voteCasts(where: { voter: address }, orderBy: createdAt, orderDirection: desc)`
4. （可选）Proposal 元数据：在 voteCasts 中嵌套 `proposal { id proposalId description canceled executed }`。

前端实现步骤：

1. Hooks：

- `useMember(address)` -> 查询 Member
- `useMemberTransfers(address)` -> 分别查询 from / to，合并+排序，分页支持（`skip/first`）
- `useMemberVotes(address)` -> 查询所有投票（或分页）

2. 聚合派生：

- `totalVotesCount = votes.length`
- `totalVotingWeight = sum(v.weight)`
- `distinctProposals = new Set(v.proposal.id)`
- 余额时间序列：reduce transfers -> cumulativeBalance；抽样或日聚合（事件多时）

3. 图表：使用现有组件库（若无，引入轻量库如 `recharts` 或纯 SVG）
4. 关联 proposal 的余额变动：对某条 transfer 的 `tx` 与 `proposal.proposeTx / executeTx / cancelTx` 做映射（需额外 GraphQL 查询 `proposals(where:{ OR: [ { proposeTx: tx }, { executeTx: tx }, { cancelTx: tx } ] })`；或在前端先建一张哈希 -> proposal 映射缓存）。
5. UI 模块：

- Header: 地址(截断) / ENS / 当前余额 / 委托余额
- Stats Cards: 累计投票次数 / 累计权重 / 不同提案数
- Balance Chart: 时间区间筛选（日 / 全部）
- Transfer Table: 列（时间、方向、数量、对方地址、关联提案）
- Votes Table: 列（时间、提案、支持类型、权重、状态）

6. React Query 缓存 key 约定：

- `['member', address]`
- `['member','transfers',{ address, page }]`
- `['member','votes', address]`

7. i18n：所有新文案添加 `member.` 命名空间前缀，例如 `member.balance`, `member.votes.total`, `member.transfers.title`。

性能与扩展：

- 如事件量增长，可在 subgraph 增加 `MemberVoteAggregate` 或 `DailyMemberBalance` 快照实体以减少前端聚合开销。
- 先采用纯前端聚合，待出现性能瓶颈再扩展 schema。

后续可选优化：

- 支持按 support 类型统计饼图
- 投票活跃度热力图（基于 VoteCast.createdAt 映射至周/日格子）
