// src/lib/adapters/eraktKoshAdapter.ts
/**
 * Backward-Compatible Bridge for ERaktKoshAdapter
 * Retains existing import signatures while delegating to the central DI registry.
 */

import { adapters, ERaktKoshAdapter } from "./index";

export type { ERaktKoshAdapter, ERaktKoshStockPreview, BloodBankStockItem } from "./interfaces/eraktkosh.interface";

export const eraktKoshAdapter: ERaktKoshAdapter = adapters.eraktKosh;

export default eraktKoshAdapter;