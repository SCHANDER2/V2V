/**
 * Mock Cloud Telephony Bridge
 * 
 * Implements Counter-Loop 4:
 * 1. Checks emergency request status (via Prisma or override).
 * 2. If status is FULFILLED_CLOSED or EXPIRED, rejects with explicit error.
 * 3. Allocates virtual proxy DID from Delhi NCR pool (+91-11-4000-xxxx).
 * 4. Masks real phone numbers so they are never exposed in UI or logs.
 */

import {
  CloudTelephonyBridge,
  TelephonyBridgeSession,
  TelephonyBridgeOptions,
} from "../interfaces/telephony.interface";
import { prisma } from "@/lib/prisma";
import { WaveState } from "@/types/enums";

export const VIRTUAL_PROXY_POOL = [
  "+911140001001",
  "+911140001002",
  "+911140001003",
  "+911140001004",
  "+911140001005",
];

export function maskPhoneNumber(phone: string): string {
  const digits = phone.replace(/[^0-9]/g, "");
  if (digits.length < 4) return "+91-XXXXX-XXXX";
  const lastFour = digits.slice(-4);
  return `+91-XXXXX-XX${lastFour.slice(-2)}`;
}

export class MockCloudTelephonyBridge implements CloudTelephonyBridge {
  private sessions: Map<string, TelephonyBridgeSession> = new Map();
  private proxyIndex = 0;

  private allocateProxy(): string {
    const proxy = VIRTUAL_PROXY_POOL[this.proxyIndex % VIRTUAL_PROXY_POOL.length];
    this.proxyIndex++;
    return proxy;
  }

  public async initiateMaskedBridge(
    requestId: number,
    donorId: number,
    attendantPhone: string,
    donorPhone: string,
    options?: TelephonyBridgeOptions
  ): Promise<TelephonyBridgeSession> {
    // 1. Check Request Status for Counter-Loop 4 (Anti-Tout Protection)
    let waveState: string | undefined = options?.requestStatusOverride;

    if (!waveState) {
      try {
        const req = await prisma.emergencyRequest.findUnique({
          where: { id: requestId },
          select: { waveState: true },
        });
        waveState = req?.waveState;
      } catch (err) {
        // Fallback if running outside full db context
      }
    }

    if (waveState === WaveState.FULFILLED_CLOSED || waveState === WaveState.EXPIRED) {
      throw new Error(
        `Counter-Loop 4 Violation: Cannot initiate masked bridge for request in state ${waveState}`
      );
    }

    // 2. Allocate Virtual Proxy DID and Mask Numbers
    const sessionId = `bridge_${requestId}_${donorId}_${Date.now()}`;
    const virtualProxyNumber = options?.customProxyNumber || this.allocateProxy();
    const ttlMinutes = options?.ttlMinutes ?? 25;
    const allocatedAt = new Date();
    const expiresAt = new Date(allocatedAt.getTime() + ttlMinutes * 60 * 1000);

    const session: TelephonyBridgeSession = {
      sessionId,
      requestId,
      donorId,
      virtualProxyNumber,
      maskedAttendantPhone: maskPhoneNumber(attendantPhone),
      maskedDonorPhone: maskPhoneNumber(donorPhone),
      status: "ACTIVE",
      allocatedAt,
      expiresAt,
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  public async terminateBridge(sessionId: string): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session) return false;
    session.status = "TERMINATED";
    return true;
  }

  public async terminateBridgesForRequest(requestId: number): Promise<number> {
    let count = 0;
    for (const session of this.sessions.values()) {
      if (session.requestId === requestId && session.status === "ACTIVE") {
        session.status = "TERMINATED";
        count++;
      }
    }
    return count;
  }

  public getActiveBridges(requestId?: number): TelephonyBridgeSession[] {
    const now = new Date();
    const active: TelephonyBridgeSession[] = [];
    for (const session of this.sessions.values()) {
      if (session.status === "ACTIVE") {
        if (session.expiresAt < now) {
          session.status = "COMPLETED";
        } else if (!requestId || session.requestId === requestId) {
          active.push(session);
        }
      }
    }
    return active;
  }

  public getSession(sessionId: string): TelephonyBridgeSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Test helper to clear all in-memory sessions
   */
  public resetSessions(): void {
    this.sessions.clear();
    this.proxyIndex = 0;
  }
}

export const mockCloudTelephonyBridge = new MockCloudTelephonyBridge();
