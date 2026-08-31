import { rpc } from "@stellar/stellar-sdk";

import { RPC_URL } from "./config";

let server: rpc.Server | null = null;

/** Lazily-created singleton Soroban RPC server. */
export function getServer(): rpc.Server {
  if (!server) {
    server = new rpc.Server(RPC_URL);
  }
  return server;
}
