// src/components/DonorRoster.tsx
"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { LeaseStatus } from "@/types/enums";

export interface DonorDetails {
  id: number;
  name: string;
  maskedPhone: string;
  bloodGroup: string;
  approxLat?: number;
  approxLng?: number;
}

export interface ActiveLease {
  id: number;
  donorId: number;
  status: string;
  leaseExpiresAt: string;
  handshakePin?: string | null;
  donor: DonorDetails;
}

export interface StandbyLease {
  id: number;
  donorId: number;
  status: string;
  leaseExpiresAt: string;
  donor: DonorDetails;
}

export interface DonorRosterProps {
  requestId: number;
  activeLeases: ActiveLease[];
  standbyLeases: StandbyLease[];
  canInitiateCalls: boolean;
  isExpired: boolean;
  isFulfilled: boolean;
  onRefresh?: () => void;
}

/** Total travel lease duration: 25 minutes (in seconds) */
const LEASE_DURATION_SECONDS = 25 * 60;

/**
 * Calculates remaining seconds until lease expiration.
 */
function getRemainingSeconds(leaseExpiresAt: string): number {
  const expiry = new Date(leaseExpiresAt).getTime();
  const diff = Math.floor((expiry - Date.now()) / 1000);
  return Math.max(0, diff);
}

/**
 * Formats seconds into mm:ss string.
 */
function formatMinutesSeconds(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

export default function DonorRoster({
  requestId,
  activeLeases,
  standbyLeases,
  canInitiateCalls,
  isExpired,
  isFulfilled,
  onRefresh,
}: DonorRosterProps) {
  // Clock state updating every second for countdowns
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [attendantPhone, setAttendantPhone] = useState("");
  const [callingLeaseId, setCallingLeaseId] = useState<number | null>(null);
  const [callMessage, setCallMessage] = useState<{ leaseId: number; text: string; error?: boolean } | null>(null);
  const [activeTab, setActiveTab] = useState<"ACTIVE" | "STANDBY">("ACTIVE");

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleCallBridge = async (lease: ActiveLease) => {
    if (!canInitiateCalls || isFulfilled || isExpired) {
      alert("Counter-Loop 4 Protection: Calls are deactivated for fulfilled or expired requests.");
      return;
    }

    const phoneToUse = attendantPhone.trim() || prompt("Enter your attendant mobile phone number (+91...):");
    if (!phoneToUse || phoneToUse.length < 8) {
      alert("Please enter a valid attendant phone number to connect.");
      return;
    }
    setAttendantPhone(phoneToUse);

    try {
      setCallingLeaseId(lease.id);
      setCallMessage(null);

      const res = await axios.post("/api/telephony/bridge", {
        requestId,
        donorId: lease.donorId,
        attendantPhone: phoneToUse,
      });

      if (res.data?.success) {
        setCallMessage({
          leaseId: lease.id,
          text: `Bridging call via virtual proxy: ${res.data.session.virtualProxyNumber}. Your phone will ring shortly.`,
        });
      } else {
        setCallMessage({
          leaseId: lease.id,
          text: res.data?.error || "Failed to initiate call bridge.",
          error: true,
        });
      }
    } catch (err: any) {
      const errMsg = err.response?.data?.error || err.message || "Telephony bridge error";
      setCallMessage({ leaseId: lease.id, text: errMsg, error: true });
    } finally {
      setCallingLeaseId(null);
    }
  };

  return (
    <div className="w-full bg-white rounded-2xl shadow-md border border-gray-200 overflow-hidden">
      {/* Roster Header */}
      <div className="p-4 sm:p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50/70">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <span>🛡️ Community Donor Roster</span>
            <span className="text-xs font-normal text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
              N+1 Buffer
            </span>
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Real-time travel leases, dead-man&apos;s countdowns, and secure masked communication.
          </p>
        </div>

        {/* Tab switchers */}
        <div className="flex bg-gray-200 p-1 rounded-lg text-xs font-semibold">
          <button
            onClick={() => setActiveTab("ACTIVE")}
            className={`px-3 py-1.5 rounded-md transition-all ${
              activeTab === "ACTIVE"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            En Route ({activeLeases.length})
          </button>
          <button
            onClick={() => setActiveTab("STANDBY")}
            className={`px-3 py-1.5 rounded-md transition-all ${
              activeTab === "STANDBY"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Standby Queue ({standbyLeases.length})
          </button>
        </div>
      </div>

      {/* Content Body */}
      <div className="p-4 sm:p-5">
        {activeTab === "ACTIVE" ? (
          <div>
            {activeLeases.length === 0 ? (
              <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                <span className="text-3xl">📡</span>
                <h4 className="text-sm font-semibold text-gray-700 mt-2">Awaiting Donor Response</h4>
                <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
                  Emergency wave broadcast is pinging compatible donors. As donors accept their JIT screening, their travel cards will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeLeases.map((lease) => {
                  const remSeconds = getRemainingSeconds(lease.leaseExpiresAt);
                  const isArrived = lease.status === LeaseStatus.ARRIVED;
                  const isTimedOut = remSeconds === 0 && !isArrived;
                  const percentLeft = Math.min(100, (remSeconds / LEASE_DURATION_SECONDS) * 100);

                  // Progress bar color based on remaining travel time
                  let progressColor = "bg-emerald-500";
                  let textColor = "text-emerald-700";
                  if (remSeconds < 300) {
                    // Under 5 minutes -> flashing red
                    progressColor = "bg-red-600 animate-pulse";
                    textColor = "text-red-700 font-bold animate-pulse";
                  } else if (remSeconds < 600) {
                    // Under 10 minutes -> flashing amber
                    progressColor = "bg-amber-500 animate-pulse";
                    textColor = "text-amber-700 font-semibold";
                  }

                  return (
                    <div
                      key={lease.id}
                      className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm hover:border-gray-300 transition-all"
                    >
                      {/* Top Row: Donor info & Status */}
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-gray-900 text-base">{lease.donor.name}</h3>
                            <span className="text-xs font-bold px-2 py-0.5 rounded bg-red-100 text-red-800 border border-red-200">
                              {lease.donor.bloodGroup.replace("_", " ")}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                            <span>📞 {lease.donor.maskedPhone}</span>
                            <span>•</span>
                            <span className="font-mono text-gray-400">Lease #{lease.id}</span>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div>
                          {isArrived ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                              ✓ ARRIVED AT HOSPITAL
                            </span>
                          ) : isTimedOut ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-red-100 text-red-800 border border-red-300 animate-pulse">
                              ⚠️ LEASE TIMED OUT
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                              🚀 EN ROUTE
                            </span>
                          )}
                        </div>
                      </div>

                      {/* 25-Minute Dead-Man's Switch Countdown Bar */}
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="text-gray-600 font-medium flex items-center gap-1">
                            ⏱️ 25-Min Dead-Man&apos;s Travel Window:
                          </span>
                          <span className={`font-mono text-sm ${textColor}`}>
                            {isArrived
                              ? "ARRIVED (Timer Frozen)"
                              : isTimedOut
                              ? "00:00 (Eviction Pending)"
                              : `${formatMinutesSeconds(remSeconds)} remaining`}
                          </span>
                        </div>

                        {!isArrived && (
                          <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                            <div
                              className={`h-2.5 rounded-full transition-all duration-1000 ${progressColor}`}
                              style={{ width: `${percentLeft}%` }}
                            />
                          </div>
                        )}

                        {remSeconds < 300 && !isArrived && !isTimedOut && (
                          <p className="text-[11px] text-red-600 font-semibold mt-1">
                            🚨 Critical: Under 5 minutes remaining. Standby donor will be promoted if arrival not recorded.
                          </p>
                        )}
                      </div>

                      {/* Handshake PIN & Telephony Call Actions */}
                      <div className="mt-4 pt-3 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        {/* 4-digit Handshake PIN Card */}
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 flex items-center gap-3">
                          <div>
                            <div className="text-[10px] uppercase font-bold text-amber-800 tracking-wider">
                              Handshake PIN
                            </div>
                            <div className="text-xs text-amber-700">
                              Verify at blood bank counter
                            </div>
                          </div>
                          <div className="text-lg font-mono font-black tracking-widest text-amber-950 bg-amber-200/80 px-2.5 py-1 rounded border border-amber-300">
                            {lease.handshakePin || "••••"}
                          </div>
                        </div>

                        {/* Masked Call Button (Counter-Loop 4 enforced) */}
                        <div>
                          {canInitiateCalls && !isFulfilled && !isExpired ? (
                            <button
                              onClick={() => handleCallBridge(lease)}
                              disabled={callingLeaseId === lease.id}
                              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 active:scale-95 transition-all shadow-sm disabled:opacity-50"
                            >
                              <span>📞</span>
                              <span>
                                {callingLeaseId === lease.id ? "Connecting..." : "Call Donor (Masked)"}
                              </span>
                            </button>
                          ) : (
                            <span className="text-xs text-gray-400 italic">
                              Calls deactivated (Anti-Tout Protection)
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Bridge call status message */}
                      {callMessage && callMessage.leaseId === lease.id && (
                        <div
                          className={`mt-2 p-2 rounded text-xs ${
                            callMessage.error
                              ? "bg-red-50 text-red-700 border border-red-200"
                              : "bg-green-50 text-green-700 border border-green-200"
                          }`}
                        >
                          {callMessage.text}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* Standby Queue Tab */
          <div>
            {standbyLeases.length === 0 ? (
              <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                <span className="text-3xl">☕</span>
                <h4 className="text-sm font-semibold text-gray-700 mt-2">No Donors in Standby Buffer</h4>
                <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
                  When primary active slots are filled, surplus responding donors are placed in this prioritized standby queue to back up active donors.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                  <strong>Counter-Loop 3 Standby Buffer:</strong> If an active en-route donor exceeds their 25-minute travel window, the lease watchdog automatically evicts them and promotes Standby Donor #1 with a fresh travel lease.
                </div>

                {standbyLeases.map((lease, index) => (
                  <div
                    key={lease.id}
                    className="border border-gray-200 rounded-lg p-3 bg-gray-50 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-200 text-amber-900 font-bold text-xs">
                        #{index + 1}
                      </span>
                      <div>
                        <div className="font-semibold text-gray-900 text-sm">{lease.donor.name}</div>
                        <div className="text-xs text-gray-500">
                          {lease.donor.bloodGroup.replace("_", " ")} • {lease.donor.maskedPhone}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded bg-amber-100 text-amber-800 border border-amber-300">
                      Standby Buffer
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
