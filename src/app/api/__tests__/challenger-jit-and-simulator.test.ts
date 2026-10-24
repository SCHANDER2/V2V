// src/app/api/__tests__/challenger-jit-and-simulator.test.ts
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { GET as donorRespondHandler } from "@/app/api/donor/respond/[token]/route";
import { POST as triggerWaveHandler } from "@/app/api/simulator/trigger-wave/route";
import { POST as ghostDonorHandler } from "@/app/api/simulator/ghost-donor/route";
import { POST as arriveHandler } from "@/app/api/lease/arrive/route";
import HealthChecklist from "@/components/HealthChecklist";
import { evictExpiredLeases } from "@/lib/engines/lease-manager";
import { isEligible } from "@/lib/engines/eligibility";
import prisma from "@/lib/prisma";
import { BloodGroup, Component, Gender, LeaseStatus, RequestMode, WaveState } from "@/types/enums";

describe("Milestone 3 Adversarial Challenger: JIT Flow, Screener & Simulator Suite", () => {
  let reqId1: number;
  let donorId1: number;
  let donorId2: number;
  let donorId3: number;
  let leaseId1: number;
  let standbyLeaseId1: number;
  let standbyLeaseId2: number;

  beforeAll(async () => {
    // 1. Create test donors
    const donor1 = await prisma.donor.create({
      data: {
        name: "Challenger Active Donor 1",
        phoneNumber: `+919777${Math.floor(100000 + Math.random() * 900000)}`,
        latitude: 28.5672,
        longitude: 77.2100,
        bloodGroup: BloodGroup.O_POS,
        gender: Gender.MALE,
        weightKg: 72,
      },
    });
    donorId1 = donor1.id;

    const donor2 = await prisma.donor.create({
      data: {
        name: "Challenger Standby Donor 2",
        phoneNumber: `+919777${Math.floor(100000 + Math.random() * 900000)}`,
        latitude: 28.5680,
        longitude: 77.2110,
        bloodGroup: BloodGroup.O_POS,
        gender: Gender.FEMALE,
        weightKg: 55,
      },
    });
    donorId2 = donor2.id;

    const donor3 = await prisma.donor.create({
      data: {
        name: "Challenger Standby Donor 3",
        phoneNumber: `+919777${Math.floor(100000 + Math.random() * 900000)}`,
        latitude: 28.5690,
        longitude: 77.2120,
        bloodGroup: BloodGroup.O_POS,
        gender: Gender.MALE,
        weightKg: 68,
      },
    });
    donorId3 = donor3.id;

    // 2. Create emergency request (unitsNeeded: 1 -> targetSlots = 2: 1 primary + 1 standby)
    const request1 = await prisma.emergencyRequest.create({
      data: {
        patientName: "Challenger Test Patient",
        patientUhid: "UHID-CHALLENGER-M3",
        hospitalName: "Safdarjung Hospital, New Delhi",
        hospitalLat: 28.5672,
        hospitalLng: 77.2100,
        component: Component.SDP,
        bloodGroup: BloodGroup.O_POS,
        requestMode: RequestMode.EXACT_OR_SDP,
        unitsNeeded: 1,
        waveState: WaveState.WAVE_1_DISPATCH,
        shortHash: `ch_${Math.random().toString(36).substring(2, 10)}`,
        expiresAt: new Date(Date.now() + 12 * 3600 * 1000),
      },
    });
    reqId1 = request1.id;

    // 3. Create active lease for donor 1
    const lease1 = await prisma.donorLease.create({
      data: {
        requestId: reqId1,
        donorId: donorId1,
        status: LeaseStatus.JIT_PASSED,
        leaseExpiresAt: new Date(Date.now() + 25 * 60 * 1000),
        handshakePin: "4321",
      },
    });
    leaseId1 = lease1.id;

    // 4. Create standby lease 1 (created earlier)
    const standby1 = await prisma.donorLease.create({
      data: {
        requestId: reqId1,
        donorId: donorId2,
        status: LeaseStatus.STANDBY,
        leaseExpiresAt: new Date(Date.now() + 25 * 60 * 1000),
        createdAt: new Date(Date.now() - 5000),
      },
    });
    standbyLeaseId1 = standby1.id;

    // 5. Create standby lease 2 (created later)
    const standby2 = await prisma.donorLease.create({
      data: {
        requestId: reqId1,
        donorId: donorId3,
        status: LeaseStatus.STANDBY,
        leaseExpiresAt: new Date(Date.now() + 25 * 60 * 1000),
        createdAt: new Date(Date.now() - 1000),
      },
    });
    standbyLeaseId2 = standby2.id;
  });

  afterAll(async () => {
    try {
      if (reqId1) {
        await prisma.donorLease.deleteMany({ where: { requestId: reqId1 } });
        await prisma.emergencyRequest.deleteMany({ where: { id: reqId1 } });
      }
      const donorIds = [donorId1, donorId2, donorId3].filter(Boolean);
      if (donorIds.length > 0) {
        await prisma.donor.deleteMany({ where: { id: { in: donorIds } } });
      }
    } catch {
      // Best-effort cleanup
    }
    await prisma.$disconnect();
  });

  // =========================================================================
  // SUB-SUITE 1: Token Resolution on /api/donor/respond/[token]
  // =========================================================================
  describe("1. Token Resolution Adversarial Tests (/api/donor/respond/[token])", () => {
    it("resolves standard hyphenated token ('reqId-donorId')", async () => {
      const token = `${reqId1}-${donorId1}`;
      const req = new Request(`http://localhost:3000/api/donor/respond/${token}`);
      const res = await donorRespondHandler(req, { params: { token } });
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.request.id).toBe(reqId1);
      expect(body.donor.id).toBe(donorId1);
      expect(body.lease?.id).toBe(leaseId1);
      expect(body.targetSlots).toBe(2);
      expect(body.sidecarUrl).toBe("sidecar://science/biomolecular_structure_viewer/ui.html");
    });

    it("resolves base64url JSON token with { requestId, donorId }", async () => {
      const jsonToken = Buffer.from(
        JSON.stringify({ requestId: reqId1, donorId: donorId1 })
      ).toString("base64url");
      const req = new Request(`http://localhost:3000/api/donor/respond/${jsonToken}`);
      const res = await donorRespondHandler(req, { params: { token: jsonToken } });
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.request.id).toBe(reqId1);
      expect(body.donor.id).toBe(donorId1);
    });

    it("resolves compact base64url JSON token with { r, d }", async () => {
      const compactToken = Buffer.from(
        JSON.stringify({ r: reqId1, d: donorId2 })
      ).toString("base64url");
      const req = new Request(`http://localhost:3000/api/donor/respond/${compactToken}`);
      const res = await donorRespondHandler(req, { params: { token: compactToken } });
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.donor.id).toBe(donorId2);
      expect(body.lease?.status).toBe(LeaseStatus.STANDBY);
    });

    it("resolves named format token ('req_X_donor_Y') case-insensitively", async () => {
      const namedToken = `REQ_${reqId1}_DONOR_${donorId1}`;
      const req = new Request(`http://localhost:3000/api/donor/respond/${namedToken}`);
      const res = await donorRespondHandler(req, { params: { token: namedToken } });
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.donor.id).toBe(donorId1);
    });

    it("resolves short format token ('rXdY') case-insensitively", async () => {
      const shortToken = `r${reqId1}d${donorId1}`;
      const req = new Request(`http://localhost:3000/api/donor/respond/${shortToken}`);
      const res = await donorRespondHandler(req, { params: { token: shortToken } });
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.donor.id).toBe(donorId1);
    });

    it("returns 400 INVALID_TOKEN for malformed / arbitrary non-token strings", async () => {
      const badTokens = [
        "not_a_valid_token",
        "123",
        "req-without-donor",
        "---",
        "rX-dY",
        "null",
      ];
      for (const token of badTokens) {
        const req = new Request(`http://localhost:3000/api/donor/respond/${token}`);
        const res = await donorRespondHandler(req, { params: { token } });
        const body = await res.json();

        expect(res.status).toBe(400);
        expect(body.code).toBe("INVALID_TOKEN");
      }
    });

    it("rejects token with 'don' instead of 'donor' ('req_1_don_1')", async () => {
      const token = `req_${reqId1}_don_${donorId1}`;
      const req = new Request(`http://localhost:3000/api/donor/respond/${token}`);
      const res = await donorRespondHandler(req, { params: { token } });
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.code).toBe("INVALID_TOKEN");
    });

    it("returns 400 for base64url string that decodes to non-JSON payload", async () => {
      const rawBase64 = Buffer.from("just_some_random_text_not_json").toString("base64url");
      const req = new Request(`http://localhost:3000/api/donor/respond/${rawBase64}`);
      const res = await donorRespondHandler(req, { params: { token: rawBase64 } });
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.code).toBe("INVALID_TOKEN");
    });

    it("returns 400 for base64url JSON missing required fields", async () => {
      const incompleteJson = Buffer.from(JSON.stringify({ someKey: 123 })).toString("base64url");
      const req = new Request(`http://localhost:3000/api/donor/respond/${incompleteJson}`);
      const res = await donorRespondHandler(req, { params: { token: incompleteJson } });
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.code).toBe("INVALID_TOKEN");
    });

    it("returns 404 REQUEST_NOT_FOUND when token has valid format but request does not exist", async () => {
      const token = `99999999-${donorId1}`;
      const req = new Request(`http://localhost:3000/api/donor/respond/${token}`);
      const res = await donorRespondHandler(req, { params: { token } });
      const body = await res.json();

      expect(res.status).toBe(404);
      expect(body.code).toBe("REQUEST_NOT_FOUND");
    });

    it("returns 404 DONOR_NOT_FOUND when token has valid format but donor does not exist", async () => {
      const token = `${reqId1}-99999999`;
      const req = new Request(`http://localhost:3000/api/donor/respond/${token}`);
      const res = await donorRespondHandler(req, { params: { token } });
      const body = await res.json();

      expect(res.status).toBe(404);
      expect(body.code).toBe("DONOR_NOT_FOUND");
    });

    it("verifies saturation flag: isSaturated reflects activeCount vs targetSlots", async () => {
      const token = `${reqId1}-${donorId1}`;
      const req = new Request(`http://localhost:3000/api/donor/respond/${token}`);
      const res = await donorRespondHandler(req, { params: { token } });
      const body = await res.json();

      // targetSlots = unitsNeeded (1) + 1 = 2; currently 1 active lease (leaseId1)
      expect(body.targetSlots).toBe(2);
      expect(body.activeCount).toBe(1);
      expect(body.isSaturated).toBe(false);
    });
  });

  // =========================================================================
  // SUB-SUITE 2: NBTC 5-Point Health Screener boundaries
  // =========================================================================
  describe("2. NBTC 5-Point Health Screener Boundary Tests", () => {
    it("renders Alcohol and Fever questions in HealthChecklist for all donation types", () => {
      const onPassMock = jest.fn();
      const onDeferralMock = jest.fn();

      const htmlWb = renderToStaticMarkup(
        React.createElement(HealthChecklist, {
          component: "WHOLE_BLOOD",
          onPass: onPassMock,
          onDeferral: onDeferralMock,
        })
      );

      const htmlSdp = renderToStaticMarkup(
        React.createElement(HealthChecklist, {
          component: "SDP",
          onPass: onPassMock,
          onDeferral: onDeferralMock,
        })
      );

      // Both must include Alcohol 24h question
      expect(htmlWb).toContain("consumed alcohol within the last 24 hours");
      expect(htmlSdp).toContain("consumed alcohol within the last 24 hours");

      // Both must include Fever / acute symptoms question
      expect(htmlWb).toContain("Feeling completely well today? No fever");
      expect(htmlSdp).toContain("Feeling completely well today? No fever");
    });

    it("differentiates SDP vs Whole Blood: SDP requires Aspirin/NSAID refraining & 50kg, Whole Blood requires 45kg", () => {
      const htmlWb = renderToStaticMarkup(
        React.createElement(HealthChecklist, {
          component: "WHOLE_BLOOD",
          onPass: jest.fn(),
          onDeferral: jest.fn(),
        })
      );

      const htmlSdp = renderToStaticMarkup(
        React.createElement(HealthChecklist, {
          component: "SDP",
          onPass: jest.fn(),
          onDeferral: jest.fn(),
        })
      );

      // SDP asks about Aspirin/NSAIDs 48h and 50 kg mass
      expect(htmlSdp).toContain("Painkillers &amp; Weight: Have you refrained from Aspirin/NSAIDs for 48 hours");
      expect(htmlSdp).toContain("at least 50 kg");
      expect(htmlSdp).toContain("Aspirin permanently acetylates platelet COX-1");

      // Whole Blood asks about 45kg and blood thinners, and DOES NOT ask about Aspirin/NSAIDs
      expect(htmlWb).toContain("Is your current body weight at least 45 kg");
      expect(htmlWb).not.toContain("Aspirin");
      expect(htmlWb).not.toContain("NSAID");
    });

    it("verifies NBTC eligibility engine boundaries: Weight (45kg WB, 50kg SDP)", () => {
      const baseDonor = {
        gender: Gender.MALE,
        bloodGroup: BloodGroup.O_POS,
        weightKg: 49.5,
      };

      // 49.5 kg is eligible for Whole Blood (≥ 45kg), but disqualified for SDP (< 50kg)
      expect(isEligible(baseDonor, Component.WHOLE_BLOOD)).toBe(true);
      expect(isEligible(baseDonor, Component.SDP)).toBe(false);

      // 44.5 kg is disqualified for both (< 45kg)
      expect(isEligible({ ...baseDonor, weightKg: 44.5 }, Component.WHOLE_BLOOD)).toBe(false);
      expect(isEligible({ ...baseDonor, weightKg: 44.5 }, Component.SDP)).toBe(false);

      // 50.0 kg boundary is eligible for SDP
      expect(isEligible({ ...baseDonor, weightKg: 50.0 }, Component.SDP)).toBe(true);
    });

    it("verifies NBTC eligibility engine boundaries: Platelet cooldown (48h for SDP)", () => {
      const now = Date.now();
      const donorJustDonatedPlatelets = {
        gender: Gender.MALE,
        bloodGroup: BloodGroup.O_POS,
        weightKg: 65,
        lastPlatelet: new Date(now - 24 * 3600 * 1000), // 24 hrs ago (< 48h)
      };

      expect(isEligible(donorJustDonatedPlatelets, Component.SDP)).toBe(false);

      const donorPassedPlateletCooldown = {
        gender: Gender.MALE,
        bloodGroup: BloodGroup.O_POS,
        weightKg: 65,
        lastPlatelet: new Date(now - 49 * 3600 * 1000), // 49 hrs ago (≥ 48h)
      };

      expect(isEligible(donorPassedPlateletCooldown, Component.SDP)).toBe(true);
    });

    it("verifies NBTC eligibility engine boundaries: Whole Blood cooldowns (90d Male, 120d Female, 28d prior to SDP)", () => {
      const now = Date.now();

      // Male donor at 89 days vs 90 days
      const male89d = {
        gender: Gender.MALE,
        bloodGroup: BloodGroup.O_POS,
        weightKg: 70,
        lastWholeBlood: new Date(now - 89 * 24 * 3600 * 1000),
      };
      const male90d = {
        gender: Gender.MALE,
        bloodGroup: BloodGroup.O_POS,
        weightKg: 70,
        lastWholeBlood: new Date(now - 90 * 24 * 3600 * 1000),
      };
      expect(isEligible(male89d, Component.WHOLE_BLOOD)).toBe(false);
      expect(isEligible(male90d, Component.WHOLE_BLOOD)).toBe(true);

      // Female donor at 119 days vs 120 days
      const female119d = {
        gender: Gender.FEMALE,
        bloodGroup: BloodGroup.O_POS,
        weightKg: 60,
        lastWholeBlood: new Date(now - 119 * 24 * 3600 * 1000),
      };
      const female120d = {
        gender: Gender.FEMALE,
        bloodGroup: BloodGroup.O_POS,
        weightKg: 60,
        lastWholeBlood: new Date(now - 120 * 24 * 3600 * 1000),
      };
      expect(isEligible(female119d, Component.WHOLE_BLOOD)).toBe(false);
      expect(isEligible(female120d, Component.WHOLE_BLOOD)).toBe(true);

      // SDP after Whole Blood: requires ≥ 28 days
      const sdpAfter27dWb = {
        gender: Gender.MALE,
        bloodGroup: BloodGroup.O_POS,
        weightKg: 70,
        lastWholeBlood: new Date(now - 27 * 24 * 3600 * 1000),
      };
      const sdpAfter28dWb = {
        gender: Gender.MALE,
        bloodGroup: BloodGroup.O_POS,
        weightKg: 70,
        lastWholeBlood: new Date(now - 28 * 24 * 3600 * 1000),
      };
      expect(isEligible(sdpAfter27dWb, Component.SDP)).toBe(false);
      expect(isEligible(sdpAfter28dWb, Component.SDP)).toBe(true);
    });
  });

  // =========================================================================
  // SUB-SUITE 3: Simulator Helper API Routes & Counter-Loop Resiliency
  // =========================================================================
  describe("3. Simulator Helper API Routes & Counter-Loop Resiliency", () => {
    // -----------------------------------------------------------------------
    // A. POST /api/simulator/trigger-wave
    // -----------------------------------------------------------------------
    describe("POST /api/simulator/trigger-wave", () => {
      let waveReqId: number;

      beforeAll(async () => {
        // Create an isolated request in an unpopulated coordinate area to test wave advancement
        const req = await prisma.emergencyRequest.create({
          data: {
            patientName: "Wave Exhaustion Patient",
            patientUhid: "UHID-WAVE-TEST",
            hospitalName: "Remote Testing Center",
            hospitalLat: 10.0000, // Remote coordinates where no donors exist
            hospitalLng: 10.0000,
            component: Component.WHOLE_BLOOD,
            bloodGroup: BloodGroup.AB_NEG, // rare group
            requestMode: RequestMode.EXACT_OR_SDP,
            unitsNeeded: 1,
            waveState: WaveState.WAVE_1_DISPATCH,
            shortHash: `wv_${Math.random().toString(36).substring(2, 10)}`,
            expiresAt: new Date(Date.now() + 12 * 3600 * 1000),
          },
        });
        waveReqId = req.id;
      });

      afterAll(async () => {
        if (waveReqId) {
          await prisma.donorLease.deleteMany({ where: { requestId: waveReqId } });
          await prisma.emergencyRequest.deleteMany({ where: { id: waveReqId } });
        }
      });

      it("increments wave radius from Wave 1 to Wave 2 when no local donors exist", async () => {
        const req = new Request("http://localhost:3000/api/simulator/trigger-wave", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ requestId: waveReqId }),
        });
        const res = await triggerWaveHandler(req);
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.success).toBe(true);
        expect(body.previousWaveState).toBe(WaveState.WAVE_1_DISPATCH);
        expect(body.newWaveState).toBe(WaveState.WAVE_2_DISPATCH);
        expect(body.waveRadius).toContain("3–7 km");
        expect(body.pingedDonorsCount).toBe(0);
      });

      it("increments wave radius from Wave 2 to Wave 3", async () => {
        const req = new Request("http://localhost:3000/api/simulator/trigger-wave", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ requestId: waveReqId }),
        });
        const res = await triggerWaveHandler(req);
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.previousWaveState).toBe(WaveState.WAVE_2_DISPATCH);
        expect(body.newWaveState).toBe(WaveState.WAVE_3_DISPATCH);
        expect(body.waveRadius).toContain("7–15 km");
      });

      it("transitions to EXPIRED when Wave 3 is exhausted and no donors found", async () => {
        const req = new Request("http://localhost:3000/api/simulator/trigger-wave", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ requestId: waveReqId }),
        });
        const res = await triggerWaveHandler(req);
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.previousWaveState).toBe(WaveState.WAVE_3_DISPATCH);
        expect(body.newWaveState).toBe(WaveState.EXPIRED);
        expect(body.waveRadius).toContain("Expired");
      });

      it("returns 409 Conflict when attempting to trigger wave on an already EXPIRED request", async () => {
        const req = new Request("http://localhost:3000/api/simulator/trigger-wave", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ requestId: waveReqId }),
        });
        const res = await triggerWaveHandler(req);
        const body = await res.json();

        expect(res.status).toBe(409);
        expect(body.error).toContain("Cannot trigger wave on terminal request");
      });

      it("validates input: returns 400 for negative or invalid requestId", async () => {
        const badInputs = [-1, 0, "invalid", null];
        for (const bad of badInputs) {
          const req = new Request("http://localhost:3000/api/simulator/trigger-wave", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ requestId: bad }),
          });
          const res = await triggerWaveHandler(req);
          expect(res.status).toBe(400);
        }
      });
    });

    // -----------------------------------------------------------------------
    // B. POST /api/simulator/ghost-donor
    // -----------------------------------------------------------------------
    describe("POST /api/simulator/ghost-donor", () => {
      it("fast-forwards expiry, evicts active lease, and promotes earliest standby donor (FIFO)", async () => {
        // Ghost donor 1 (leaseId1)
        const req = new Request("http://localhost:3000/api/simulator/ghost-donor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ leaseId: leaseId1 }),
        });
        const res = await ghostDonorHandler(req);
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.success).toBe(true);
        expect(body.ghostedLeaseId).toBe(leaseId1);
        expect(body.newStatus).toBe(LeaseStatus.EVICTED_TIMEOUT);
        expect(body.evictionSummary.evictedCount).toBeGreaterThanOrEqual(1);
        expect(body.evictionSummary.promotedCount).toBe(1);

        // Standby donor 1 (created earlier) MUST be promoted over standby donor 2
        expect(body.promotedLeaseIds).toContain(standbyLeaseId1);
        expect(body.promotedLeaseIds).not.toContain(standbyLeaseId2);

        // Verify promoted lease status in DB
        const promotedLease = await prisma.donorLease.findUnique({
          where: { id: standbyLeaseId1 },
        });
        expect(promotedLease?.status).toBe(LeaseStatus.JIT_PASSED);
        expect(promotedLease?.handshakePin).toBeDefined();
        expect(promotedLease?.handshakePin?.length).toBe(4);

        // Verify remaining standby lease 2 is still STANDBY
        const unpromotedLease = await prisma.donorLease.findUnique({
          where: { id: standbyLeaseId2 },
        });
        expect(unpromotedLease?.status).toBe(LeaseStatus.STANDBY);
      });

      it("cascading promotion: ghosting newly promoted lease promotes second standby donor", async () => {
        // Ghost the previously promoted standby lease 1 (now JIT_PASSED)
        const req = new Request("http://localhost:3000/api/simulator/ghost-donor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ leaseId: standbyLeaseId1 }),
        });
        const res = await ghostDonorHandler(req);
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.newStatus).toBe(LeaseStatus.EVICTED_TIMEOUT);
        expect(body.promotedLeaseIds).toContain(standbyLeaseId2);

        // Verify standby lease 2 is now JIT_PASSED
        const promoted2 = await prisma.donorLease.findUnique({
          where: { id: standbyLeaseId2 },
        });
        expect(promoted2?.status).toBe(LeaseStatus.JIT_PASSED);
      });

      it("clean eviction when standby queue is exhausted (promotedCount = 0)", async () => {
        // Ghost the now active standby lease 2; there are no further standby donors queued
        const req = new Request("http://localhost:3000/api/simulator/ghost-donor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ leaseId: standbyLeaseId2 }),
        });
        const res = await ghostDonorHandler(req);
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.newStatus).toBe(LeaseStatus.EVICTED_TIMEOUT);
        expect(body.evictionSummary.promotedCount).toBe(0);
        expect(body.promotedLeaseIds).toEqual([]);
      });

      it("rejects ghosting a lease that is already EVICTED_TIMEOUT (status 400)", async () => {
        const req = new Request("http://localhost:3000/api/simulator/ghost-donor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ leaseId: leaseId1 }), // already evicted
        });
        const res = await ghostDonorHandler(req);
        const body = await res.json();

        expect(res.status).toBe(400);
        expect(body.error).toContain("Only active leases (JIT_PASSED, EN_ROUTE) can be ghosted");
      });
    });

    // -----------------------------------------------------------------------
    // C. POST /api/lease/arrive & Dead-Man's Switch Immunity
    // -----------------------------------------------------------------------
    describe("POST /api/lease/arrive & Dead-Man's Switch Immunity", () => {
      let arriveLeaseId: number;

      beforeAll(async () => {
        // Create an active lease to test arrival
        const lease = await prisma.donorLease.create({
          data: {
            requestId: reqId1,
            donorId: donorId1,
            status: LeaseStatus.EN_ROUTE,
            leaseExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
            handshakePin: "8899",
          },
        });
        arriveLeaseId = lease.id;
      });

      afterAll(async () => {
        if (arriveLeaseId) {
          await prisma.donorLease.deleteMany({ where: { id: arriveLeaseId } });
        }
      });

      it("marks lease ARRIVED and preserves handshake PIN", async () => {
        const req = new Request("http://localhost:3000/api/lease/arrive", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ leaseId: arriveLeaseId }),
        });
        const res = await arriveHandler(req);
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.success).toBe(true);
        expect(body.status).toBe(LeaseStatus.ARRIVED);
        expect(body.handshakePin).toBe("8899");
      });

      it("proves ARRIVED status prevents subsequent eviction by lease watchdog even when leaseExpiresAt is in the past", async () => {
        // Artificially wind clock backwards: set leaseExpiresAt to 30 minutes in the past
        await prisma.donorLease.update({
          where: { id: arriveLeaseId },
          data: {
            leaseExpiresAt: new Date(Date.now() - 30 * 60 * 1000),
          },
        });

        // Run dead-man's switch watchdog eviction
        const evictionResult = await evictExpiredLeases();

        // The arrived lease MUST NOT be evicted
        expect(evictionResult.evictedLeaseIds).not.toContain(arriveLeaseId);

        // Verify status in DB remains ARRIVED
        const checkedLease = await prisma.donorLease.findUnique({
          where: { id: arriveLeaseId },
        });
        expect(checkedLease?.status).toBe(LeaseStatus.ARRIVED);
      });

      it("is idempotent: calling arrive again on already ARRIVED lease returns success", async () => {
        const req = new Request("http://localhost:3000/api/lease/arrive", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ leaseId: arriveLeaseId }),
        });
        const res = await arriveHandler(req);
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.success).toBe(true);
        expect(body.status).toBe(LeaseStatus.ARRIVED);
        expect(body.message).toContain("already checked in");
      });

      it("rejects arrival on an already evicted lease with 409 Conflict", async () => {
        const req = new Request("http://localhost:3000/api/lease/arrive", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ leaseId: leaseId1 }), // leaseId1 is EVICTED_TIMEOUT
        });
        const res = await arriveHandler(req);
        const body = await res.json();

        expect(res.status).toBe(409);
        expect(body.error).toContain("Lease has already expired and timed out");
      });

      it("validates input: returns 400 for invalid leaseId, 404 for non-existent leaseId", async () => {
        const badReq = new Request("http://localhost:3000/api/lease/arrive", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ leaseId: "not-a-number" }),
        });
        const badRes = await arriveHandler(badReq);
        expect(badRes.status).toBe(400);

        const notFoundReq = new Request("http://localhost:3000/api/lease/arrive", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ leaseId: 9999999 }),
        });
        const notFoundRes = await arriveHandler(notFoundReq);
        expect(notFoundRes.status).toBe(404);
      });
    });
  });
});
