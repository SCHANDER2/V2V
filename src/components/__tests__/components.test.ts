// src/components/__tests__/components.test.ts
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import SidecarPill, { SIDECAR_URL } from "@/components/SidecarPill";
import WaveRadar from "@/components/WaveRadar";
import DynamicQrCode from "@/components/DynamicQrCode";
import HealthChecklist from "@/components/HealthChecklist";
import DonorRoster from "@/components/DonorRoster";
import V2VPass from "@/components/V2VPass";
import { WaveState, LeaseStatus } from "@/types/enums";

describe("Milestone 3 UI Components Render & Logic Suite", () => {
  describe("SidecarPill Component", () => {
    it("renders mandatory sidecar URL per Science Visualization Priority Rules", () => {
      const html = renderToStaticMarkup(
        React.createElement(SidecarPill, { variant: "banner" })
      );

      expect(html).toContain(SIDECAR_URL);
      expect(html).toContain("sidecar://science/biomolecular_structure_viewer/ui.html");
      expect(html).toContain("Biomolecular Structure Viewer");
      expect(html).toContain("Launch Viewer");
    });

    it("renders compact variant when compact=true", () => {
      const html = renderToStaticMarkup(
        React.createElement(SidecarPill, { compact: true })
      );

      expect(html).toContain(SIDECAR_URL);
      expect(html).toContain("Biomolecular Structure Viewer");
      expect(html).toContain("rounded-full");
    });
  });

  describe("WaveRadar Component", () => {
    it("renders animated SVG concentric rings for Wave 1", () => {
      const html = renderToStaticMarkup(
        React.createElement(WaveRadar, {
          waveState: WaveState.WAVE_1_DISPATCH,
          pingCount: 5,
          activeDonorsCount: 1,
          unitsNeeded: 2,
          hospitalName: "AIIMS Delhi, Trauma Centre",
        })
      );

      expect(html).toContain("Geospatial Dispatch Radar");
      expect(html).toContain("Wave 1 Active: 0 – 3 km (Vicinity)");
      expect(html).toContain("AIIMS Delhi, Trauma Centre");
      expect(html).toContain("W1: 3km | W2: 7km | W3: 15km");
      expect(html).toContain("scannerSweep");
      expect(html).toContain("2 Units");
    });

    it("renders locked state overlay when LEASE_LOCKED", () => {
      const html = renderToStaticMarkup(
        React.createElement(WaveRadar, {
          waveState: WaveState.LEASE_LOCKED,
          pingCount: 10,
          activeDonorsCount: 3,
          unitsNeeded: 2,
        })
      );

      expect(html).toContain("SLOTS LOCKED");
      expect(html).toContain("Dispatch Locked: Full Donor Travel Quota Filled");
    });

    it("renders fulfilled state overlay when FULFILLED_CLOSED", () => {
      const html = renderToStaticMarkup(
        React.createElement(WaveRadar, {
          waveState: WaveState.FULFILLED_CLOSED,
        })
      );

      expect(html).toContain("FULFILLED");
      expect(html).toContain("Transfusion Completed: Waves Deactivated");
    });
  });

  describe("DynamicQrCode Component", () => {
    it("renders SVG with deterministic finder patterns and modules", () => {
      const testPayload = JSON.stringify({ pass: "V2V-TEST", id: 123 });
      const html = renderToStaticMarkup(
        React.createElement(DynamicQrCode, {
          value: testPayload,
          size: 200,
        })
      );

      expect(html).toContain("<svg");
      expect(html).toContain('viewBox="0 0 200 200"');
      expect(html).toContain("<rect");
    });
  });

  describe("HealthChecklist Component", () => {
    it("renders 5 rapid health screener questions for Whole Blood", () => {
      const onPassMock = jest.fn();
      const onDeferralMock = jest.fn();

      const html = renderToStaticMarkup(
        React.createElement(HealthChecklist, {
          component: "WHOLE_BLOOD",
          onPass: onPassMock,
          onDeferral: onDeferralMock,
        })
      );

      expect(html).toContain("Rapid Health &amp; Safety Screener");
      expect(html).toContain("Feeling completely well today?");
      expect(html).toContain("Have you consumed alcohol within the last 24 hours?");
      expect(html).toContain("dental extraction, root canal, minor surgery");
      expect(html).toContain("tattoo, body piercing, microblading");
      expect(html).toContain("Is your current body weight at least 45 kg");
    });

    it("renders SDP-specific questions for Single Donor Platelets", () => {
      const onPassMock = jest.fn();
      const onDeferralMock = jest.fn();

      const html = renderToStaticMarkup(
        React.createElement(HealthChecklist, {
          component: "SDP",
          onPass: onPassMock,
          onDeferral: onDeferralMock,
        })
      );

      expect(html).toContain("Painkillers &amp; Weight: Have you refrained from Aspirin/NSAIDs for 48 hours");
      expect(html).toContain("at least 50 kg");
    });
  });

  describe("DonorRoster Component", () => {
    it("renders active en-route and standby donors with masked contacts and handshake PIN", () => {
      const activeLeases = [
        {
          id: 101,
          donorId: 1,
          status: LeaseStatus.EN_ROUTE,
          leaseExpiresAt: new Date(Date.now() + 20 * 60 * 1000).toISOString(),
          handshakePin: "5544",
          donor: {
            id: 1,
            name: "Rajesh K.",
            maskedPhone: "+91 98••••0001",
            bloodGroup: "B_POS",
          },
        },
      ];

      const standbyLeases = [
        {
          id: 102,
          donorId: 2,
          status: LeaseStatus.STANDBY,
          leaseExpiresAt: new Date(Date.now() + 25 * 60 * 1000).toISOString(),
          donor: {
            id: 2,
            name: "Sunita M.",
            maskedPhone: "+91 98••••0002",
            bloodGroup: "B_POS",
          },
        },
      ];

      const html = renderToStaticMarkup(
        React.createElement(DonorRoster, {
          requestId: 1,
          activeLeases,
          standbyLeases,
          canInitiateCalls: true,
          isExpired: false,
          isFulfilled: false,
        })
      );

      expect(html).toContain("Community Donor Roster");
      expect(html).toContain("Rajesh K.");
      expect(html).toContain("+91 98••••0001");
      expect(html).toContain("EN ROUTE");
      expect(html).toContain("5544"); // Handshake PIN visible to family
      expect(html).toContain("Call Donor (Masked)");
      expect(html).toMatch(/Dead-Man(&apos;|&#x27;|')s Travel Window/);
    });

    it("deactivates call triggers when request is fulfilled (Counter-Loop 4)", () => {
      const activeLeases = [
        {
          id: 101,
          donorId: 1,
          status: LeaseStatus.ARRIVED,
          leaseExpiresAt: new Date(Date.now() + 20 * 60 * 1000).toISOString(),
          handshakePin: "5544",
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
          canInitiateCalls: false,
          isExpired: false,
          isFulfilled: true,
        })
      );

      expect(html).toContain("Calls deactivated (Anti-Tout Protection)");
      expect(html).not.toContain("Call Donor (Masked)");
    });
  });

  describe("V2VPass Component", () => {
    it("renders official emergency pass with hospital info, QR, navigation, and PIN", () => {
      const html = renderToStaticMarkup(
        React.createElement(V2VPass, {
          leaseId: 50,
          donorId: 12,
          requestId: 9,
          donorName: "Arjun Verma",
          patientUhid: "UHID-2026-99",
          hospitalName: "Safdarjung Hospital, New Delhi",
          bloodGroup: "O_POS",
          component: "WHOLE_BLOOD",
          handshakePin: "8833",
          status: LeaseStatus.EN_ROUTE,
          leaseExpiresAt: new Date(Date.now() + 18 * 60 * 1000).toISOString(),
          hospitalLat: 28.5924,
          hospitalLng: 77.2210,
        })
      );

      expect(html).toContain("V2V Emergency Donor Pass");
      expect(html).toContain("Safdarjung Hospital, New Delhi");
      expect(html).toContain("UHID-2026-99");
      expect(html).toContain("O_POS • WHOLE_BLOOD");
      expect(html).toContain("PASS ID: V2V-9-12-50");
      expect(html).toContain("Open Google Maps Turn-by-Turn");
      expect(html).toContain("I Have Arrived at Blood Bank");
      expect(html).toContain("Counter Handshake PIN");
      expect(html).toContain("https://www.google.com/maps/dir/?api=1&amp;destination=28.5924,77.221");
    });
  });
});
