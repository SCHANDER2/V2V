/**
 * Mock ERaktKosh Adapter
 * 
 * Simulates e-RaktKosh blood availability API across realistic Delhi NCR blood banks:
 * - AIIMS Main Blood Bank (Ansari Nagar, New Delhi)
 * - Indian Red Cross Society NHQ Blood Bank (Sansad Marg, New Delhi)
 * - Rotary Blood Bank (Tughlakabad Institutional Area, New Delhi)
 * - Lions Blood Bank & Research Foundation (Shalimar Bagh, New Delhi)
 * 
 * Uses the Haversine formula for distance sorting.
 * Supports test overrides for zero-stock, low-stock, and custom inventory injection.
 */

import { ERaktKoshAdapter, ERaktKoshStockPreview, BloodBankStockItem } from "../interfaces/eraktkosh.interface";
import { HaversineDistance } from "@/utils/haversine";
import { BloodGroup, Component } from "@/types/enums";

export interface StaticBloodBankLocation {
  id: string;
  name: string;
  address: string;
  contactPhone: string;
  latitude: number;
  longitude: number;
}

export const DELHI_NCR_BLOOD_BANKS: StaticBloodBankLocation[] = [
  {
    id: "bb-aiims",
    name: "AIIMS Main Blood Bank",
    address: "Ansari Nagar East, Sri Aurobindo Marg, New Delhi 110029",
    contactPhone: "+91-11-2659-4438",
    latitude: 28.5672,
    longitude: 77.2100,
  },
  {
    id: "bb-redcross",
    name: "Indian Red Cross Society NHQ Blood Bank",
    address: "1, Red Cross Road, Sansad Marg Area, New Delhi 110001",
    contactPhone: "+91-11-2371-1551",
    latitude: 28.6219,
    longitude: 77.2106,
  },
  {
    id: "bb-rotary",
    name: "Rotary Blood Bank",
    address: "56-57, Institutional Area, Phase II, Tughlakabad, New Delhi 110062",
    contactPhone: "+91-11-4225-8300",
    latitude: 28.5376,
    longitude: 77.2798,
  },
  {
    id: "bb-lions",
    name: "Lions Blood Bank & Research Foundation",
    address: "Plot No. 1, Block A, Phase 2, Shalimar Bagh, New Delhi 110088",
    contactPhone: "+91-11-4225-8491",
    latitude: 28.7025,
    longitude: 77.1620,
  },
];

export class MockEraktKoshAdapter implements ERaktKoshAdapter {
  private customInventory: Map<string, number> = new Map();
  private forceAvailability: boolean | null = null;

  /**
   * Key generator for custom inventory mapping
   */
  private getInventoryKey(bankId: string, component: string, bloodGroup: string): string {
    return `${bankId}:${component.toUpperCase()}:${bloodGroup.toUpperCase()}`;
  }

  /**
   * Deterministic default inventory generation for testing
   */
  private getDefaultUnits(bankId: string, component: string, bloodGroup: string): number {
    // Bombay Oh is exceptionally rare across all banks
    if (bloodGroup === BloodGroup.BOMBAY_OH || bloodGroup === "BOMBAY_OH") {
      return bankId === "bb-aiims" ? 1 : 0;
    }

    // Platelets (SDP) have 5-day shelf life, scarce availability
    if (component === Component.SDP || component === "SDP") {
      switch (bankId) {
        case "bb-aiims":
          return bloodGroup === "O_POS" || bloodGroup === "B_POS" ? 3 : 1;
        case "bb-redcross":
          return bloodGroup === "O_POS" ? 2 : 0;
        case "bb-rotary":
          return bloodGroup === "A_POS" ? 1 : 0;
        default:
          return 0;
      }
    }

    // Negative blood groups are rarer
    const isNegative = bloodGroup.includes("NEG");
    const baseUnits = isNegative ? 2 : 8;

    switch (bankId) {
      case "bb-aiims":
        return baseUnits + 5;
      case "bb-redcross":
        return baseUnits + 3;
      case "bb-rotary":
        return baseUnits;
      case "bb-lions":
        return Math.max(0, baseUnits - 2);
      default:
        return baseUnits;
    }
  }

  /**
   * Test control method: Set explicit inventory for a bank/component/group
   */
  public setMockStock(bankId: string, component: string, bloodGroup: string, units: number): void {
    this.customInventory.set(this.getInventoryKey(bankId, component, bloodGroup), units);
  }

  /**
   * Test control method: Force overall checkStock boolean return
   */
  public setForceAvailability(available: boolean | null): void {
    this.forceAvailability = available;
  }

  /**
   * Reset all mock overrides to default
   */
  public resetMockStock(): void {
    this.customInventory.clear();
    this.forceAvailability = null;
  }

  public async getStockPreview(
    lat: number,
    lng: number,
    component: string,
    bloodGroup: string
  ): Promise<ERaktKoshStockPreview> {
    const nowIso = new Date().toISOString();

    const bloodBanks: BloodBankStockItem[] = DELHI_NCR_BLOOD_BANKS.map((bank) => {
      // Calculate Haversine distance from user location to blood bank
      const distanceKm = Math.round(HaversineDistance(lat, lng, bank.latitude, bank.longitude) * 10) / 10;

      const key = this.getInventoryKey(bank.id, component, bloodGroup);
      const unitsAvailable = this.forceAvailability === false
        ? 0
        : this.customInventory.has(key)
        ? this.customInventory.get(key)!
        : this.getDefaultUnits(bank.id, component, bloodGroup);

      return {
        id: bank.id,
        name: bank.name,
        address: bank.address,
        contactPhone: bank.contactPhone,
        latitude: bank.latitude,
        longitude: bank.longitude,
        distanceKm,
        unitsAvailable,
        component,
        bloodGroup,
        lastUpdated: nowIso,
      };
    });

    // Sort by nearest distance first
    bloodBanks.sort((a, b) => a.distanceKm - b.distanceKm);

    const totalUnitsAvailable = bloodBanks.reduce((sum, b) => sum + b.unitsAvailable, 0);
    const available = this.forceAvailability !== null
      ? this.forceAvailability
      : totalUnitsAvailable > 0;

    return {
      available,
      totalUnitsAvailable,
      nearestBankDistanceKm: bloodBanks.length > 0 ? bloodBanks[0].distanceKm : null,
      component,
      bloodGroup,
      bloodBanks,
      checkedAt: nowIso,
    };
  }

  public async checkStock(
    lat: number,
    lng: number,
    component: string,
    bloodGroup: string
  ): Promise<boolean> {
    if (this.forceAvailability !== null) {
      return this.forceAvailability;
    }
    const preview = await this.getStockPreview(lat, lng, component, bloodGroup);
    return preview.available;
  }
}

export const mockEraktKoshAdapter = new MockEraktKoshAdapter();
