// src/lib/__tests__/rateLimit.test.ts
import { rateLimiter, rateLimitResponse } from "@/lib/rateLimit";

describe("Scale Hardening: Sliding Window Rate Limiter Suite", () => {
  beforeEach(() => {
    rateLimiter.reset();
  });

  afterAll(() => {
    rateLimiter.destroy();
  });

  it("permits requests within quota and enforces limit", () => {
    const mockReq = new Request("http://localhost:3000/api/request/create", {
      headers: { "x-forwarded-for": "203.0.113.195" },
    });

    const options = {
      keyPrefix: "test_endpoint",
      limit: 3,
      windowMs: 5000,
      enforceInTest: true,
    };

    // First 3 requests must be allowed
    const r1 = rateLimiter.check(mockReq, options);
    expect(r1.allowed).toBe(true);
    expect(r1.remaining).toBe(2);

    const r2 = rateLimiter.check(mockReq, options);
    expect(r2.allowed).toBe(true);
    expect(r2.remaining).toBe(1);

    const r3 = rateLimiter.check(mockReq, options);
    expect(r3.allowed).toBe(true);
    expect(r3.remaining).toBe(0);

    // 4th request must be rejected
    const r4 = rateLimiter.check(mockReq, options);
    expect(r4.allowed).toBe(false);
    expect(r4.remaining).toBe(0);
  });

  it("returns standard HTTP 429 response with appropriate Retry-After headers", async () => {
    const mockReq = new Request("http://localhost:3000/api/lease/lock", {
      headers: { "x-real-ip": "198.51.100.42" },
    });

    const options = {
      keyPrefix: "test_lock",
      limit: 1,
      windowMs: 10000,
      enforceInTest: true,
    };

    rateLimiter.check(mockReq, options); // First call passes
    const blocked = rateLimiter.check(mockReq, options); // Second call blocked

    expect(blocked.allowed).toBe(false);
    const response = rateLimitResponse(blocked);

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBeDefined();
    expect(response.headers.get("X-RateLimit-Limit")).toBe("1");
    expect(response.headers.get("X-RateLimit-Remaining")).toBe("0");

    const body = await response.json();
    expect(body.error).toBe("Too Many Requests");
    expect(body.message).toContain("V2V protection active");
  });

  it("extracts client IP from proxy headers accurately", () => {
    const reqWithForwarded = new Request("http://localhost:3000/api/test", {
      headers: { "x-forwarded-for": "103.21.244.1, 10.0.0.1" },
    });
    expect(rateLimiter.getClientIp(reqWithForwarded)).toBe("103.21.244.1");

    const reqWithRealIp = new Request("http://localhost:3000/api/test", {
      headers: { "x-real-ip": "103.22.200.5" },
    });
    expect(rateLimiter.getClientIp(reqWithRealIp)).toBe("103.22.200.5");
  });
});
