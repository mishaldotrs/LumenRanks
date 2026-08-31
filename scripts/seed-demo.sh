#!/usr/bin/env bash
# Seeds the deployed LumenRanks contract with demo holders so the
# leaderboard has interesting data. Mints are signed by lumenranks-admin,
# so this only works while that identity is still the contract admin.
#
# Usage: bash scripts/seed-demo.sh [extra_address extra_amount_lumr]...
set -euo pipefail

cd "$(dirname "$0")/.."

CONTRACT_ID="$(sed -n 's/.*"testnet"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' client/lib/contract/contract-ids.json)"
if [ -z "$CONTRACT_ID" ]; then
  echo "No contract id found in client/lib/contract/contract-ids.json — run scripts/deploy.sh first." >&2
  exit 1
fi

ADMIN_ADDR="$(stellar keys address lumenranks-admin)"

mint() {
  local to="$1" amount_lumr="$2"
  # 7 decimals: 1 LUMR = 10_000_000 stroops
  local amount="${amount_lumr}0000000"
  echo "Minting ${amount_lumr} LUMR -> ${to}"
  stellar contract invoke --id "$CONTRACT_ID" --source lumenranks-admin --network testnet -- \
    mint --admin "$ADMIN_ADDR" --to "$to" --amount "$amount" >/dev/null
}

# Demo holders (varied balances so the leaderboard looks alive).
mint "$ADMIN_ADDR" 25000
mint "$(stellar keys address lumenranks-alice)" 8400
mint "$(stellar keys address lumenranks-bob)" 6250
mint "$(stellar keys address lumenranks-uniq-carol)" 4700
mint "$(stellar keys address lumenranks-uniq-dave)" 3100
mint "$(stellar keys address lumenranks-uniq-erin)" 1850
mint "$(stellar keys address lumenranks-uniq-frank)" 920
mint "$(stellar keys address lumenranks-uniq-grace)" 340

# Optional extra address/amount pairs from the command line.
while [ "$#" -ge 2 ]; do
  mint "$1" "$2"
  shift 2
done

echo
echo "Done. Current leaderboard:"
stellar contract invoke --id "$CONTRACT_ID" --source lumenranks-admin --network testnet -- \
  get_leaderboard --limit 0
