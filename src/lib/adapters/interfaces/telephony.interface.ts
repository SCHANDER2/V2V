/**
 * Cloud Telephony Bridge Interface
 * 
 * Implements Counter-Loop 4 (Anti-Tout & Masked Communication):
 * - Real phone numbers of patients, families, and donors are NEVER exposed.
 * - Bridges all calls through a temporary virtual proxy number (DID).
 * - Enforces strict deactivation: Rejects bridge creation and terminates active bridges
 *   if the EmergencyRequest is in FULFILLED_CLOSED or EXPIRED state.
 */

export type TelephonySessionStatus = "ACTIVE" | "COMPLETED" | "TERMINATED" | "REJECTED";

export interface TelephonyBridgeSession {
  sessionId: string;
  requestId: number;
  donorId: number;
  virtualProxyNumber: string; // e.g. "+911140001001"
  maskedAttendantPhone: string; // e.g. "+91-XXXXX-98765"
  maskedDonorPhone: string; // e.g. "+91-XXXXX-12345"
  status: TelephonySessionStatus;
  allocatedAt: Date;
  expiresAt: Date;
  rejectionReason?: string;
}

export interface TelephonyBridgeOptions {
  ttlMinutes?: number; // default 25 minutes
  customProxyNumber?: string;
  requestStatusOverride?: string; // For testing state without hitting DB
}

export interface CloudTelephonyBridge {
  /**
   * Initiates a 2-way masked voice call bridge between patient attendant and donor.
   * Allocates a virtual proxy number.
   * 
   * Strict Counter-Loop 4 Enforcement:
   * Throws an error or returns a rejected session if the request is FULFILLED_CLOSED or EXPIRED.
   */
  initiateMaskedBridge(
    requestId: number,
    donorId: number,
    attendantPhone: string,
    donorPhone: string,
    options?: TelephonyBridgeOptions
  ): Promise<TelephonyBridgeSession>;

  /**
   * Terminate an active call bridge session immediately.
   */
  terminateBridge(sessionId: string): Promise<boolean>;

  /**
   * Terminate all active call bridges for a specific emergency request
   * (e.g. called upon request closure or expiry).
   */
  terminateBridgesForRequest(requestId: number): Promise<number>;

  /**
   * Retrieve active bridge sessions, optionally filtered by requestId.
   */
  getActiveBridges(requestId?: number): TelephonyBridgeSession[];

  /**
   * Retrieve a session by its unique sessionId.
   */
  getSession(sessionId: string): TelephonyBridgeSession | undefined;
}
