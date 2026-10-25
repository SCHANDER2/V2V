// src/app/api/donor/respond/[token]/route.ts
import { NextResponse } from "next/server";
import prisma, { withDbRetry } from "@/lib/prisma";
import cache from "@/lib/cache";
import { LeaseStatus } from "@/types/enums";
import { SIDECAR_VIEWER_URL } from "@/lib/shortHash";

/**
 * Resolves token string into { requestId, donorId }.
 * Supports:
 * 1. Base64url JSON: { requestId, donorId } or { r, d }
 * 2. Hyphenated: "1-5" (requestId-donorId)
 * 3. Named: "req_1_donor_5" or "r1d5"
 */
function resolveToken(token: string): { requestId: number; donorId: number } | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf-8");
    const json = JSON.parse(decoded);
    if (json.requestId && json.donorId) {
      return { requestId: Number(json.requestId), donorId: Number(json.donorId) };
    }
    if (json.r && json.d) {
      return { requestId: Number(json.r), donorId: Number(json.d) };
    }
  } catch {
    // Fall through to regex patterns
  }

  const matchHyphen = token.match(/^(\d+)-(\d+)$/);
  if (matchHyphen) {
    return { requestId: Number(matchHyphen[1]), donorId: Number(matchHyphen[2]) };
  }

  const matchNamed = token.match(/^req_?(\d+)_?donor_?(\d+)$/i);
  if (matchNamed) {
    return { requestId: Number(matchNamed[1]), donorId: Number(matchNamed[2]) };
  }

  const matchShort = token.match(/^r(\d+)d(\d+)$/i);
  if (matchShort) {
    return { requestId: Number(matchShort[1]), donorId: Number(matchShort[2]) };
  }

  return null;
}

export async function GET(
  req: Request,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;

    // Cache lookup for 15k concurrent donor pings
    const cacheKey = `donor_token_${token}`;
    const cached = cache.get<any>(cacheKey);
    if (cached) {
      return NextResponse.json(cached, {
        headers: { "X-V2V-Cache": "HIT" },
      });
    }

    const resolved = resolveToken(token);

    if (!resolved) {
      return NextResponse.json(
        { error: "Invalid or malformed donor response token", code: "INVALID_TOKEN" },
        { status: 400 }
      );
    }

    const { requestId, donorId } = resolved;

    const request = await withDbRetry(() =>
      prisma.emergencyRequest.findUnique({
        where: { id: requestId },
      })
    );

    if (!request) {
      return NextResponse.json(
        { error: `Emergency request #${requestId} not found`, code: "REQUEST_NOT_FOUND" },
        { status: 404 }
      );
    }

    const donor = await withDbRetry(() =>
      prisma.donor.findUnique({
        where: { id: donorId },
      })
    );

    if (!donor) {
      return NextResponse.json(
        { error: `Donor #${donorId} not found`, code: "DONOR_NOT_FOUND" },
        { status: 404 }
      );
    }

    // Fetch existing lease for this donor on this request, if any
    const existingLease = await withDbRetry(() =>
      prisma.donorLease.findFirst({
        where: { requestId, donorId },
        orderBy: { createdAt: "desc" },
      })
    );

    // Count currently active leases (JIT_PASSED, EN_ROUTE, ARRIVED)
    const activeCount = await withDbRetry(() =>
      prisma.donorLease.count({
        where: {
          requestId,
          status: { in: [LeaseStatus.JIT_PASSED, LeaseStatus.EN_ROUTE, LeaseStatus.ARRIVED] },
        },
      })
    );

    const targetSlots = request.unitsNeeded + 1; // N+1 Token Bucket
    const isSaturated = activeCount >= targetSlots;

    const payload = {
      success: true,
      token,
      request: {
        id: request.id,
        patientName: request.patientName,
        patientUhid: request.patientUhid,
        hospitalName: request.hospitalName,
        hospitalLat: request.hospitalLat,
        hospitalLng: request.hospitalLng,
        component: request.component,
        bloodGroup: request.bloodGroup,
        unitsNeeded: request.unitsNeeded,
        waveState: request.waveState,
        shortHash: request.shortHash,
        expiresAt: request.expiresAt.toISOString(),
      },
      donor: {
        id: donor.id,
        name: donor.name,
        bloodGroup: donor.bloodGroup,
        gender: donor.gender,
        weightKg: donor.weightKg,
      },
      lease: existingLease
        ? {
            id: existingLease.id,
            status: existingLease.status,
            leaseExpiresAt: existingLease.leaseExpiresAt.toISOString(),
            handshakePin: existingLease.handshakePin ?? null,
          }
        : null,
      targetSlots,
      activeCount,
      isSaturated,
      sidecarUrl: SIDECAR_VIEWER_URL,
    };

    // Cache for 2.5 seconds
    cache.set(cacheKey, payload, 2500);

    return NextResponse.json(payload, {
      headers: { "X-V2V-Cache": "MISS" },
    });
  } catch (error: any) {
    console.error("Error in GET /api/donor/respond/[token]:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}
