// src/app/api/lease/arrive/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
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
      include: { request: true, donor: true },
    });

    if (!lease) {
      return NextResponse.json(
        { error: `DonorLease with id ${leaseId} not found` },
        { status: 404 }
      );
    }

    // Guard: timed-out leases cannot check in
    if (lease.status === LeaseStatus.EVICTED_TIMEOUT) {
      return NextResponse.json(
        {
          error: "Lease has already expired and timed out. Slot has been re-allocated.",
          status: lease.status,
        },
        { status: 409 }
      );
    }

    // Idempotency: If already arrived, return success
    if (lease.status === LeaseStatus.ARRIVED) {
      return NextResponse.json({
        success: true,
        leaseId: lease.id,
        status: LeaseStatus.ARRIVED,
        handshakePin: lease.handshakePin,
        message: "Donor has already checked in as arrived",
      });
    }

    // Transition lease to ARRIVED (freezes eviction timer)
    const updated = await prisma.donorLease.update({
      where: { id: leaseId },
      data: {
        status: LeaseStatus.ARRIVED,
      },
    });

    return NextResponse.json({
      success: true,
      leaseId: updated.id,
      status: LeaseStatus.ARRIVED,
      arrivedAt: new Date().toISOString(),
      handshakePin: updated.handshakePin,
    });
  } catch (error: any) {
    console.error("Error in POST /api/lease/arrive:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}
