// src/app/api/telephony/bridge/route.ts
import { NextResponse } from "next/server";
import prisma, { withDbRetry } from "@/lib/prisma";
import { rateLimiter, rateLimitResponse } from "@/lib/rateLimit";
import { adapters } from "@/lib/adapters";
import { LeaseStatus, WaveState } from "@/types/enums";

interface TelephonyBridgeBody {
  requestId: number;
  donorId: number;
  attendantPhone: string;
  donorPhone?: string;
}

export async function POST(req: Request) {
  try {
    // Rate Limiting Protection (30 call bridges/min per IP)
    const rl = rateLimiter.check(req, { keyPrefix: "rl:telephony_bridge", limit: 30 });
    if (!rl.allowed) {
      return rateLimitResponse(rl);
    }

    const body: TelephonyBridgeBody = await req.json();
    const requestId = Number(body.requestId);
    const donorId = Number(body.donorId);
    const attendantPhone = body.attendantPhone?.trim();

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

    if (!attendantPhone || attendantPhone.length < 8) {
      return NextResponse.json(
        { error: "attendantPhone must be a valid phone number" },
        { status: 400 }
      );
    }

    // 1. Verify Request & Counter-Loop 4 (Anti-Tout) deactivation
    const request = await prisma.emergencyRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      return NextResponse.json(
        { error: `EmergencyRequest ${requestId} not found` },
        { status: 404 }
      );
    }

    if (
      request.waveState === WaveState.FULFILLED_CLOSED ||
      request.waveState === WaveState.EXPIRED
    ) {
      return NextResponse.json(
        {
          error:
            "Counter-Loop 4 Anti-Tout Violation: Communication bridges are deactivated for fulfilled or expired requests.",
        },
        { status: 403 }
      );
    }

    // 2. Verify Donor existence
    const donor = await prisma.donor.findUnique({
      where: { id: donorId },
    });

    if (!donor) {
      return NextResponse.json(
        { error: `Donor ${donorId} not found` },
        { status: 404 }
      );
    }

    // 3. Verify Donor holds an ACTIVE lease
    const activeLease = await prisma.donorLease.findFirst({
      where: {
        requestId,
        donorId,
        status: {
          in: [LeaseStatus.JIT_PASSED, LeaseStatus.EN_ROUTE, LeaseStatus.ARRIVED],
        },
      },
    });

    if (!activeLease) {
      return NextResponse.json(
        {
          error:
            "Counter-Loop 4 Protection: Call bridging is only permitted for donors with an active travel lease.",
        },
        { status: 403 }
      );
    }

    // 4. Resolve donor phone safely from database
    const actualDonorPhone = body.donorPhone?.trim() || donor.phoneNumber;

    // 5. Invoke adapter bridge
    const session = await adapters.telephony.initiateMaskedBridge(
      requestId,
      donorId,
      attendantPhone,
      actualDonorPhone
    );

    return NextResponse.json({
      success: true,
      session,
    });
  } catch (error: any) {
    console.error("Error in POST /api/telephony/bridge:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}
