/**
 * Mock Requisition Verifier OCR Adapter
 * 
 * Provides deterministic simulation of OCR and doctor stamp / signature verification.
 * Supports presets for valid slips, missing stamps, blurry slips, and regex parsing of raw text.
 */

import {
  RequisitionVerifierOCR,
  OCRImageInput,
  OCRVerificationResult,
} from "../interfaces/ocr.interface";

export class MockRequisitionVerifierOCR implements RequisitionVerifierOCR {
  private defaultPreset: OCRImageInput["simulatedPreset"] = "VALID_AIIMS_SDP";
  private customMockResult: OCRVerificationResult | null = null;

  public setDefaultPreset(preset: OCRImageInput["simulatedPreset"]): void {
    this.defaultPreset = preset;
  }

  public setMockResult(result: OCRVerificationResult | null): void {
    this.customMockResult = result;
  }

  public async verifyRequisition(imageInput: OCRImageInput): Promise<OCRVerificationResult> {
    if (this.customMockResult) {
      return this.customMockResult;
    }

    const preset = imageInput.simulatedPreset || this.defaultPreset;
    const nowIso = new Date().toISOString();

    // Handle explicit simulation presets
    if (preset === "MISSING_STAMP") {
      return {
        isValidRequisition: false,
        overallConfidence: 0.62,
        doctorStampDetected: false,
        doctorSignatureDetected: true,
        fields: {
          patientName: "Aarav Sharma",
          patientUhid: "AIIMS-2026-9012",
          hospitalName: "AIIMS Delhi, Trauma Centre",
          component: "SDP",
          bloodGroup: "O_POS",
          unitsNeeded: 1,
          requisitionDate: new Date().toISOString().split("T")[0],
          doctorName: "Dr. V. K. Paul",
          doctorRegistrationNumber: "DMC-44812",
        },
        confidence: {
          patientName: 0.95,
          patientUhid: 0.92,
          hospitalName: 0.96,
          component: 0.9,
          bloodGroup: 0.94,
          unitsNeeded: 0.88,
          doctorStamp: 0.1,
          doctorSignature: 0.85,
        },
        rawText: "REQUISITION FOR BLOOD/COMPONENTS - AIIMS DELHI. Patient: Aarav Sharma, UHID: AIIMS-2026-9012. Component: SDP 1 unit.",
        validationWarnings: ["Official doctor stamp missing from requisition slip"],
        processedAt: nowIso,
      };
    }

    if (preset === "BLURRY_UNREADABLE") {
      return {
        isValidRequisition: false,
        overallConfidence: 0.21,
        doctorStampDetected: false,
        doctorSignatureDetected: false,
        fields: {
          patientName: null,
          patientUhid: null,
          hospitalName: null,
          component: null,
          bloodGroup: null,
          unitsNeeded: null,
          requisitionDate: null,
        },
        confidence: {
          patientName: 0.15,
          patientUhid: 0.2,
          hospitalName: 0.1,
          component: 0.25,
          bloodGroup: 0.18,
          unitsNeeded: 0.3,
          doctorStamp: 0.05,
          doctorSignature: 0.08,
        },
        rawText: "...unreadable noisy blur...",
        validationWarnings: [
          "Image resolution insufficient or blur score too high (>0.7)",
          "Could not detect patient UHID or required blood component",
        ],
        processedAt: nowIso,
      };
    }

    if (preset === "VALID_APOLLO_PRBC") {
      return {
        isValidRequisition: true,
        overallConfidence: 0.94,
        doctorStampDetected: true,
        doctorSignatureDetected: true,
        fields: {
          patientName: "Sunita Devi",
          patientUhid: "APOLLO-DEL-4821",
          hospitalName: "Indraprastha Apollo Hospital",
          component: "PRBC",
          bloodGroup: "B_POS",
          unitsNeeded: 2,
          requisitionDate: new Date().toISOString().split("T")[0],
          doctorName: "Dr. Ramesh Aggarwal",
          doctorRegistrationNumber: "MCI-19827",
        },
        confidence: {
          patientName: 0.97,
          patientUhid: 0.95,
          hospitalName: 0.98,
          component: 0.93,
          bloodGroup: 0.96,
          unitsNeeded: 0.91,
          doctorStamp: 0.92,
          doctorSignature: 0.89,
        },
        rawText: "INDRAPRASTHA APOLLO HOSPITALS - BLOOD REQUISITION FORM. Patient: Sunita Devi, UHID: APOLLO-DEL-4821. Component: PRBC, Blood Group: B Pos, 2 Units. Dr. Ramesh Aggarwal [STAMP & SIGNED]",
        validationWarnings: [],
        processedAt: nowIso,
      };
    }

    // Default: VALID_AIIMS_SDP
    return {
      isValidRequisition: true,
      overallConfidence: 0.96,
      doctorStampDetected: true,
      doctorSignatureDetected: true,
      fields: {
        patientName: "Rohit Verma",
        patientUhid: "AIIMS-2026-8841",
        hospitalName: "AIIMS Delhi, Trauma Centre",
        component: "SDP",
        bloodGroup: "A_POS",
        unitsNeeded: 1,
        requisitionDate: new Date().toISOString().split("T")[0],
        doctorName: "Dr. S. K. Gupta",
        doctorRegistrationNumber: "DMC-55921",
      },
      confidence: {
        patientName: 0.98,
        patientUhid: 0.96,
        hospitalName: 0.99,
        component: 0.95,
        bloodGroup: 0.97,
        unitsNeeded: 0.92,
        doctorStamp: 0.94,
        doctorSignature: 0.91,
      },
      rawText: "ALL INDIA INSTITUTE OF MEDICAL SCIENCES, JPNATC. EMERGENCY BLOOD BANK REQUISITION. Patient Name: Rohit Verma, UHID: AIIMS-2026-8841, Diagnosis: Severe Thrombocytopenia, Component: Single Donor Platelets (SDP), Units: 1, Group: A+ve. Dr. S. K. Gupta [VERIFIED STAMP]",
      validationWarnings: [],
      processedAt: nowIso,
    };
  }
}

export const mockRequisitionVerifierOCR = new MockRequisitionVerifierOCR();
