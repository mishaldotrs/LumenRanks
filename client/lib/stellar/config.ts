export const RPC_URL = "https://soroban-testnet.stellar.org";
export const NETWORK_PASSPHRASE = "Test SDF Network ; September 2015";

export const TOKEN_SYMBOL = "LUMR";
export const TOKEN_DECIMALS = 7;

const EXPLORER_BASE = "https://stellar.expert/explorer/testnet";

export function txExplorerUrl(hash: string): string {
  return `${EXPLORER_BASE}/tx/${hash}`;
}

export function accountExplorerUrl(address: string): string {
  return `${EXPLORER_BASE}/account/${address}`;
}

export function contractExplorerUrl(contractId: string): string {
  return `${EXPLORER_BASE}/contract/${contractId}`;
}
