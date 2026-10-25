// src/app/api/simulator/ghost-donor/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { invalidateRequestCache, invalidateDonorCache } from "@/lib/cache";
import { evictExpiredLeases } from "@/lib/engines/lease-manager";
import { LeaseStatus } from "@/types/enums";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const leaseId = Number(body.leaseId);

    if (isNaN(leaseId) || leaseId <= 0) {
      return NextResponse.json(
        { error: "leaseId must be a valid positive integer" },
        { status: 400 }
      );
    }

    const lease = await prisma.donorLease.findUnique({
      where: { id: leaseId },
      include: { donor: true, request: true },
    });

    if (!lease) {
      return NextResponse.json(
        { error: `DonorLease with id ${leaseId} not found` },
        { status: 404 }
      );
    }

    if (
      lease.status !== LeaseStatus.JIT_PASSED &&
      lease.status !== LeaseStatus.EN_ROUTE
    ) {
      return NextResponse.json(
        {
          error: `Cannot ghost donor with status '${lease.status}'. Only active leases (JIT_PASSED, EN_ROUTE) can be ghosted.`,
          currentStatus: lease.status,
        },
        { status: 400 }
      );
    }

    // 1. Fast-forward expiration to now - 1 second
    const expiredTimestamp = new Date(Date.now() - 1000);
    await prisma.donorLease.update({
      where: { id: leaseId },
      data: { leaseExpiresAt: expiredTimestamp },
    });

    // 2. Immediately execute dead-man's switch watchdog eviction
    const evictionSummary = await evictExpiredLeases();

    // 3. Inspect updated state of this lease
    const updatedLease = await prisma.donorLease.findUnique({
      where: { id: leaseId },
    });

    // 4. Fetch details of any promoted standby leases
    const promotedLeases = await prisma.donorLease.findMany({
      where: { id: { in: evictionSummary.promotedLeaseIds } },
      include: { donor: true },
    });

    const logs = [
      `[GHOST_SIMULATOR] Lease #${leaseId} (Donor: ${lease.donor.name}) fast-forwarded to ${expiredTimestamp.toISOString()}`,
      `[DEAD_MANS_SWITCH] evictExpiredLeases() executed`,
      `[EVICTION] Evicted ${evictionSummary.evictedCount} lease(s): [${evictionSummary.evictedLeaseIds.join(", ")}]`,
      evictionSummary.promotedCount > 0
        ? `[PROMOTION] Promoted ${evictionSummary.promotedCount} standby lease(s) to JIT_PASSED: [${evictionSummary.promotedLeaseIds.join(", ")}]`
        : `[STANDBY_BUFFER] No standby donors currently queued for promotion`,
    ];

    invalidateRequestCache(lease.requestId);
    if (lease.request?.shortHash) {
      invalidateRequestCache(lease.request.shortHash);
    }
    invalidateDonorCache(lease.donorId);

    return NextResponse.json({
      success: true,
      ghostedLeaseId: leaseId,
      newStatus: updatedLease?.status,
      evictedLeaseIds: evictionSummary.evictedLeaseIds,
      promotedLeaseIds: evictionSummary.promotedLeaseIds,
      promotedDonors: promotedLeases.map((l) => ({
        leaseId: l.id,
        donorId: l.donorId,
        donorName: l.donor.name,
        newExpiresAt: l.leaseExpiresAt.toISOString(),
        handshakePin: l.handshakePin,
      })),
      evictionSummary,
      logs,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error in POST /api/simulator/ghost-donor:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}
