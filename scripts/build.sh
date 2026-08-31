#!/usr/bin/env bash
#
# Builds the LumenRanks contract to wasm and optimizes it if the
# `stellar contract optimize` subcommand is available.
#
# Usage: ./scripts/build.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

if ! command -v stellar >/dev/null 2>&1; then
  echo "error: the 'stellar' CLI is not installed." >&2
  echo "       See https://developers.stellar.org/docs/tools/cli/install-cli" >&2
  exit 1
fi

cd "$ROOT_DIR/contract"
stellar contract build

# Newer toolchains emit to wasm32v1-none; older ones to wasm32-unknown-unknown.
WASM=""
for candidate in \
  "target/wasm32v1-none/release/lumenranks.wasm" \
  "target/wasm32-unknown-unknown/release/lumenranks.wasm"; do
  if [[ -f "$candidate" ]]; then
    WASM="$candidate"
    break
  fi
done

if [[ -z "$WASM" ]]; then
  echo "error: built wasm not found in target/wasm32v1-none or target/wasm32-unknown-unknown." >&2
  exit 1
fi

if stellar contract optimize --wasm "$WASM" 2>/dev/null; then
  OPTIMIZED="${WASM%.wasm}.optimized.wasm"
  if [[ -f "$OPTIMIZED" ]]; then
    WASM="$OPTIMIZED"
  fi
else
  echo "warn: 'stellar contract optimize' unavailable or failed — using unoptimized wasm." >&2
fi

echo
echo "Wasm ready: $ROOT_DIR/contract/$WASM"
