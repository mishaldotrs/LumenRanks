import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Pin file tracing to the repo root so stray lockfiles elsewhere on the
  // machine don't confuse Next's workspace inference.
  outputFileTracingRoot: path.join(__dirname, ".."),
  webpack: (config, { isServer }) => {
    // @stellar/stellar-base optionally requires sodium-native; it is not
    // installed (the JS fallback is used), so keep webpack from resolving it.
    if (isServer) {
      config.externals = [...(config.externals ?? []), "sodium-native"];
    }
    config.resolve.fallback = {
      ...config.resolve.fallback,
      "sodium-native": false,
    };
    return config;
  },
};

export default nextConfig;
