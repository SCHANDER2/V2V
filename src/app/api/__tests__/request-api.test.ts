// src/app/api/__tests__/request-api.test.ts
import { POST as createRequest } from "@/app/api/request/create/route";
import { GET as getRequest } from "@/app/api/request/[shortHash]/route";
import { POST as lockLease } from "@/app/api/lease/lock/route";
import { POST as bridgeTelephony } from "@/app/api/telephony/bridge/route";
import prisma from "@/lib/prisma";
import { BloodGroup, Component, RequestMode, WaveState, LeaseStatus } from "@/types/enums";

describe("API Routes Suite (M2)", () => {
  let createdShortHash: string;
  let createdRequestId: number;
  let sampleDonorId: number;

  beforeAll(async () => {
    // Ensure at least one donor exists for lease locking
    const donor = await prisma.donor.findFirst();
    if (donor) {
      sampleDonorId = donor.id;
    } else {
      const newDonor = await prisma.donor.create({
        data: {
          name: "Vikram Singh",
          phoneNumber: "+919810109999",
          latitude: 28.5672,
          longitude: 77.2100,
          bloodGroup: BloodGroup.O_POS,
          gender: "MALE",
          weightKg: 72,
        },
      });
      sampleDonorId = newDonor.id;
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("POST /api/request/create", () => {
    it("rejects invalid input payloads with 400", async () => {
      const req = new Request("http://localhost:3000/api/request/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const res = await createRequest(req);
      const data = await res.json();
      expect(res.status).toBe(400);
      expect(data.error).toBe("Validation failed");
      expect(Array.isArray(data.details)).toBe(true);
    });

    it("creates an emergency request and returns shortHash with sidecarUrl", async () => {
      const payload = {
        patientName: "Simranjeet Singh",
        UHID: "AIIMS-2026-TEST",
        hospitalName: "AIIMS Delhi, Trauma Centre",
        hospitalLat: 28.5672,
        hospitalLng: 77.2100,
        component: Component.SDP,
        bloodGroup: BloodGroup.B_POS,
        requestMode: RequestMode.EXACT_OR_SDP,
        unitsNeeded: 2,
      };

      const req = new Request("http://localhost:3000/api/request/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const res = await createRequest(req);
      const data = await res.json();

      expect(res.status).toBe(201);
      expect(data.id).toBeDefined();
      expect(data.shortHash).toBeDefined();
      expect(data.shortHash.length).toBe(12);
      expect(data.trackingUrl).toBe(`/r/${data.shortHash}`);
      expect(data.waveState).toBe(WaveState.PENDING_VERIFICATION);
      expect(data.sidecarUrl).toBe(
        "sidecar://science/biomolecular_structure_viewer/ui.html"
      );

      createdShortHash = data.shortHash;
      createdRequestId = data.id;
    });
  });

  describe("GET /api/request/[shortHash]", () => {
    it("returns 404 for unknown shortHash", async () => {
      const req = new Request("http://localhost:3000/api/request/unknown12345");
      const res = await getRequest(req, { params: { shortHash: "unknown12345" } });
      expect(res.status).toBe(404);
    });

    it("fetches request details and masks donor phone numbers", async () => {
      const req = new Request(`http://localhost:3000/api/request/${createdShortHash}`);
      const res = await getRequest(req, { params: { shortHash: createdShortHash } });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.request.patientName).toBe("Simranjeet Singh");
      expect(data.request.shortHash).toBe(createdShortHash);
      expect(data.request.canInitiateCalls).toBe(true);
      expect(Array.isArray(data.activeLeases)).toBe(true);
      expect(Array.isArray(data.standbyLeases)).toBe(true);
      expect(data.request.sidecarUrl).toBe(
        "sidecar://science/biomolecular_structure_viewer/ui.html"
      );
    });
  });

  describe("POST /api/lease/lock", () => {
    it("locks slot atomically and returns lease info", async () => {
      const req = new Request("http://localhost:3000/api/lease/lock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: createdRequestId,
          donorId: sampleDonorId,
        }),
      });

      const res = await lockLease(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.leaseId).toBeDefined();
      expect([LeaseStatus.JIT_PASSED, LeaseStatus.STANDBY]).toContain(data.status);
      if (data.status === LeaseStatus.JIT_PASSED) {
        expect(data.handshakePin).toBeDefined();
        expect(data.handshakePin).toMatch(/^\d{4}$/);
      }
    });

    it("returns existing lease on duplicate call (idempotent)", async () => {
      const req = new Request("http://localhost:3000/api/lease/lock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: createdRequestId,
          donorId: sampleDonorId,
        }),
      });

      const res = await lockLease(req);
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.leaseId).toBeDefined();
    });
  });

  describe("POST /api/telephony/bridge (Counter-Loop 4 & Anti-Tout)", () => {
    it("creates a masked telephony bridge session for an active donor lease", async () => {
      const req = new Request("http://localhost:3000/api/telephony/bridge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: createdRequestId,
          donorId: sampleDonorId,
          attendantPhone: "+919876543210",
        }),
      });

      const res = await bridgeTelephony(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.session.virtualProxyNumber).toMatch(/^\+91114000\d{4}$/);
      expect(data.session.maskedAttendantPhone).toContain("XXXXX");
      expect(data.session.status).toBe("ACTIVE");
    });

    it("rejects bridge when donor does not hold active lease", async () => {
      // Create a donor with no lease
      const dummyDonor = await prisma.donor.create({
        data: {
          name: "Unassigned Donor",
          phoneNumber: `+9199${Math.floor(10000000 + Math.random() * 90000000)}`,
          latitude: 28.60,
          longitude: 77.20,
          bloodGroup: BloodGroup.A_POS,
          gender: "FEMALE",
          weightKg: 65,
        },
      });

      const req = new Request("http://localhost:3000/api/telephony/bridge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: createdRequestId,
          donorId: dummyDonor.id,
          attendantPhone: "+919876543210",
        }),
      });

      const res = await bridgeTelephony(req);
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toContain("active travel lease");
    });

    it("rejects bridge with 403 when request is FULFILLED_CLOSED or EXPIRED", async () => {
      const closedReq = await prisma.emergencyRequest.create({
        data: {
          patientName: "Closed Request Patient",
          patientUhid: "UHID-CLOSED-TEST",
          hospitalName: "Apollo Hospital",
          hospitalLat: 28.56,
          hospitalLng: 77.28,
          component: Component.PRBC,
          bloodGroup: BloodGroup.O_POS,
          requestMode: RequestMode.REPLACEMENT_ANY,
          unitsNeeded: 1,
          waveState: WaveState.FULFILLED_CLOSED,
          shortHash: `cl_${Date.now()}_test`,
          expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000),
        },
      });

      const req = new Request("http://localhost:3000/api/telephony/bridge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: closedReq.id,
          donorId: sampleDonorId,
          attendantPhone: "+919876543210",
        }),
      });

      const res = await bridgeTelephony(req);
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toContain("Anti-Tout");
    });
  });
});
