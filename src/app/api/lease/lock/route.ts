// src/app/api/lease/lock/route.ts
import { NextResponse } from "next/server";
import prisma, { withDbRetry } from "@/lib/prisma";
import { rateLimiter, rateLimitResponse } from "@/lib/rateLimit";
import { invalidateRequestCache, invalidateDonorCache } from "@/lib/cache";
import { attemptLease, maybeLockRequest } from "@/lib/engines/lease-manager";
import { LeaseStatus, WaveState } from "@/types/enums";

interface LeaseLockBody {
  requestId: number;
  donorId: number;
}

export async function POST(req: Request) {
  try {
    // Rate Limiting Protection (40 locks/min per IP)
    const rl = rateLimiter.check(req, { keyPrefix: "rl:lease_lock", limit: 40 });
    if (!rl.allowed) {
      return rateLimitResponse(rl);
    }

    const body: LeaseLockBody = await req.json();
    const requestId = Number(body.requestId);
    const donorId = Number(body.donorId);

    if (isNaN(requestId) || requestId <= 0) {
      return NextResponse.json(
        { error: "requestId must be a valid positive integer" },
        { status: 400 }
      );
    }

    if (isNaN(donorId) || donorId <= 0) {
      return NextResponse.json(
        { error: "donorId must be a valid positive integer" },
        { status: 400 }
      );
    }

    // Verify EmergencyRequest existence and state
    const request = await prisma.emergencyRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      return NextResponse.json(
        { error: `EmergencyRequest with id ${requestId} not found` },
        { status: 404 }
      );
    }

    if (
      request.waveState === WaveState.FULFILLED_CLOSED ||
      request.waveState === WaveState.EXPIRED
    ) {
      return NextResponse.json(
        {
          error: "Request is no longer active",
          waveState: request.waveState,
        },
        { status: 409 }
      );
    }

    // Verify Donor existence
    const donor = await prisma.donor.findUnique({
      where: { id: donorId },
    });

    if (!donor) {
      return NextResponse.json(
        { error: `Donor with id ${donorId} not found` },
        { status: 404 }
      );
    }

    // Idempotency: Check if donor already has an active or standby lease
    const existingLease = await prisma.donorLease.findFirst({
      where: {
        requestId,
        donorId,
        status: {
          in: [
            LeaseStatus.JIT_PASSED,
            LeaseStatus.EN_ROUTE,
            LeaseStatus.ARRIVED,
            LeaseStatus.STANDBY,
          ],
        },
      },
    });

    if (existingLease) {
      return NextResponse.json({
        leaseId: existingLease.id,
        status: existingLease.status,
        leaseExpiresAt: existingLease.leaseExpiresAt.toISOString(),
        handshakePin: existingLease.handshakePin ?? null,
      });
    }

    // Execute atomic token bucket lock via lease-manager engine
    const lease = await attemptLease(requestId, donorId);

    // If active slots reached N+1, advance waveState to LEASE_LOCKED
    await maybeLockRequest(requestId);

    // Invalidate request and donor caches so concurrent readers get immediate state update
    invalidateRequestCache(request.shortHash);
    invalidateRequestCache(requestId);
    invalidateDonorCache(donorId);

    return NextResponse.json(
      {
        leaseId: lease.id,
        status: lease.status,
        leaseExpiresAt: lease.leaseExpiresAt.toISOString(),
        handshakePin: lease.handshakePin ?? null,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error in POST /api/lease/lock:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}
