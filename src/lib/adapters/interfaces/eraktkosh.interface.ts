/**
 * ERaktKosh Integration Adapter Interface
 * 
 * Provides live or simulated access to Indian national blood portal (e-RaktKosh)
 * for checking emergency stock availability across licensed blood banks in India.
 */

export interface BloodBankStockItem {
  id: string;
  name: string;
  address: string;
  contactPhone: string;
  latitude: number;
  longitude: number;
  distanceKm: number;
  unitsAvailable: number;
  component: string;
  bloodGroup: string;
  lastUpdated: string; // ISO 8601 string
}

export interface ERaktKoshStockPreview {
  available: boolean;
  totalUnitsAvailable: number;
  nearestBankDistanceKm: number | null;
  component: string;
  bloodGroup: string;
  bloodBanks: BloodBankStockItem[];
  checkedAt: string; // ISO 8601 string
}

export interface ERaktKoshAdapter {
  /**
   * Checks whether stock is available for the given component and blood group
   * at nearby blood banks within a search radius (default ~25km in Delhi NCR).
   * Returns true if at least one unit is available in the vicinity.
   */
  checkStock(
    lat: number,
    lng: number,
    component: string,
    bloodGroup: string
  ): Promise<boolean>;

  /**
   * Retrieves detailed stock preview breakdown for all nearby blood banks,
   * sorted by nearest distance (using Haversine formula), with inventory counts
   * and contact details for family coordination.
   */
  getStockPreview(
    lat: number,
    lng: number,
    component: string,
    bloodGroup: string
  ): Promise<ERaktKoshStockPreview>;
}
