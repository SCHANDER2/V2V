// src/app/api/cron/lease-watchdog/route.ts
/**
 * Background Lease Watchdog Cron Route
 *
 * Implements Counter-Loop 3 (Dead-Man's Switch Eviction & Standby Promotion).
 * - Triggered automatically every 5 minutes by Vercel Cron (schedule: "star/5 * * * *")
 * - Can be triggered manually via GET for testing, admin simulator, and health checks (AC3)
 *
 * Contract:
 * GET /api/cron/lease-watchdog
 * Response: { success: true, timestamp: string, executionTimeMs: number, summary: EvictionResult }
 */

import { NextRequest, NextResponse } from "next/server";
import { evictExpiredLeases, EvictionResult } from "@/lib/engines/lease-manager";

// Next.js Route Segment Configuration
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export interface LeaseWatchdogResponse {
  success: boolean;
  timestamp: string;
  executionTimeMs: number;
  summary: EvictionResult;
  error?: string;
}

export async function GET(request: NextRequest): Promise<NextResponse<LeaseWatchdogResponse>> {
  const startTime = Date.now();
  const requestTimestamp = new Date().toISOString();

  // 1. Authorization Check (Vercel Cron vs Manual Invocation)
  const cronSecret = process.env.CRON_SECRET;
  const isProduction = process.env.NODE_ENV === "production";

  if (isProduction && cronSecret) {
    const authHeader = request.headers.get("authorization");
    const { searchParams } = new URL(request.url);
    const querySecret = searchParams.get("secret") || searchParams.get("key");

    const isAuthorized =
      authHeader === `Bearer ${cronSecret}` || querySecret === cronSecret;

    if (!isAuthorized) {
      const executionTimeMs = Date.now() - startTime;
      console.warn(
        `[LeaseWatchdog] Unauthorized access attempt rejected at ${requestTimestamp}`
      );
      return NextResponse.json(
        {
          success: false,
          timestamp: requestTimestamp,
          executionTimeMs,
          summary: {
            evictedCount: 0,
            promotedCount: 0,
            evictedLeaseIds: [],
            promotedLeaseIds: [],
          },
          error: "Unauthorized: Missing or invalid CRON_SECRET",
        },
        { status: 401 }
      );
    }
  }

  // Determine trigger source for logging
  const authHeader = request.headers.get("authorization");
  const triggerSource =
    authHeader && authHeader.startsWith("Bearer") ? "vercel_cron" : "manual";

  console.log(
    `[LeaseWatchdog] Execution initiated at ${requestTimestamp} (source: ${triggerSource})`
  );

  // 2. Execute Watchdog Eviction & Standby Promotion
  try {
    const summary = await evictExpiredLeases();
    const executionTimeMs = Date.now() - startTime;

    // Structured logging of watchdog outcomes
    if (summary.evictedCount > 0) {
      console.log(
        `[LeaseWatchdog] Evicted ${summary.evictedCount} expired lease(s): [${summary.evictedLeaseIds.join(
          ", "
        )}]`
      );
    } else {
      console.log(`[LeaseWatchdog] No expired leases found to evict.`);
    }

    if (summary.promotedCount > 0) {
      console.log(
        `[LeaseWatchdog] Promoted ${summary.promotedCount} standby lease(s) to JIT_PASSED: [${summary.promotedLeaseIds.join(
          ", "
        )}]`
      );
    } else if (summary.evictedCount > 0) {
      console.log(`[LeaseWatchdog] No standby donors available for promotion.`);
    }

    console.log(
      `[LeaseWatchdog] Execution completed successfully in ${executionTimeMs}ms (evicted: ${summary.evictedCount}, promoted: ${summary.promotedCount})`
    );

    return NextResponse.json(
      {
        success: true,
        timestamp: new Date().toISOString(),
        executionTimeMs,
        summary,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  } catch (error: any) {
    const executionTimeMs = Date.now() - startTime;
    const errorMessage = error?.message || "Unknown error during lease watchdog execution";
    console.error(`[LeaseWatchdog] ERROR during eviction cycle:`, error);

    return NextResponse.json(
      {
        success: false,
        timestamp: new Date().toISOString(),
        executionTimeMs,
        summary: {
          evictedCount: 0,
          promotedCount: 0,
          evictedLeaseIds: [],
          promotedLeaseIds: [],
        },
        error: errorMessage,
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  }
}
