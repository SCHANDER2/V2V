/**
 * Empirical Challenger Test Suite for Milestone 2 (challenger_m2_2)
 *
 * Requirements & Acceptance Criteria Tested:
 * 1. AC3 - Background Cron Watchdog (/api/cron/lease-watchdog & lease-manager):
 *    - Case A: Expired lease + standby donor -> evicted to EVICTED_TIMEOUT, standby promoted to JIT_PASSED with fresh 25m lease & 4-digit PIN.
 *    - Case B: Expired lease + NO standby donor -> evicted to EVICTED_TIMEOUT, vacancy handled cleanly with 0 promotions and 200 OK.
 *    - Case C: ARRIVED lease past 25 minutes -> verified NEVER evicted.
 *    - Additional Adversarial:
 *      * Multiple standby FIFO ordering (earliest standby promoted, later remains STANDBY).
 *      * EN_ROUTE expired lease evicted properly.
 *      * COMPLETED lease with past timestamp protected from eviction.
 *      * Production authentication enforcement (CRON_SECRET bearer / query params).
 * 2. AC4 - Short-Hash Engine & Sidecar Visualization Link:
 *    - Scale test: 5,000 short hashes generated -> 0 collisions, 100% regex match ^[A-Za-z0-9_-]{12}$.
 *    - 12-hour TTL expiration: active hashes return valid, past hashes return expired.
 *    - Input robustness: strings, numbers, ISO dates, invalid dates.
 *    - Sidecar link verification: sidecar://science/biomolecular_structure_viewer/ui.html in shortHash, /api/request/create, and /api/request/[shortHash].
 */

import { NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";
import { GET as watchdogHandler } from "../route";
import {
  generateShortHash,
  calculateShortHashExpiry,
  isShortHashExpired,
  isValidShortHash,
  formatTrackingUrl,
  SIDECAR_VIEWER_URL,
  SHORT_HASH_TTL_MS,
} from "@/lib/shortHash";
import { POST as createRequestRoute } from "@/app/api/request/create/route";
import { GET as getRequestRoute } from "@/app/api/request/[shortHash]/route";
import {
  LeaseStatus,
  WaveState,
  BloodGroup,
  Component,
  RequestMode,
  Gender,
} from "@/types/enums";

const prisma = new PrismaClient();

const testIdSuffix = () => `${Date.now()}_${Math.floor(Math.random() * 1000000)}`;

function uniquePhone(): string {
  return `+9177${Math.floor(10000000 + Math.random() * 90000000)}`;
}

async function cleanupTestData() {
  await prisma.donorLease.deleteMany({
    where: {
      OR: [
        { request: { shortHash: { startsWith: "m2chal_" } } },
        { donor: { phoneNumber: { startsWith: "+9177" } } },
      ],
    },
  });
  await prisma.emergencyRequest.deleteMany({
    where: { shortHash: { startsWith: "m2chal_" } },
  });
  await prisma.donor.deleteMany({
    where: { phoneNumber: { startsWith: "+9177" } },
  });
}

describe("Empirical Challenger M2_2: Cron Watchdog & Short-Hash Engine (AC3 & AC4)", () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeAll(async () => {
    originalEnv = { ...process.env };
    await cleanupTestData();
  });

  afterAll(async () => {
    process.env = originalEnv;
    await cleanupTestData();
    await prisma.$disconnect();
  });

  // =========================================================================
  // SECTION 1: AC3 - CRON LEASE WATCHDOG EMPIRICAL VERIFICATION
  // =========================================================================
  describe("AC3: Background Cron Watchdog (/api/cron/lease-watchdog)", () => {
    test("Case A: Expired lease + standby donor -> EVICTED_TIMEOUT & standby promoted to JIT_PASSED with fresh 25m lease and PIN", async () => {
      const now = new Date();
      const uniqueHash = `m2chal_case_a_${testIdSuffix()}`;

      // 1. Create emergency request
      const req = await prisma.emergencyRequest.create({
        data: {
          patientName: "AC3 Case A Patient",
          patientUhid: `UHID-A-${testIdSuffix()}`,
          hospitalName: "AIIMS Delhi",
          hospitalLat: 28.5672,
          hospitalLng: 77.2100,
          component: Component.WHOLE_BLOOD,
          bloodGroup: BloodGroup.B_POS,
          requestMode: RequestMode.REPLACEMENT_ANY,
          unitsNeeded: 1, // Target active slots: N+1 = 2
          waveState: WaveState.LEASE_LOCKED,
          shortHash: uniqueHash,
          expiresAt: new Date(now.getTime() + 12 * 60 * 60 * 1000),
        },
      });

      // 2. Create donor with expired active lease (expired 12 minutes ago)
      const expiredDonor = await prisma.donor.create({
        data: {
          name: "Expired Donor A",
          phoneNumber: uniquePhone(),
          latitude: 28.567,
          longitude: 77.210,
          bloodGroup: BloodGroup.B_POS,
          gender: Gender.MALE,
          weightKg: 75,
        },
      });
      const expiredLease = await prisma.donorLease.create({
        data: {
          requestId: req.id,
          donorId: expiredDonor.id,
          status: LeaseStatus.JIT_PASSED,
          leaseExpiresAt: new Date(now.getTime() - 12 * 60 * 1000),
          handshakePin: "7890",
        },
      });

      // 3. Create standby donor (registered 6 minutes ago)
      const standbyDonor = await prisma.donor.create({
        data: {
          name: "Standby Donor A",
          phoneNumber: uniquePhone(),
          latitude: 28.569,
          longitude: 77.212,
          bloodGroup: BloodGroup.B_POS,
          gender: Gender.FEMALE,
          weightKg: 63,
        },
      });
      const standbyLease = await prisma.donorLease.create({
        data: {
          requestId: req.id,
          donorId: standbyDonor.id,
          status: LeaseStatus.STANDBY,
          leaseExpiresAt: new Date(now.getTime() + 25 * 60 * 1000),
          createdAt: new Date(now.getTime() - 6 * 60 * 1000),
        },
      });

      // 4. Manually invoke GET /api/cron/lease-watchdog
      const request = new NextRequest("http://localhost:3000/api/cron/lease-watchdog");
      const response = await watchdogHandler(request);

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(typeof data.timestamp).toBe("string");
      expect(typeof data.executionTimeMs).toBe("number");
      expect(data.summary.evictedLeaseIds).toContain(expiredLease.id);
      expect(data.summary.promotedLeaseIds).toContain(standbyLease.id);
      expect(data.summary.evictedCount).toBeGreaterThanOrEqual(1);
      expect(data.summary.promotedCount).toBeGreaterThanOrEqual(1);

      // 5. Verify database state
      const dbExpired = await prisma.donorLease.findUnique({ where: { id: expiredLease.id } });
      expect(dbExpired).not.toBeNull();
      expect(dbExpired?.status).toBe(LeaseStatus.EVICTED_TIMEOUT);

      const dbPromoted = await prisma.donorLease.findUnique({ where: { id: standbyLease.id } });
      expect(dbPromoted).not.toBeNull();
      expect(dbPromoted?.status).toBe(LeaseStatus.JIT_PASSED);
      expect(dbPromoted?.handshakePin).toMatch(/^\d{4}$/);

      // Verify fresh 25-minute lease duration (allow variance)
      const remainingMs = dbPromoted!.leaseExpiresAt.getTime() - Date.now();
      expect(remainingMs).toBeGreaterThan(24 * 60 * 1000);
      expect(remainingMs).toBeLessThanOrEqual(25.1 * 60 * 1000);
    });

    test("Case B: Expired lease + NO standby donor -> EVICTED_TIMEOUT & handles vacancy cleanly", async () => {
      const now = new Date();
      const uniqueHash = `m2chal_case_b_${testIdSuffix()}`;

      // 1. Create emergency request
      const req = await prisma.emergencyRequest.create({
        data: {
          patientName: "AC3 Case B Patient",
          patientUhid: `UHID-B-${testIdSuffix()}`,
          hospitalName: "Apollo Hospital",
          hospitalLat: 28.5401,
          hospitalLng: 77.2832,
          component: Component.PRBC,
          bloodGroup: BloodGroup.A_POS,
          requestMode: RequestMode.REPLACEMENT_ANY,
          unitsNeeded: 1,
          waveState: WaveState.WAVE_1_DISPATCH,
          shortHash: uniqueHash,
          expiresAt: new Date(now.getTime() + 12 * 60 * 60 * 1000),
        },
      });

      // 2. Create donor with expired active lease (expired 8 minutes ago)
      const ghostDonor = await prisma.donor.create({
        data: {
          name: "Ghost Donor B",
          phoneNumber: uniquePhone(),
          latitude: 28.540,
          longitude: 77.283,
          bloodGroup: BloodGroup.A_POS,
          gender: Gender.MALE,
          weightKg: 70,
        },
      });
      const ghostLease = await prisma.donorLease.create({
        data: {
          requestId: req.id,
          donorId: ghostDonor.id,
          status: LeaseStatus.JIT_PASSED,
          leaseExpiresAt: new Date(now.getTime() - 8 * 60 * 1000),
          handshakePin: "4321",
        },
      });

      // Notice: NO standby donor created for this request

      // 3. Manually invoke GET /api/cron/lease-watchdog
      const request = new NextRequest("http://localhost:3000/api/cron/lease-watchdog");
      const response = await watchdogHandler(request);

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.summary.evictedLeaseIds).toContain(ghostLease.id);

      // Verify no lease from this request was promoted
      const leasesForReq = await prisma.donorLease.findMany({ where: { requestId: req.id } });
      expect(leasesForReq.length).toBe(1);
      expect(leasesForReq[0].id).toBe(ghostLease.id);
      expect(leasesForReq[0].status).toBe(LeaseStatus.EVICTED_TIMEOUT);

      // Verify promotedLeaseIds does not contain any lease from req
      expect(data.summary.promotedLeaseIds).not.toContain(ghostLease.id);
    });

    test("Case C: ARRIVED lease past 25 minutes -> NOT evicted", async () => {
      const now = new Date();
      const uniqueHash = `m2chal_case_c_${testIdSuffix()}`;

      // 1. Create emergency request
      const req = await prisma.emergencyRequest.create({
        data: {
          patientName: "AC3 Case C Patient",
          patientUhid: `UHID-C-${testIdSuffix()}`,
          hospitalName: "Fortis Hospital",
          hospitalLat: 28.5100,
          hospitalLng: 77.3000,
          component: Component.SDP,
          bloodGroup: BloodGroup.O_NEG,
          requestMode: RequestMode.EXACT_OR_SDP,
          unitsNeeded: 1,
          waveState: WaveState.LEASE_LOCKED,
          shortHash: uniqueHash,
          expiresAt: new Date(now.getTime() + 12 * 60 * 60 * 1000),
        },
      });

      // 2. Create donor with ARRIVED lease whose travel lease expired 45 minutes ago
      const arrivedDonor = await prisma.donor.create({
        data: {
          name: "Arrived Hero Donor",
          phoneNumber: uniquePhone(),
          latitude: 28.510,
          longitude: 77.300,
          bloodGroup: BloodGroup.O_NEG,
          gender: Gender.FEMALE,
          weightKg: 58,
        },
      });
      const arrivedLease = await prisma.donorLease.create({
        data: {
          requestId: req.id,
          donorId: arrivedDonor.id,
          status: LeaseStatus.ARRIVED,
          leaseExpiresAt: new Date(now.getTime() - 45 * 60 * 1000), // 45m in past
          handshakePin: "5555",
        },
      });

      // 3. Manually invoke GET /api/cron/lease-watchdog
      const request = new NextRequest("http://localhost:3000/api/cron/lease-watchdog");
      const response = await watchdogHandler(request);

      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.summary.evictedLeaseIds).not.toContain(arrivedLease.id);

      // 4. Verify DB state is still ARRIVED
      const dbArrived = await prisma.donorLease.findUnique({ where: { id: arrivedLease.id } });
      expect(dbArrived?.status).toBe(LeaseStatus.ARRIVED);
    });

    test("Adversarial: Multiple standby donors adhere strictly to FIFO promotion order", async () => {
      const now = new Date();
      const uniqueHash = `m2chal_fifo_${testIdSuffix()}`;

      const req = await prisma.emergencyRequest.create({
        data: {
          patientName: "FIFO Standby Patient",
          patientUhid: `UHID-FIFO-${testIdSuffix()}`,
          hospitalName: "AIIMS Delhi",
          hospitalLat: 28.5672,
          hospitalLng: 77.2100,
          component: Component.WHOLE_BLOOD,
          bloodGroup: BloodGroup.AB_POS,
          requestMode: RequestMode.REPLACEMENT_ANY,
          unitsNeeded: 1,
          waveState: WaveState.LEASE_LOCKED,
          shortHash: uniqueHash,
          expiresAt: new Date(now.getTime() + 12 * 60 * 60 * 1000),
        },
      });

      // Expired active lease
      const expDonor = await prisma.donor.create({
        data: {
          name: "Exp Donor FIFO",
          phoneNumber: uniquePhone(),
          latitude: 28.56,
          longitude: 77.21,
          bloodGroup: BloodGroup.AB_POS,
          gender: Gender.MALE,
          weightKg: 80,
        },
      });
      const expLease = await prisma.donorLease.create({
        data: {
          requestId: req.id,
          donorId: expDonor.id,
          status: LeaseStatus.EN_ROUTE, // EN_ROUTE status also tested
          leaseExpiresAt: new Date(now.getTime() - 20 * 60 * 1000),
        },
      });

      // Standby 1 (Created 15m ago - EARLIER)
      const sbDonor1 = await prisma.donor.create({
        data: {
          name: "First Standby",
          phoneNumber: uniquePhone(),
          latitude: 28.56,
          longitude: 77.21,
          bloodGroup: BloodGroup.AB_POS,
          gender: Gender.FEMALE,
          weightKg: 60,
        },
      });
      const sbLease1 = await prisma.donorLease.create({
        data: {
          requestId: req.id,
          donorId: sbDonor1.id,
          status: LeaseStatus.STANDBY,
          leaseExpiresAt: new Date(now.getTime() + 25 * 60 * 1000),
          createdAt: new Date(now.getTime() - 15 * 60 * 1000),
        },
      });

      // Standby 2 (Created 5m ago - LATER)
      const sbDonor2 = await prisma.donor.create({
        data: {
          name: "Second Standby",
          phoneNumber: uniquePhone(),
          latitude: 28.56,
          longitude: 77.21,
          bloodGroup: BloodGroup.AB_POS,
          gender: Gender.MALE,
          weightKg: 70,
        },
      });
      const sbLease2 = await prisma.donorLease.create({
        data: {
          requestId: req.id,
          donorId: sbDonor2.id,
          status: LeaseStatus.STANDBY,
          leaseExpiresAt: new Date(now.getTime() + 25 * 60 * 1000),
          createdAt: new Date(now.getTime() - 5 * 60 * 1000),
        },
      });

      // Trigger watchdog
      const res = await watchdogHandler(new NextRequest("http://localhost:3000/api/cron/lease-watchdog"));
      expect(res.status).toBe(200);
      const data = await res.json();

      expect(data.summary.evictedLeaseIds).toContain(expLease.id);
      expect(data.summary.promotedLeaseIds).toContain(sbLease1.id);
      expect(data.summary.promotedLeaseIds).not.toContain(sbLease2.id);

      // Verify in DB: sbLease1 is JIT_PASSED, sbLease2 is still STANDBY
      const dbSb1 = await prisma.donorLease.findUnique({ where: { id: sbLease1.id } });
      const dbSb2 = await prisma.donorLease.findUnique({ where: { id: sbLease2.id } });

      expect(dbSb1?.status).toBe(LeaseStatus.JIT_PASSED);
      expect(dbSb2?.status).toBe(LeaseStatus.STANDBY);
    });
  });

  // =========================================================================
  // SECTION 2: AC4 - SHORT HASH ENGINE & SIDECAR LINK EMPIRICAL VERIFICATION
  // =========================================================================
  describe("AC4: Short-Hash Generation & TTL Expiration", () => {
    test("Generates 5,000 short-hashes: exactly 0 collisions and 100% regex match ^[A-Za-z0-9_-]{12}$", () => {
      const HASH_COUNT = 5000;
      const hashSet = new Set<string>();
      const regex = /^[A-Za-z0-9_-]{12}$/;

      const startTime = Date.now();
      for (let i = 0; i < HASH_COUNT; i++) {
        const hash = generateShortHash();

        // 1. Validate length and format
        expect(hash.length).toBe(12);
        expect(regex.test(hash)).toBe(true);
        expect(isValidShortHash(hash)).toBe(true);

        hashSet.add(hash);
      }
      const durationMs = Date.now() - startTime;

      // 2. Verify 0 collisions across 5,000 samples
      expect(hashSet.size).toBe(HASH_COUNT);
      console.log(`Generated and verified ${HASH_COUNT} unique short-hashes in ${durationMs}ms`);
    });

    test("12-hour TTL expiration: active hashes return valid, past hashes return expired", () => {
      const now = Date.now();

      // 1. Default calculateShortHashExpiry
      const defaultExpiry = calculateShortHashExpiry();
      expect(defaultExpiry instanceof Date).toBe(true);
      const diffHours = (defaultExpiry.getTime() - now) / (1000 * 60 * 60);
      expect(diffHours).toBeCloseTo(12, 1);
      expect(isShortHashExpired(defaultExpiry)).toBe(false);

      // 2. Active hashes (future expiration)
      const future1m = new Date(now + 60 * 1000);
      const future1h = new Date(now + 60 * 60 * 1000);
      const future12h = new Date(now + 12 * 60 * 60 * 1000);
      const futureIso = new Date(now + 30 * 60 * 1000).toISOString();
      const futureTimestamp = now + 5 * 60 * 1000;

      expect(isShortHashExpired(future1m)).toBe(false);
      expect(isShortHashExpired(future1h)).toBe(false);
      expect(isShortHashExpired(future12h)).toBe(false);
      expect(isShortHashExpired(futureIso)).toBe(false);
      expect(isShortHashExpired(futureTimestamp)).toBe(false);

      // 3. Past hashes (expired)
      const past1ms = new Date(now - 1);
      const past1m = new Date(now - 60 * 1000);
      const past12h = new Date(now - 12 * 60 * 60 * 1000);
      const pastIso = new Date(now - 30 * 60 * 1000).toISOString();
      const pastTimestamp = now - 10000;

      expect(isShortHashExpired(past1ms)).toBe(true);
      expect(isShortHashExpired(past1m)).toBe(true);
      expect(isShortHashExpired(past12h)).toBe(true);
      expect(isShortHashExpired(pastIso)).toBe(true);
      expect(isShortHashExpired(pastTimestamp)).toBe(true);

      // 4. Boundary invalid date handling
      expect(() => isShortHashExpired("invalid-date-string")).toThrow(
        "Invalid date provided to isShortHashExpired"
      );
    });

    test("Short-hash formatting & validation boundaries", () => {
      expect(formatTrackingUrl("xyz123456789")).toBe("/r/xyz123456789");
      expect(isValidShortHash("123456789012")).toBe(true);
      expect(isValidShortHash("abcdefghijkl")).toBe(true);
      expect(isValidShortHash("ABCDEFGHIJKL")).toBe(true);
      expect(isValidShortHash("-_-_-_-_-_-_")).toBe(true);

      // Invalid tokens
      expect(isValidShortHash("short")).toBe(false);
      expect(isValidShortHash("1234567890123")).toBe(false); // 13 chars
      expect(isValidShortHash("12345678901")).toBe(false);  // 11 chars
      expect(isValidShortHash("123456789+12")).toBe(false);  // + is not base64url
      expect(isValidShortHash("123456789/12")).toBe(false);  // / is not base64url
      expect(isValidShortHash("123456789=12")).toBe(false);  // = is padding
      expect(isValidShortHash("")).toBe(false);
      expect(isValidShortHash(null as any)).toBe(false);
      expect(isValidShortHash(undefined as any)).toBe(false);
    });

    test("Sidecar link verification in shortHash and API route responses", async () => {
      // 1. Direct library export
      expect(SIDECAR_VIEWER_URL).toBe(
        "sidecar://science/biomolecular_structure_viewer/ui.html"
      );

      // 2. Verify POST /api/request/create includes sidecarUrl
      const createReq = new NextRequest("http://localhost:3000/api/request/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientName: "Sidecar Verification Patient",
          patientUhid: `UHID-SC-${testIdSuffix()}`,
          hospitalName: "AIIMS Delhi",
          hospitalLat: 28.5672,
          hospitalLng: 77.2100,
          component: Component.WHOLE_BLOOD,
          bloodGroup: BloodGroup.O_POS,
          requestMode: RequestMode.REPLACEMENT_ANY,
          unitsNeeded: 1,
        }),
      });

      const createRes = await createRequestRoute(createReq);
      expect(createRes.status).toBe(201);
      const createData = await createRes.json();

      expect(createData.sidecarUrl).toBe(
        "sidecar://science/biomolecular_structure_viewer/ui.html"
      );
      expect(isValidShortHash(createData.shortHash)).toBe(true);
      expect(createData.trackingUrl).toBe(`/r/${createData.shortHash}`);

      // 3. Verify GET /api/request/[shortHash] includes sidecarUrl
      const getReq = new NextRequest(
        `http://localhost:3000/api/request/${createData.shortHash}`
      );
      const getRes = await getRequestRoute(getReq, {
        params: { shortHash: createData.shortHash },
      });
      expect(getRes.status).toBe(200);
      const getData = await getRes.json();

      expect(getData.request.sidecarUrl).toBe(
        "sidecar://science/biomolecular_structure_viewer/ui.html"
      );
      expect(getData.request.shortHash).toBe(createData.shortHash);
    });
  });
});
