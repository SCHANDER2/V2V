// Lease manager engine for V2V
// Implements Counter‑Loop 2 (atomic N+1 token bucket) and Counter‑Loop 3 (dead‑man's switch eviction)

import { EmergencyRequest, DonorLease } from "@prisma/client";
import prisma from "@/lib/prisma";
import { LeaseStatus } from "@/types/enums";

/** Simple helper to add minutes to a Date */
function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

/** Generate secure 4-digit verification PIN for Counter-Loop 4 verification */
function generateHandshakePin(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

/**
 * Attempt to lock a slot for a donor on a given request.
 * - Uses a transaction to ensure atomicity.
 * - If the number of active leases (JIT_PASSED, EN_ROUTE, ARRIVED) is less than N+1,
 *   creates a lease with status `JIT_PASSED`, 25‑minute travel lease, and handshake PIN.
 * - Otherwise creates a standby lease (`STANDBY`).
 */
export async function attemptLease(requestId: number, donorId: number): Promise<DonorLease> {
  return await prisma.$transaction(async (tx) => {
    const request = await tx.emergencyRequest.findUnique({
      where: { id: requestId },
    });
    if (!request) throw new Error(`Request ${requestId} not found`);

    const targetSlots = request.unitsNeeded + 1; // N+1
    const activeCount = await tx.donorLease.count({
      where: {
        requestId,
        status: { in: [LeaseStatus.JIT_PASSED, LeaseStatus.EN_ROUTE, LeaseStatus.ARRIVED] },
      },
    });

    const now = new Date();
    const leaseExpiresAt = addMinutes(now, 25);

    if (activeCount < targetSlots) {
      // Create an active lease
      return await tx.donorLease.create({
        data: {
          requestId,
          donorId,
          status: LeaseStatus.JIT_PASSED,
          leaseExpiresAt,
          handshakePin: generateHandshakePin(),
        },
      });
    } else {
      // Create a standby lease
      return await tx.donorLease.create({
        data: {
          requestId,
          donorId,
          status: LeaseStatus.STANDBY,
          leaseExpiresAt,
        },
      });
    }
  });
}

export interface EvictionResult {
  evictedCount: number;
  promotedCount: number;
  evictedLeaseIds: number[];
  promotedLeaseIds: number[];
}

/**
 * Evict leases that have timed out (no ETA check‑in within 25 min).
 * For each evicted lease we attempt to promote the earliest standby lease.
 */
export async function evictExpiredLeases(): Promise<EvictionResult> {
  const now = new Date();
  const evictedLeaseIds: number[] = [];
  const promotedLeaseIds: number[] = [];

  // Find all leases that are active but past expiry
  const expiredLeases = await prisma.donorLease.findMany({
    where: {
      status: { in: [LeaseStatus.JIT_PASSED, LeaseStatus.EN_ROUTE] },
      leaseExpiresAt: { lt: now },
    },
  });

  for (const lease of expiredLeases) {
    await prisma.$transaction(async (tx) => {
      // Mark as evicted atomically
      const updateResult = await tx.donorLease.updateMany({
        where: { 
          id: lease.id, 
          status: { in: [LeaseStatus.JIT_PASSED, LeaseStatus.EN_ROUTE] } 
        },
        data: { status: LeaseStatus.EVICTED_TIMEOUT },
      });
      if (updateResult.count === 0) return;
      evictedLeaseIds.push(lease.id);

      // Find earliest standby lease for same request
      const standby = await tx.donorLease.findFirst({
        where: { requestId: lease.requestId, status: LeaseStatus.STANDBY },
        orderBy: { createdAt: "asc" },
      });
      if (standby) {
        await tx.donorLease.update({
          where: { id: standby.id },
          data: {
            status: LeaseStatus.JIT_PASSED,
            leaseExpiresAt: addMinutes(new Date(), 25),
            handshakePin: generateHandshakePin(),
          },
        });
        promotedLeaseIds.push(standby.id);
      }
    });
  }

  return {
    evictedCount: evictedLeaseIds.length,
    promotedCount: promotedLeaseIds.length,
    evictedLeaseIds,
    promotedLeaseIds,
  };
}

/**
 * Watchdog alias for background cron route compatibility
 */
export const leaseWatchdog = evictExpiredLeases;

/**
 * Helper to transition request to `LEASE_LOCKED` when active leases reach N+1.
 */
export async function maybeLockRequest(requestId: number): Promise<void> {
  const request = await prisma.emergencyRequest.findUnique({
    where: { id: requestId },
  });
  if (!request) return;
  const targetSlots = request.unitsNeeded + 1;
  const activeCount = await prisma.donorLease.count({
    where: {
      requestId,
      status: { in: [LeaseStatus.JIT_PASSED, LeaseStatus.EN_ROUTE, LeaseStatus.ARRIVED] },
    },
  });
  if (activeCount >= targetSlots && request.waveState !== "LEASE_LOCKED") {
    await prisma.emergencyRequest.update({
      where: { id: requestId },
      data: { waveState: "LEASE_LOCKED" },
    });
  }
}

export default { attemptLease, evictExpiredLeases, leaseWatchdog, maybeLockRequest };
