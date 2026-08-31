# LumenRanks 🏆

**Track and display token holders in real-time — only on Stellar.**

![CI/CD Pipeline](https://github.com/mishaldotrs/LumenRanks/actions/workflows/ci.yml/badge.svg)
![Stellar](https://img.shields.io/badge/Stellar-Soroban%20Smart%20Contracts-7d00ff?logo=stellar&logoColor=white)
![Rust](https://img.shields.io/badge/Rust-soroban--sdk%2022-deb887?logo=rust&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-15%20(App%20Router)-000000?logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-18-149eca?logo=react&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-v3-38bdf8?logo=tailwindcss&logoColor=white)
![Bun](https://img.shields.io/badge/Bun-runtime-fbf0df?logo=bun&logoColor=black)
![stellar-sdk](https://img.shields.io/badge/%40stellar%2Fstellar--sdk-14-f7df1e)
![StellarWalletsKit](https://img.shields.io/badge/StellarWalletsKit-Freighter%20%C2%B7%20xBull%20%C2%B7%20Albedo%20%2B%20more-6d28d9)
![TanStack Query](https://img.shields.io/badge/TanStack%20Query-v5-ef4444?logo=reactquery&logoColor=white)
![Zustand](https://img.shields.io/badge/Zustand-state-433e38)
![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-000000?logo=vercel&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-a3e635)

A live, trustless token-holder leaderboard built on Stellar/Soroban with an **on-chain holder registry**, **on-chain rankings**, and a **zero-indexer architecture**. Every mint, transfer, and burn re-ranks the leaderboard instantly — computed by the contract itself, not by a database someone could fake.

|  |  |
| --- | --- |
| 🔗 **Live link** | [lumen-ranks.vercel.app](https://lumen-ranks.vercel.app/) |
| 📜 **Stellar smart contract (Testnet)** | `CDYRLKMADEHBFUYNHOUHXHSRWJHBRPDHZR6W3QSUE5LBYL5THTULKPZS` |
| 🔎 **Explorer** | [stellar.expert/explorer/testnet/contract/CDYRLK…](https://stellar.expert/explorer/testnet/contract/CDYRLKMADEHBFUYNHOUHXHSRWJHBRPDHZR6W3QSUE5LBYL5THTULKPZS) |
| 🪙 **Token** | LumenRanks Token (`LUMR`), 7 decimals |
| 👨‍💻 **Developed by** | [@mishaldotrs](https://github.com/mishaldotrs) · [X](https://x.com/mishaldotrs) |

## Overview

Most token leaderboards depend on off-chain indexers: a service watches events, mirrors balances into a database, and the UI trusts whatever that database says. If the indexer lags, drops events, or is compromised, the leaderboard lies. On most chains you *have* to accept that trade-off, because contracts can't enumerate their own holders.

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

Rankings (`get_leaderboard`, `get_rank`) are computed on-chain from that set, so any client can query the current standings directly from a Soroban RPC node — zero trust assumptions, zero indexing infrastructure, zero backend. Kill the frontend and the leaderboard still exists; anyone can rebuild the exact same UI from the contract alone.

### The two roles

| Role | What they do | What the contract enforces |
| --- | --- | --- |
| **Admin** | Mints new LUMR to any address (set at `initialize`, transferable via `set_admin`) | Only the stored admin address can mint or hand over the role — everyone else gets `NotAdmin` |
| **Holder** | Transfers LUMR to others, burns their own, climbs the leaderboard | You can only move what you hold; self-transfers and zero/negative amounts are rejected |

## A tour of the app

### 🏠 Landing (`/`)

A dark, gold-accented landing page that pitches the idea: hero section, six feature cards explaining the trustless architecture, and a **View Leaderboard** CTA. The leaderboard is readable without connecting a wallet — reads are free RPC simulations, so there's no wall between a visitor and the data.

### 🏆 Leaderboard (`/app`)

The heart of the app, refreshed automatically every 5 seconds:

- **Stats cards** — total supply, holder count, top holder, and (when connected) *your* rank.
- **Podium** — the top three holders on a gold/silver/bronze podium with medal icons.
- **Holders table** — every holder ranked: rank number, truncated address with copy button and stellar.expert account link, formatted LUMR balance, and **share-of-supply** rendered as a percentage with a progress bar. The connected wallet's row is highlighted so you can spot yourself instantly.
- Skeleton loaders while fetching, and a friendly empty state ("No holders yet — mint the first LUMR") on a fresh deployment.

### 📊 Dashboard (`/dashboard`)

Your personal control room (prompts you to connect if you haven't):

- **My stats** — your balance, your 1-based rank, and your share of total supply.
- **Transfer** — send LUMR to any `G…` address (validated with StrKey before it ever reaches the chain).
- **Burn** — destroy your own tokens and watch total supply shrink.
- **Mint** — this form only renders when the connected wallet *is* the contract admin (the UI checks `get_admin()` live). Everyone else never sees it — and even if they called the contract directly, `NotAdmin` stops them on-chain.

Every action shows a pending state, then resolves to a success or error toast with a plain-language message.

### ⚡ Activity (`/activity`)

Two tabs of real-time truth:

- **Live events** — the app polls Soroban RPC's `getEvents` for the contract's `mint` / `transfer` / `burn` events every 5 seconds, decodes them with `scValToNative`, and streams them into a feed with type badges, addresses, amounts, relative timestamps ("2 minutes ago"), and transaction links. No backend, no websocket server — the chain *is* the feed.
- **My transactions** — a per-session tracker: every transaction you submit moves through `pending → success | failed` with a spinner, its hash captured the moment it's known, and a stellar.expert link for each.

## Features

- **On-chain holder registry** — the contract tracks every address with a positive balance; no indexer, no database, no sync lag.
- **Live leaderboard** — top-3 podium 🥇🥈🥉, ranked holders table with balances and share-of-supply percentages, sorted on-chain and auto-refreshed every 5 seconds.
- **Wallet dashboard** — your balance, rank, and supply share, plus transfer and burn forms; the mint form appears only when the connected wallet *is* the admin.
- **Admin handover** — the admin role itself is transferable on-chain via `set_admin`, with the same auth guarantees as minting.
- **Multi-wallet support** — connect with any wallet supported by StellarWalletsKit (Freighter, xBull, Albedo, Hana, Lobstr, and more) through a single modal; the session persists across refreshes.
- **Real-time activity** — a live event feed polls the chain directly for `mint` / `transfer` / `burn` events (no backend required) and a per-session transaction tracker shows pending → success/failed status with explorer links.
- **Friendly error handling** — wallet errors and all 6 contract error codes are translated into plain-language messages, never raw RPC dumps.
- **Demo seeding** — one script mints a realistic spread of balances across demo accounts so the leaderboard never looks empty.

## Architecture

LumenRanks draws a hard line between what must be trustless and what's just convenience:

| Concern | Where it lives | Why |
| --- | --- | --- |
| Balances, total supply, holder set, rankings | **On-chain** (Soroban contract, persistent storage) | A leaderboard you could fake is worthless |
| Token metadata, admin, supply counter | **On-chain** (instance storage) | Small, fixed-size, loaded with every call |
| Leaderboard/dashboard UI, wallet session, tx tracker, event buffer | **Frontend** (Next.js + Zustand + TanStack Query) | Presentation and session state don't belong on chain |

### Storage design

| Data | Storage class | Rationale |
| --- | --- | --- |
| `Admin`, `Meta`, `TotalSupply` | Instance | Tiny and read on almost every call — rides along with the contract instance, TTL extended on every write |
| `Holders` (`Vec<Address>`) | Persistent | Grows with adoption; addresses are appended on a 0 → positive transition and removed when a balance hits 0 |
| `Balance(Address)` | Persistent | One entry per holder, keyed by address |

### How the frontend talks to the chain

**Reads are free.** Every query (`get_leaderboard`, `balance`, `get_rank`, …) is a *simulated* transaction against Soroban RPC using a dummy source account — no wallet, no signature, no fee. This is why the leaderboard works for visitors who never connect.

**Writes are the full lifecycle.** A mutation (transfer/mint/burn) goes through:

```
build tx → simulate (catches contract errors before you sign)
        → sign XDR via StellarWalletsKit (whichever wallet you chose)
        → submit to the network
        → poll getTransaction until it lands
        → record pending → success | failed in the session tracker
        → TanStack Query refetches → leaderboard re-ranks
```

Because simulation runs *before* signing, a doomed transaction (say, `InsufficientBalance`) is caught and translated into a friendly toast without costing a signature or a fee.

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
| Hosting | Vercel (frontend) · Stellar Testnet (contract) |

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
│   └── lumenranks/src/        # lib.rs (contract) + test.rs (14 tests)
├── scripts/                   # build.sh, setup-identity.sh, deploy.sh, seed-demo.sh
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

### 6. Seed demo data (optional)

```sh
# mints a realistic spread of balances across demo accounts,
# plus any extra address/amount pairs you pass in
bash scripts/seed-demo.sh GYOUR...ADDRESS 100000
```

### 7. Local development

```sh
cd client && bun run dev
```

Visit `http://localhost:3000`. Connect a funded testnet wallet, mint some LUMR from the admin wallet, and watch the **Leaderboard** and **Activity** pages update automatically.

### 8. Deploying to Vercel

- Push the repo to GitHub and import it into Vercel.
- Set the project's **Root Directory** to `client`.
- Add `NEXT_PUBLIC_CONTRACT_ID` in the Vercel project's environment variables.
- Deploy. The contract lives on Stellar Testnet independently of the frontend host — redeploying the frontend never requires redeploying the contract.

## Smart contract design

`contract/lumenranks/src/lib.rs` implements:

| Function | Description |
| --- | --- |
| `initialize(admin, name, symbol, decimals)` | One-time setup of admin and token metadata. |
| `set_admin(admin, new_admin)` | Admin-only: hands the admin role over to `new_admin`. Emits `("set_admin", admin)`. |
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

All **14 tests** cover initialization, double-init rejection, admin gating, admin handover, transfers, insufficient-balance and self-transfer rejection, burns, leaderboard ordering and truncation, rank queries, and holder-set maintenance when balances hit zero.

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
| **Contract** | Rust stable toolchain + cargo cache → `cargo test` (all 14 Soroban contract tests) |

Nothing lands on `main` broken — a lint error, type error, failed build, or failing contract test turns the pipeline red.

**Continuous deployment** is handled by Vercel's Git integration: every push to `main` that passes CI is automatically built and deployed. The smart contract deploys separately (and far less often) via `scripts/deploy.sh` — frontend deploys never touch the chain.

## Requirements checklist (Level 2)

| Requirement | Status | Where |
| --- | --- | --- |
| 3+ error types handled | ✅ 13 typed errors | 6 contract errors (`LumenRanksError` in `contract/lumenranks/src/lib.rs`) + 7 frontend error codes (`client/types/wallet.ts`), every one translated to a friendly toast message |
| Contract deployed on testnet | ✅ | [`CDYRLKMADEHBFUYNHOUHXHSRWJHBRPDHZR6W3QSUE5LBYL5THTULKPZS`](https://stellar.expert/explorer/testnet/contract/CDYRLKMADEHBFUYNHOUHXHSRWJHBRPDHZR6W3QSUE5LBYL5THTULKPZS) |
| Contract called from the frontend | ✅ | `client/lib/contract/client.ts` — simulated reads + build→simulate→sign→send→poll writes, used by every page |
| Transaction status visible | ✅ | `client/lib/store/tx-store.ts` — `pending → success \| failed` tracker rendered in **Activity → My transactions** with stellar.expert links |
| 10+ meaningful commits | ✅ | Conventional commits (`feat`, `test`, `ci`, `docs`, `chore`) building the project up layer by layer |
| Multi-wallet app | ✅ | StellarWalletsKit with `allowAllModules()` — Freighter, xBull, Albedo, Hana, Lobstr, … |
| Real-time event integration | ✅ | `client/hooks/use-events.ts` polls `getEvents` every 5s; leaderboard state re-polls every 5s |

## License

[MIT](LICENSE) © 2026 mishaldotrs — built as a demonstration project for Soroban smart-contract + Next.js integration.
