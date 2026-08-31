#!/usr/bin/env bash
#
# Creates and funds (via friendbot) the Stellar CLI identities used by
# LumenRanks on testnet: an admin plus two demo accounts.
#
# Usage: ./scripts/setup-identity.sh

set -euo pipefail

NETWORK="testnet"
IDENTITIES=("lumenranks-admin" "lumenranks-alice" "lumenranks-bob")

if ! command -v stellar >/dev/null 2>&1; then
  echo "error: the 'stellar' CLI is not installed." >&2
  echo "       See https://developers.stellar.org/docs/tools/cli/install-cli" >&2
  exit 1
fi

for name in "${IDENTITIES[@]}"; do
  if stellar keys address "$name" >/dev/null 2>&1; then
    echo "Identity '$name' already exists — skipping generation."
  else
    echo "Generating and funding identity '$name' on $NETWORK..."
    stellar keys generate --global "$name" --network "$NETWORK" --fund
  fi
  echo "  $name => $(stellar keys address "$name")"
done

echo
echo "All identities are ready. Deploy with: ./scripts/build.sh && ./scripts/deploy.sh"
