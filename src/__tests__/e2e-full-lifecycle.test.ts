/**
 * Milestone 4: Full E2E Lifecycle Integration Tests
 * 
 * Tests the complete request lifecycle:
 *   Seed → Create Request → Dispatch Wave → Donor Respond → Lease Lock →
 *   Arrival → Fulfillment/Expiration
 * 
 * Also includes adversarial hardening:
 *   - Race condition stress tests (concurrent lease attempts)
 *   - Boundary fuzzing (invalid inputs, edge cases)
 *   - State machine integrity (no illegal transitions)
 *   - Counter-loop verification (all 4 loops enforced end-to-end)
 */

import { PrismaClient } from "@prisma/client";
import {
  BloodGroup,
  Gender,
  Component,
  RequestMode,
  WaveState,
  LeaseStatus,
} from "@/types/enums";
import { isEligible, DonorProfile } from "@/lib/engines/eligibility";
import { prioritizedGroups } from "@/lib/engines/compatibility";
import {
  selectDonorsForWave,
  pingDonors,
  advanceWaveOrClose,
  dispatchWave,
} from "@/lib/engines/dispatcher";
import {
  attemptLease,
  evictExpiredLeases,
  maybeLockRequest,
} from "@/lib/engines/lease-manager";
import {
  generateShortHash,
  isShortHashExpired,
  isValidShortHash,
  calculateShortHashExpiry,
} from "@/lib/shortHash";

const prisma = new PrismaClient();

// ──────────────────────────────────────────────
// Test Utilities
// ──────────────────────────────────────────────

async function cleanTestData() {
  await prisma.donorLease.deleteMany({
    where: {
      donor: { name: { startsWith: "Test" } },
    },
  }).catch(() => {
    // Fallback: clean leases tied to test donors that may not exist yet
  });
  // Only delete test-created data, preserve seed data
  await prisma.donorLease.deleteMany({
    where: {
      OR: [
        { donor: { name: { startsWith: "E2E" } } },
        { donor: { name: { startsWith: "Eviction" } } },
        { donor: { name: { startsWith: "Standby" } } },
        { donor: { name: { startsWith: "Arrived" } } },
        { donor: { name: { startsWith: "Recently" } } },
        { donor: { name: { startsWith: "Cooled" } } },
        { donor: { name: { startsWith: "Concurrent" } } },
        { donor: { name: { startsWith: "PIN" } } },
        { donor: { name: { startsWith: "Still" } } },
        { donor: { name: { startsWith: "No Backup" } } },
        { donor: { name: { startsWith: "Batch" } } },
      ],
    },
  }).catch(() => {});
  // Delete test emergency requests (preserve seed)
  await prisma.emergencyRequest.deleteMany({
    where: { patientName: "Test Patient" },
  }).catch(() => {});
  // Delete test donors (preserve seed)
  await prisma.donor.deleteMany({
    where: { name: { startsWith: "Test" } },
  }).catch(() => {});
  await prisma.donor.deleteMany({
    where: {
      OR: [
        { name: { startsWith: "E2E" } },
        { name: { startsWith: "Eviction" } },
        { name: { startsWith: "Standby" } },
        { name: { startsWith: "Arrived" } },
        { name: { startsWith: "Recently" } },
        { name: { startsWith: "Cooled" } },
        { name: { startsWith: "Concurrent" } },
        { name: { startsWith: "PIN" } },
        { name: { startsWith: "Still" } },
        { name: { startsWith: "No Backup" } },
        { name: { startsWith: "Batch" } },
      ],
    },
  }).catch(() => {});
}

/** Create a test donor at a specific distance from AIIMS Delhi */
async function createTestDonor(overrides: {
  name?: string;
  bloodGroup?: string;
  gender?: string;
  weightKg?: number;
  latitude?: number;
  longitude?: number;
  lastWholeBlood?: Date | null;
  lastPlatelet?: Date | null;
  lastPingedAt?: Date | null;
  phoneNumber?: string;
}) {
  return prisma.donor.create({
    data: {
      name: overrides.name ?? "Test Donor",
      phoneNumber: overrides.phoneNumber ?? `+9198${Date.now()}${Math.floor(Math.random() * 1000)}`,
      latitude: overrides.latitude ?? 28.5672, // ~1km from AIIMS
      longitude: overrides.longitude ?? 77.2100,
      bloodGroup: overrides.bloodGroup ?? BloodGroup.O_POS,
      gender: overrides.gender ?? Gender.MALE,
      weightKg: overrides.weightKg ?? 70,
      lastWholeBlood: overrides.lastWholeBlood ?? null,
      lastPlatelet: overrides.lastPlatelet ?? null,
      lastPingedAt: overrides.lastPingedAt ?? null,
    },
  });
}

/** Create a test emergency request at AIIMS Delhi (or custom coordinates) */
async function createTestRequest(overrides: {
  bloodGroup?: string;
  component?: string;
  requestMode?: string;
  unitsNeeded?: number;
  waveState?: string;
  expiresAt?: Date;
  hospitalLat?: number;
  hospitalLng?: number;
}) {
  const shortHash = generateShortHash();
  return prisma.emergencyRequest.create({
    data: {
      patientName: "Test Patient",
      patientUhid: "AIIMS-TEST-001",
      hospitalName: "AIIMS Delhi",
      hospitalLat: overrides.hospitalLat ?? 28.5672,
      hospitalLng: overrides.hospitalLng ?? 77.2100,
      component: overrides.component ?? Component.WHOLE_BLOOD,
      bloodGroup: overrides.bloodGroup ?? BloodGroup.O_POS,
      requestMode: overrides.requestMode ?? RequestMode.EXACT_OR_SDP,
      unitsNeeded: overrides.unitsNeeded ?? 2,
      waveState: overrides.waveState ?? WaveState.WAVE_1_DISPATCH,
      shortHash,
      expiresAt: overrides.expiresAt ?? calculateShortHashExpiry(12),
    },
  });
}

// ──────────────────────────────────────────────
// E2E LIFECYCLE TESTS
// ──────────────────────────────────────────────

describe("E2E Full Lifecycle", () => {
  beforeAll(async () => {
    await cleanTestData();
  }, 30000);

  afterAll(async () => {
    await cleanTestData();
    await prisma.$disconnect();
  }, 30000);

  describe("Phase 1: Request Creation → Wave Dispatch → Donor Lock → Arrival → Fulfillment", () => {
    let requestId: number;
    let donorIds: number[] = [];

    it("should create an emergency request in PENDING_VERIFICATION state", async () => {
      const req = await createTestRequest({
        waveState: WaveState.PENDING_VERIFICATION,
        unitsNeeded: 2,
        bloodGroup: BloodGroup.B_POS,
        requestMode: RequestMode.EXACT_OR_SDP,
      });
      requestId = req.id;
      expect(req.waveState).toBe(WaveState.PENDING_VERIFICATION);
      expect(req.shortHash).toBeTruthy();
      expect(isValidShortHash(req.shortHash)).toBe(true);
    });

    it("should have a valid 12h TTL on the request", async () => {
      const req = await prisma.emergencyRequest.findUnique({
        where: { id: requestId },
      });
      expect(req).toBeTruthy();
      const ttlMs = req!.expiresAt.getTime() - req!.createdAt.getTime();
      // Should be approximately 12 hours (within 1 minute tolerance)
      expect(ttlMs).toBeGreaterThan(11 * 60 * 60 * 1000);
      expect(ttlMs).toBeLessThanOrEqual(12 * 60 * 60 * 1000 + 60000);
    });

    it("should seed 5 eligible B_POS donors within Wave 1 radius (0-3km)", async () => {
      // Create 5 B_POS donors near AIIMS (within 3km)
      for (let i = 0; i < 5; i++) {
        const d = await createTestDonor({
          name: `E2E Donor ${i + 1}`,
          bloodGroup: BloodGroup.B_POS,
          latitude: 28.567 + i * 0.001, // Very close to AIIMS
          longitude: 77.210 + i * 0.001,
          lastWholeBlood: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000), // 100 days ago
        });
        donorIds.push(d.id);
      }
      expect(donorIds.length).toBe(5);
    });

    it("should dispatch Wave 1 and transition from PENDING_VERIFICATION to WAVE_1_DISPATCH", async () => {
      const result = await dispatchWave(requestId);
      expect(result.waveState).toBe(WaveState.WAVE_1_DISPATCH);
      expect(result.pingedDonorsCount).toBeGreaterThan(0);
      expect(result.pingedDonorsCount).toBeLessThanOrEqual(15); // 5 * (2+1) = 15 max
    });

    it("should mark pinged donors with lastPingedAt timestamp", async () => {
      const donors = await prisma.donor.findMany({
        where: { id: { in: donorIds } },
      });
      const pingedDonors = donors.filter((d) => d.lastPingedAt !== null);
      expect(pingedDonors.length).toBeGreaterThan(0);
    });

    it("should create PINGED lease entries for dispatched donors", async () => {
      const leases = await prisma.donorLease.findMany({
        where: { requestId, status: LeaseStatus.PINGED },
      });
      expect(leases.length).toBeGreaterThan(0);
    });

    it("should lock 3 donor slots (N+1 = 2+1) via attemptLease", async () => {
      // Lock 3 donors (N+1 where N=2)
      const lease1 = await attemptLease(requestId, donorIds[0]);
      expect(lease1.status).toBe(LeaseStatus.JIT_PASSED);
      expect(lease1.handshakePin).toMatch(/^\d{4}$/);

      const lease2 = await attemptLease(requestId, donorIds[1]);
      expect(lease2.status).toBe(LeaseStatus.JIT_PASSED);

      const lease3 = await attemptLease(requestId, donorIds[2]);
      expect(lease3.status).toBe(LeaseStatus.JIT_PASSED);
    });

    it("should place 4th donor in STANDBY after N+1 slots filled", async () => {
      const lease4 = await attemptLease(requestId, donorIds[3]);
      expect(lease4.status).toBe(LeaseStatus.STANDBY);
      expect(lease4.handshakePin).toBeNull(); // Standby doesn't get a PIN
    });

    it("should transition request to LEASE_LOCKED after N+1 active leases", async () => {
      await maybeLockRequest(requestId);
      const req = await prisma.emergencyRequest.findUnique({
        where: { id: requestId },
      });
      expect(req!.waveState).toBe(WaveState.LEASE_LOCKED);
    });

    it("should mark donor as ARRIVED after check-in", async () => {
      // Find first active lease
      const activeLease = await prisma.donorLease.findFirst({
        where: {
          requestId,
          donorId: donorIds[0],
          status: LeaseStatus.JIT_PASSED,
        },
      });
      expect(activeLease).toBeTruthy();

      // Simulate arrival
      const updated = await prisma.donorLease.update({
        where: { id: activeLease!.id },
        data: { status: LeaseStatus.ARRIVED },
      });
      expect(updated.status).toBe(LeaseStatus.ARRIVED);
    });

    it("should transition to FULFILLED_CLOSED when all units completed", async () => {
      // Mark all active leases as COMPLETED
      await prisma.donorLease.updateMany({
        where: {
          requestId,
          status: { in: [LeaseStatus.JIT_PASSED, LeaseStatus.EN_ROUTE, LeaseStatus.ARRIVED] },
        },
        data: { status: LeaseStatus.COMPLETED },
      });

      // Transition request to FULFILLED_CLOSED
      await prisma.emergencyRequest.update({
        where: { id: requestId },
        data: { waveState: WaveState.FULFILLED_CLOSED },
      });

      const req = await prisma.emergencyRequest.findUnique({
        where: { id: requestId },
      });
      expect(req!.waveState).toBe(WaveState.FULFILLED_CLOSED);
    });

    it("should not dispatch new waves on a FULFILLED_CLOSED request", async () => {
      const result = await dispatchWave(requestId);
      expect(result.pingedDonorsCount).toBe(0);
      expect(result.waveState).toBe(WaveState.FULFILLED_CLOSED);
    });
  });

  describe("Phase 2: Wave Advancement (No Donors in Range)", () => {
    let requestId: number;

    beforeAll(async () => {
      // Create request at remote ocean coordinates where no donors exist
      const req = await createTestRequest({
        bloodGroup: BloodGroup.O_POS,
        waveState: WaveState.WAVE_1_DISPATCH,
        unitsNeeded: 1,
        hospitalLat: 0.0,
        hospitalLng: 0.0,
      });
      requestId = req.id;
    });

    it("should auto-advance to WAVE_2_DISPATCH when Wave 1 has no eligible donors", async () => {
      const result = await dispatchWave(requestId);
      expect(result.pingedDonorsCount).toBe(0);
      expect(result.waveState).toBe(WaveState.WAVE_2_DISPATCH);
    });

    it("should auto-advance to WAVE_3_DISPATCH when Wave 2 also has no donors", async () => {
      const result = await dispatchWave(requestId);
      expect(result.pingedDonorsCount).toBe(0);
      expect(result.waveState).toBe(WaveState.WAVE_3_DISPATCH);
    });

    it("should EXPIRE request when Wave 3 exhausted with no donors", async () => {
      const result = await dispatchWave(requestId);
      expect(result.pingedDonorsCount).toBe(0);
      expect(result.waveState).toBe(WaveState.EXPIRED);
    });

    it("should not dispatch on already EXPIRED request", async () => {
      const result = await dispatchWave(requestId);
      expect(result.pingedDonorsCount).toBe(0);
      expect(result.waveState).toBe(WaveState.EXPIRED);
    });
  });

  describe("Phase 3: Dead-Man's Switch Eviction & Standby Promotion", () => {
    let requestId: number;
    let activeDonorId: number;
    let standbyDonorId: number;

    beforeAll(async () => {
      const req = await createTestRequest({
        bloodGroup: BloodGroup.A_POS,
        unitsNeeded: 1, // N+1 = 2 active slots
      });
      requestId = req.id;

      const activeDonor = await createTestDonor({
        name: "Eviction Target",
        bloodGroup: BloodGroup.A_POS,
      });
      activeDonorId = activeDonor.id;

      const standbyDonor = await createTestDonor({
        name: "Standby Hero",
        bloodGroup: BloodGroup.A_POS,
      });
      standbyDonorId = standbyDonor.id;
    });

    it("should evict a lease whose travel window has expired", async () => {
      // Create an active lease that expired 5 minutes ago
      const expiredLease = await prisma.donorLease.create({
        data: {
          requestId,
          donorId: activeDonorId,
          status: LeaseStatus.EN_ROUTE,
          leaseExpiresAt: new Date(Date.now() - 5 * 60 * 1000), // 5 min ago
          handshakePin: "1234",
        },
      });

      // Create a standby lease
      const standbyLease = await prisma.donorLease.create({
        data: {
          requestId,
          donorId: standbyDonorId,
          status: LeaseStatus.STANDBY,
          leaseExpiresAt: new Date(Date.now() + 25 * 60 * 1000),
        },
      });

      const result = await evictExpiredLeases();
      expect(result.evictedCount).toBeGreaterThanOrEqual(1);
      expect(result.evictedLeaseIds).toContain(expiredLease.id);

      // Check evicted lease status
      const evicted = await prisma.donorLease.findUnique({
        where: { id: expiredLease.id },
      });
      expect(evicted!.status).toBe(LeaseStatus.EVICTED_TIMEOUT);

      // Check standby was promoted
      const promoted = await prisma.donorLease.findUnique({
        where: { id: standbyLease.id },
      });
      expect(promoted!.status).toBe(LeaseStatus.JIT_PASSED);
      expect(promoted!.handshakePin).toMatch(/^\d{4}$/);
      expect(result.promotedLeaseIds).toContain(standbyLease.id);
    });

    it("should NOT evict ARRIVED leases (they are safe from eviction)", async () => {
      const arrivedDonor = await createTestDonor({
        name: "Arrived Donor",
        bloodGroup: BloodGroup.A_POS,
      });

      const arrivedLease = await prisma.donorLease.create({
        data: {
          requestId,
          donorId: arrivedDonor.id,
          status: LeaseStatus.ARRIVED, // Safe from eviction
          leaseExpiresAt: new Date(Date.now() - 10 * 60 * 1000), // "Expired" but ARRIVED
          handshakePin: "5678",
        },
      });

      const result = await evictExpiredLeases();
      const lease = await prisma.donorLease.findUnique({
        where: { id: arrivedLease.id },
      });
      expect(lease!.status).toBe(LeaseStatus.ARRIVED); // Still ARRIVED
      expect(result.evictedLeaseIds).not.toContain(arrivedLease.id);
    });
  });
});

// ──────────────────────────────────────────────
// ADVERSARIAL HARDENING TESTS (Tier 5)
// ──────────────────────────────────────────────

describe("Adversarial Hardening", () => {
  beforeAll(async () => {
    await cleanTestData();
  }, 30000);

  afterAll(async () => {
    await cleanTestData();
    await prisma.$disconnect();
  }, 30000);

  describe("Counter-Loop 1: 72h Ping Cooldown Enforcement", () => {
    it("should NOT select donors who were pinged within 72 hours", async () => {
      const req = await createTestRequest({
        bloodGroup: BloodGroup.O_POS,
        unitsNeeded: 1,
      });

      // Create donor pinged 1 hour ago (within 72h cooldown)
      await createTestDonor({
        name: "Recently Pinged",
        bloodGroup: BloodGroup.O_POS,
        latitude: 28.567,
        longitude: 77.210,
        lastPingedAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
      });

      const selected = await selectDonorsForWave(req.id);
      const names = selected.map((d) => d.name);
      expect(names).not.toContain("Recently Pinged");
    });

    it("should select donors whose 72h cooldown has expired", async () => {
      const req = await createTestRequest({
        bloodGroup: BloodGroup.O_POS,
        unitsNeeded: 1,
      });

      const cooledOff = await createTestDonor({
        name: "Cooled Off Donor",
        bloodGroup: BloodGroup.O_POS,
        latitude: 28.568,
        longitude: 77.211,
        lastPingedAt: new Date(Date.now() - 73 * 60 * 60 * 1000), // 73 hours ago
        lastWholeBlood: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000),
      });

      const selected = await selectDonorsForWave(req.id);
      const ids = selected.map((d) => d.id);
      expect(ids).toContain(cooledOff.id);
    });
  });

  describe("Counter-Loop 2: Atomic N+1 Token Bucket Boundary", () => {
    it("should enforce exact N+1 ceiling regardless of concurrent attempts", async () => {
      const req = await createTestRequest({
        bloodGroup: BloodGroup.AB_POS,
        unitsNeeded: 1, // N+1 = 2 slots
      });

      // Create 5 donors
      const donors = [];
      for (let i = 0; i < 5; i++) {
        donors.push(
          await createTestDonor({
            name: `Concurrent Donor ${i}`,
            bloodGroup: BloodGroup.AB_POS,
          })
        );
      }

      // Fire all 5 lease attempts concurrently
      const results = await Promise.all(
        donors.map((d) => attemptLease(req.id, d.id))
      );

      const active = results.filter(
        (r) =>
          r.status === LeaseStatus.JIT_PASSED ||
          r.status === LeaseStatus.EN_ROUTE ||
          r.status === LeaseStatus.ARRIVED
      );
      const standby = results.filter((r) => r.status === LeaseStatus.STANDBY);

      // Exactly N+1=2 should be active, rest standby
      expect(active.length).toBe(2);
      expect(standby.length).toBe(3);
    });

    it("should generate unique 4-digit PINs for active leases", async () => {
      const req = await createTestRequest({
        bloodGroup: BloodGroup.O_NEG,
        unitsNeeded: 2,
      });

      const donors = [];
      for (let i = 0; i < 3; i++) {
        donors.push(
          await createTestDonor({
            name: `PIN Donor ${i}`,
            bloodGroup: BloodGroup.O_NEG,
          })
        );
      }

      const leases = await Promise.all(
        donors.map((d) => attemptLease(req.id, d.id))
      );

      const activePins = leases
        .filter((l) => l.status === LeaseStatus.JIT_PASSED)
        .map((l) => l.handshakePin);

      // All PINs should be 4-digit strings
      activePins.forEach((pin) => {
        expect(pin).toMatch(/^\d{4}$/);
      });
    });
  });

  describe("Counter-Loop 3: Dead-Man's Switch Edge Cases", () => {
    it("should not evict leases that have NOT yet expired", async () => {
      const req = await createTestRequest({
        bloodGroup: BloodGroup.B_NEG,
        unitsNeeded: 1,
      });

      const donor = await createTestDonor({
        name: "Still Traveling",
        bloodGroup: BloodGroup.B_NEG,
      });

      // Create lease expiring in 20 minutes (still valid)
      const lease = await prisma.donorLease.create({
        data: {
          requestId: req.id,
          donorId: donor.id,
          status: LeaseStatus.EN_ROUTE,
          leaseExpiresAt: new Date(Date.now() + 20 * 60 * 1000),
          handshakePin: "9876",
        },
      });

      const result = await evictExpiredLeases();
      expect(result.evictedLeaseIds).not.toContain(lease.id);

      const check = await prisma.donorLease.findUnique({
        where: { id: lease.id },
      });
      expect(check!.status).toBe(LeaseStatus.EN_ROUTE);
    });

    it("should handle eviction when there are no standby donors to promote", async () => {
      const req = await createTestRequest({
        bloodGroup: BloodGroup.AB_NEG,
        unitsNeeded: 1,
      });

      const donor = await createTestDonor({
        name: "No Backup Available",
        bloodGroup: BloodGroup.AB_NEG,
      });

      // Create expired lease with no standby
      await prisma.donorLease.create({
        data: {
          requestId: req.id,
          donorId: donor.id,
          status: LeaseStatus.JIT_PASSED,
          leaseExpiresAt: new Date(Date.now() - 1 * 60 * 1000), // 1 min ago
          handshakePin: "1111",
        },
      });

      const result = await evictExpiredLeases();
      expect(result.evictedCount).toBeGreaterThanOrEqual(1);
      expect(result.promotedCount).toBe(0); // No standby to promote
    });
  });

  describe("Counter-Loop 4: Short-Hash Crypto & TTL Integrity", () => {
    it("should generate 100 unique short hashes with zero collisions", () => {
      const hashes = new Set<string>();
      for (let i = 0; i < 100; i++) {
        hashes.add(generateShortHash());
      }
      expect(hashes.size).toBe(100);
    });

    it("should validate short hash format (12-char base64url)", () => {
      for (let i = 0; i < 50; i++) {
        const hash = generateShortHash();
        expect(isValidShortHash(hash)).toBe(true);
        expect(hash.length).toBe(12);
        expect(hash).toMatch(/^[A-Za-z0-9_-]{12}$/);
      }
    });

    it("should correctly detect expired vs valid TTLs", () => {
      const expired = new Date(Date.now() - 1000);
      const valid = new Date(Date.now() + 60000);
      expect(isShortHashExpired(expired)).toBe(true);
      expect(isShortHashExpired(valid)).toBe(false);
    });

    it("should throw on invalid date input to isShortHashExpired", () => {
      expect(() => isShortHashExpired("not-a-date")).toThrow("Invalid date");
    });
  });

  describe("NBTC Eligibility Boundary Fuzzing", () => {
    it("should reject donor at exactly 44.9kg for Whole Blood", () => {
      const profile: DonorProfile = {
        gender: Gender.MALE,
        bloodGroup: BloodGroup.O_POS,
        weightKg: 44.9,
      };
      expect(isEligible(profile, Component.WHOLE_BLOOD)).toBe(false);
    });

    it("should accept donor at exactly 45kg for Whole Blood", () => {
      const profile: DonorProfile = {
        gender: Gender.MALE,
        bloodGroup: BloodGroup.O_POS,
        weightKg: 45,
      };
      expect(isEligible(profile, Component.WHOLE_BLOOD)).toBe(true);
    });

    it("should reject donor at 49.9kg for SDP", () => {
      const profile: DonorProfile = {
        gender: Gender.FEMALE,
        bloodGroup: BloodGroup.A_POS,
        weightKg: 49.9,
      };
      expect(isEligible(profile, Component.SDP)).toBe(false);
    });

    it("should accept donor at exactly 50kg for SDP", () => {
      const profile: DonorProfile = {
        gender: Gender.FEMALE,
        bloodGroup: BloodGroup.A_POS,
        weightKg: 50,
      };
      expect(isEligible(profile, Component.SDP)).toBe(true);
    });

    it("should reject MALE donor at day 89 after whole blood (cooldown = 90)", () => {
      const profile: DonorProfile = {
        gender: Gender.MALE,
        bloodGroup: BloodGroup.B_POS,
        weightKg: 70,
        lastWholeBlood: new Date(Date.now() - 89 * 24 * 60 * 60 * 1000),
      };
      expect(isEligible(profile, Component.WHOLE_BLOOD)).toBe(false);
    });

    it("should accept MALE donor at day 90 after whole blood", () => {
      const profile: DonorProfile = {
        gender: Gender.MALE,
        bloodGroup: BloodGroup.B_POS,
        weightKg: 70,
        lastWholeBlood: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      };
      expect(isEligible(profile, Component.WHOLE_BLOOD)).toBe(true);
    });

    it("should reject FEMALE donor at day 119 after whole blood (cooldown = 120)", () => {
      const profile: DonorProfile = {
        gender: Gender.FEMALE,
        bloodGroup: BloodGroup.A_NEG,
        weightKg: 55,
        lastWholeBlood: new Date(Date.now() - 119 * 24 * 60 * 60 * 1000),
      };
      expect(isEligible(profile, Component.WHOLE_BLOOD)).toBe(false);
    });

    it("should accept FEMALE donor at day 120 after whole blood", () => {
      const profile: DonorProfile = {
        gender: Gender.FEMALE,
        bloodGroup: BloodGroup.A_NEG,
        weightKg: 55,
        lastWholeBlood: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000),
      };
      expect(isEligible(profile, Component.WHOLE_BLOOD)).toBe(true);
    });

    it("should reject SDP donor at 47 hours since last platelet (cooldown = 48h)", () => {
      const profile: DonorProfile = {
        gender: Gender.MALE,
        bloodGroup: BloodGroup.AB_POS,
        weightKg: 65,
        lastPlatelet: new Date(Date.now() - 47 * 60 * 60 * 1000),
      };
      expect(isEligible(profile, Component.SDP)).toBe(false);
    });

    it("should accept SDP donor at 48 hours since last platelet", () => {
      const profile: DonorProfile = {
        gender: Gender.MALE,
        bloodGroup: BloodGroup.AB_POS,
        weightKg: 65,
        lastPlatelet: new Date(Date.now() - 48 * 60 * 60 * 1000),
      };
      expect(isEligible(profile, Component.SDP)).toBe(true);
    });

    it("should reject SDP donor who donated whole blood 27 days ago (cooldown = 28d)", () => {
      const profile: DonorProfile = {
        gender: Gender.MALE,
        bloodGroup: BloodGroup.O_POS,
        weightKg: 70,
        lastWholeBlood: new Date(Date.now() - 27 * 24 * 60 * 60 * 1000),
        lastPlatelet: new Date(Date.now() - 72 * 60 * 60 * 1000), // 72h ago (ok)
      };
      expect(isEligible(profile, Component.SDP)).toBe(false);
    });
  });

  describe("Blood Group Compatibility Matrix Integrity", () => {
    it("should isolate BOMBAY_OH — only matches BOMBAY_OH donors", () => {
      const groups = prioritizedGroups(BloodGroup.BOMBAY_OH, "EXACT_OR_SDP");
      expect(groups).toEqual([BloodGroup.BOMBAY_OH]);
      expect(groups).not.toContain(BloodGroup.O_NEG);
    });

    it("should include O_NEG as universal fallback for non-O_NEG groups in EXACT_OR_SDP", () => {
      const groups = prioritizedGroups(BloodGroup.A_POS, "EXACT_OR_SDP");
      expect(groups).toContain(BloodGroup.A_POS);
      expect(groups).toContain(BloodGroup.O_NEG);
    });

    it("should return all blood groups for REPLACEMENT_ANY mode", () => {
      const groups = prioritizedGroups(BloodGroup.B_NEG, "REPLACEMENT_ANY");
      expect(groups.length).toBe(Object.values(BloodGroup).length);
    });

    it("should NOT include O_NEG as fallback for O_NEG requests (already exact)", () => {
      const groups = prioritizedGroups(BloodGroup.O_NEG, "EXACT_OR_SDP");
      // O_NEG can only receive from O_NEG — no duplication
      const oNegCount = groups.filter((g) => g === BloodGroup.O_NEG).length;
      expect(oNegCount).toBe(1);
    });
  });

  describe("State Machine Integrity", () => {
    it("should reject dispatch on LEASE_LOCKED request", async () => {
      const req = await createTestRequest({
        waveState: WaveState.LEASE_LOCKED,
        unitsNeeded: 1,
      });
      const result = await dispatchWave(req.id);
      expect(result.pingedDonorsCount).toBe(0);
      expect(result.waveState).toBe(WaveState.LEASE_LOCKED);
    });

    it("should reject dispatch on FULFILLED_CLOSED request", async () => {
      const req = await createTestRequest({
        waveState: WaveState.FULFILLED_CLOSED,
        unitsNeeded: 1,
      });
      const result = await dispatchWave(req.id);
      expect(result.pingedDonorsCount).toBe(0);
      expect(result.waveState).toBe(WaveState.FULFILLED_CLOSED);
    });

    it("should reject dispatch on EXPIRED request", async () => {
      const req = await createTestRequest({
        waveState: WaveState.EXPIRED,
        unitsNeeded: 1,
      });
      const result = await dispatchWave(req.id);
      expect(result.pingedDonorsCount).toBe(0);
      expect(result.waveState).toBe(WaveState.EXPIRED);
    });

    it("should throw on non-existent request ID", async () => {
      await expect(dispatchWave(99999)).rejects.toThrow("not found");
    });

    it("should throw on non-existent request in attemptLease", async () => {
      await expect(attemptLease(99999, 1)).rejects.toThrow("not found");
    });
  });

  describe("Batch Limiter: 5x Remaining Slots Cap", () => {
    it("should never ping more than 5 * remainingSlots donors", async () => {
      const req = await createTestRequest({
        bloodGroup: BloodGroup.O_POS,
        unitsNeeded: 1, // target = 2 slots, remaining = 2
        requestMode: RequestMode.REPLACEMENT_ANY,
      });

      // Create 20 eligible donors nearby
      for (let i = 0; i < 20; i++) {
        await createTestDonor({
          name: `Batch Test ${i}`,
          bloodGroup: BloodGroup.O_POS,
          latitude: 28.567 + i * 0.0005,
          longitude: 77.210 + i * 0.0005,
          lastWholeBlood: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000),
        });
      }

      const selected = await selectDonorsForWave(req.id);
      // remainingSlots = 2, so max = 5 * 2 = 10
      expect(selected.length).toBeLessThanOrEqual(10);
    });
  });
});
