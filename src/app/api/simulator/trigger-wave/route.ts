// src/app/api/simulator/trigger-wave/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { invalidateRequestCache } from "@/lib/cache";
import { dispatchWave } from "@/lib/engines/dispatcher";
import { WaveState } from "@/types/enums";

function getWaveRadiusLabel(waveState: string): string {
  switch (waveState) {
    case WaveState.WAVE_1_DISPATCH:
      return "0–3 km (Wave 1: Immediate Hospital Vicinity)";
    case WaveState.WAVE_2_DISPATCH:
      return "3–7 km (Wave 2: Surrounding City Cluster)";
    case WaveState.WAVE_3_DISPATCH:
      return "7–15 km (Wave 3: NCR Metropolitan Ring)";
    case WaveState.LEASE_LOCKED:
      return "Slots Locked: Target N+1 Reached";
    case WaveState.FULFILLED_CLOSED:
      return "Fulfilled & Closed";
    case WaveState.EXPIRED:
      return "Waves Exhausted / Expired";
    default:
      return "Initial Wave (0–3 km)";
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const requestId = Number(body.requestId);

    if (isNaN(requestId) || requestId <= 0) {
      return NextResponse.json(
        { error: "requestId must be a valid positive integer" },
        { status: 400 }
      );
    }

    const request = await prisma.emergencyRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      return NextResponse.json(
        { error: `EmergencyRequest with id ${requestId} not found` },
        { status: 404 }
      );
    }

    const previousWaveState = request.waveState;

    if (
      request.waveState === WaveState.FULFILLED_CLOSED ||
      request.waveState === WaveState.EXPIRED
    ) {
      return NextResponse.json(
        {
          error: `Cannot trigger wave on terminal request (state: ${request.waveState})`,
          waveState: request.waveState,
        },
        { status: 409 }
      );
    }

    // Execute wave dispatch engine
    const result = await dispatchWave(requestId);

    const updatedRequest = await prisma.emergencyRequest.findUnique({
      where: { id: requestId },
      include: {
        leases: {
          include: { donor: true },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    const waveRadius = getWaveRadiusLabel(result.waveState);

    const logs = [
      `[SIMULATOR] Triggered wave dispatch for Request #${requestId}`,
      `[STATE_TRANSITION] Previous State: ${previousWaveState} -> New State: ${result.waveState}`,
      `[RADIUS_EXPANSION] Radius evaluated: ${waveRadius}`,
      `[PING_DONORS] Dispatched pings to ${result.pingedDonorsCount} eligible donors`,
    ];

    invalidateRequestCache(requestId);
    if (request.shortHash) {
      invalidateRequestCache(request.shortHash);
    }

    return NextResponse.json({
      success: true,
      requestId,
      previousWaveState,
      newWaveState: result.waveState,
      pingedDonorsCount: result.pingedDonorsCount,
      waveRadius,
      recentLeases: updatedRequest?.leases.map((l) => ({
        id: l.id,
        donorId: l.donorId,
        donorName: l.donor.name,
        donorPhone: l.donor.phoneNumber,
        status: l.status,
      })) ?? [],
      logs,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Error in POST /api/simulator/trigger-wave:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}
