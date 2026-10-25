// src/app/api/lease/update-eta/route.ts
import { NextResponse } from "next/server";
import prisma, { withDbRetry } from "@/lib/prisma";
import { invalidateRequestCache, invalidateDonorCache } from "@/lib/cache";
import { LeaseStatus } from "@/types/enums";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const leaseId = Number(body.leaseId);
    const etaMinutes = Number(body.etaMinutes);

    if (isNaN(leaseId) || leaseId <= 0) {
      return NextResponse.json(
        { error: "leaseId must be a valid positive integer" },
        { status: 400 }
      );
    }

    if (isNaN(etaMinutes) || etaMinutes <= 0 || etaMinutes > 60) {
      return NextResponse.json(
        { error: "etaMinutes must be a valid positive integer between 1 and 60" },
        { status: 400 }
      );
    }

    const lease = await prisma.donorLease.findUnique({
      where: { id: leaseId },
    });

    if (!lease) {
      return NextResponse.json(
        { error: `DonorLease with id ${leaseId} not found` },
        { status: 404 }
      );
    }

    if (lease.status === LeaseStatus.EVICTED_TIMEOUT) {
      return NextResponse.json(
        { error: "Lease has expired and timed out", status: lease.status },
        { status: 409 }
      );
    }

    // Advance status to EN_ROUTE if currently JIT_PASSED
    const newStatus =
      lease.status === LeaseStatus.JIT_PASSED
        ? LeaseStatus.EN_ROUTE
        : lease.status;

    const updated = await withDbRetry(() =>
      prisma.donorLease.update({
        where: { id: leaseId },
        data: {
          status: newStatus,
        },
      })
    );

    invalidateRequestCache(lease.requestId);
    invalidateDonorCache(lease.donorId);

    return NextResponse.json({
      success: true,
      leaseId: updated.id,
      status: updated.status,
      etaMinutes,
      updatedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error in POST /api/lease/update-eta:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}
