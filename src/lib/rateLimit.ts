// src/lib/rateLimit.ts
/**
 * In-Memory Sliding Window Rate Limiter for V2V Scale Hardening
 * Defends write endpoints (request creation, lease locks, telephony bridging)
 * against floods and malicious bot activity during high concurrency (15,000+ users).
 */

import { NextResponse } from "next/server";

interface RateLimitRecord {
  timestamps: number[];
}

export interface RateLimitOptions {
  keyPrefix?: string;
  limit?: number;        // Max requests within window
  windowMs?: number;     // Window size in ms (default: 60,000ms = 1 minute)
  enforceInTest?: boolean; // If false, bypasses in test environment
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTime: number; // Timestamp in epoch ms
}

class InMemoryRateLimiter {
  private store = new Map<string, RateLimitRecord>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Purge expired records every 60 seconds to prevent memory leaks
    if (typeof setInterval !== "undefined") {
      this.cleanupInterval = setInterval(() => {
        this.cleanup();
      }, 60000);

      if (this.cleanupInterval && typeof this.cleanupInterval.unref === "function") {
        this.cleanupInterval.unref();
      }
    }
  }

  /**
   * Extract reliable client IP from headers with proxy awareness.
   */
  getClientIp(req: Request): string {
    const forwarded = req.headers.get("x-forwarded-for");
    if (forwarded) {
      const parts = forwarded.split(",");
      return parts[0].trim();
    }
    const realIp = req.headers.get("x-real-ip");
    if (realIp) return realIp.trim();

    const cfIp = req.headers.get("cf-connecting-ip");
    if (cfIp) return cfIp.trim();

    return "127.0.0.1";
  }

  /**
   * Evaluates request against sliding window quota.
   */
  check(req: Request, options: RateLimitOptions = {}): RateLimitResult {
    const {
      keyPrefix = "rl",
      limit = 30,
      windowMs = 60000,
      enforceInTest = false,
    } = options;

    // Allow bypassing during standard unit test suites unless explicitly enforced
    if (process.env.NODE_ENV === "test" && !enforceInTest) {
      return {
        allowed: true,
        limit,
        remaining: limit,
        resetTime: Date.now() + windowMs,
      };
    }

    const ip = this.getClientIp(req);
    const key = `${keyPrefix}:${ip}`;
    const now = Date.now();
    const windowStart = now - windowMs;

    let record = this.store.get(key);
    if (!record) {
      record = { timestamps: [] };
      this.store.set(key, record);
    }

    // Filter out timestamps outside current sliding window
    record.timestamps = record.timestamps.filter((ts) => ts > windowStart);

    const currentCount = record.timestamps.length;
    const resetTime = (record.timestamps[0] || now) + windowMs;

    if (currentCount >= limit) {
      return {
        allowed: false,
        limit,
        remaining: 0,
        resetTime,
      };
    }

    // Record this hit
    record.timestamps.push(now);

    return {
      allowed: true,
      limit,
      remaining: Math.max(0, limit - record.timestamps.length),
      resetTime,
    };
  }

  /**
   * Reset limits for a specific IP or prefix (useful in tests).
   */
  reset(keyPrefix?: string): void {
    if (!keyPrefix) {
      this.store.clear();
      return;
    }
    for (const key of this.store.keys()) {
      if (key.startsWith(keyPrefix)) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Purge expired records from memory.
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.store.entries()) {
      // If all timestamps are older than 5 minutes, delete
      if (record.timestamps.length === 0 || record.timestamps[record.timestamps.length - 1] < now - 300000) {
        this.store.delete(key);
      }
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.store.clear();
  }
}

// Global singleton rate limiter instance
const globalForLimiter = globalThis as unknown as {
  v2vLimiter: InMemoryRateLimiter | undefined;
};

export const rateLimiter = globalForLimiter.v2vLimiter ?? new InMemoryRateLimiter();

if (process.env.NODE_ENV !== "production") {
  globalForLimiter.v2vLimiter = rateLimiter;
}

/**
 * Creates standardized 429 response with rate limit headers.
 */
export function rateLimitResponse(result: RateLimitResult): NextResponse {
  const retryAfterSec = Math.max(1, Math.ceil((result.resetTime - Date.now()) / 1000));

  return NextResponse.json(
    {
      error: "Too Many Requests",
      message: "Rate limit exceeded. V2V protection active. Please try again shortly.",
      retryAfterSeconds: retryAfterSec,
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSec),
        "X-RateLimit-Limit": String(result.limit),
        "X-RateLimit-Remaining": String(result.remaining),
        "X-RateLimit-Reset": String(Math.ceil(result.resetTime / 1000)),
      },
    }
  );
}

export default rateLimiter;
