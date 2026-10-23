import { NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";
import { GET } from "../route";
import { LeaseStatus, WaveState, BloodGroup, Component, RequestMode, Gender } from "@/types/enums";

const prisma = new PrismaClient();

const uniqueSuffix = () => `${Date.now()}_${Math.floor(Math.random() * 10000)}`;

describe("API Route: /api/cron/lease-watchdog (R4, AC3)", () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeAll(() => {
    originalEnv = { ...process.env };
  });

  afterAll(async () => {
    process.env = originalEnv;
    await prisma.$disconnect();
  });

  test("AC3: Manual invocation evicts expired leases and promotes earliest standby", async () => {
    const now = new Date();
    const reqRecord = await prisma.emergencyRequest.create({
      data: {
        patientName: "Watchdog Test Patient",
        patientUhid: `UHID-WD-${uniqueSuffix()}`,
        hospitalName: "Watchdog General Hospital",
        hospitalLat: 28.6139,
        hospitalLng: 77.2090,
        component: Component.WHOLE_BLOOD,
        bloodGroup: BloodGroup.O_POS,
        requestMode: RequestMode.REPLACEMENT_ANY,
        unitsNeeded: 1, // Target active slots: N+1 = 2
        waveState: WaveState.LEASE_LOCKED,
        shortHash: `wd_hash_${uniqueSuffix()}`,
        expiresAt: new Date(now.getTime() + 12 * 60 * 60 * 1000),
      },
    });

    // 1. Expired active lease (leaseExpiresAt: 15 mins in past)
    const expiredDonor = await prisma.donor.create({
      data: {
        name: "Ghosting Active Donor",
        phoneNumber: `+9199${Math.floor(10000000 + Math.random() * 90000000)}`,
        latitude: 28.61,
        longitude: 77.20,
        bloodGroup: BloodGroup.O_POS,
        gender: Gender.MALE,
        weightKg: 72,
      },
    });
    const expiredLease = await prisma.donorLease.create({
      data: {
        requestId: reqRecord.id,
        donorId: expiredDonor.id,
        status: LeaseStatus.JIT_PASSED,
        leaseExpiresAt: new Date(now.getTime() - 15 * 60 * 1000),
        handshakePin: "1234",
      },
    });

    // 2. Earliest Standby lease (createdAt: 10 mins in past)
    const standbyDonor1 = await prisma.donor.create({
      data: {
        name: "Earliest Standby Donor",
        phoneNumber: `+9198${Math.floor(10000000 + Math.random() * 90000000)}`,
        latitude: 28.62,
        longitude: 77.21,
        bloodGroup: BloodGroup.O_POS,
        gender: Gender.FEMALE,
        weightKg: 60,
      },
    });
    const standbyLease1 = await prisma.donorLease.create({
      data: {
        requestId: reqRecord.id,
        donorId: standbyDonor1.id,
        status: LeaseStatus.STANDBY,
        leaseExpiresAt: new Date(now.getTime() + 25 * 60 * 1000),
        createdAt: new Date(now.getTime() - 10 * 60 * 1000),
      },
    });

    // 3. Later Standby lease (createdAt: 2 mins in past)
    const standbyDonor2 = await prisma.donor.create({
      data: {
        name: "Later Standby Donor",
        phoneNumber: `+9197${Math.floor(10000000 + Math.random() * 90000000)}`,
        latitude: 28.63,
        longitude: 77.22,
        bloodGroup: BloodGroup.O_POS,
        gender: Gender.MALE,
        weightKg: 78,
      },
    });
    const standbyLease2 = await prisma.donorLease.create({
      data: {
        requestId: reqRecord.id,
        donorId: standbyDonor2.id,
        status: LeaseStatus.STANDBY,
        leaseExpiresAt: new Date(now.getTime() + 25 * 60 * 1000),
        createdAt: new Date(now.getTime() - 2 * 60 * 1000),
      },
    });

    // Invoke GET /api/cron/lease-watchdog manually
    const request = new NextRequest("http://localhost:3000/api/cron/lease-watchdog");
    const response = await GET(request);

    expect(response.status).toBe(200);
    const body = await response.json();

    expect(body.success).toBe(true);
    expect(typeof body.timestamp).toBe("string");
    expect(typeof body.executionTimeMs).toBe("number");
    expect(body.executionTimeMs).toBeGreaterThanOrEqual(0);

    // Verify eviction & promotion counts
    expect(body.summary.evictedCount).toBeGreaterThanOrEqual(1);
    expect(body.summary.evictedLeaseIds).toContain(expiredLease.id);
    expect(body.summary.promotedCount).toBeGreaterThanOrEqual(1);
    expect(body.summary.promotedLeaseIds).toContain(standbyLease1.id);

    // Verify DB state for expired lease
    const updatedExpired = await prisma.donorLease.findUnique({ where: { id: expiredLease.id } });
    expect(updatedExpired?.status).toBe(LeaseStatus.EVICTED_TIMEOUT);

    // Verify DB state for promoted standby
    const updatedPromoted = await prisma.donorLease.findUnique({ where: { id: standbyLease1.id } });
    expect(updatedPromoted?.status).toBe(LeaseStatus.JIT_PASSED);
    expect(updatedPromoted?.handshakePin).toMatch(/^\d{4}$/);
    const remainingMs = updatedPromoted!.leaseExpiresAt.getTime() - Date.now();
    expect(remainingMs).toBeGreaterThan(24 * 60 * 1000);
    expect(remainingMs).toBeLessThanOrEqual(25.1 * 60 * 1000);

    // Verify later standby remains STANDBY
    const remainingStandby = await prisma.donorLease.findUnique({ where: { id: standbyLease2.id } });
    expect(remainingStandby?.status).toBe(LeaseStatus.STANDBY);
  });

  test("Returns 200 with zero evictions when no expired leases exist", async () => {
    const request = new NextRequest("http://localhost:3000/api/cron/lease-watchdog");
    const response = await GET(request);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.summary).toBeDefined();
    expect(Array.isArray(body.summary.evictedLeaseIds)).toBe(true);
    expect(Array.isArray(body.summary.promotedLeaseIds)).toBe(true);
  });

  test("Enforces CRON_SECRET authentication in production environment", async () => {
    (process.env as any).NODE_ENV = "production";
    process.env.CRON_SECRET = "super_secure_cron_token_12345";

    // 1. Unauthenticated request -> 401
    const unauthReq = new NextRequest("http://localhost:3000/api/cron/lease-watchdog");
    const unauthRes = await GET(unauthReq);
    expect(unauthRes.status).toBe(401);
    const unauthBody = await unauthRes.json();
    expect(unauthBody.success).toBe(false);

    // 2. Authenticated via Bearer header -> 200
    const authHeaderReq = new NextRequest("http://localhost:3000/api/cron/lease-watchdog", {
      headers: {
        authorization: "Bearer super_secure_cron_token_12345",
      },
    });
    const authHeaderRes = await GET(authHeaderReq);
    expect(authHeaderRes.status).toBe(200);

    // 3. Authenticated via query parameter (?secret=...) -> 200
    const queryReq = new NextRequest("http://localhost:3000/api/cron/lease-watchdog?secret=super_secure_cron_token_12345");
    const queryRes = await GET(queryReq);
    expect(queryRes.status).toBe(200);
  });
});
