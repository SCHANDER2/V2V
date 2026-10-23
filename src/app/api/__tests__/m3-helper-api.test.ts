// src/app/api/__tests__/m3-helper-api.test.ts
import { POST as arriveHandler } from "@/app/api/lease/arrive/route";
import { POST as updateEtaHandler } from "@/app/api/lease/update-eta/route";
import { POST as triggerWaveHandler } from "@/app/api/simulator/trigger-wave/route";
import { POST as ghostDonorHandler } from "@/app/api/simulator/ghost-donor/route";
import { GET as donorRespondHandler } from "@/app/api/donor/respond/[token]/route";
import prisma from "@/lib/prisma";
import { BloodGroup, Component, LeaseStatus, RequestMode, WaveState } from "@/types/enums";

describe("Milestone 3 Helper Routes Test Suite", () => {
  let testRequestId: number;
  let testDonorId: number;
  let testStandbyDonorId: number;
  let testLeaseId: number;
  let testStandbyLeaseId: number;
  let testShortHash: string;

  beforeAll(async () => {
    // 1. Create a primary donor
    const donor = await prisma.donor.create({
      data: {
        name: "Test JIT Donor",
        phoneNumber: `+919999${Math.floor(100000 + Math.random() * 900000)}`,
        latitude: 28.5672,
        longitude: 77.2100,
        bloodGroup: BloodGroup.B_POS,
        gender: "MALE",
        weightKg: 75,
      },
    });
    testDonorId = donor.id;

    // 2. Create a standby donor
    const standbyDonor = await prisma.donor.create({
      data: {
        name: "Test Standby Donor",
        phoneNumber: `+919888${Math.floor(100000 + Math.random() * 900000)}`,
        latitude: 28.5680,
        longitude: 77.2110,
        bloodGroup: BloodGroup.B_POS,
        gender: "FEMALE",
        weightKg: 58,
      },
    });
    testStandbyDonorId = standbyDonor.id;

    // 3. Create emergency request
    testShortHash = `m3_${Math.random().toString(36).substring(2, 11)}`;
    const request = await prisma.emergencyRequest.create({
      data: {
        patientName: "Emergency Test Patient",
        patientUhid: "UHID-M3-TEST",
        hospitalName: "AIIMS Delhi, Trauma Centre",
        hospitalLat: 28.5672,
        hospitalLng: 77.2100,
        component: Component.SDP,
        bloodGroup: BloodGroup.B_POS,
        requestMode: RequestMode.EXACT_OR_SDP,
        unitsNeeded: 1,
        waveState: WaveState.WAVE_1_DISPATCH,
        shortHash: testShortHash,
        expiresAt: new Date(Date.now() + 12 * 3600 * 1000),
      },
    });
    testRequestId = request.id;

    // 4. Create an active lease
    const lease = await prisma.donorLease.create({
      data: {
        requestId: testRequestId,
        donorId: testDonorId,
        status: LeaseStatus.JIT_PASSED,
        leaseExpiresAt: new Date(Date.now() + 25 * 60 * 1000),
        handshakePin: "7721",
      },
    });
    testLeaseId = lease.id;

    // 5. Create a standby lease for promotion test
    const standbyLease = await prisma.donorLease.create({
      data: {
        requestId: testRequestId,
        donorId: testStandbyDonorId,
        status: LeaseStatus.STANDBY,
        leaseExpiresAt: new Date(Date.now() + 25 * 60 * 1000),
      },
    });
    testStandbyLeaseId = standbyLease.id;
  });

  afterAll(async () => {
    try {
      if (testRequestId) {
        await prisma.donorLease.deleteMany({ where: { requestId: testRequestId } });
        await prisma.emergencyRequest.deleteMany({ where: { id: testRequestId } });
      }
      if (testDonorId || testStandbyDonorId) {
        await prisma.donor.deleteMany({
          where: { id: { in: [testDonorId, testStandbyDonorId].filter(Boolean) } },
        });
      }
    } catch {
      // Best-effort cleanup
    }
    await prisma.$disconnect();
  });

  describe("GET /api/donor/respond/[token]", () => {
    it("resolves hyphenated token (requestId-donorId) correctly", async () => {
      const token = `${testRequestId}-${testDonorId}`;
      const req = new Request(`http://localhost:3000/api/donor/respond/${token}`);
      const res = await donorRespondHandler(req, { params: { token } });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.request.id).toBe(testRequestId);
      expect(data.donor.id).toBe(testDonorId);
      expect(data.lease).toBeDefined();
      expect(data.lease.id).toBe(testLeaseId);
      expect(data.sidecarUrl).toContain("sidecar://science/biomolecular_structure_viewer");
    });

    it("resolves base64url JSON token correctly", async () => {
      const jsonToken = Buffer.from(
        JSON.stringify({ requestId: testRequestId, donorId: testDonorId })
      ).toString("base64url");

      const req = new Request(`http://localhost:3000/api/donor/respond/${jsonToken}`);
      const res = await donorRespondHandler(req, { params: { token: jsonToken } });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.request.id).toBe(testRequestId);
    });

    it("returns 400 for malformed token", async () => {
      const req = new Request("http://localhost:3000/api/donor/respond/invalid_token_xyz");
      const res = await donorRespondHandler(req, { params: { token: "invalid_token_xyz" } });
      expect(res.status).toBe(400);
    });
  });

  describe("POST /api/lease/update-eta", () => {
    it("updates donor ETA and advances status to EN_ROUTE", async () => {
      const req = new Request("http://localhost:3000/api/lease/update-eta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leaseId: testLeaseId, etaMinutes: 15 }),
      });

      const res = await updateEtaHandler(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.status).toBe(LeaseStatus.EN_ROUTE);
      expect(data.etaMinutes).toBe(15);
    });

    it("rejects invalid etaMinutes exceeding 60", async () => {
      const req = new Request("http://localhost:3000/api/lease/update-eta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leaseId: testLeaseId, etaMinutes: 999 }),
      });

      const res = await updateEtaHandler(req);
      expect(res.status).toBe(400);
    });
  });

  describe("POST /api/lease/arrive", () => {
    it("transitions lease to ARRIVED and halts countdown", async () => {
      const req = new Request("http://localhost:3000/api/lease/arrive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leaseId: testLeaseId }),
      });

      const res = await arriveHandler(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.status).toBe(LeaseStatus.ARRIVED);
      expect(data.handshakePin).toBe("7721");
    });

    it("is idempotent when called again for already arrived donor", async () => {
      const req = new Request("http://localhost:3000/api/lease/arrive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leaseId: testLeaseId }),
      });

      const res = await arriveHandler(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.status).toBe(LeaseStatus.ARRIVED);
    });
  });

  describe("POST /api/simulator/trigger-wave", () => {
    it("executes wave dispatch and returns radius expansion logs", async () => {
      const req = new Request("http://localhost:3000/api/simulator/trigger-wave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: testRequestId }),
      });

      const res = await triggerWaveHandler(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.logs)).toBe(true);
      expect(data.waveRadius).toBeDefined();
    });

    it("returns 404 for non-existent request", async () => {
      const req = new Request("http://localhost:3000/api/simulator/trigger-wave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: 999999 }),
      });

      const res = await triggerWaveHandler(req);
      expect(res.status).toBe(404);
    });
  });

  describe("POST /api/simulator/ghost-donor", () => {
    it("fast-forwards lease expiry, evicts lease, and automatically promotes standby donor", async () => {
      // Create a fresh active lease to ghost
      const ghostLease = await prisma.donorLease.create({
        data: {
          requestId: testRequestId,
          donorId: testDonorId,
          status: LeaseStatus.EN_ROUTE,
          leaseExpiresAt: new Date(Date.now() + 20 * 60 * 1000),
          handshakePin: "9988",
        },
      });

      const req = new Request("http://localhost:3000/api/simulator/ghost-donor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leaseId: ghostLease.id }),
      });

      const res = await ghostDonorHandler(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.newStatus).toBe(LeaseStatus.EVICTED_TIMEOUT);
      expect(data.evictionSummary.evictedCount).toBeGreaterThanOrEqual(1);
      expect(data.evictionSummary.promotedCount).toBeGreaterThanOrEqual(1);
      expect(data.promotedLeaseIds).toContain(testStandbyLeaseId);
    });

    it("rejects ghosting on already evicted lease", async () => {
      const req = new Request("http://localhost:3000/api/simulator/ghost-donor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leaseId: testLeaseId }), // currently ARRIVED
      });

      const res = await ghostDonorHandler(req);
      expect(res.status).toBe(400);
    });
  });
});
