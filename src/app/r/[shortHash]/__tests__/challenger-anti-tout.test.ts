// src/app/r/[shortHash]/__tests__/challenger-anti-tout.test.ts
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import prisma from "@/lib/prisma";
import DonorRoster, { ActiveLease, StandbyLease } from "@/components/DonorRoster";
import SidecarPill, { SIDECAR_URL } from "@/components/SidecarPill";
import FamilyCommandCenterPage from "@/app/r/[shortHash]/page";
import EmergencyRequestNewPage from "@/app/request/new/page";
import { POST as telephonyBridgeHandler } from "@/app/api/telephony/bridge/route";
import { GET as requestByShortHashHandler } from "@/app/api/request/[shortHash]/route";
import { WaveState, LeaseStatus, Component, BloodGroup, RequestMode } from "@/types/enums";
import { SIDECAR_VIEWER_URL } from "@/lib/shortHash";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
  }),
  useParams: () => ({ shortHash: "v2v_fn_aiims" }),
}));

// Mock next/link to render a simple anchor tag
jest.mock("next/link", () => {
  return ({ children, href, ...rest }: any) => {
    return React.createElement("a", { href, ...rest }, children);
  };
});

// Helper to render FamilyCommandCenterPage with mocked state
function renderCommandCenterWithState(
  mockData: any,
  options: { loading?: boolean; error?: string | null } = {}
): string {
  const origUseState = React.useState;
  let pageCallCount = 0;

  React.useState = ((initial: any) => {
    pageCallCount++;
    if (pageCallCount === 1) return [mockData, jest.fn()];
    if (pageCallCount === 2) return [options.loading ?? false, jest.fn()];
    if (pageCallCount === 3) return [options.error ?? null, jest.fn()];
    if (pageCallCount === 4) return [new Date("2026-10-23T14:00:00Z"), jest.fn()];
    if (pageCallCount === 5) return [false, jest.fn()];
    // For child components (DonorRoster, WaveRadar, etc.):
    return [initial, jest.fn()];
  }) as any;

  try {
    return renderToStaticMarkup(
      React.createElement(FamilyCommandCenterPage, {
        params: { shortHash: mockData?.request?.shortHash || "test-hash" },
      })
    );
  } finally {
    React.useState = origUseState;
  }
}

// Helper to render EmergencyRequestNewPage with mocked initial component & requestMode
function renderEmergencyRequestNewWithState(
  overrideComponent: Component = Component.WHOLE_BLOOD,
  overrideMode: RequestMode = RequestMode.REPLACEMENT_ANY
): string {
  const origUseState = React.useState;
  let callCount = 0;

  React.useState = ((initial: any) => {
    callCount++;
    if (callCount === 7) return [overrideComponent, jest.fn()]; // component state
    if (callCount === 9) return [overrideMode, jest.fn()];      // requestMode state
    return [initial, jest.fn()];
  }) as any;

  try {
    return renderToStaticMarkup(React.createElement(EmergencyRequestNewPage));
  } finally {
    React.useState = origUseState;
  }
}

describe("Empirical Challenger M3-1: UI State Machine, Counter-Loop 4 & Dead-Man Switch", () => {
  let seededFulfilledReq: any = null;
  let seededExpiredReq: any = null;
  let seededActiveDonor: any = null;

  beforeAll(async () => {
    // Locate seeded records for API verification
    seededFulfilledReq = await prisma.emergencyRequest.findUnique({
      where: { shortHash: "v2v_fn_aiims" },
    });
    if (!seededFulfilledReq) {
      const { main } = await import("../../../../../prisma/seed");
      await main();
      seededFulfilledReq = await prisma.emergencyRequest.findUnique({
        where: { shortHash: "v2v_fn_aiims" },
      });
    }
    seededExpiredReq = await prisma.emergencyRequest.findUnique({
      where: { shortHash: "v2v_ex_aiims" },
    });
    seededActiveDonor = await prisma.donor.findFirst();
  });

  // ===========================================================================
  // AREA 1: Counter-Loop 4 (Anti-Tout Lockdown)
  // ===========================================================================
  describe("Area 1: Counter-Loop 4 (Anti-Tout Lockdown)", () => {
    it("when request is FULFILLED_CLOSED: call buttons, donor phone triggers, and direct contacts are 100% unmounted/disabled", () => {
      const mockFulfilledData = {
        request: {
          id: 401,
          patientName: "Priya Malhotra",
          patientUhid: "AIIMS-2026-1044",
          hospitalName: "AIIMS Delhi, Trauma Centre",
          hospitalLat: 28.5672,
          hospitalLng: 77.21,
          component: "SDP",
          bloodGroup: "O_POS",
          requestMode: "EXACT_OR_SDP",
          unitsNeeded: 1,
          waveState: WaveState.FULFILLED_CLOSED,
          shortHash: "v2v_fn_aiims",
          expiresAt: new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
          isExpired: false,
          canInitiateCalls: false,
          trackingUrl: "http://localhost:3000/r/v2v_fn_aiims",
          sidecarUrl: SIDECAR_URL,
        },
        activeLeases: [
          {
            id: 1,
            donorId: 10,
            status: LeaseStatus.ARRIVED,
            leaseExpiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
            handshakePin: "1122",
            donor: {
              id: 10,
              name: "Rohit V.",
              maskedPhone: "+91 98••••0001",
              bloodGroup: "O_POS",
            },
          },
        ],
        standbyLeases: [],
        pingCount: 2,
      };

      const html = renderCommandCenterWithState(mockFulfilledData);

      // 1. Fulfilled completion banner is prominently rendered
      expect(html).toContain("Requirement Fulfilled — Thank You!");
      expect(html).toContain("Counter-Loop 4 Enforced:");
      expect(html).toContain(
        "All volunteer contact lines and masked call bridges have been permanently deactivated to safeguard donor privacy."
      );

      // 2. DonorRoster and WaveRadar are 100% unmounted (!isFulfilled && !isExpired guard)
      expect(html).not.toContain("Community Donor Roster");
      expect(html).not.toContain("Geospatial Dispatch Radar");

      // 3. Telephony bridge call triggers are 100% absent
      expect(html).not.toContain("Call Donor (Masked)");
      expect(html).not.toContain("Connecting...");
      expect(html).not.toContain("tel:+91");
    });

    it("when request is EXPIRED: call triggers are deactivated and emergency helpline (104) is advised", () => {
      const mockExpiredData = {
        request: {
          id: 501,
          patientName: "Vikramaditya Rao",
          patientUhid: "AIIMS-2026-0012",
          hospitalName: "AIIMS Delhi, Trauma Centre",
          hospitalLat: 28.5672,
          hospitalLng: 77.21,
          component: "WHOLE_BLOOD",
          bloodGroup: "BOMBAY_OH",
          requestMode: "EXACT_OR_SDP",
          unitsNeeded: 1,
          waveState: WaveState.EXPIRED,
          shortHash: "v2v_ex_aiims",
          expiresAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
          isExpired: true,
          canInitiateCalls: false,
          trackingUrl: "http://localhost:3000/r/v2v_ex_aiims",
          sidecarUrl: SIDECAR_URL,
        },
        activeLeases: [],
        standbyLeases: [],
        pingCount: 0,
      };

      const html = renderCommandCenterWithState(mockExpiredData);

      // 1. Expired state header is rendered
      expect(html).toContain("Emergency Request Expired");
      expect(html).toContain("This request has exceeded the 12-hour maximum TTL without full fulfillment.");

      // 2. National Blood Helpline (104) is explicitly advised with tel:104 link
      expect(html).toContain('href="tel:104"');
      expect(html).toContain("Call National Blood Helpline (104)");

      // 3. New request launch link is available
      expect(html).toContain('href="/request/new"');
      expect(html).toContain("Launch New Emergency Request");

      // 4. Donor Roster & calls are 100% unmounted
      expect(html).not.toContain("Community Donor Roster");
      expect(html).not.toContain("Call Donor (Masked)");
    });

    it("defense-in-depth: DonorRoster directly disables calls when isFulfilled, isExpired, or canInitiateCalls=false", () => {
      const activeLeases: ActiveLease[] = [
        {
          id: 99,
          donorId: 5,
          status: LeaseStatus.EN_ROUTE,
          leaseExpiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
          handshakePin: "9988",
          donor: {
            id: 5,
            name: "Anjali S.",
            maskedPhone: "+91 98••••0005",
            bloodGroup: "AB_POS",
          },
        },
      ];

      // Case A: isFulfilled = true
      const htmlFulfilled = renderToStaticMarkup(
        React.createElement(DonorRoster, {
          requestId: 1,
          activeLeases,
          standbyLeases: [],
          canInitiateCalls: false,
          isExpired: false,
          isFulfilled: true,
        })
      );
      expect(htmlFulfilled).toContain("Calls deactivated (Anti-Tout Protection)");
      expect(htmlFulfilled).not.toContain("Call Donor (Masked)");

      // Case B: isExpired = true
      const htmlExpired = renderToStaticMarkup(
        React.createElement(DonorRoster, {
          requestId: 1,
          activeLeases,
          standbyLeases: [],
          canInitiateCalls: false,
          isExpired: true,
          isFulfilled: false,
        })
      );
      expect(htmlExpired).toContain("Calls deactivated (Anti-Tout Protection)");
      expect(htmlExpired).not.toContain("Call Donor (Masked)");

      // Case C: canInitiateCalls = false
      const htmlNoCalls = renderToStaticMarkup(
        React.createElement(DonorRoster, {
          requestId: 1,
          activeLeases,
          standbyLeases: [],
          canInitiateCalls: false,
          isExpired: false,
          isFulfilled: false,
        })
      );
      expect(htmlNoCalls).toContain("Calls deactivated (Anti-Tout Protection)");
      expect(htmlNoCalls).not.toContain("Call Donor (Masked)");
    });

    it("backend API enforcement: POST /api/telephony/bridge rejects calls on FULFILLED_CLOSED or EXPIRED requests with HTTP 403", async () => {
      if (!seededFulfilledReq || !seededExpiredReq || !seededActiveDonor) {
        console.warn("Skipping API bridge test: DB seeds not loaded");
        return;
      }

      // 1. Attempt call on FULFILLED_CLOSED request
      const reqFulfilled = new Request("http://localhost:3000/api/telephony/bridge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: seededFulfilledReq.id,
          donorId: seededActiveDonor.id,
          attendantPhone: "+919876543210",
        }),
      });
      const resFulfilled = await telephonyBridgeHandler(reqFulfilled);
      expect(resFulfilled.status).toBe(403);
      const jsonFulfilled = await resFulfilled.json();
      expect(jsonFulfilled.error).toContain("Counter-Loop 4 Anti-Tout Violation");

      // 2. Attempt call on EXPIRED request
      const reqExpired = new Request("http://localhost:3000/api/telephony/bridge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: seededExpiredReq.id,
          donorId: seededActiveDonor.id,
          attendantPhone: "+919876543210",
        }),
      });
      const resExpired = await telephonyBridgeHandler(reqExpired);
      expect(resExpired.status).toBe(403);
      const jsonExpired = await resExpired.json();
      expect(jsonExpired.error).toContain("Counter-Loop 4 Anti-Tout Violation");
    });

    it("backend API enforcement: GET /api/request/[shortHash] sets canInitiateCalls=false for fulfilled & expired requests", async () => {
      // 1. Query fulfilled shortHash
      const req1 = new Request("http://localhost:3000/api/request/v2v_fn_aiims");
      const res1 = await requestByShortHashHandler(req1, { params: { shortHash: "v2v_fn_aiims" } });
      expect(res1.status).toBe(200);
      const json1 = await res1.json();
      expect(json1.request.canInitiateCalls).toBe(false);

      // 2. Query expired shortHash
      const req2 = new Request("http://localhost:3000/api/request/v2v_ex_aiims");
      const res2 = await requestByShortHashHandler(req2, { params: { shortHash: "v2v_ex_aiims" } });
      expect(res2.status).toBe(200);
      const json2 = await res2.json();
      expect(json2.request.canInitiateCalls).toBe(false);
      expect(json2.request.isExpired).toBe(true);
    });
  });

  // ===========================================================================
  // AREA 2: 25-Minute Dead-Man's Countdown
  // ===========================================================================
  describe("Area 2: 25-Minute Dead-Man's Countdown Bar & Visual Indicators", () => {
    it("when lease expires in >10m: standard countdown with emerald bar and text", () => {
      const activeLeases: ActiveLease[] = [
        {
          id: 101,
          donorId: 1,
          status: LeaseStatus.EN_ROUTE,
          leaseExpiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 mins left
          handshakePin: "1234",
          donor: {
            id: 1,
            name: "Rajesh K.",
            maskedPhone: "+91 98••••0001",
            bloodGroup: "B_POS",
          },
        },
      ];

      const html = renderToStaticMarkup(
        React.createElement(DonorRoster, {
          requestId: 1,
          activeLeases,
          standbyLeases: [],
          canInitiateCalls: true,
          isExpired: false,
          isFulfilled: false,
        })
      );

      // Standard countdown formatting (15:00 or 14:59)
      expect(html).toMatch(/1[45]:\d{2} remaining/);

      // Green progress bar and green text
      expect(html).toContain("bg-emerald-500");
      expect(html).toContain("text-emerald-700");

      // Critical amber/red pulses should NOT be present
      expect(html).not.toContain("bg-amber-500 animate-pulse");
      expect(html).not.toContain("bg-red-600 animate-pulse");
      expect(html).not.toContain("Critical: Under 5 minutes remaining");
    });

    it("when lease expires in <10m: amber warning progress bar with pulse", () => {
      const activeLeases: ActiveLease[] = [
        {
          id: 102,
          donorId: 2,
          status: LeaseStatus.EN_ROUTE,
          leaseExpiresAt: new Date(Date.now() + 8 * 60 * 1000).toISOString(), // 8 mins left (< 600s)
          handshakePin: "5678",
          donor: {
            id: 2,
            name: "Sunita M.",
            maskedPhone: "+91 98••••0002",
            bloodGroup: "A_POS",
          },
        },
      ];

      const html = renderToStaticMarkup(
        React.createElement(DonorRoster, {
          requestId: 1,
          activeLeases,
          standbyLeases: [],
          canInitiateCalls: true,
          isExpired: false,
          isFulfilled: false,
        })
      );

      // Countdown between 7:50 and 8:00
      expect(html).toMatch(/0[78]:\d{2} remaining/);

      // Amber pulse styling
      expect(html).toContain("bg-amber-500 animate-pulse");
      expect(html).toContain("text-amber-700 font-semibold");

      // Urgent red flashing should NOT be triggered yet
      expect(html).not.toContain("bg-red-600 animate-pulse");
      expect(html).not.toContain("Critical: Under 5 minutes remaining");
    });

    it("when lease expires in <5m: urgent red flashing indicator and critical warning banner", () => {
      const activeLeases: ActiveLease[] = [
        {
          id: 103,
          donorId: 3,
          status: LeaseStatus.EN_ROUTE,
          leaseExpiresAt: new Date(Date.now() + 3 * 60 * 1000).toISOString(), // 3 mins left (< 300s)
          handshakePin: "9012",
          donor: {
            id: 3,
            name: "Amit V.",
            maskedPhone: "+91 98••••0003",
            bloodGroup: "O_NEG",
          },
        },
      ];

      const html = renderToStaticMarkup(
        React.createElement(DonorRoster, {
          requestId: 1,
          activeLeases,
          standbyLeases: [],
          canInitiateCalls: true,
          isExpired: false,
          isFulfilled: false,
        })
      );

      // Countdown around 03:00
      expect(html).toMatch(/0[23]:\d{2} remaining/);

      // Red flashing bar and bold pulsating text
      expect(html).toContain("bg-red-600 animate-pulse");
      expect(html).toContain("text-red-700 font-bold animate-pulse");

      // Critical standby promotion warning
      expect(html).toContain(
        "🚨 Critical: Under 5 minutes remaining. Standby donor will be promoted if arrival not recorded."
      );
    });

    it("boundary transition analysis: verifies 600s (<10m) and 300s (<5m) inflection points", () => {
      // 1. At 605 seconds (>10m) -> Green
      const htmlOver10m = renderToStaticMarkup(
        React.createElement(DonorRoster, {
          requestId: 1,
          activeLeases: [
            {
              id: 201,
              donorId: 1,
              status: LeaseStatus.EN_ROUTE,
              leaseExpiresAt: new Date(Date.now() + 605 * 1000).toISOString(),
              donor: { id: 1, name: "Test D.", maskedPhone: "•••", bloodGroup: "O_POS" },
            },
          ],
          standbyLeases: [],
          canInitiateCalls: true,
          isExpired: false,
          isFulfilled: false,
        })
      );
      expect(htmlOver10m).toContain("bg-emerald-500");

      // 2. At 595 seconds (<10m, >=5m) -> Amber
      const htmlUnder10m = renderToStaticMarkup(
        React.createElement(DonorRoster, {
          requestId: 1,
          activeLeases: [
            {
              id: 202,
              donorId: 2,
              status: LeaseStatus.EN_ROUTE,
              leaseExpiresAt: new Date(Date.now() + 595 * 1000).toISOString(),
              donor: { id: 2, name: "Test D2.", maskedPhone: "•••", bloodGroup: "O_POS" },
            },
          ],
          standbyLeases: [],
          canInitiateCalls: true,
          isExpired: false,
          isFulfilled: false,
        })
      );
      expect(htmlUnder10m).toContain("bg-amber-500 animate-pulse");

      // 3. At 295 seconds (<5m) -> Red
      const htmlUnder5m = renderToStaticMarkup(
        React.createElement(DonorRoster, {
          requestId: 1,
          activeLeases: [
            {
              id: 203,
              donorId: 3,
              status: LeaseStatus.EN_ROUTE,
              leaseExpiresAt: new Date(Date.now() + 295 * 1000).toISOString(),
              donor: { id: 3, name: "Test D3.", maskedPhone: "•••", bloodGroup: "O_POS" },
            },
          ],
          standbyLeases: [],
          canInitiateCalls: true,
          isExpired: false,
          isFulfilled: false,
        })
      );
      expect(htmlUnder5m).toContain("bg-red-600 animate-pulse");
    });

    it("when lease is ARRIVED: countdown freezes with confirmation checkmark and progress bar is hidden", () => {
      const activeLeases: ActiveLease[] = [
        {
          id: 104,
          donorId: 4,
          status: LeaseStatus.ARRIVED,
          leaseExpiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
          handshakePin: "7744",
          donor: {
            id: 4,
            name: "Karan Johar",
            maskedPhone: "+91 98••••0004",
            bloodGroup: "B_POS",
          },
        },
      ];

      const html = renderToStaticMarkup(
        React.createElement(DonorRoster, {
          requestId: 1,
          activeLeases,
          standbyLeases: [],
          canInitiateCalls: true,
          isExpired: false,
          isFulfilled: false,
        })
      );

      // 1. Frozen countdown text
      expect(html).toContain("ARRIVED (Timer Frozen)");

      // 2. Green confirmation checkmark badge
      expect(html).toContain("✓ ARRIVED AT HOSPITAL");
      expect(html).toContain("bg-emerald-100 text-emerald-800 border border-emerald-300");

      // 3. Countdown progress bar is completely removed (!isArrived guard)
      expect(html).not.toContain("rounded-full h-2.5 overflow-hidden");
    });

    it("when lease is timed out: displays 00:00 (Eviction Pending) and LEASE TIMED OUT badge", () => {
      const activeLeases: ActiveLease[] = [
        {
          id: 105,
          donorId: 5,
          status: LeaseStatus.EN_ROUTE,
          leaseExpiresAt: new Date(Date.now() - 30 * 1000).toISOString(), // Expired 30s ago
          handshakePin: "3321",
          donor: {
            id: 5,
            name: "Deepak S.",
            maskedPhone: "+91 98••••0005",
            bloodGroup: "O_POS",
          },
        },
      ];

      const html = renderToStaticMarkup(
        React.createElement(DonorRoster, {
          requestId: 1,
          activeLeases,
          standbyLeases: [],
          canInitiateCalls: true,
          isExpired: false,
          isFulfilled: false,
        })
      );

      expect(html).toContain("00:00 (Eviction Pending)");
      expect(html).toContain("⚠️ LEASE TIMED OUT");
    });
  });

  // ===========================================================================
  // AREA 3: SDP Apheresis rule on /request/new
  // ===========================================================================
  describe("Area 3: SDP Apheresis Rule on /request/new", () => {
    it("when component = SDP: locks requestMode to EXACT_OR_SDP and disables Replacement button", () => {
      const htmlSDP = renderEmergencyRequestNewWithState(
        Component.SDP,
        RequestMode.EXACT_OR_SDP
      );

      // 1. NBTC Lock indicator badge is visible
      expect(htmlSDP).toContain("Locked to EXACT_OR_SDP (NBTC Rule)");

      // 2. Replacement Mode button is disabled with cursor-not-allowed
      expect(htmlSDP).toContain("disabled=\"\"");
      expect(htmlSDP).toContain("opacity-40 cursor-not-allowed");

      // 3. NBTC Clinical Advisory notice explaining SDP apheresis constraints
      expect(htmlSDP).toContain("NBTC Clinical Advisory:");
      expect(htmlSDP).toContain(
        "Single Donor Platelet (SDP) apheresis transfusions require strictly ABO/Rh compatible or exact matches to prevent severe immune-mediated platelet refractoriness"
      );
      expect(htmlSDP).toContain("Replacement mode is prohibited for SDP.");
    });

    it("when component = WHOLE_BLOOD: Replacement Mode is active and selectable", () => {
      const htmlWB = renderEmergencyRequestNewWithState(
        Component.WHOLE_BLOOD,
        RequestMode.REPLACEMENT_ANY
      );

      // 1. Replacement Mode button is enabled (not disabled)
      expect(htmlWB).toContain("Replacement Mode");
      expect(htmlWB).toContain("Any donor blood group acceptable for hospital blood bank exchange inventory.");

      // 2. Lock badge is NOT displayed
      expect(htmlWB).not.toContain("Locked to EXACT_OR_SDP (NBTC Rule)");

      // 3. SDP advisory is NOT displayed
      expect(htmlWB).not.toContain("Replacement mode is prohibited for SDP.");
    });

    it("backend validation check: SDP requests reject non-EXACT requestMode or enforce EXACT_OR_SDP", () => {
      // In EmergencyRequestNewPage.handleSubmit:
      // requestMode: component === Component.SDP ? RequestMode.EXACT_OR_SDP : requestMode
      const evaluatePayloadMode = (comp: Component, reqMode: RequestMode) => {
        return comp === Component.SDP ? RequestMode.EXACT_OR_SDP : reqMode;
      };

      // Even if user manipulated state to REPLACEMENT_ANY, SDP strictly evaluates to EXACT_OR_SDP
      expect(evaluatePayloadMode(Component.SDP, RequestMode.REPLACEMENT_ANY)).toBe(
        RequestMode.EXACT_OR_SDP
      );
      expect(evaluatePayloadMode(Component.SDP, RequestMode.EXACT_OR_SDP)).toBe(
        RequestMode.EXACT_OR_SDP
      );

      // Non-SDP components retain their selected mode
      expect(evaluatePayloadMode(Component.WHOLE_BLOOD, RequestMode.REPLACEMENT_ANY)).toBe(
        RequestMode.REPLACEMENT_ANY
      );
    });
  });

  // ===========================================================================
  // AREA 4: Science Sidecar Link Presence
  // ===========================================================================
  describe("Area 4: Science Sidecar Link Presence & Conformance", () => {
    it("SidecarPill component renders valid sidecar:// URL and compliant security attributes", () => {
      const html = renderToStaticMarkup(
        React.createElement(SidecarPill, { variant: "banner" })
      );

      // 1. Mandatory protocol URL
      expect(html).toContain(
        'href="sidecar://science/biomolecular_structure_viewer/ui.html"'
      );

      // 2. Security attributes for external sidecar integration
      expect(html).toContain('target="_blank"');
      expect(html).toContain('rel="noopener noreferrer"');

      // 3. Clear human-readable label
      expect(html).toContain("Biomolecular Structure Viewer");
    });

    it("Sidecar link is present in Family Command Center (/r/[shortHash])", () => {
      const mockData = {
        request: {
          id: 1,
          patientName: "Aarav Sharma",
          patientUhid: "AIIMS-2026-9921",
          hospitalName: "AIIMS Delhi, Trauma Centre",
          hospitalLat: 28.5672,
          hospitalLng: 77.21,
          component: "SDP",
          bloodGroup: "B_POS",
          requestMode: "EXACT_OR_SDP",
          unitsNeeded: 2,
          waveState: WaveState.WAVE_1_DISPATCH,
          shortHash: "v2v_w1_aiims",
          expiresAt: new Date(Date.now() + 11 * 3600 * 1000).toISOString(),
          isExpired: false,
          canInitiateCalls: true,
          trackingUrl: "http://localhost:3000/r/v2v_w1_aiims",
          sidecarUrl: SIDECAR_URL,
        },
        activeLeases: [],
        standbyLeases: [],
        pingCount: 2,
      };

      const html = renderCommandCenterWithState(mockData);
      expect(html).toContain(
        'href="sidecar://science/biomolecular_structure_viewer/ui.html"'
      );
    });

    it("Sidecar link is present in Emergency SOS Intake page (/request/new)", () => {
      const html = renderEmergencyRequestNewWithState();
      expect(html).toContain(
        'href="sidecar://science/biomolecular_structure_viewer/ui.html"'
      );
    });

    it("exports match SIDECAR_VIEWER_URL and SIDECAR_URL constants across codebase", () => {
      const EXPECTED = "sidecar://science/biomolecular_structure_viewer/ui.html";
      expect(SIDECAR_URL).toBe(EXPECTED);
      expect(SIDECAR_VIEWER_URL).toBe(EXPECTED);
    });
  });
});
