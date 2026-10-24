// Dispatcher engine for V2V emergency blood dispatch
// Handles geospatial wave selection, batch limiting, and anti‑spam cooldowns

import { EmergencyRequest, Donor } from "@prisma/client";
import prisma from "@/lib/prisma";
import { BloodGroup, WaveState, LeaseStatus } from "@/types/enums";
import { HaversineDistance } from "@/utils/haversine";
import { prioritizedGroups } from "./compatibility";
import { isEligible } from "./eligibility";

/**
 * Configuration constants for counter‑loop 1 (Expanding Ring Wave Batching)
 */
const PING_BATCH_MULTIPLIER = 5; // max donors to ping per remaining slot
const PING_COOLDOWN_HOURS = 72;

/**
 * Compute the Haversine distance (km) between two lat/lng points.
 * Wrapper that uses the shared utility.
 */
function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  return HaversineDistance(lat1, lng1, lat2, lng2);
}

/**
 * Determine the current wave radius (km) based on the request's wave index.
 * Wave 1: 0‑3 km, Wave 2: 3‑7 km, Wave 3: 7‑15 km.
 */
function waveRadius(waveIndex: number): { min: number; max: number } {
  switch (waveIndex) {
    case 1:
      return { min: 0, max: 3 };
    case 2:
      return { min: 3, max: 7 };
    case 3:
      return { min: 7, max: 15 };
    default:
      // fallback to max radius if unknown
      return { min: 0, max: 15 };
  }
}

/**
 * Get donors that are eligible according to NBTC rules, matching blood group
 * according to the request mode, and not currently under a 72‑hour ping cooldown.
 */
async function fetchEligibleDonors(request: EmergencyRequest): Promise<Donor[]> {
  const compatibleGroups = prioritizedGroups(request.bloodGroup as BloodGroup, request.requestMode as any);

  const now = new Date();
  const cooldownThreshold = new Date(now.getTime() - PING_COOLDOWN_HOURS * 60 * 60 * 1000);

  // Pull donors with matching group and no recent ping (including donors never pinged)
  const donors = await prisma.donor.findMany({
    where: {
      bloodGroup: { in: compatibleGroups },
      OR: [
        { lastPingedAt: null },
        { lastPingedAt: { lt: cooldownThreshold } },
      ],
    },
  });

  // Filter by eligibility (age/weight/cooldowns) passing both profile and request component
  return donors.filter((d) => isEligible(d as any, request.component as any));
}

/**
 * Select donors for the current wave respecting the batch multiplier.
 * Returns the list of donors to ping.
 */
export async function selectDonorsForWave(requestId: number): Promise<Donor[]> {
  const request = await prisma.emergencyRequest.findUnique({
    where: { id: requestId },
  });
  if (!request) throw new Error(`EmergencyRequest ${requestId} not found`);

  // Determine how many slots are still needed (including standby buffer)
  const targetSlots = request.unitsNeeded + 1; // N+1
  const activeLeases = await prisma.donorLease.count({
    where: {
      requestId,
      status: { in: [LeaseStatus.JIT_PASSED, LeaseStatus.EN_ROUTE, LeaseStatus.ARRIVED] },
    },
  });
  const remainingSlots = Math.max(targetSlots - activeLeases, 0);

  // No more slots required
  if (remainingSlots <= 0) return [];

  // Fetch all eligible donors
  const eligibleDonors = await fetchEligibleDonors(request);

  // Calculate distance from request (hospital) location
  const reqLat = request.hospitalLat;
  const reqLng = request.hospitalLng;
  const donorsWithDist = eligibleDonors.map((d) => ({
    donor: d,
    dist: distanceKm(reqLat, reqLng, d.latitude, d.longitude),
  }));

  // Filter by current wave radius derived from waveState enum
  const waveIndex = (() => {
    switch (request.waveState) {
      case WaveState.WAVE_1_DISPATCH:
        return 1;
      case WaveState.WAVE_2_DISPATCH:
        return 2;
      case WaveState.WAVE_3_DISPATCH:
        return 3;
      default:
        return 1; // fallback to first wave for other states
    }
  })();
  const { min, max } = waveRadius(waveIndex);
  const waveDonors = donorsWithDist
    .filter((d) => d.dist >= min && d.dist <= max)
    .sort((a, b) => a.dist - b.dist) // nearest first
    .map((d) => d.donor);

  // Apply batch limit: at most PING_BATCH_MULTIPLIER * remainingSlots
  const limit = PING_BATCH_MULTIPLIER * remainingSlots;
  return waveDonors.slice(0, limit);
}

/**
 * Ping a set of donors – updates `lastPingedAt` and creates a temporary
 * `DonorLease` entry with status `PINGED`.
 */
export async function pingDonors(requestId: number, donors: Donor[]): Promise<void> {
  const now = new Date();
  await prisma.$transaction(async (tx) => {
    for (const donor of donors) {
      await tx.donor.update({
        where: { id: donor.id },
        data: { lastPingedAt: now },
      });
      await tx.donorLease.create({
        data: {
          requestId,
          donorId: donor.id,
          status: LeaseStatus.PINGED,
          leaseExpiresAt: now, // placeholder – real lease created after JIT pass
        },
      });
    }
  });
}

/**
 * Advance the request to the next wave or finalize if no more waves available.
 */
export async function advanceWaveOrClose(requestId: number): Promise<void> {
  const request = await prisma.emergencyRequest.findUnique({
    where: { id: requestId },
  });
  if (!request) return;

  switch (request.waveState) {
    case WaveState.PENDING_VERIFICATION:
    case WaveState.STOCK_CHECK:
    case WaveState.WAVE_1_DISPATCH:
      await prisma.emergencyRequest.update({
        where: { id: requestId },
        data: { waveState: WaveState.WAVE_2_DISPATCH },
      });
      break;
    case WaveState.WAVE_2_DISPATCH:
      await prisma.emergencyRequest.update({
        where: { id: requestId },
        data: { waveState: WaveState.WAVE_3_DISPATCH },
      });
      break;
    case WaveState.WAVE_3_DISPATCH:
    default:
      // No more waves – expire request
      await prisma.emergencyRequest.update({
        where: { id: requestId },
        data: { waveState: WaveState.EXPIRED, expiresAt: new Date() },
      });
      break;
  }
}

/**
 * Dispatch wave entrypoint: select donors for current wave, ping them,
 * or advance wave if none found.
 */
export async function dispatchWave(
  requestId: number
): Promise<{ waveState: string; pingedDonorsCount: number }> {
  let request = await prisma.emergencyRequest.findUnique({
    where: { id: requestId },
  });
  if (!request) throw new Error(`EmergencyRequest ${requestId} not found`);

  // If request is in initial setup state, initialize to WAVE_1_DISPATCH
  if (
    request.waveState === WaveState.PENDING_VERIFICATION ||
    request.waveState === WaveState.STOCK_CHECK
  ) {
    request = await prisma.emergencyRequest.update({
      where: { id: requestId },
      data: { waveState: WaveState.WAVE_1_DISPATCH },
    });
  }

  // If request is already closed or locked, do not dispatch
  if (
    request.waveState === WaveState.LEASE_LOCKED ||
    request.waveState === WaveState.FULFILLED_CLOSED ||
    request.waveState === WaveState.EXPIRED
  ) {
    return { waveState: request.waveState, pingedDonorsCount: 0 };
  }

  const donorsToPing = await selectDonorsForWave(requestId);

  if (donorsToPing.length > 0) {
    await pingDonors(requestId, donorsToPing);
    return {
      waveState: request.waveState,
      pingedDonorsCount: donorsToPing.length,
    };
  } else {
    // If no eligible donors in this wave, advance to next wave
    await advanceWaveOrClose(requestId);
    const updated = await prisma.emergencyRequest.findUnique({
      where: { id: requestId },
    });
    return {
      waveState: updated?.waveState ?? request.waveState,
      pingedDonorsCount: 0,
    };
  }
}

export default {
  selectDonorsForWave,
  pingDonors,
  advanceWaveOrClose,
  dispatchWave,
};
