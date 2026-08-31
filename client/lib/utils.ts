import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

import { TOKEN_DECIMALS } from "@/lib/stellar/config";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** `GABC…WXYZ` style truncation. */
export function formatAddress(address: string, chars = 4): string {
  if (!address) return "";
  if (address.length <= chars * 2 + 1) return address;
  return `${address.slice(0, chars)}…${address.slice(-chars)}`;
}

/**
 * Formats a raw i128 amount (10^7 units per LUMR, like XLM stroops) as a
 * human-readable decimal string with thousands separators.
 */
export function formatTokenAmount(
  amount: bigint,
  decimals: number = TOKEN_DECIMALS,
  maxFractionDigits = 2
): string {
  const negative = amount < BigInt(0);
  const abs = negative ? -amount : amount;
  const base = BigInt(10) ** BigInt(decimals);
  const whole = abs / base;
  const fraction = abs % base;

  const wholeStr = whole.toLocaleString("en-US");

  let fractionStr = fraction.toString().padStart(decimals, "0");
  fractionStr = fractionStr.slice(0, maxFractionDigits).replace(/0+$/, "");

  const result = fractionStr ? `${wholeStr}.${fractionStr}` : wholeStr;
  return negative ? `-${result}` : result;
}

/**
 * Parses a user-entered decimal string (e.g. "12.5") into raw i128 units.
 * Throws on invalid input or too many decimal places.
 */
export function parseTokenAmount(input: string, decimals: number = TOKEN_DECIMALS): bigint {
  const trimmed = input.trim();
  if (!/^\d+(\.\d+)?$/.test(trimmed)) {
    throw new Error("Enter a valid positive number.");
  }
  const [whole, fraction = ""] = trimmed.split(".");
  if (fraction.length > decimals) {
    throw new Error(`At most ${decimals} decimal places are supported.`);
  }
  const paddedFraction = fraction.padEnd(decimals, "0");
  return BigInt(whole) * BigInt(10) ** BigInt(decimals) + BigInt(paddedFraction || "0");
}

/** Percentage share (0–100, 2 decimal places) of `part` in `total`. */
export function sharePercent(part: bigint, total: bigint): number {
  if (total <= BigInt(0)) return 0;
  return Number((part * BigInt(10000)) / total) / 100;
}
