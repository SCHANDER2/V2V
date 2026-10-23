/**
 * Requisition Verifier OCR Adapter Interface
 * 
 * Simulates high-precision clinical document analysis for hospital requisition slips:
 * - Extracts patient UHID, patient name, hospital name, component, blood group, units.
 * - Detects official doctor stamp and clinical signature.
 * - Computes field-level and overall confidence scores.
 * - Validates clinical legitimacy to prevent fraudulent SOS waves.
 */

export interface OCRImageInput {
  imageBuffer?: Buffer;
  base64Data?: string;
  fileMimeType?: string;
  fileName?: string;
  simulatedPreset?:
    | "VALID_AIIMS_SDP"
    | "VALID_APOLLO_PRBC"
    | "MISSING_STAMP"
    | "BLURRY_UNREADABLE"
    | "EXPIRED_PRESCRIPTION";
  extractedTextOverride?: string;
}

export interface OCRParsedFields {
  patientName: string | null;
  patientUhid: string | null;
  hospitalName: string | null;
  component: string | null; // e.g. "SDP", "WHOLE_BLOOD", "PRBC", "PLASMA"
  bloodGroup: string | null; // e.g. "A_POS", "O_POS", "B_POS"
  unitsNeeded: number | null;
  requisitionDate: string | null;
  doctorName?: string | null;
  doctorRegistrationNumber?: string | null;
}

export interface OCRFieldConfidence {
  patientName: number; // 0.0 to 1.0
  patientUhid: number;
  hospitalName: number;
  component: number;
  bloodGroup: number;
  unitsNeeded: number;
  doctorStamp: number;
  doctorSignature: number;
}

export interface OCRVerificationResult {
  isValidRequisition: boolean;
  overallConfidence: number; // 0.0 to 1.0
  doctorStampDetected: boolean;
  doctorSignatureDetected: boolean;
  fields: OCRParsedFields;
  confidence: OCRFieldConfidence;
  rawText: string;
  validationWarnings: string[];
  processedAt: string;
}

export interface RequisitionVerifierOCR {
  /**
   * Verifies an uploaded or captured hospital blood requisition slip image.
   * Returns parsed clinical fields, doctor stamp/signature status, and confidence scores.
   */
  verifyRequisition(imageInput: OCRImageInput): Promise<OCRVerificationResult>;
}
