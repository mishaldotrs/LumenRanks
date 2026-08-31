# LumenRanks

**Track and display token holders in real-time — only on Stellar.** A live, trustless token-holder leaderboard built on Stellar/Soroban with an **on-chain holder registry**, **on-chain rankings**, and a **zero-indexer architecture**. Every mint, transfer, and burn re-ranks the leaderboard instantly — computed by the contract itself, not by a database someone could fake.

|  |  |
| --- | --- |
| 📜 **Stellar smart contract (Testnet)** | `CCUDMJARNXQJNBDRC4GVKKDV3SGKPEVMHWZ7VMFSBUI7V6JBVN3AYJOO` |
| 🔎 **Explorer** | [stellar.expert/explorer/testnet/contract/CCUDMJ…](https://stellar.expert/explorer/testnet/contract/CCUDMJARNXQJNBDRC4GVKKDV3SGKPEVMHWZ7VMFSBUI7V6JBVN3AYJOO) |
| 🪙 **Token** | LumenRanks Token (`LUMR`), 7 decimals |
| 👨‍💻 **Developed by** | [@mishaldotrs](https://github.com/mishaldotrs) |

## Overview

Most token leaderboards depend on off-chain indexers: a service watches events, mirrors balances into a database, and the UI trusts whatever that database says. If the indexer lags, drops events, or is compromised, the leaderboard lies.

LumenRanks replaces "trust the indexer" with "trust the contract." The holder registry lives **inside the Soroban contract itself** — every mint, transfer, and burn atomically updates a persistent set of holders alongside the balances:

```
            mint (admin only)
                  │
                  ▼
        ┌──────────────────┐     transfer      ┌──────────────────┐
        │  Holder A        │ ───────────────▶  │  Holder B        │
        │  balance ↑       │                   │  balance ↑       │
        └──────────────────┘                   └──────────────────┘
                  │                                     │
                  └────────────── burn ─────────────────┘
                                   │
                                   ▼
              on-chain holder set updated on every 0 ↔ positive
              transition → get_leaderboard() always current
```

Rankings (`get_leaderboard`, `get_rank`) are computed on-chain from that set, so any client can query the current standings directly from a Soroban RPC node — zero trust assumptions, zero indexing infrastructure, zero backend.

### The two roles

| Role | What they do | What the contract enforces |
| --- | --- | --- |
| **Admin** | Mints new LUMR to any address (set once at `initialize`) | Only the stored admin address can mint — everyone else gets `NotAdmin` |
| **Holder** | Transfers LUMR to others, burns their own, climbs the leaderboard | You can only move what you hold; self-transfers and zero/negative amounts are rejected |

## Features

- **On-chain holder registry** — the contract tracks every address with a positive balance; no indexer, no database, no sync lag.
- **Live leaderboard** — top-3 podium 🥇🥈🥉, ranked holders table with balances and share-of-supply percentages, sorted on-chain and auto-refreshed every 5 seconds.
- **Wallet dashboard** — your balance, rank, and supply share, plus transfer and burn forms; the mint form appears only when the connected wallet *is* the admin.
- **Multi-wallet support** — connect with any wallet supported by StellarWalletsKit (Freighter, xBull, Albedo, Hana, Lobstr, and more) through a single modal.
- **Real-time activity** — a live event feed polls the chain directly for `mint` / `transfer` / `burn` events (no backend required) and a per-session transaction tracker shows pending → success/failed status with explorer links.
- **Friendly error handling** — wallet errors and all 6 contract error codes are translated into plain-language messages, never raw RPC dumps.

## Architecture

LumenRanks draws a hard line between what must be trustless and what's just convenience:

| Concern | Where it lives | Why |
| --- | --- | --- |
| Balances, total supply, holder set, rankings | **On-chain** (Soroban contract, persistent storage) | A leaderboard you could fake is worthless |
| Token metadata, admin, supply counter | **On-chain** (instance storage) | Small, fixed-size, loaded with every call |
| Leaderboard/dashboard UI, wallet session, tx tracker, event buffer | **Frontend** (Next.js + Zustand + TanStack Query) | Presentation and session state don't belong on chain |

The frontend talks to the chain two ways: **reads** are free simulations against Soroban RPC (no wallet needed — the leaderboard works before you even connect), and **writes** build a transaction, simulate it, get it signed by the connected wallet, submit it, and poll until it lands.

## Try the full flow (2 wallets)

- Run the app locally with two funded testnet wallets (Friendbot funds them free — `scripts/setup-identity.sh` does it for you).
- **Wallet A (admin):** import the `lumenranks-admin` secret (`stellar keys show lumenranks-admin`) into Freighter, connect, open **Dashboard** — the mint form is visible because you're the admin. Mint yourself and a friend some LUMR.
- Watch the **Leaderboard** populate: podium, ranks, share-of-supply bars — your row is highlighted.
- **Wallet B (holder):** connect in a second browser profile, transfer some LUMR back to Wallet A — watch the ranks reorder live in both tabs, no refresh needed.
- Burn a chunk from either wallet and watch total supply, share percentages, and ranks all shift.
- Open **Activity** the whole time — every mint/transfer/burn appears in the live feed with an explorer link.

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 15.5 (App Router) + TypeScript |
| Styling | Tailwind CSS + shadcn/ui (Radix primitives) |
| Wallets | `@creit.tech/stellar-wallets-kit` |
| Chain | `soroban-sdk` 22 (Rust) + `@stellar/stellar-sdk` 14 (JS) |
| Server state | TanStack Query (polling reads, mutation lifecycle) |
| Client state | Zustand (wallet session, tx tracker, live event buffer) |
| JS runtime & package manager | **Bun** |

## Project structure

```
LumenRanks/
├── client/                    # Next.js frontend (Bun)
│   ├── app/                   # App Router pages
│   │   ├── page.tsx           # Landing page
│   │   ├── app/page.tsx       # Leaderboard (podium + holders table)
│   │   ├── dashboard/page.tsx # Wallet dashboard (transfer / mint / burn)
│   │   └── activity/page.tsx  # Event feed + transaction history
│   ├── components/            # ui/, leaderboard/, wallet/, dashboard/, activity/, layout/
│   ├── hooks/                 # useWallet, useLumenRanks, useEvents, useToast
│   ├── lib/
│   │   ├── wallet/            # StellarWalletsKit singleton + connect/sign helpers
│   │   ├── stellar/           # network config, RPC client
│   │   ├── contract/          # typed LumenRanks contract client + contract-ids.json
│   │   └── store/             # Zustand stores (wallet, tx tracker, events)
│   └── types/                 # contract.ts, wallet.ts, events.ts
├── contract/                  # Soroban contract (Rust workspace)
│   └── lumenranks/src/        # lib.rs (contract) + test.rs (13 tests)
├── scripts/                   # build.sh, setup-identity.sh, deploy.sh
└── .github/workflows/ci.yml   # CI: frontend + contract jobs
```

## Setup

### 1. Prerequisites

- [Bun](https://bun.sh/)
- [Rust](https://rustup.rs/) toolchain
- [Stellar CLI](https://developers.stellar.org/docs/tools/cli/install-cli) (`stellar` command) — used for identities, build, and deploy

### 2. Install dependencies

```sh
cd client
bun install
```

### 3. Environment variables

```sh
cp .env.example .env.local    # inside client/
```

At minimum you'll set `NEXT_PUBLIC_CONTRACT_ID` after deploying (the deploy script does this for you automatically).

### 4. Wallet setup

Install a Stellar wallet browser extension — Freighter is the easiest for testnet — and switch it to **Testnet**. LumenRanks' "Connect wallet" button opens StellarWalletsKit's modal, which detects installed wallets automatically.

### 5. Contract deployment (Stellar Testnet)

From the repo root:

```sh
# one-time: create/fund local CLI identities (admin + demo accounts)
bash scripts/setup-identity.sh

# compile + optimize the contract to wasm
bash scripts/build.sh

# deploy, initialize, and write the contract ID into the frontend config
bash scripts/deploy.sh
```

`scripts/deploy.sh` prints the deployed contract ID and a stellar.expert explorer link.

### 6. Local development

```sh
cd client && bun run dev
```

Visit `http://localhost:3000`. Connect a funded testnet wallet, mint some LUMR from the admin wallet, and watch the **Leaderboard** and **Activity** pages update automatically.

## Smart contract design

`contract/lumenranks/src/lib.rs` implements:

| Function | Description |
| --- | --- |
| `initialize(admin, name, symbol, decimals)` | One-time setup of admin and token metadata. |
| `mint(admin, to, amount)` | Admin-only: credits `to` and increases total supply. Emits `("mint", to)`. |
| `transfer(from, to, amount)` | Moves tokens between accounts (auth: `from`). Emits `("transfer", from, to)`. |
| `burn(from, amount)` | Destroys tokens and reduces total supply (auth: `from`). Emits `("burn", from)`. |
| `balance(id) -> i128` | Balance of `id`; `0` if none. |
| `total_supply() -> i128` | Current total supply. |
| `holder_count() -> u32` | Number of addresses with a positive balance. |
| `get_meta() -> TokenMeta` | Token name, symbol, and decimals. |
| `get_admin() -> Address` | The admin address. |
| `get_leaderboard(limit) -> Vec<HolderEntry>` | All holders sorted by balance descending, truncated to `limit` (`0` = all). |
| `get_rank(id) -> u32` | 1-based rank of `id`; `0` if it holds nothing. |

Errors are a typed `LumenRanksError` enum so the frontend can show specific, friendly messages instead of generic panics:

| Code | Error | Meaning |
| --- | --- | --- |
| 1 | `AlreadyInitialized` | `initialize` was already called. |
| 2 | `NotInitialized` | Contract used before `initialize`. |
| 3 | `NotAdmin` | Caller is not the stored admin. |
| 4 | `InvalidAmount` | Amount was `<= 0`. |
| 5 | `InsufficientBalance` | Not enough balance for transfer/burn. |
| 6 | `SelfTransfer` | `from` and `to` are the same address. |

Run the contract's test suite with:

```sh
cd contract && cargo test
```

## Error handling (frontend)

`client/types/wallet.ts` maps raw wallet/RPC errors into a typed error with one of: `WALLET_NOT_FOUND`, `USER_REJECTED`, `INSUFFICIENT_BALANCE`, `SIMULATION_FAILED`, `NETWORK_MISMATCH`, `CONTRACT_NOT_CONFIGURED`, `UNKNOWN`. Contract error codes (`Error(Contract, #N)`) are translated to actionable messages ("You don't have enough LUMR for that."), and every wallet and contract call routes through this mapping before surfacing a toast.

## Real-time updates

- **Event feed** (`client/hooks/use-events.ts`) polls `server.getEvents` against the deployed contract, decodes topics/values with `scValToNative`, and merges new events into a Zustand store — so the feed grows without ever refetching what it already has.
- **Leaderboard / stats** (`client/hooks/use-lumenranks.ts`) poll contract state via TanStack Query (`refetchInterval: 5000`), so rank changes propagate to every open tab without a manual refresh.
- **Transaction tracker** (`client/lib/store/tx-store.ts`) moves each submitted transaction through `pending → success | failed`, storing the hash the moment it's known and linking to `stellar.expert`.

## CI/CD

Every push and pull request to `main` runs the GitHub Actions pipeline defined in `.github/workflows/ci.yml`:

| Job | Steps |
| --- | --- |
| **Frontend** | `bun install --frozen-lockfile` → `bun run lint` (ESLint) → `bun run typecheck` (tsc) → `bun run build` (Next.js production build) |
| **Contract** | Rust stable toolchain + cargo cache → `cargo test` (all 13 Soroban contract tests) |

Nothing lands on `main` broken — a lint error, type error, failed build, or failing contract test turns the pipeline red.

## License

[MIT](LICENSE) © 2026 mishaldotrs — built as a demonstration project for Soroban smart-contract + Next.js integration.
