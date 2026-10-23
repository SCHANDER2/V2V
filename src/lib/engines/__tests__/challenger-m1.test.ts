/**
 * Adversarial Challenger Test Suite for Milestone 1
 * Targets:
 * 1. Concurrency & race conditions on attemptLease (Counter-Loop 2)
 * 2. Dead-man's switch: evicting expired leases & promoting earliest standby (Counter-Loop 3)
 * 3. NBTC eligibility boundaries: 89d vs 90d (M), 119d vs 120d (F), 49kg vs 50kg (SDP), 47h vs 48h (platelets)
 * 4. Expanding wave selection (0-3km, 3-7km, 7-15km) and 72h anti-spam ping cooldown filtering
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
import {
  attemptLease,
  evictExpiredLeases,
  maybeLockRequest,
} from "../lease-manager";
import {
  selectDonorsForWave,
  pingDonors,
  advanceWaveOrClose,
  dispatchWave,
} from "../dispatcher";
import { isEligible } from "../eligibility";
import { HaversineDistance } from "@/utils/haversine";

const prisma = new PrismaClient();

const AIIMS_LAT = 28.5672;
const AIIMS_LNG = 77.2100;

let phoneCounter = 1;
function getUniquePhone(): string {
  const ts = Date.now().toString().slice(-6);
  return `+9199${ts}${String(phoneCounter++).padStart(3, "0")}`;
}

// Helper to compute offset coordinates for exact distance tests
function offsetCoordsKm(lat: number, lng: number, distanceKm: number): { lat: number; lng: number } {
  // Approximate 1 deg lat = 111.195 km
  const dLat = distanceKm / 111.195;
  return { lat: lat + dLat, lng };
}

async function cleanupChallengeData() {
  await prisma.donorLease.deleteMany({
    where: {
      OR: [
        { request: { shortHash: { startsWith: "chal_" } } },
        { donor: { phoneNumber: { startsWith: "+9199" } } },
      ],
    },
  });
  await prisma.emergencyRequest.deleteMany({
    where: { shortHash: { startsWith: "chal_" } },
  });
  await prisma.donor.deleteMany({
    where: { phoneNumber: { startsWith: "+9199" } },
  });
}

describe("Adversarial Milestone 1 Challenge Harness", () => {
  beforeAll(async () => {
    await cleanupChallengeData();
  });

  afterAll(async () => {
    await cleanupChallengeData();
    await prisma.$disconnect();
  });

  // =========================================================================
  // AREA 1: CONCURRENCY & RACE CONDITIONS (attemptLease - Counter-Loop 2)
  // =========================================================================
  describe("Area 1: Concurrency & Race Conditions (Counter-Loop 2)", () => {
    test("Simultaneous requests competing for the LAST active slot: exactly 1 JIT_PASSED, 1 STANDBY", async () => {
      // Create request needing 1 unit -> targetSlots = N + 1 = 2
      const req = await prisma.emergencyRequest.create({
        data: {
          patientName: "Concurrent Patient A",
          patientUhid: "UHID-CONCUR-01",
          hospitalName: "AIIMS Delhi, Trauma Centre",
          hospitalLat: AIIMS_LAT,
          hospitalLng: AIIMS_LNG,
          component: Component.WHOLE_BLOOD,
          bloodGroup: BloodGroup.O_POS,
          requestMode: RequestMode.REPLACEMENT_ANY,
          unitsNeeded: 1, // Target slots: 1 + 1 = 2
          waveState: WaveState.WAVE_1_DISPATCH,
          shortHash: "chal_concur_1_" + Date.now(),
          expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000),
        },
      });

      // Create pre-existing active donor filling slot 1 of 2
      const donorPre = await prisma.donor.create({
        data: {
          name: "Pre-existing Donor",
          phoneNumber: getUniquePhone(),
          latitude: AIIMS_LAT,
          longitude: AIIMS_LNG,
          bloodGroup: BloodGroup.O_POS,
          gender: Gender.MALE,
          weightKg: 70,
        },
      });

      const leasePre = await attemptLease(req.id, donorPre.id);
      expect(leasePre.status).toBe(LeaseStatus.JIT_PASSED);

      // Now create two candidate donors competing simultaneously for the remaining 1 slot
      const donorA = await prisma.donor.create({
        data: {
          name: "Contender Donor A",
          phoneNumber: getUniquePhone(),
          latitude: AIIMS_LAT + 0.005,
          longitude: AIIMS_LNG,
          bloodGroup: BloodGroup.O_POS,
          gender: Gender.MALE,
          weightKg: 72,
        },
      });

      const donorB = await prisma.donor.create({
        data: {
          name: "Contender Donor B",
          phoneNumber: getUniquePhone(),
          latitude: AIIMS_LAT + 0.006,
          longitude: AIIMS_LNG,
          bloodGroup: BloodGroup.O_POS,
          gender: Gender.FEMALE,
          weightKg: 65,
        },
      });

      // Fire simultaneous attemptLease calls
      const [resultA, resultB] = await Promise.all([
        attemptLease(req.id, donorA.id),
        attemptLease(req.id, donorB.id),
      ]);

      const statuses = [resultA.status, resultB.status].sort();
      expect(statuses).toEqual([LeaseStatus.JIT_PASSED, LeaseStatus.STANDBY]);

      // Check the JIT_PASSED lease has a 4-digit handshake PIN and ~25 min expiry
      const jitPassedLease = resultA.status === LeaseStatus.JIT_PASSED ? resultA : resultB;
      const standbyLease = resultA.status === LeaseStatus.STANDBY ? resultA : resultB;

      expect(jitPassedLease.handshakePin).toMatch(/^\d{4}$/);
      expect(standbyLease.handshakePin).toBeNull();

      // Verify DB total active count is exactly 2 (targetSlots N+1)
      const activeCount = await prisma.donorLease.count({
        where: {
          requestId: req.id,
          status: { in: [LeaseStatus.JIT_PASSED, LeaseStatus.EN_ROUTE, LeaseStatus.ARRIVED] },
        },
      });
      expect(activeCount).toBe(2);

      // Verify maybeLockRequest transitions state to LEASE_LOCKED
      await maybeLockRequest(req.id);
      const lockedReq = await prisma.emergencyRequest.findUnique({ where: { id: req.id } });
      expect(lockedReq?.waveState).toBe(WaveState.LEASE_LOCKED);
    });

    test("Massive contention: 5 concurrent callers competing for 1 slot -> exactly 1 JIT_PASSED, 4 STANDBY", async () => {
      const req = await prisma.emergencyRequest.create({
        data: {
          patientName: "Mass Contention Patient",
          patientUhid: "UHID-CONCUR-02",
          hospitalName: "AIIMS Delhi, Trauma Centre",
          hospitalLat: AIIMS_LAT,
          hospitalLng: AIIMS_LNG,
          component: Component.WHOLE_BLOOD,
          bloodGroup: BloodGroup.O_POS,
          requestMode: RequestMode.REPLACEMENT_ANY,
          unitsNeeded: 1, // Target slots: 2
          waveState: WaveState.WAVE_1_DISPATCH,
          shortHash: "chal_concur_5_" + Date.now(),
          expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000),
        },
      });

      // Fill slot 1 beforehand
      const preDonor = await prisma.donor.create({
        data: {
          name: "Pre Slot 1 Donor",
          phoneNumber: getUniquePhone(),
          latitude: AIIMS_LAT,
          longitude: AIIMS_LNG,
          bloodGroup: BloodGroup.O_POS,
          gender: Gender.MALE,
          weightKg: 70,
        },
      });
      await attemptLease(req.id, preDonor.id);

      // Create 5 competing donors
      const donors: any[] = [];
      for (let i = 1; i <= 5; i++) {
        const d = await prisma.donor.create({
          data: {
            name: `Contender ${i}`,
            phoneNumber: getUniquePhone(),
            latitude: AIIMS_LAT + 0.001 * i,
            longitude: AIIMS_LNG,
            bloodGroup: BloodGroup.O_POS,
            gender: Gender.MALE,
            weightKg: 70,
          },
        });
        donors.push(d);
      }

      // Fire 5 concurrent attemptLease calls
      const results = await Promise.all(
        donors.map((d) => attemptLease(req.id, d.id))
      );

      const jitPassed = results.filter((r) => r.status === LeaseStatus.JIT_PASSED);
      const standby = results.filter((r) => r.status === LeaseStatus.STANDBY);

      expect(jitPassed.length).toBe(1);
      expect(standby.length).toBe(4);

      // Verify total active leases in DB remains strictly 2 (N+1)
      const totalActive = await prisma.donorLease.count({
        where: {
          requestId: req.id,
          status: { in: [LeaseStatus.JIT_PASSED, LeaseStatus.EN_ROUTE, LeaseStatus.ARRIVED] },
        },
      });
      expect(totalActive).toBe(2);
    });
  });

  // =========================================================================
  // AREA 2: DEAD-MAN'S SWITCH (evictExpiredLeases - Counter-Loop 3)
  // =========================================================================
  describe("Area 2: Dead-Man's Switch (Counter-Loop 3)", () => {
    test("Evicts expired active lease and promotes earliest standby with fresh 25m lease and PIN", async () => {
      const now = new Date();
      const req = await prisma.emergencyRequest.create({
        data: {
          patientName: "Dead Man Test Patient",
          patientUhid: "UHID-DMS-01",
          hospitalName: "Indraprastha Apollo Hospital",
          hospitalLat: 28.5401,
          hospitalLng: 77.2832,
          component: Component.WHOLE_BLOOD,
          bloodGroup: BloodGroup.A_POS,
          requestMode: RequestMode.REPLACEMENT_ANY,
          unitsNeeded: 1, // Target: 2
          waveState: WaveState.LEASE_LOCKED,
          shortHash: "chal_dms_1_" + Date.now(),
          expiresAt: new Date(now.getTime() + 12 * 60 * 60 * 1000),
        },
      });

      // Active lease 1: EXPIRED 10 mins ago
      const expiredDonor = await prisma.donor.create({
        data: {
          name: "Ghosting Donor",
          phoneNumber: getUniquePhone(),
          latitude: 28.54,
          longitude: 77.28,
          bloodGroup: BloodGroup.A_POS,
          gender: Gender.MALE,
          weightKg: 75,
        },
      });
      const expiredLease = await prisma.donorLease.create({
        data: {
          requestId: req.id,
          donorId: expiredDonor.id,
          status: LeaseStatus.JIT_PASSED,
          leaseExpiresAt: new Date(now.getTime() - 10 * 60 * 1000), // 10 mins in past
          handshakePin: "1111",
        },
      });

      // Active lease 2: NOT EXPIRED (healthy)
      const healthyDonor = await prisma.donor.create({
        data: {
          name: "Healthy Donor",
          phoneNumber: getUniquePhone(),
          latitude: 28.54,
          longitude: 77.28,
          bloodGroup: BloodGroup.A_POS,
          gender: Gender.FEMALE,
          weightKg: 62,
        },
      });
      const healthyLease = await prisma.donorLease.create({
        data: {
          requestId: req.id,
          donorId: healthyDonor.id,
          status: LeaseStatus.JIT_PASSED,
          leaseExpiresAt: new Date(now.getTime() + 20 * 60 * 1000), // 20 mins in future
          handshakePin: "2222",
        },
      });

      // Standby 1: Registered EARLIER (createdAt: now - 5m)
      const standbyDonor1 = await prisma.donor.create({
        data: {
          name: "Earliest Standby Donor",
          phoneNumber: getUniquePhone(),
          latitude: 28.54,
          longitude: 77.28,
          bloodGroup: BloodGroup.A_POS,
          gender: Gender.MALE,
          weightKg: 68,
        },
      });
      const standbyLease1 = await prisma.donorLease.create({
        data: {
          requestId: req.id,
          donorId: standbyDonor1.id,
          status: LeaseStatus.STANDBY,
          leaseExpiresAt: new Date(now.getTime() + 25 * 60 * 1000),
          createdAt: new Date(now.getTime() - 5 * 60 * 1000), // earlier
        },
      });

      // Standby 2: Registered LATER (createdAt: now - 1m)
      const standbyDonor2 = await prisma.donor.create({
        data: {
          name: "Later Standby Donor",
          phoneNumber: getUniquePhone(),
          latitude: 28.54,
          longitude: 77.28,
          bloodGroup: BloodGroup.A_POS,
          gender: Gender.FEMALE,
          weightKg: 59,
        },
      });
      const standbyLease2 = await prisma.donorLease.create({
        data: {
          requestId: req.id,
          donorId: standbyDonor2.id,
          status: LeaseStatus.STANDBY,
          leaseExpiresAt: new Date(now.getTime() + 25 * 60 * 1000),
          createdAt: new Date(now.getTime() - 1 * 60 * 1000), // later
        },
      });

      // Execute watchdog eviction
      const result = await evictExpiredLeases();

      expect(result.evictedCount).toBeGreaterThanOrEqual(1);
      expect(result.evictedLeaseIds).toContain(expiredLease.id);
      expect(result.promotedLeaseIds).toContain(standbyLease1.id);

      // Verify expired lease status changed to EVICTED_TIMEOUT
      const postExpired = await prisma.donorLease.findUnique({ where: { id: expiredLease.id } });
      expect(postExpired?.status).toBe(LeaseStatus.EVICTED_TIMEOUT);

      // Verify healthy lease untouched
      const postHealthy = await prisma.donorLease.findUnique({ where: { id: healthyLease.id } });
      expect(postHealthy?.status).toBe(LeaseStatus.JIT_PASSED);

      // Verify earliest standby was promoted to JIT_PASSED with fresh 25m lease and new PIN
      const postStandby1 = await prisma.donorLease.findUnique({ where: { id: standbyLease1.id } });
      expect(postStandby1?.status).toBe(LeaseStatus.JIT_PASSED);
      expect(postStandby1?.handshakePin).toMatch(/^\d{4}$/);
      const remainingMinutes = (postStandby1!.leaseExpiresAt.getTime() - Date.now()) / (60 * 1000);
      expect(remainingMinutes).toBeGreaterThan(24);
      expect(remainingMinutes).toBeLessThanOrEqual(25.1);

      // Verify later standby remains in STANDBY
      const postStandby2 = await prisma.donorLease.findUnique({ where: { id: standbyLease2.id } });
      expect(postStandby2?.status).toBe(LeaseStatus.STANDBY);
    });

    test("Protects ARRIVED donors from eviction even if leaseExpiresAt is in the past", async () => {
      const now = new Date();
      const req = await prisma.emergencyRequest.create({
        data: {
          patientName: "Arrived Donor Test",
          patientUhid: "UHID-DMS-ARRIVED",
          hospitalName: "AIIMS Delhi, Trauma Centre",
          hospitalLat: AIIMS_LAT,
          hospitalLng: AIIMS_LNG,
          component: Component.WHOLE_BLOOD,
          bloodGroup: BloodGroup.O_POS,
          requestMode: RequestMode.REPLACEMENT_ANY,
          unitsNeeded: 1,
          waveState: WaveState.LEASE_LOCKED,
          shortHash: "chal_arrived_" + Date.now(),
          expiresAt: new Date(now.getTime() + 12 * 60 * 60 * 1000),
        },
      });

      const arrivedDonor = await prisma.donor.create({
        data: {
          name: "Arrived On Site Donor",
          phoneNumber: getUniquePhone(),
          latitude: AIIMS_LAT,
          longitude: AIIMS_LNG,
          bloodGroup: BloodGroup.O_POS,
          gender: Gender.MALE,
          weightKg: 70,
        },
      });

      const arrivedLease = await prisma.donorLease.create({
        data: {
          requestId: req.id,
          donorId: arrivedDonor.id,
          status: LeaseStatus.ARRIVED,
          leaseExpiresAt: new Date(now.getTime() - 30 * 60 * 1000), // 30m in past
          handshakePin: "3333",
        },
      });

      const result = await evictExpiredLeases();
      expect(result.evictedLeaseIds).not.toContain(arrivedLease.id);

      const checkLease = await prisma.donorLease.findUnique({ where: { id: arrivedLease.id } });
      expect(checkLease?.status).toBe(LeaseStatus.ARRIVED);
    });

    test("Handles eviction when no standby donors are available", async () => {
      const now = new Date();
      const req = await prisma.emergencyRequest.create({
        data: {
          patientName: "No Standby Test",
          patientUhid: "UHID-DMS-NOSTANDBY",
          hospitalName: "AIIMS Delhi, Trauma Centre",
          hospitalLat: AIIMS_LAT,
          hospitalLng: AIIMS_LNG,
          component: Component.WHOLE_BLOOD,
          bloodGroup: BloodGroup.O_POS,
          requestMode: RequestMode.REPLACEMENT_ANY,
          unitsNeeded: 1,
          waveState: WaveState.WAVE_1_DISPATCH,
          shortHash: "chal_nostandby_" + Date.now(),
          expiresAt: new Date(now.getTime() + 12 * 60 * 60 * 1000),
        },
      });

      const ghostDonor = await prisma.donor.create({
        data: {
          name: "Solo Ghost Donor",
          phoneNumber: getUniquePhone(),
          latitude: AIIMS_LAT,
          longitude: AIIMS_LNG,
          bloodGroup: BloodGroup.O_POS,
          gender: Gender.MALE,
          weightKg: 70,
        },
      });

      const ghostLease = await prisma.donorLease.create({
        data: {
          requestId: req.id,
          donorId: ghostDonor.id,
          status: LeaseStatus.JIT_PASSED,
          leaseExpiresAt: new Date(now.getTime() - 5 * 60 * 1000),
          handshakePin: "4444",
        },
      });

      const result = await evictExpiredLeases();
      expect(result.evictedLeaseIds).toContain(ghostLease.id);

      const checkGhost = await prisma.donorLease.findUnique({ where: { id: ghostLease.id } });
      expect(checkGhost?.status).toBe(LeaseStatus.EVICTED_TIMEOUT);
    });
  });

  // =========================================================================
  // AREA 3: NBTC ELIGIBILITY BOUNDARIES (isEligible)
  // =========================================================================
  describe("Area 3: NBTC Clinical Eligibility Boundaries", () => {
    // 3A: Male Whole Blood: 89d vs 90d
    test("Male Whole Blood cooldown: 89 days fail, 90 days pass", () => {
      const now = new Date();
      const d89Ago = new Date(now.getTime() - 89 * 24 * 60 * 60 * 1000);
      const d90Ago = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      const d91Ago = new Date(now.getTime() - 91 * 24 * 60 * 60 * 1000);

      const male89 = {
        gender: Gender.MALE,
        bloodGroup: BloodGroup.O_POS,
        weightKg: 70,
        lastWholeBlood: d89Ago,
      };
      const male90 = {
        gender: Gender.MALE,
        bloodGroup: BloodGroup.O_POS,
        weightKg: 70,
        lastWholeBlood: d90Ago,
      };
      const male91 = {
        gender: Gender.MALE,
        bloodGroup: BloodGroup.O_POS,
        weightKg: 70,
        lastWholeBlood: d91Ago,
      };

      expect(isEligible(male89, Component.WHOLE_BLOOD)).toBe(false);
      expect(isEligible(male90, Component.WHOLE_BLOOD)).toBe(true);
      expect(isEligible(male91, Component.WHOLE_BLOOD)).toBe(true);
    });

    // 3B: Female Whole Blood: 119d vs 120d
    test("Female Whole Blood cooldown: 119 days fail, 120 days pass", () => {
      const now = new Date();
      const d119Ago = new Date(now.getTime() - 119 * 24 * 60 * 60 * 1000);
      const d120Ago = new Date(now.getTime() - 120 * 24 * 60 * 60 * 1000);
      const d121Ago = new Date(now.getTime() - 121 * 24 * 60 * 60 * 1000);

      const female119 = {
        gender: Gender.FEMALE,
        bloodGroup: BloodGroup.A_POS,
        weightKg: 60,
        lastWholeBlood: d119Ago,
      };
      const female120 = {
        gender: Gender.FEMALE,
        bloodGroup: BloodGroup.A_POS,
        weightKg: 60,
        lastWholeBlood: d120Ago,
      };
      const female121 = {
        gender: Gender.FEMALE,
        bloodGroup: BloodGroup.A_POS,
        weightKg: 60,
        lastWholeBlood: d121Ago,
      };

      expect(isEligible(female119, Component.WHOLE_BLOOD)).toBe(false);
      expect(isEligible(female120, Component.WHOLE_BLOOD)).toBe(true);
      expect(isEligible(female121, Component.WHOLE_BLOOD)).toBe(true);
    });

    // 3C: Body Weight Thresholds: SDP 49kg vs 50kg, WB 44kg vs 45kg
    test("Weight boundaries: SDP requires >= 50kg, Whole Blood requires >= 45kg", () => {
      const sdp49 = {
        gender: Gender.MALE,
        bloodGroup: BloodGroup.B_POS,
        weightKg: 49.0,
      };
      const sdp49_9 = {
        gender: Gender.MALE,
        bloodGroup: BloodGroup.B_POS,
        weightKg: 49.9,
      };
      const sdp50 = {
        gender: Gender.MALE,
        bloodGroup: BloodGroup.B_POS,
        weightKg: 50.0,
      };

      expect(isEligible(sdp49, Component.SDP)).toBe(false);
      expect(isEligible(sdp49_9, Component.SDP)).toBe(false);
      expect(isEligible(sdp50, Component.SDP)).toBe(true);

      const wb44 = {
        gender: Gender.FEMALE,
        bloodGroup: BloodGroup.B_POS,
        weightKg: 44.0,
      };
      const wb44_9 = {
        gender: Gender.FEMALE,
        bloodGroup: BloodGroup.B_POS,
        weightKg: 44.9,
      };
      const wb45 = {
        gender: Gender.FEMALE,
        bloodGroup: BloodGroup.B_POS,
        weightKg: 45.0,
      };

      expect(isEligible(wb44, Component.WHOLE_BLOOD)).toBe(false);
      expect(isEligible(wb44_9, Component.WHOLE_BLOOD)).toBe(false);
      expect(isEligible(wb45, Component.WHOLE_BLOOD)).toBe(true);
    });

    // 3D: Platelet Apheresis (SDP) Cooldown: 47h vs 48h
    test("Platelet apheresis cooldown: 47 hours fail, 48 hours pass", () => {
      const now = new Date();
      const h47Ago = new Date(now.getTime() - 47 * 60 * 60 * 1000);
      const h48Ago = new Date(now.getTime() - 48 * 60 * 60 * 1000);
      const h49Ago = new Date(now.getTime() - 49 * 60 * 60 * 1000);

      const donor47h = {
        gender: Gender.MALE,
        bloodGroup: BloodGroup.AB_POS,
        weightKg: 75,
        lastPlatelet: h47Ago,
      };
      const donor48h = {
        gender: Gender.MALE,
        bloodGroup: BloodGroup.AB_POS,
        weightKg: 75,
        lastPlatelet: h48Ago,
      };
      const donor49h = {
        gender: Gender.MALE,
        bloodGroup: BloodGroup.AB_POS,
        weightKg: 75,
        lastPlatelet: h49Ago,
      };

      expect(isEligible(donor47h, Component.SDP)).toBe(false);
      expect(isEligible(donor48h, Component.SDP)).toBe(true);
      expect(isEligible(donor49h, Component.SDP)).toBe(true);
    });

    // 3E: Prior Whole Blood donation before SDP: 27d vs 28d
    test("Prior Whole Blood donation before SDP: 27 days fail, 28 days pass", () => {
      const now = new Date();
      const d27Ago = new Date(now.getTime() - 27 * 24 * 60 * 60 * 1000);
      const d28Ago = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);

      const donor27d = {
        gender: Gender.MALE,
        bloodGroup: BloodGroup.O_POS,
        weightKg: 75,
        lastWholeBlood: d27Ago,
      };
      const donor28d = {
        gender: Gender.MALE,
        bloodGroup: BloodGroup.O_POS,
        weightKg: 75,
        lastWholeBlood: d28Ago,
      };

      expect(isEligible(donor27d, Component.SDP)).toBe(false);
      expect(isEligible(donor28d, Component.SDP)).toBe(true);
    });

    // 3F: First time donor with null history
    test("First-time donor with null history is eligible", () => {
      const donorFirstTime = {
        gender: Gender.FEMALE,
        bloodGroup: BloodGroup.A_NEG,
        weightKg: 55,
        lastWholeBlood: null,
        lastPlatelet: null,
      };
      expect(isEligible(donorFirstTime, Component.WHOLE_BLOOD)).toBe(true);
      expect(isEligible(donorFirstTime, Component.PRBC)).toBe(true);
      expect(isEligible(donorFirstTime, Component.SDP)).toBe(true);
    });
  });

  // =========================================================================
  // AREA 4: EXPANDING WAVE SELECTION & 72H COOLDOWN (dispatcher.ts)
  // =========================================================================
  describe("Area 4: Expanding Wave Selection & 72h Anti-Spam Ping Cooldown", () => {
    test("Geospatial ring boundaries strictly filter Wave 1 (0-3km), Wave 2 (3-7km), Wave 3 (7-15km)", async () => {
      // Calculate coordinates at known distances from AIIMS
      const coords1_5km = offsetCoordsKm(AIIMS_LAT, AIIMS_LNG, 1.5);
      const coords5_0km = offsetCoordsKm(AIIMS_LAT, AIIMS_LNG, 5.0);
      const coords10_0km = offsetCoordsKm(AIIMS_LAT, AIIMS_LNG, 10.0);
      const coords18_0km = offsetCoordsKm(AIIMS_LAT, AIIMS_LNG, 18.0);

      // Verify Haversine calculations directly
      const d1 = HaversineDistance(AIIMS_LAT, AIIMS_LNG, coords1_5km.lat, coords1_5km.lng);
      const d2 = HaversineDistance(AIIMS_LAT, AIIMS_LNG, coords5_0km.lat, coords5_0km.lng);
      const d3 = HaversineDistance(AIIMS_LAT, AIIMS_LNG, coords10_0km.lat, coords10_0km.lng);
      const d4 = HaversineDistance(AIIMS_LAT, AIIMS_LNG, coords18_0km.lat, coords18_0km.lng);

      expect(d1).toBeCloseTo(1.5, 1);
      expect(d2).toBeCloseTo(5.0, 1);
      expect(d3).toBeCloseTo(10.0, 1);
      expect(d4).toBeCloseTo(18.0, 1);

      // Create isolated donors with unique blood group BOMBAY_OH so no other donors interfere
      const dWave1 = await prisma.donor.create({
        data: {
          name: "Wave 1 Donor (1.5km)",
          phoneNumber: getUniquePhone(),
          latitude: coords1_5km.lat,
          longitude: coords1_5km.lng,
          bloodGroup: BloodGroup.BOMBAY_OH,
          gender: Gender.MALE,
          weightKg: 70,
        },
      });

      const dWave2 = await prisma.donor.create({
        data: {
          name: "Wave 2 Donor (5.0km)",
          phoneNumber: getUniquePhone(),
          latitude: coords5_0km.lat,
          longitude: coords5_0km.lng,
          bloodGroup: BloodGroup.BOMBAY_OH,
          gender: Gender.MALE,
          weightKg: 70,
        },
      });

      const dWave3 = await prisma.donor.create({
        data: {
          name: "Wave 3 Donor (10.0km)",
          phoneNumber: getUniquePhone(),
          latitude: coords10_0km.lat,
          longitude: coords10_0km.lng,
          bloodGroup: BloodGroup.BOMBAY_OH,
          gender: Gender.MALE,
          weightKg: 70,
        },
      });

      const dOutside = await prisma.donor.create({
        data: {
          name: "Outside Donor (18.0km)",
          phoneNumber: getUniquePhone(),
          latitude: coords18_0km.lat,
          longitude: coords18_0km.lng,
          bloodGroup: BloodGroup.BOMBAY_OH,
          gender: Gender.MALE,
          weightKg: 70,
        },
      });

      // Create test request for BOMBAY_OH
      const req = await prisma.emergencyRequest.create({
        data: {
          patientName: "Bombay Blood Patient",
          patientUhid: "UHID-BOMBAY-01",
          hospitalName: "AIIMS Delhi, Trauma Centre",
          hospitalLat: AIIMS_LAT,
          hospitalLng: AIIMS_LNG,
          component: Component.WHOLE_BLOOD,
          bloodGroup: BloodGroup.BOMBAY_OH,
          requestMode: RequestMode.EXACT_OR_SDP,
          unitsNeeded: 1,
          waveState: WaveState.WAVE_1_DISPATCH,
          shortHash: "chal_wave_" + Date.now(),
          expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000),
        },
      });

      // Wave 1 test: should select only dWave1
      const w1Donors = await selectDonorsForWave(req.id);
      const w1Ids = w1Donors.map((d) => d.id);
      expect(w1Ids).toContain(dWave1.id);
      expect(w1Ids).not.toContain(dWave2.id);
      expect(w1Ids).not.toContain(dWave3.id);
      expect(w1Ids).not.toContain(dOutside.id);

      // Advance to Wave 2
      await advanceWaveOrClose(req.id);
      const reqAfterW1 = await prisma.emergencyRequest.findUnique({ where: { id: req.id } });
      expect(reqAfterW1?.waveState).toBe(WaveState.WAVE_2_DISPATCH);

      const w2Donors = await selectDonorsForWave(req.id);
      const w2Ids = w2Donors.map((d) => d.id);
      expect(w2Ids).toContain(dWave2.id);
      expect(w2Ids).not.toContain(dWave1.id);
      expect(w2Ids).not.toContain(dWave3.id);
      expect(w2Ids).not.toContain(dOutside.id);

      // Advance to Wave 3
      await advanceWaveOrClose(req.id);
      const reqAfterW2 = await prisma.emergencyRequest.findUnique({ where: { id: req.id } });
      expect(reqAfterW2?.waveState).toBe(WaveState.WAVE_3_DISPATCH);

      const w3Donors = await selectDonorsForWave(req.id);
      const w3Ids = w3Donors.map((d) => d.id);
      expect(w3Ids).toContain(dWave3.id);
      expect(w3Ids).not.toContain(dWave1.id);
      expect(w3Ids).not.toContain(dWave2.id);
      expect(w3Ids).not.toContain(dOutside.id);

      // Advance beyond Wave 3 -> should EXPIRE
      await advanceWaveOrClose(req.id);
      const reqAfterW3 = await prisma.emergencyRequest.findUnique({ where: { id: req.id } });
      expect(reqAfterW3?.waveState).toBe(WaveState.EXPIRED);
    });

    test("72-hour anti-spam ping cooldown: 71 hours excluded, 73 hours included, never pinged included", async () => {
      const now = new Date();
      const coordsW1 = offsetCoordsKm(AIIMS_LAT, AIIMS_LNG, 1.2);

      // Donor A: pinged 71 hours ago (< 72h cooldown threshold -> EXCLUDED)
      const donor71h = await prisma.donor.create({
        data: {
          name: "Donor Pinged 71h Ago",
          phoneNumber: getUniquePhone(),
          latitude: coordsW1.lat,
          longitude: coordsW1.lng,
          bloodGroup: BloodGroup.AB_NEG,
          gender: Gender.MALE,
          weightKg: 70,
          lastPingedAt: new Date(now.getTime() - 71 * 60 * 60 * 1000),
        },
      });

      // Donor B: pinged 73 hours ago (> 72h cooldown threshold -> INCLUDED)
      const donor73h = await prisma.donor.create({
        data: {
          name: "Donor Pinged 73h Ago",
          phoneNumber: getUniquePhone(),
          latitude: coordsW1.lat + 0.001,
          longitude: coordsW1.lng,
          bloodGroup: BloodGroup.AB_NEG,
          gender: Gender.MALE,
          weightKg: 70,
          lastPingedAt: new Date(now.getTime() - 73 * 60 * 60 * 1000),
        },
      });

      // Donor C: never pinged (lastPingedAt = null -> INCLUDED)
      const donorNever = await prisma.donor.create({
        data: {
          name: "Donor Never Pinged",
          phoneNumber: getUniquePhone(),
          latitude: coordsW1.lat + 0.002,
          longitude: coordsW1.lng,
          bloodGroup: BloodGroup.AB_NEG,
          gender: Gender.FEMALE,
          weightKg: 60,
          lastPingedAt: null,
        },
      });

      // Create request for AB_NEG
      const req = await prisma.emergencyRequest.create({
        data: {
          patientName: "Cooldown Test Patient",
          patientUhid: "UHID-COOL-01",
          hospitalName: "AIIMS Delhi, Trauma Centre",
          hospitalLat: AIIMS_LAT,
          hospitalLng: AIIMS_LNG,
          component: Component.WHOLE_BLOOD,
          bloodGroup: BloodGroup.AB_NEG,
          requestMode: RequestMode.EXACT_OR_SDP,
          unitsNeeded: 2,
          waveState: WaveState.WAVE_1_DISPATCH,
          shortHash: "chal_cooldown_" + Date.now(),
          expiresAt: new Date(now.getTime() + 12 * 60 * 60 * 1000),
        },
      });

      const selected = await selectDonorsForWave(req.id);
      const selectedIds = selected.map((d) => d.id);

      expect(selectedIds).not.toContain(donor71h.id);
      expect(selectedIds).toContain(donor73h.id);
      expect(selectedIds).toContain(donorNever.id);
    });

    test("Batch limit multiplier enforces at most (5 * remainingSlots)", async () => {
      // Request with unitsNeeded = 1 -> targetSlots = 2 (N+1)
      // Active leases = 0 -> remainingSlots = 2 -> limit = 5 * 2 = 10
      const req = await prisma.emergencyRequest.create({
        data: {
          patientName: "Batch Limit Patient",
          patientUhid: "UHID-BATCH-01",
          hospitalName: "AIIMS Delhi, Trauma Centre",
          hospitalLat: AIIMS_LAT,
          hospitalLng: AIIMS_LNG,
          component: Component.WHOLE_BLOOD,
          bloodGroup: BloodGroup.BOMBAY_OH,
          requestMode: RequestMode.EXACT_OR_SDP,
          unitsNeeded: 1, // Target: 2 slots
          waveState: WaveState.WAVE_1_DISPATCH,
          shortHash: "chal_batch_" + Date.now(),
          expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000),
        },
      });

      // Create 15 eligible donors in Wave 1
      for (let i = 1; i <= 15; i++) {
        const coords = offsetCoordsKm(AIIMS_LAT, AIIMS_LNG, 0.1 + i * 0.15); // all within 0.25 - 2.35km
        await prisma.donor.create({
          data: {
            name: `Batch Donor ${i}`,
            phoneNumber: getUniquePhone(),
            latitude: coords.lat,
            longitude: coords.lng,
            bloodGroup: BloodGroup.BOMBAY_OH,
            gender: Gender.MALE,
            weightKg: 70,
          },
        });
      }

      // Test with 0 active leases: remaining slots = 2 -> limit = 10
      const selected0 = await selectDonorsForWave(req.id);
      expect(selected0.length).toBe(10);

      // Create 1 active lease: remaining slots = 1 -> limit = 5
      await attemptLease(req.id, selected0[0].id);
      const selected1 = await selectDonorsForWave(req.id);
      expect(selected1.length).toBe(5);

      // Create 2nd active lease: remaining slots = 0 -> limit = 0
      await attemptLease(req.id, selected0[1].id);
      const selected2 = await selectDonorsForWave(req.id);
      expect(selected2.length).toBe(0);
    });
  });
});
