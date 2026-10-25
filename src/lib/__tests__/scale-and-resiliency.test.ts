// src/lib/__tests__/scale-and-resiliency.test.ts
import prisma, { ensureWalMode, withDbRetry } from "@/lib/prisma";
import cache from "@/lib/cache";
import { GET as getRequestHandler } from "@/app/api/request/[shortHash]/route";
import { BloodGroup, Component, RequestMode, WaveState } from "@/types/enums";

describe("Scale Hardening: SQLite WAL Mode & Connection Resiliency Suite", () => {
  let testShortHash: string;

  beforeAll(async () => {
    await ensureWalMode();

    // Create a temporary test request
    testShortHash = `scal_${Math.random().toString(36).substring(2, 10)}`;
    await prisma.emergencyRequest.create({
      data: {
        patientName: "Concurrent Test Patient",
        patientUhid: "UHID-SCALE-15K",
        hospitalName: "AIIMS Delhi",
        hospitalLat: 28.5672,
        hospitalLng: 77.2100,
        component: Component.WHOLE_BLOOD,
        bloodGroup: BloodGroup.O_POS,
        requestMode: RequestMode.REPLACEMENT_ANY,
        unitsNeeded: 1,
        waveState: WaveState.WAVE_1_DISPATCH,
        shortHash: testShortHash,
        expiresAt: new Date(Date.now() + 12 * 3600 * 1000),
      },
    });
  });

  afterAll(async () => {
    cache.clear();
    await prisma.$disconnect();
  });

  it("verifies SQLite database operates in WAL (Write-Ahead Logging) mode", async () => {
    const result = await prisma.$queryRawUnsafe<Array<{ journal_mode: string }>>(
      "PRAGMA journal_mode;"
    );

    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
    // WAL mode allows non-blocking concurrent readers while a write occurs
    expect(result[0].journal_mode.toLowerCase()).toBe("wal");
  });

  it("withDbRetry retries on transient simulated busy locks and succeeds", async () => {
    let attempts = 0;
    const transientOperation = async () => {
      attempts++;
      if (attempts < 3) {
        throw new Error("SQLITE_BUSY: database is locked");
      }
      return "SUCCESS_AFTER_RETRY";
    };

    const result = await withDbRetry(transientOperation, 4, 10);
    expect(result).toBe("SUCCESS_AFTER_RETRY");
    expect(attempts).toBe(3);
  });

  it("withDbRetry throws immediately on non-transient, non-lock errors", async () => {
    const fatalOperation = async () => {
      throw new Error("P2002: Unique constraint failed on field");
    };

    await expect(withDbRetry(fatalOperation, 3, 10)).rejects.toThrow(
      "Unique constraint failed"
    );
  });

  it("read endpoint uses In-Memory Cache (MISS on first call, HIT on subsequent calls)", async () => {
    cache.clear();

    const req1 = new Request(`http://localhost:3000/api/request/${testShortHash}`);
    const res1 = await getRequestHandler(req1, { params: { shortHash: testShortHash } });

    expect(res1.status).toBe(200);
    expect(res1.headers.get("X-V2V-Cache")).toBe("MISS");

    // Second immediate call must be served from high-speed in-memory cache
    const req2 = new Request(`http://localhost:3000/api/request/${testShortHash}`);
    const res2 = await getRequestHandler(req2, { params: { shortHash: testShortHash } });

    expect(res2.status).toBe(200);
    expect(res2.headers.get("X-V2V-Cache")).toBe("HIT");

    const data2 = await res2.json();
    expect(data2.request.shortHash).toBe(testShortHash);
  });
});
