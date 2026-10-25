import { cache, invalidateRequestCache, invalidateDonorCache, InMemoryCache } from "@/lib/cache";

describe("Scale Hardening: In-Memory TTL Cache Suite", () => {
  beforeEach(() => {
    cache.clear();
  });

  afterAll(() => {
    cache.destroy();
  });

  it("stores and retrieves values accurately within TTL", () => {
    cache.set("test_key_1", { name: "Aarav Sharma", units: 2 }, 1000);
    const result = cache.get<{ name: string; units: number }>("test_key_1");

    expect(result).toBeDefined();
    expect(result?.name).toBe("Aarav Sharma");
    expect(result?.units).toBe(2);
  });

  it("returns undefined for expired items", async () => {
    cache.set("expired_key", "stale_value", 50); // 50ms TTL
    expect(cache.get("expired_key")).toBe("stale_value");

    await new Promise((r) => setTimeout(r, 60));
    expect(cache.get("expired_key")).toBeUndefined();
  });

  it("supports prefix-based invalidation for emergency requests", () => {
    cache.set("req_v2v_hash_1", { id: 101, state: "WAVE_1" }, 5000);
    cache.set("req_v2v_hash_2", { id: 102, state: "WAVE_2" }, 5000);
    cache.set("donor_token_99", { id: 99, name: "Donor" }, 5000);

    invalidateRequestCache("v2v_hash_1");

    expect(cache.get("req_v2v_hash_1")).toBeUndefined();
    expect(cache.get("req_v2v_hash_2")).toBeDefined();
    expect(cache.get("donor_token_99")).toBeDefined();
  });

  it("supports donor cache invalidation helper", () => {
    cache.set("donor_token_tok123", { donorId: 44, status: "STANDBY" }, 5000);
    cache.set("donor_id_44", { donorId: 44, status: "STANDBY" }, 5000);

    invalidateDonorCache("tok123");
    expect(cache.get("donor_token_tok123")).toBeUndefined();
  });

  it("evicts least recently used (LRU) entry when at capacity", () => {
    const testCache = new InMemoryCache(3, 5000);
    testCache.set("a", 1, 5000);
    testCache.set("b", 2, 5000);
    testCache.set("c", 3, 5000);
    testCache.set("d", 4, 5000); // Should evict "a"

    expect(testCache.get("a")).toBeUndefined();
    expect(testCache.get("b")).toBe(2);
    expect(testCache.get("c")).toBe(3);
    expect(testCache.get("d")).toBe(4);
    expect(testCache.size()).toBe(3);
    testCache.destroy();
  });
});
