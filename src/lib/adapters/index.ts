/**
 * Central Adapter Dependency Injection Registry
 * 
 * Provides single access point for all 4 core external adapters:
 * 1. eraktKosh (ERaktKoshAdapter)
 * 2. whatsapp (WhatsAppCloudAdapter)
 * 3. telephony (CloudTelephonyBridge)
 * 4. ocr (RequisitionVerifierOCR)
 * 
 * Supports dependency injection override for unit, integration, and chaos testing.
 */

import { ERaktKoshAdapter } from "./interfaces/eraktkosh.interface";
import { WhatsAppCloudAdapter } from "./interfaces/whatsapp.interface";
import { CloudTelephonyBridge } from "./interfaces/telephony.interface";
import { RequisitionVerifierOCR } from "./interfaces/ocr.interface";

import { mockEraktKoshAdapter, MockEraktKoshAdapter } from "./mocks/mockEraktKoshAdapter";
import { mockWhatsAppCloudAdapter, MockWhatsAppCloudAdapter } from "./mocks/mockWhatsAppCloudAdapter";
import { mockCloudTelephonyBridge, MockCloudTelephonyBridge } from "./mocks/mockCloudTelephonyBridge";
import { mockRequisitionVerifierOCR, MockRequisitionVerifierOCR } from "./mocks/mockRequisitionVerifierOCR";

export interface AdapterRegistry {
  eraktKosh: ERaktKoshAdapter;
  whatsapp: WhatsAppCloudAdapter;
  telephony: CloudTelephonyBridge;
  ocr: RequisitionVerifierOCR;
}

const defaultAdapters: AdapterRegistry = {
  eraktKosh: mockEraktKoshAdapter,
  whatsapp: mockWhatsAppCloudAdapter,
  telephony: mockCloudTelephonyBridge,
  ocr: mockRequisitionVerifierOCR,
};

let currentAdapters: AdapterRegistry = { ...defaultAdapters };

/**
 * Global adapters singleton
 */
export const adapters: AdapterRegistry = {
  get eraktKosh() {
    return currentAdapters.eraktKosh;
  },
  get whatsapp() {
    return currentAdapters.whatsapp;
  },
  get telephony() {
    return currentAdapters.telephony;
  },
  get ocr() {
    return currentAdapters.ocr;
  },
};

/**
 * Override one or more adapters for testing
 */
export function setAdapterOverrides(overrides: Partial<AdapterRegistry>): void {
  currentAdapters = {
    ...currentAdapters,
    ...overrides,
  };
}

/**
 * Reset all adapters back to default mocks
 */
export function resetAdapterOverrides(): void {
  currentAdapters = { ...defaultAdapters };
}

/**
 * Access the active adapter registry
 */
export function getAdapters(): AdapterRegistry {
  return adapters;
}

// Re-export all interfaces
export * from "./interfaces/eraktkosh.interface";
export * from "./interfaces/whatsapp.interface";
export * from "./interfaces/telephony.interface";
export * from "./interfaces/ocr.interface";

// Re-export mock implementations & instances
export { mockEraktKoshAdapter, MockEraktKoshAdapter } from "./mocks/mockEraktKoshAdapter";
export { mockWhatsAppCloudAdapter, MockWhatsAppCloudAdapter } from "./mocks/mockWhatsAppCloudAdapter";
export { mockCloudTelephonyBridge, MockCloudTelephonyBridge } from "./mocks/mockCloudTelephonyBridge";
export { mockRequisitionVerifierOCR, MockRequisitionVerifierOCR } from "./mocks/mockRequisitionVerifierOCR";
