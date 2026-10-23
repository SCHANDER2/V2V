// src/lib/__tests__/shortHash.test.ts
import {
  generateShortHash,
  calculateShortHashExpiry,
  isShortHashExpired,
  isValidShortHash,
  formatTrackingUrl,
  SHORT_HASH_TTL_MS,
  SHORT_HASH_TTL_HOURS,
  SIDECAR_VIEWER_URL,
} from "@/lib/shortHash";

describe("ShortHash Engine (R5, AC4)", () => {
  describe("generateShortHash", () => {
    it("generates a 12-character URL-safe base64 string", () => {
      const hash = generateShortHash();
      expect(typeof hash).toBe("string");
      expect(hash.length).toBe(12);
      expect(/^[A-Za-z0-9_-]{12}$/.test(hash)).toBe(true);
    });

    it("generates unique values across 1000 iterations without collisions", () => {
      const hashes = new Set<string>();
      const iterations = 1000;
      for (let i = 0; i < iterations; i++) {
        hashes.add(generateShortHash());
      }
      expect(hashes.size).toBe(iterations);
    });
  });

  describe("calculateShortHashExpiry", () => {
    it("calculates 12-hour TTL expiration by default", () => {
      const now = Date.now();
      const expiry = calculateShortHashExpiry();
      const expectedTime = now + SHORT_HASH_TTL_MS;

      expect(expiry instanceof Date).toBe(true);
      expect(Math.abs(expiry.getTime() - expectedTime)).toBeLessThan(100); // 100ms tolerance
    });

    it("supports custom hour duration", () => {
      const now = Date.now();
      const expiry = calculateShortHashExpiry(6);
      const expectedTime = now + 6 * 60 * 60 * 1000;

      expect(Math.abs(expiry.getTime() - expectedTime)).toBeLessThan(100);
    });
  });

  describe("isShortHashExpired", () => {
    it("returns false for future expiration timestamps", () => {
      const future = new Date(Date.now() + 10 * 60 * 1000);
      expect(isShortHashExpired(future)).toBe(false);
    });

    it("returns true for past expiration timestamps", () => {
      const past = new Date(Date.now() - 1000);
      expect(isShortHashExpired(past)).toBe(true);
    });

    it("handles ISO date strings and millisecond timestamps", () => {
      const pastIso = new Date(Date.now() - 5000).toISOString();
      const futureTimestamp = Date.now() + 50000;

      expect(isShortHashExpired(pastIso)).toBe(true);
      expect(isShortHashExpired(futureTimestamp)).toBe(false);
    });
  });

  describe("isValidShortHash & formatTrackingUrl", () => {
    it("validates valid 12-character base64url strings", () => {
      expect(isValidShortHash("aB3-_k9LmP12")).toBe(true);
      expect(isValidShortHash("short")).toBe(false);
      expect(isValidShortHash("has!special#")).toBe(false);
    });

    it("formats relative tracking URL correctly", () => {
      expect(formatTrackingUrl("v2v_w1_aiims")).toBe("/r/v2v_w1_aiims");
    });

    it("exports valid sidecar visualization link", () => {
      expect(SIDECAR_VIEWER_URL).toBe(
        "sidecar://science/biomolecular_structure_viewer/ui.html"
      );
    });
  });
});
