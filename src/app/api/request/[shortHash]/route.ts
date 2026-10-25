// src/app/api/request/[shortHash]/route.ts
import { NextResponse } from "next/server";
import prisma, { withDbRetry } from "@/lib/prisma";
import cache from "@/lib/cache";
import { isShortHashExpired, formatTrackingUrl, SIDECAR_VIEWER_URL } from "@/lib/shortHash";
import { LeaseStatus, WaveState } from "@/types/enums";

/** Mask phone number: +919810100009 -> +91 98••••0009 */
function maskPhoneNumber(phone: string): string {
  if (!phone || phone.length < 8) return "••••••••";
  const cleaned = phone.replace(/\s+/g, "");
  const prefix = cleaned.slice(0, 5); // "+9198"
  const suffix = cleaned.slice(-4);   // "0009"
  return `${prefix}••••${suffix}`;
}

/** Mask donor surname: Vikram Singh -> Vikram S. */
function maskDonorName(name: string): string {
  if (!name) return "Anonymous Donor";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1].charAt(0)}.`;
}

export async function GET(
  req: Request,
  { params }: { params: { shortHash: string } }
) {
  try {
    const { shortHash } = params;

    if (!shortHash) {
      return NextResponse.json(
        { error: "shortHash parameter is required" },
        { status: 400 }
      );
    }

    // 1. High-speed In-Memory Cache Lookup (protects DB under 15,000 concurrent users)
    const cacheKey = `req_${shortHash}`;
    const cached = cache.get<any>(cacheKey);
    if (cached) {
      return NextResponse.json(cached, {
        headers: {
          "X-V2V-Cache": "HIT",
        },
      });
    }

    const request = await withDbRetry(() =>
      prisma.emergencyRequest.findUnique({
        where: { shortHash },
        include: {
          leases: {
            include: {
              donor: true,
            },
            orderBy: { createdAt: "asc" },
          },
        },
      })
    );

    if (!request) {
      return NextResponse.json(
        { error: "Emergency request not found" },
        { status: 404 }
      );
    }

    // Evaluate 12h TTL expiration
    const expired = isShortHashExpired(request.expiresAt);
    let effectiveWaveState = request.waveState;

    // Automatically transition to EXPIRED if TTL passed and not already completed
    if (
      expired &&
      request.waveState !== WaveState.EXPIRED &&
      request.waveState !== WaveState.FULFILLED_CLOSED
    ) {
      await prisma.emergencyRequest.update({
        where: { id: request.id },
        data: { waveState: WaveState.EXPIRED },
      });
      effectiveWaveState = WaveState.EXPIRED;
    }

    // Partition leases into Active (en-route) vs. Standby (buffer) vs. Pinged
    const activeStatuses: string[] = [
      LeaseStatus.JIT_PASSED,
      LeaseStatus.EN_ROUTE,
      LeaseStatus.ARRIVED,
    ];

    const activeLeases = request.leases
      .filter((l) => activeStatuses.includes(l.status))
      .map((l) => ({
        id: l.id,
        donorId: l.donorId,
        status: l.status,
        leaseExpiresAt: l.leaseExpiresAt.toISOString(),
        handshakePin: l.handshakePin, // Exposed to family for counter-verification
        donor: {
          id: l.donor.id,
          name: maskDonorName(l.donor.name),
          maskedPhone: maskPhoneNumber(l.donor.phoneNumber),
          bloodGroup: l.donor.bloodGroup,
          approxLat: Number(l.donor.latitude.toFixed(2)),
          approxLng: Number(l.donor.longitude.toFixed(2)),
        },
      }));

    const standbyLeases = request.leases
      .filter((l) => l.status === LeaseStatus.STANDBY)
      .map((l) => ({
        id: l.id,
        donorId: l.donorId,
        status: l.status,
        leaseExpiresAt: l.leaseExpiresAt.toISOString(),
        donor: {
          id: l.donor.id,
          name: maskDonorName(l.donor.name),
          maskedPhone: maskPhoneNumber(l.donor.phoneNumber),
          bloodGroup: l.donor.bloodGroup,
        },
      }));

    const pingCount = request.leases.filter(
      (l) => l.status === LeaseStatus.PINGED
    ).length;

    const isFinalState =
      effectiveWaveState === WaveState.FULFILLED_CLOSED ||
      effectiveWaveState === WaveState.EXPIRED;

    const responsePayload = {
      request: {
        id: request.id,
        patientName: request.patientName,
        patientUhid: request.patientUhid,
        hospitalName: request.hospitalName,
        hospitalLat: request.hospitalLat,
        hospitalLng: request.hospitalLng,
        component: request.component,
        bloodGroup: request.bloodGroup,
        requestMode: request.requestMode,
        unitsNeeded: request.unitsNeeded,
        waveState: effectiveWaveState,
        shortHash: request.shortHash,
        expiresAt: request.expiresAt.toISOString(),
        isExpired: expired,
        canInitiateCalls: !isFinalState, // Anti-Tout flag
        trackingUrl: formatTrackingUrl(request.shortHash),
        sidecarUrl: SIDECAR_VIEWER_URL,
      },
      activeLeases,
      standbyLeases,
      pingCount,
    };

    // Cache TTL: 10s for final states (CLOSED/EXPIRED), 2.5s for active dispatch states
    const cacheTtlMs = isFinalState ? 10000 : 2500;
    cache.set(cacheKey, responsePayload, cacheTtlMs);

    return NextResponse.json(responsePayload, {
      headers: {
        "X-V2V-Cache": "MISS",
      },
    });
  } catch (error: any) {
    console.error("Error in GET /api/request/[shortHash]:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}
