#!/usr/bin/env bash
#
# Deploys the LumenRanks contract to testnet, initializes it, and wires the
# contract ID into the frontend (client/lib/contract/contract-ids.json and
# client/.env.local).
#
# Prerequisites: ./scripts/setup-identity.sh and ./scripts/build.sh
#
# Usage: ./scripts/deploy.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

NETWORK="testnet"
IDENTITY="lumenranks-admin"
TOKEN_NAME="LumenRanks Token"
TOKEN_SYMBOL="LUMR"
TOKEN_DECIMALS=7

if ! command -v stellar >/dev/null 2>&1; then
  echo "error: the 'stellar' CLI is not installed." >&2
  exit 1
fi

if ! stellar keys address "$IDENTITY" >/dev/null 2>&1; then
  echo "error: identity '$IDENTITY' not found. Run ./scripts/setup-identity.sh first." >&2
  exit 1
fi

cd "$ROOT_DIR/contract"

# Prefer the optimized wasm; fall back to the plain build output.
WASM=""
for candidate in \
  "target/wasm32v1-none/release/lumenranks.optimized.wasm" \
  "target/wasm32-unknown-unknown/release/lumenranks.optimized.wasm" \
  "target/wasm32v1-none/release/lumenranks.wasm" \
  "target/wasm32-unknown-unknown/release/lumenranks.wasm"; do
  if [[ -f "$candidate" ]]; then
    WASM="$candidate"
    break
  fi
done

if [[ -z "$WASM" ]]; then
  echo "error: no wasm found. Run ./scripts/build.sh first." >&2
  exit 1
fi

ADMIN_ADDRESS="$(stellar keys address "$IDENTITY")"
echo "Deploying $WASM to $NETWORK as $IDENTITY ($ADMIN_ADDRESS)..."

CONTRACT_ID="$(stellar contract deploy \
  --wasm "$WASM" \
  --source "$IDENTITY" \
  --network "$NETWORK")"

echo "Deployed. Initializing..."

stellar contract invoke \
  --id "$CONTRACT_ID" \
  --source "$IDENTITY" \
  --network "$NETWORK" \
  -- \
  initialize \
  --admin "$ADMIN_ADDRESS" \
  --name "$TOKEN_NAME" \
  --symbol "$TOKEN_SYMBOL" \
  --decimals "$TOKEN_DECIMALS"

# Wire the contract ID into the frontend.
mkdir -p "$ROOT_DIR/client/lib/contract"
cat > "$ROOT_DIR/client/lib/contract/contract-ids.json" <<EOF
{ "testnet": "$CONTRACT_ID" }
EOF
echo "Wrote client/lib/contract/contract-ids.json"

ENV_FILE="$ROOT_DIR/client/.env.local"
if [[ -f "$ENV_FILE" ]] && grep -q "^NEXT_PUBLIC_CONTRACT_ID=" "$ENV_FILE"; then
  sed -i.bak "s|^NEXT_PUBLIC_CONTRACT_ID=.*|NEXT_PUBLIC_CONTRACT_ID=$CONTRACT_ID|" "$ENV_FILE"
  rm -f "$ENV_FILE.bak"
else
  echo "NEXT_PUBLIC_CONTRACT_ID=$CONTRACT_ID" >> "$ENV_FILE"
fi
echo "Updated client/.env.local"

echo
echo "Contract ID: $CONTRACT_ID"
echo "Explorer:    https://stellar.expert/explorer/testnet/contract/$CONTRACT_ID"
