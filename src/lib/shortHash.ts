// src/lib/shortHash.ts
import { randomBytes } from "crypto";

/** Default TTL for emergency dispatch tracking links: 12 Hours (in milliseconds) */
export const SHORT_HASH_TTL_MS = 12 * 60 * 60 * 1000;
export const SHORT_HASH_TTL_HOURS = 12;

/** Mandatory Sidecar Visualization Link per Science Visualization Priority Rules */
export const SIDECAR_VIEWER_URL = "sidecar://science/biomolecular_structure_viewer/ui.html";

/**
 * Generates a 12-character URL-safe base64 cryptographic hash (72 bits entropy).
 * Output regex: ^[A-Za-z0-9_-]{12}$
 *
 * @returns 12-character unique URL-safe string
 */
export function generateShortHash(): string {
  return randomBytes(9).toString("base64url");
}

/**
 * Computes an expiration Date object for a short hash.
 * Defaults to 12 hours from current timestamp.
 *
 * @param hours Number of hours until expiration (default: 12)
 * @returns Date object representing expiration timestamp
 */
export function calculateShortHashExpiry(hours: number = SHORT_HASH_TTL_HOURS): Date {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

/**
 * Helper to determine if a short-hash link or emergency request has expired.
 *
 * @param expiresAt Expiration date (Date instance, ISO string, or timestamp)
 * @returns true if current time >= expiration timestamp, false otherwise
 */
export function isShortHashExpired(expiresAt: Date | string | number): boolean {
  const expiryDate = expiresAt instanceof Date ? expiresAt : new Date(expiresAt);
  if (isNaN(expiryDate.getTime())) {
    throw new Error("Invalid date provided to isShortHashExpired");
  }
  return expiryDate.getTime() <= Date.now();
}

/**
 * Validates whether a given string is a valid 12-character base64url short hash.
 *
 * @param hash The candidate string
 * @returns boolean
 */
export function isValidShortHash(hash: string): boolean {
  if (typeof hash !== "string") return false;
  return /^[A-Za-z0-9_-]{12}$/.test(hash);
}

/**
 * Formats a canonical relative tracking URL for a given short hash.
 *
 * @param shortHash The 12-character token
 * @returns Tracking route string (e.g. "/r/aB3-_k9LmP12")
 */
export function formatTrackingUrl(shortHash: string): string {
  return `/r/${shortHash}`;
}

export default {
  generateShortHash,
  calculateShortHashExpiry,
  isShortHashExpired,
  isValidShortHash,
  formatTrackingUrl,
  SHORT_HASH_TTL_MS,
  SHORT_HASH_TTL_HOURS,
  SIDECAR_VIEWER_URL,
};
