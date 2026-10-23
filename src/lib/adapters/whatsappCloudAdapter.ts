// src/lib/adapters/whatsappCloudAdapter.ts
/**
 * Backward-Compatible Bridge for WhatsAppCloudAdapter
 * Retains existing import signatures while delegating to the central DI registry.
 */

import { adapters, WhatsAppCloudAdapter } from "./index";

export type {
  WhatsAppCloudAdapter,
  WhatsAppInteractiveButton,
  WhatsAppTemplateComponent,
  WhatsAppSendResult,
  WhatsAppMessageRecord,
} from "./interfaces/whatsapp.interface";

export const whatsappCloudAdapter: WhatsAppCloudAdapter = adapters.whatsapp;

export default whatsappCloudAdapter;