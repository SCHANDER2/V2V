// src/lib/adapters/__tests__/adapters.test.ts
import {
  adapters,
  setAdapterOverrides,
  resetAdapterOverrides,
  mockEraktKoshAdapter,
  mockWhatsAppCloudAdapter,
  mockCloudTelephonyBridge,
  mockRequisitionVerifierOCR,
} from "../index";
import { BloodGroup, Component, WaveState } from "@/types/enums";

describe("Milestone 2: Adapters Integration Suite", () => {
  beforeEach(() => {
    resetAdapterOverrides();
    mockEraktKoshAdapter.resetMockStock();
    mockWhatsAppCloudAdapter.clearOutbox();
    mockCloudTelephonyBridge.resetSessions();
    mockRequisitionVerifierOCR.setDefaultPreset("VALID_AIIMS_SDP");
    mockRequisitionVerifierOCR.setMockResult(null);
  });

  describe("ERaktKoshAdapter (Haversine & Delhi NCR Blood Banks)", () => {
    it("returns stock preview sorted by nearest distance from AIIMS Delhi coordinates", async () => {
      // AIIMS Delhi coords: 28.5672, 77.2100
      const preview = await adapters.eraktKosh.getStockPreview(
        28.5672,
        77.2100,
        Component.SDP,
        BloodGroup.O_POS
      );

      expect(preview.available).toBe(true);
      expect(preview.totalUnitsAvailable).toBeGreaterThan(0);
      expect(preview.bloodBanks.length).toBe(4);

      // AIIMS should be the closest bank (distance ~ 0 km)
      expect(preview.bloodBanks[0].id).toBe("bb-aiims");
      expect(preview.bloodBanks[0].distanceKm).toBe(0);
      expect(preview.nearestBankDistanceKm).toBe(0);

      // Distances should be monotonically increasing (nearest first)
      for (let i = 1; i < preview.bloodBanks.length; i++) {
        expect(preview.bloodBanks[i].distanceKm).toBeGreaterThanOrEqual(
          preview.bloodBanks[i - 1].distanceKm
        );
      }
    });

    it("evaluates checkStock accurately for common vs rare blood groups", async () => {
      const wholeBloodStock = await adapters.eraktKosh.checkStock(
        28.5672,
        77.2100,
        Component.WHOLE_BLOOD,
        BloodGroup.O_POS
      );
      expect(wholeBloodStock).toBe(true);

      // Force availability override to false
      mockEraktKoshAdapter.setForceAvailability(false);
      const forcedZeroStock = await adapters.eraktKosh.checkStock(
        28.5672,
        77.2100,
        Component.WHOLE_BLOOD,
        BloodGroup.O_POS
      );
      expect(forcedZeroStock).toBe(false);
    });

    it("respects custom inventory overrides", async () => {
      mockEraktKoshAdapter.setMockStock("bb-aiims", Component.SDP, BloodGroup.BOMBAY_OH, 10);
      const preview = await adapters.eraktKosh.getStockPreview(
        28.5672,
        77.2100,
        Component.SDP,
        BloodGroup.BOMBAY_OH
      );

      const aiims = preview.bloodBanks.find((b) => b.id === "bb-aiims");
      expect(aiims?.unitsAvailable).toBe(10);
      expect(preview.available).toBe(true);
    });
  });

  describe("WhatsAppCloudAdapter (Outbox, Templates & Webhooks)", () => {
    it("captures template messages in outbox with generated messageId", async () => {
      const recipient = "+919876543210";
      const result = await adapters.whatsapp.sendTemplate(
        recipient,
        "v2v_emergency_sos_dispatch",
        [{ type: "body", parameters: [{ type: "text", text: "AIIMS Trauma" }] }]
      );

      expect(result.success).toBe(true);
      expect(result.recipientPhone).toBe(recipient);
      expect(result.messageId).toMatch(/^wamid\.HBgL/);

      const outbox = adapters.whatsapp.getOutbox();
      expect(outbox.length).toBe(1);
      expect(outbox[0].messageId).toBe(result.messageId);
      expect(outbox[0].templateName).toBe("v2v_emergency_sos_dispatch");

      const recipientMsgs = adapters.whatsapp.getMessagesForRecipient(recipient);
      expect(recipientMsgs.length).toBe(1);
    });

    it("captures interactive button replies in outbox", async () => {
      const recipient = "+919811223344";
      const buttons = [
        { id: "ACCEPT_SOS", title: "Accept SOS & Unlock Slot" },
        { id: "DECLINE_SOS", title: "Cannot Donate Today" },
      ];

      const result = await adapters.whatsapp.sendInteractiveButtons(
        recipient,
        "Critical emergency: Patient requires 1 unit SDP at AIIMS.",
        buttons
      );

      expect(result.success).toBe(true);
      expect(result.type).toBe("interactive");

      const last = adapters.whatsapp.getLastMessage();
      expect(last?.buttons?.length).toBe(2);
      expect(last?.buttons?.[0].id).toBe("ACCEPT_SOS");
    });

    it("processes simulated incoming donor button replies", async () => {
      const donorPhone = "+919811223344";
      const processing = await mockWhatsAppCloudAdapter.simulateDonorButtonReply(
        donorPhone,
        "ACCEPT_SOS",
        "Accept SOS & Unlock Slot"
      );

      expect(processing.processed).toBe(true);
      expect(processing.fromPhone).toBe(donorPhone);
      expect(processing.buttonId).toBe("ACCEPT_SOS");
      expect(processing.actionTaken).toBe("BUTTON_ACTION_ACCEPT_SOS");
    });
  });

  describe("CloudTelephonyBridge (Counter-Loop 4 & Masking)", () => {
    it("allocates virtual proxy DID and masks real phone numbers for active requests", async () => {
      const session = await adapters.telephony.initiateMaskedBridge(
        101,
        202,
        "+919876543210",
        "+919811223344",
        { requestStatusOverride: WaveState.WAVE_1_DISPATCH }
      );

      expect(session.sessionId).toContain("bridge_101_202");
      expect(session.virtualProxyNumber).toMatch(/^\+91114000\d{4}$/);
      expect(session.status).toBe("ACTIVE");
      expect(session.maskedAttendantPhone).not.toBe("+919876543210");
      expect(session.maskedAttendantPhone).toContain("XXXXX");
      expect(session.maskedDonorPhone).not.toBe("+919811223344");
      expect(session.maskedDonorPhone).toContain("XXXXX");
    });

    it("enforces Counter-Loop 4: rejects bridge when request is FULFILLED_CLOSED or EXPIRED", async () => {
      await expect(
        adapters.telephony.initiateMaskedBridge(
          102,
          203,
          "+919876543210",
          "+919811223344",
          { requestStatusOverride: WaveState.FULFILLED_CLOSED }
        )
      ).rejects.toThrow(/Counter-Loop 4 Violation/);

      await expect(
        adapters.telephony.initiateMaskedBridge(
          103,
          204,
          "+919876543210",
          "+919811223344",
          { requestStatusOverride: WaveState.EXPIRED }
        )
      ).rejects.toThrow(/Counter-Loop 4 Violation/);
    });

    it("allows terminating bridges individually and by requestId", async () => {
      const s1 = await adapters.telephony.initiateMaskedBridge(
        104,
        205,
        "+919876543210",
        "+919811223344",
        { requestStatusOverride: WaveState.WAVE_2_DISPATCH }
      );
      const s2 = await adapters.telephony.initiateMaskedBridge(
        104,
        206,
        "+919876543210",
        "+919811223355",
        { requestStatusOverride: WaveState.WAVE_2_DISPATCH }
      );

      expect(adapters.telephony.getActiveBridges(104).length).toBe(2);

      await adapters.telephony.terminateBridge(s1.sessionId);
      expect(adapters.telephony.getSession(s1.sessionId)?.status).toBe("TERMINATED");
      expect(adapters.telephony.getActiveBridges(104).length).toBe(1);

      const terminatedCount = await adapters.telephony.terminateBridgesForRequest(104);
      expect(terminatedCount).toBe(1);
      expect(adapters.telephony.getActiveBridges(104).length).toBe(0);
    });
  });

  describe("RequisitionVerifierOCR (Doctor Stamp & Field Parsing)", () => {
    it("correctly parses valid AIIMS requisition slip with stamp and signature", async () => {
      const result = await adapters.ocr.verifyRequisition({
        simulatedPreset: "VALID_AIIMS_SDP",
      });

      expect(result.isValidRequisition).toBe(true);
      expect(result.overallConfidence).toBeGreaterThan(0.9);
      expect(result.doctorStampDetected).toBe(true);
      expect(result.doctorSignatureDetected).toBe(true);
      expect(result.fields.patientUhid).toBe("AIIMS-2026-8841");
      expect(result.fields.component).toBe("SDP");
      expect(result.fields.bloodGroup).toBe("A_POS");
      expect(result.validationWarnings.length).toBe(0);
    });

    it("flags missing official doctor stamp as invalid", async () => {
      const result = await adapters.ocr.verifyRequisition({
        simulatedPreset: "MISSING_STAMP",
      });

      expect(result.isValidRequisition).toBe(false);
      expect(result.doctorStampDetected).toBe(false);
      expect(result.validationWarnings).toContain("Official doctor stamp missing from requisition slip");
    });

    it("rejects blurry unreadable slips with low confidence", async () => {
      const result = await adapters.ocr.verifyRequisition({
        simulatedPreset: "BLURRY_UNREADABLE",
      });

      expect(result.isValidRequisition).toBe(false);
      expect(result.overallConfidence).toBeLessThan(0.3);
      expect(result.fields.patientUhid).toBeNull();
    });
  });

  describe("Dependency Injection Registry (Test Overrides)", () => {
    it("allows overriding specific adapters and resetting to default", () => {
      const customMockOCR = {
        verifyRequisition: jest.fn().mockResolvedValue({
          isValidRequisition: true,
          overallConfidence: 1.0,
          doctorStampDetected: true,
          doctorSignatureDetected: true,
          fields: {
            patientName: "Overridden Patient",
            patientUhid: "UHID-OVERRIDE",
            hospitalName: "Custom Hospital",
            component: "SDP",
            bloodGroup: "O_POS",
            unitsNeeded: 1,
            requisitionDate: "2026-10-23",
          },
          confidence: {} as any,
          rawText: "Override Text",
          validationWarnings: [],
          processedAt: new Date().toISOString(),
        }),
      };

      setAdapterOverrides({ ocr: customMockOCR as any });
      expect(adapters.ocr).toBe(customMockOCR);

      resetAdapterOverrides();
      expect(adapters.ocr).toBe(mockRequisitionVerifierOCR);
    });
  });
});
