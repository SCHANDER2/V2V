// src/app/api/request/create/route.ts
import { NextResponse } from "next/server";
import prisma, { withDbRetry } from "@/lib/prisma";
import { rateLimiter, rateLimitResponse } from "@/lib/rateLimit";
import {
  generateShortHash,
  calculateShortHashExpiry,
  formatTrackingUrl,
  SIDECAR_VIEWER_URL,
} from "@/lib/shortHash";
import { BloodGroup, Component, RequestMode, WaveState } from "@/types/enums";

interface CreateRequestBody {
  patientName: string;
  patientUhid?: string;
  UHID?: string;
  patientUHID?: string;
  hospitalName: string;
  hospitalLat: number;
  hospitalLng: number;
  component: string;
  bloodGroup?: string;
  requestMode?: string;
  unitsNeeded: number;
}

export async function POST(req: Request) {
  try {
    // 1. Rate Limiting Protection (25 requests/min per IP)
    const rl = rateLimiter.check(req, { keyPrefix: "rl:request_create", limit: 25 });
    if (!rl.allowed) {
      return rateLimitResponse(rl);
    }

    const body: CreateRequestBody = await req.json();

    const patientName = body.patientName?.trim();
    const patientUhid = (body.patientUhid || body.UHID || body.patientUHID)?.trim();
    const hospitalName = body.hospitalName?.trim();
    const hospitalLat = Number(body.hospitalLat);
    const hospitalLng = Number(body.hospitalLng);
    const component = body.component?.trim();
    const bloodGroup = (body.bloodGroup?.trim() || BloodGroup.O_POS) as BloodGroup;
    let requestMode = (body.requestMode?.trim() || "") as RequestMode;
    const unitsNeeded = Number(body.unitsNeeded);

    // Validation errors collection
    const errors: string[] = [];
    if (!patientName) errors.push("patientName is required");
    if (!patientUhid) errors.push("patientUhid (or UHID) is required");
    if (!hospitalName) errors.push("hospitalName is required");
    if (isNaN(hospitalLat) || hospitalLat < -90 || hospitalLat > 90) {
      errors.push("hospitalLat must be a valid latitude between -90 and 90");
    }
    if (isNaN(hospitalLng) || hospitalLng < -180 || hospitalLng > 180) {
      errors.push("hospitalLng must be a valid longitude between -180 and 180");
    }
    if (!Object.values(Component).includes(component as Component)) {
      errors.push(`Invalid component. Must be one of: ${Object.values(Component).join(", ")}`);
    }
    if (!Object.values(BloodGroup).includes(bloodGroup)) {
      errors.push(`Invalid bloodGroup. Must be one of: ${Object.values(BloodGroup).join(", ")}`);
    }

    // SDP clinical rule: platelets require exact ABO matching
    if (component === Component.SDP) {
      requestMode = RequestMode.EXACT_OR_SDP;
    } else if (!Object.values(RequestMode).includes(requestMode)) {
      errors.push(`Invalid requestMode. Must be one of: ${Object.values(RequestMode).join(", ")}`);
    }

    if (isNaN(unitsNeeded) || !Number.isInteger(unitsNeeded) || unitsNeeded < 1) {
      errors.push("unitsNeeded must be an integer >= 1");
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { error: "Validation failed", details: errors },
        { status: 400 }
      );
    }

    // Generate unique shortHash with collision resilience
    let shortHash = generateShortHash();
    let collisionCheck = await withDbRetry(() =>
      prisma.emergencyRequest.findUnique({ where: { shortHash } })
    );
    let retries = 0;
    while (collisionCheck && retries < 3) {
      shortHash = generateShortHash();
      collisionCheck = await withDbRetry(() =>
        prisma.emergencyRequest.findUnique({ where: { shortHash } })
      );
      retries++;
    }

    // Calculate 12-hour TTL expiration
    const expiresAt = calculateShortHashExpiry(12);

    // Create EmergencyRequest in database
    const request = await withDbRetry(() =>
      prisma.emergencyRequest.create({
        data: {
          patientName: patientName!,
          patientUhid: patientUhid!,
          hospitalName: hospitalName!,
          hospitalLat,
          hospitalLng,
          component: component!,
          bloodGroup,
          requestMode,
          unitsNeeded,
          waveState: WaveState.PENDING_VERIFICATION,
          shortHash,
          expiresAt,
        },
      })
    );

    return NextResponse.json(
      {
        id: request.id,
        shortHash: request.shortHash,
        trackingUrl: formatTrackingUrl(request.shortHash),
        expiresAt: request.expiresAt.toISOString(),
        waveState: request.waveState,
        sidecarUrl: SIDECAR_VIEWER_URL,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error in POST /api/request/create:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}
