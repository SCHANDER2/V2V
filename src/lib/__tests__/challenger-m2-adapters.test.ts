// src/lib/__tests__/challenger-m2-adapters.test.ts
/**
 * Milestone 2 Adversarial Challenge Test Harness
 * 
 * Conducts stress testing, edge case mining, and boundary verification on:
 * 1. ERaktKoshAdapter: Far coordinates (>50km away from Delhi), rare blood groups (BOMBAY_OH, AB_NEG), inventory exhaustion.
 * 2. WhatsAppCloudAdapter: Outbox tracking, recipient isolation, phone number normalization, and malformed/unregistered webhook payloads.
 * 3. CloudTelephonyBridge: Counter-Loop 4 strict enforcement (FULFILLED_CLOSED, EXPIRED), DID proxy pool cycling, number masking robustness, and session lifecycle.
 * 4. RequisitionVerifierOCR: Degraded/fraudulent input handling, confidence scoring, doctor stamp/signature validation, and unhandled preset behavior.
 * 5. setAdapterOverrides: Clean test mock injection, partial overrides, and strict isolation after reset.
 */

import {
  adapters,
  setAdapterOverrides,
  resetAdapterOverrides,
  mockEraktKoshAdapter,
  mockWhatsAppCloudAdapter,
  mockCloudTelephonyBridge,
  mockRequisitionVerifierOCR,
} from "../adapters/index";
import { BloodGroup, Component, WaveState } from "@/types/enums";
import { maskPhoneNumber, VIRTUAL_PROXY_POOL } from "../adapters/mocks/mockCloudTelephonyBridge";

describe("Milestone 2 Adversarial Challenge: Integration Adapters", () => {
  beforeEach(() => {
    resetAdapterOverrides();
    mockEraktKoshAdapter.resetMockStock();
    mockWhatsAppCloudAdapter.clearOutbox();
    mockCloudTelephonyBridge.resetSessions();
    mockRequisitionVerifierOCR.setDefaultPreset("VALID_AIIMS_SDP");
    mockRequisitionVerifierOCR.setMockResult(null);
  });

  afterAll(() => {
    resetAdapterOverrides();
    mockEraktKoshAdapter.resetMockStock();
    mockWhatsAppCloudAdapter.clearOutbox();
    mockCloudTelephonyBridge.resetSessions();
    mockRequisitionVerifierOCR.setDefaultPreset("VALID_AIIMS_SDP");
    mockRequisitionVerifierOCR.setMockResult(null);
  });

  // =========================================================================
  // 1. ERaktKoshAdapter Stress & Edge Testing
  // =========================================================================
  describe("Adversarial: ERaktKoshAdapter", () => {
    it("handles coordinates >50km away (Jaipur, ~235km) and preserves monotonic distance sorting", async () => {
      // Jaipur, Rajasthan coordinates: 26.9124° N, 75.7873° E
      const jaipurLat = 26.9124;
      const jaipurLng = 75.7873;

      const preview = await adapters.eraktKosh.getStockPreview(
        jaipurLat,
        jaipurLng,
        Component.WHOLE_BLOOD,
        BloodGroup.O_POS
      );

      // Verify that every single Delhi NCR blood bank is > 50km away
      expect(preview.nearestBankDistanceKm).toBeGreaterThan(50);
      expect(preview.nearestBankDistanceKm).toBeGreaterThan(200); // Actually ~234 km

      expect(preview.bloodBanks.length).toBe(4);
      for (const bank of preview.bloodBanks) {
        expect(bank.distanceKm).toBeGreaterThan(50);
      }

      // Verify distance monotonicity: bloodBanks must be strictly ordered ascending
      for (let i = 1; i < preview.bloodBanks.length; i++) {
        expect(preview.bloodBanks[i].distanceKm).toBeGreaterThanOrEqual(
          preview.bloodBanks[i - 1].distanceKm
        );
      }
    });

    it("verifies spatial accuracy for northern distant coordinates (Chandigarh, ~230km)", async () => {
      // Chandigarh coordinates: 30.7333° N, 76.7794° E
      const chandigarhLat = 30.7333;
      const chandigarhLng = 76.7794;

      const preview = await adapters.eraktKosh.getStockPreview(
        chandigarhLat,
        chandigarhLng,
        Component.PRBC,
        BloodGroup.B_POS
      );

      expect(preview.nearestBankDistanceKm).toBeGreaterThan(50);

      // From Chandigarh (North), Lions Blood Bank in Shalimar Bagh (North Delhi, lat ~28.70)
      // should be closer than Rotary Blood Bank in Tughlakabad (South Delhi, lat ~28.53)
      const lionsBank = preview.bloodBanks.find((b) => b.id === "bb-lions");
      const rotaryBank = preview.bloodBanks.find((b) => b.id === "bb-rotary");

      expect(lionsBank).toBeDefined();
      expect(rotaryBank).toBeDefined();
      expect(lionsBank!.distanceKm).toBeLessThan(rotaryBank!.distanceKm);
    });

    it("handles extreme remote coordinates (London, UK) without arithmetic overflow or NaN", async () => {
      const londonLat = 51.5074;
      const londonLng = -0.1278;

      const preview = await adapters.eraktKosh.getStockPreview(
        londonLat,
        londonLng,
        Component.SDP,
        BloodGroup.A_POS
      );

      expect(preview.nearestBankDistanceKm).toBeGreaterThan(6000);
      expect(Number.isFinite(preview.nearestBankDistanceKm)).toBe(true);
      expect(Number.isNaN(preview.nearestBankDistanceKm)).toBe(false);
    });

    it("evaluates extremely rare blood group BOMBAY_OH under default and exhausted conditions", async () => {
      // Default: AIIMS has exactly 1 unit, all other banks have 0
      const preview = await adapters.eraktKosh.getStockPreview(
        28.5672,
        77.2100,
        Component.WHOLE_BLOOD,
        BloodGroup.BOMBAY_OH
      );

      expect(preview.totalUnitsAvailable).toBe(1);
      expect(preview.available).toBe(true);

      const aiims = preview.bloodBanks.find((b) => b.id === "bb-aiims");
      expect(aiims?.unitsAvailable).toBe(1);

      const others = preview.bloodBanks.filter((b) => b.id !== "bb-aiims");
      for (const b of others) {
        expect(b.unitsAvailable).toBe(0);
      }

      // Exhaustion test: set AIIMS BOMBAY_OH stock to 0
      mockEraktKoshAdapter.setMockStock("bb-aiims", Component.WHOLE_BLOOD, BloodGroup.BOMBAY_OH, 0);

      const exhaustedPreview = await adapters.eraktKosh.getStockPreview(
        28.5672,
        77.2100,
        Component.WHOLE_BLOOD,
        BloodGroup.BOMBAY_OH
      );

      expect(exhaustedPreview.totalUnitsAvailable).toBe(0);
      expect(exhaustedPreview.available).toBe(false);

      const checkAvailable = await adapters.eraktKosh.checkStock(
        28.5672,
        77.2100,
        Component.WHOLE_BLOOD,
        BloodGroup.BOMBAY_OH
      );
      expect(checkAvailable).toBe(false);
    });

    it("evaluates rare blood group AB_NEG across PRBC vs SDP components", async () => {
      // AB_NEG with PRBC (Negative blood groups base = 2 units)
      const prbcPreview = await adapters.eraktKosh.getStockPreview(
        28.5672,
        77.2100,
        Component.PRBC,
        BloodGroup.AB_NEG
      );

      expect(prbcPreview.available).toBe(true);
      // AIIMS: 2+5=7, RedCross: 2+3=5, Rotary: 2, Lions: Math.max(0, 2-2)=0 -> Total = 14
      expect(prbcPreview.totalUnitsAvailable).toBe(14);

      // AB_NEG with SDP (Platelets for non-O+/B+ return 1 unit at AIIMS, 0 elsewhere)
      const sdpPreview = await adapters.eraktKosh.getStockPreview(
        28.5672,
        77.2100,
        Component.SDP,
        BloodGroup.AB_NEG
      );

      expect(sdpPreview.totalUnitsAvailable).toBe(1);
      expect(sdpPreview.available).toBe(true);
    });
  });

  // =========================================================================
  // 2. WhatsAppCloudAdapter Stress & Edge Testing
  // =========================================================================
  describe("Adversarial: WhatsAppCloudAdapter", () => {
    it("maintains strict recipient isolation and handles various phone number formats", async () => {
      const phoneA = "+91 98765 43210";
      const phoneB = "+919811223344";

      await adapters.whatsapp.sendTemplate(phoneA, "emergency_dispatch_wave_1", []);
      await adapters.whatsapp.sendTemplate(phoneB, "emergency_dispatch_wave_1", []);
      await adapters.whatsapp.sendInteractiveButtons(phoneA, "Please confirm arrival", [
        { id: "CONFIRM_ARRIVAL", title: "I Have Arrived" },
      ]);

      const outbox = adapters.whatsapp.getOutbox();
      expect(outbox.length).toBe(3);

      // Query with formatted and unformatted variations of phoneA with country code
      const msgsA1 = adapters.whatsapp.getMessagesForRecipient("+919876543210");
      const msgsA2 = adapters.whatsapp.getMessagesForRecipient("+91 98765-43210");
      expect(msgsA1.length).toBe(2);
      expect(msgsA2.length).toBe(2);

      // Query without country code (+91) strictly does not match 12-digit E.164 recipient
      const msgsA3 = adapters.whatsapp.getMessagesForRecipient("9876543210");
      expect(msgsA3.length).toBe(0);

      const msgsB = adapters.whatsapp.getMessagesForRecipient(phoneB);
      expect(msgsB.length).toBe(1);
    });

    it("resiliently processes malformed or incomplete webhook payloads without crashing", async () => {
      // Empty payload
      const res1 = await mockWhatsAppCloudAdapter.simulateIncomingWebhook({} as any);
      expect(res1.processed).toBe(false);
      expect(res1.messageType).toBe("unknown");

      // Payload with empty entries
      const res2 = await mockWhatsAppCloudAdapter.simulateIncomingWebhook({ entry: [] } as any);
      expect(res2.processed).toBe(false);

      // Payload with empty changes
      const res3 = await mockWhatsAppCloudAdapter.simulateIncomingWebhook({
        entry: [{ id: "entry_1", changes: [] }],
      } as any);
      expect(res3.processed).toBe(false);

      // Payload with empty messages array
      const res4 = await mockWhatsAppCloudAdapter.simulateIncomingWebhook({
        entry: [{ id: "entry_1", changes: [{ value: { messages: [] }, field: "messages" }] }],
      } as any);
      expect(res4.processed).toBe(false);
    });

    it("processes unregistered / adversarial button replies safely", async () => {
      const maliciousButtonId = "HACK_SQL_INJECTION' OR '1'='1; --";
      const res = await mockWhatsAppCloudAdapter.simulateDonorButtonReply(
        "+919811223344",
        maliciousButtonId,
        "Adversarial Button"
      );

      expect(res.processed).toBe(true);
      expect(res.buttonId).toBe(maliciousButtonId);
      expect(res.actionTaken).toBe(`BUTTON_ACTION_${maliciousButtonId}`);
    });

    it("processes unrecognized message types (e.g. location, image) gracefully", async () => {
      const payload = {
        object: "whatsapp_business_account",
        entry: [
          {
            id: "WHATSAPP_ENTRY_002",
            changes: [
              {
                value: {
                  messaging_product: "whatsapp",
                  messages: [
                    {
                      from: "+919811223344",
                      id: "wamid.HBgL9999",
                      timestamp: "1729690000",
                      type: "location",
                      location: {
                        latitude: 28.5672,
                        longitude: 77.21,
                        name: "AIIMS Gate 2",
                      },
                    },
                  ],
                },
                field: "messages",
              },
            ],
          },
        ],
      };

      const res = await mockWhatsAppCloudAdapter.simulateIncomingWebhook(payload as any);
      expect(res.processed).toBe(true);
      expect(res.messageType).toBe("location");
      expect(res.buttonId).toBeUndefined();
      expect(res.actionTaken).toBe("TEXT_RECEIVED");
    });
  });

  // =========================================================================
  // 3. CloudTelephonyBridge Stress & Edge Testing (Counter-Loop 4)
  // =========================================================================
  describe("Adversarial: CloudTelephonyBridge & Counter-Loop 4", () => {
    it("strictly throws Counter-Loop 4 violation for FULFILLED_CLOSED status override", async () => {
      await expect(
        adapters.telephony.initiateMaskedBridge(
          501,
          601,
          "+919876543210",
          "+919811223344",
          { requestStatusOverride: WaveState.FULFILLED_CLOSED }
        )
      ).rejects.toThrow("Counter-Loop 4 Violation: Cannot initiate masked bridge for request in state FULFILLED_CLOSED");
    });

    it("strictly throws Counter-Loop 4 violation for EXPIRED status override", async () => {
      await expect(
        adapters.telephony.initiateMaskedBridge(
          502,
          602,
          "+919876543210",
          "+919811223344",
          { requestStatusOverride: WaveState.EXPIRED }
        )
      ).rejects.toThrow("Counter-Loop 4 Violation: Cannot initiate masked bridge for request in state EXPIRED");
    });

    it("permits bridge initiation across all valid active wave states", async () => {
      const activeStates = [
        WaveState.WAVE_1_DISPATCH,
        WaveState.WAVE_2_DISPATCH,
        WaveState.LEASE_LOCKED,
      ];

      for (let i = 0; i < activeStates.length; i++) {
        const session = await adapters.telephony.initiateMaskedBridge(
          700 + i,
          800 + i,
          "+919876543210",
          "+919811223344",
          { requestStatusOverride: activeStates[i] }
        );

        expect(session.status).toBe("ACTIVE");
        expect(session.requestId).toBe(700 + i);
      }
    });

    it("cycles through virtual proxy pool gracefully under high volume without undefined DIDs", async () => {
      const totalCalls = 15; // Greater than pool size of 5
      const allocatedDIDs: string[] = [];

      for (let i = 0; i < totalCalls; i++) {
        const session = await adapters.telephony.initiateMaskedBridge(
          900,
          1000 + i,
          "+919876543210",
          "+919811223344",
          { requestStatusOverride: WaveState.WAVE_1_DISPATCH }
        );
        allocatedDIDs.push(session.virtualProxyNumber);
      }

      // Check all 15 sessions received valid pool numbers
      expect(allocatedDIDs.length).toBe(totalCalls);
      for (const did of allocatedDIDs) {
        expect(VIRTUAL_PROXY_POOL).toContain(did);
      }

      // Check modulo cycling behavior
      for (let i = 0; i < totalCalls; i++) {
        const expectedDID = VIRTUAL_PROXY_POOL[i % VIRTUAL_PROXY_POOL.length];
        expect(allocatedDIDs[i]).toBe(expectedDID);
      }
    });

    it("masks phone numbers with various edge cases and malformed inputs", () => {
      // Standard 10-digit Indian number: +919876543210 -> last 4 digits are 3210 -> masked last 2 digits: 10
      expect(maskPhoneNumber("+919876543210")).toBe("+91-XXXXX-XX10");

      // Number with special formatting
      expect(maskPhoneNumber("+91 (987) 654-3210")).toBe("+91-XXXXX-XX10");

      // Boundary: short numbers (< 4 digits)
      expect(maskPhoneNumber("123")).toBe("+91-XXXXX-XXXX");
      expect(maskPhoneNumber("")).toBe("+91-XXXXX-XXXX");
      expect(maskPhoneNumber("---")).toBe("+91-XXXXX-XXXX");
    });

    it("automatically excludes expired bridge sessions from getActiveBridges", async () => {
      // Create session with negative TTL (-1 minute) so it is already expired
      const session = await adapters.telephony.initiateMaskedBridge(
        1101,
        1201,
        "+919876543210",
        "+919811223344",
        {
          requestStatusOverride: WaveState.WAVE_1_DISPATCH,
          ttlMinutes: -1,
        }
      );

      expect(session.status).toBe("ACTIVE");

      // getActiveBridges should detect expiry, mutate status to COMPLETED, and exclude it
      const active = adapters.telephony.getActiveBridges(1101);
      expect(active.length).toBe(0);

      const refreshedSession = adapters.telephony.getSession(session.sessionId);
      expect(refreshedSession?.status).toBe("COMPLETED");
    });
  });

  // =========================================================================
  // 4. RequisitionVerifierOCR Stress & Edge Testing
  // =========================================================================
  describe("Adversarial: RequisitionVerifierOCR", () => {
    it("flags missing official doctor stamp and reflects lower confidence", async () => {
      const result = await adapters.ocr.verifyRequisition({
        simulatedPreset: "MISSING_STAMP",
      });

      expect(result.isValidRequisition).toBe(false);
      expect(result.doctorStampDetected).toBe(false);
      expect(result.doctorSignatureDetected).toBe(true);
      expect(result.overallConfidence).toBe(0.62);
      expect(result.confidence.doctorStamp).toBeLessThan(0.2);
      expect(result.validationWarnings).toContain(
        "Official doctor stamp missing from requisition slip"
      );
    });

    it("rejects blurry unreadable slips with severe confidence degradation", async () => {
      const result = await adapters.ocr.verifyRequisition({
        simulatedPreset: "BLURRY_UNREADABLE",
      });

      expect(result.isValidRequisition).toBe(false);
      expect(result.overallConfidence).toBeLessThan(0.25);
      expect(result.doctorStampDetected).toBe(false);
      expect(result.doctorSignatureDetected).toBe(false);

      // All extracted fields must be null
      expect(result.fields.patientName).toBeNull();
      expect(result.fields.patientUhid).toBeNull();
      expect(result.fields.hospitalName).toBeNull();
      expect(result.fields.component).toBeNull();

      expect(result.validationWarnings.length).toBeGreaterThan(0);
    });

    it("handles injection of custom fraudulent requisition slips with explicit fraud warnings", async () => {
      const fraudulentResult = {
        isValidRequisition: false,
        overallConfidence: 0.15,
        doctorStampDetected: false,
        doctorSignatureDetected: false,
        fields: {
          patientName: "Suspect Patient",
          patientUhid: "INVALID-UHID-FORMAT-999",
          hospitalName: "Unregistered Clinic XYZ",
          component: "SDP",
          bloodGroup: "O_POS",
          unitsNeeded: 10, // Unusually high units
          requisitionDate: "2020-01-01", // Stale date
        },
        confidence: {
          patientName: 0.2,
          patientUhid: 0.1,
          hospitalName: 0.1,
          component: 0.3,
          bloodGroup: 0.3,
          unitsNeeded: 0.2,
          doctorStamp: 0.0,
          doctorSignature: 0.0,
        },
        rawText: "SUSPICIOUS FORGED SLIP WITH NO REGISTRATION NUMBER",
        validationWarnings: [
          "Suspected forged requisition document",
          "Units requested exceed single patient emergency threshold",
          "Requisition date exceeds valid 48-hour clinical window",
        ],
        processedAt: new Date().toISOString(),
      };

      mockRequisitionVerifierOCR.setMockResult(fraudulentResult);

      const verified = await adapters.ocr.verifyRequisition({});
      expect(verified.isValidRequisition).toBe(false);
      expect(verified.overallConfidence).toBe(0.15);
      expect(verified.validationWarnings).toContain("Suspected forged requisition document");
      expect(verified.validationWarnings).toContain("Units requested exceed single patient emergency threshold");
    });

    it("reveals edge case: EXPIRED_PRESCRIPTION preset unhandled by mock falls back to VALID_AIIMS_SDP", async () => {
      // EXPIRED_PRESCRIPTION is defined in OCRImageInput interface but mockRequisitionVerifierOCR lacks a handler branch
      const result = await adapters.ocr.verifyRequisition({
        simulatedPreset: "EXPIRED_PRESCRIPTION",
      });

      // Empirical challenger observation: falls through to default VALID_AIIMS_SDP
      expect(result.isValidRequisition).toBe(true);
      expect(result.fields.patientUhid).toBe("AIIMS-2026-8841");
    });
  });

  // =========================================================================
  // 5. Dependency Injection Registry (setAdapterOverrides) Stress Testing
  // =========================================================================
  describe("Adversarial: setAdapterOverrides & Registry Isolation", () => {
    it("allows surgical override of single adapter without mutating other adapters", () => {
      const mockCustomEraktKosh = {
        checkStock: jest.fn().mockResolvedValue(false),
        getStockPreview: jest.fn().mockResolvedValue({
          available: false,
          totalUnitsAvailable: 0,
          nearestBankDistanceKm: null,
          component: "SDP",
          bloodGroup: "BOMBAY_OH",
          bloodBanks: [],
          checkedAt: new Date().toISOString(),
        }),
      };

      // Override only eraktKosh
      setAdapterOverrides({ eraktKosh: mockCustomEraktKosh as any });

      expect(adapters.eraktKosh).toBe(mockCustomEraktKosh);
      // Other 3 adapters must remain strictly intact
      expect(adapters.whatsapp).toBe(mockWhatsAppCloudAdapter);
      expect(adapters.telephony).toBe(mockCloudTelephonyBridge);
      expect(adapters.ocr).toBe(mockRequisitionVerifierOCR);

      // Reset
      resetAdapterOverrides();
      expect(adapters.eraktKosh).toBe(mockEraktKoshAdapter);
    });

    it("guarantees zero leakage across successive test cases with multiple simultaneous overrides", () => {
      const customWA = {
        sendTemplate: jest.fn(),
        sendInteractiveButtons: jest.fn(),
        getOutbox: jest.fn().mockReturnValue([]),
        clearOutbox: jest.fn(),
        getMessagesForRecipient: jest.fn().mockReturnValue([]),
        getLastMessage: jest.fn(),
        simulateIncomingWebhook: jest.fn(),
        simulateDonorButtonReply: jest.fn(),
      };

      const customTelephony = {
        initiateMaskedBridge: jest.fn(),
        terminateBridge: jest.fn(),
        terminateBridgesForRequest: jest.fn(),
        getActiveBridges: jest.fn().mockReturnValue([]),
        getSession: jest.fn(),
        resetSessions: jest.fn(),
      };

      setAdapterOverrides({
        whatsapp: customWA as any,
        telephony: customTelephony as any,
      });

      expect(adapters.whatsapp).toBe(customWA);
      expect(adapters.telephony).toBe(customTelephony);
      expect(adapters.eraktKosh).toBe(mockEraktKoshAdapter);
      expect(adapters.ocr).toBe(mockRequisitionVerifierOCR);

      resetAdapterOverrides();

      expect(adapters.whatsapp).toBe(mockWhatsAppCloudAdapter);
      expect(adapters.telephony).toBe(mockCloudTelephonyBridge);
    });
  });
});
