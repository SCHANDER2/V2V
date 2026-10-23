// src/app/donor/respond/[token]/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import HealthChecklist from "@/components/HealthChecklist";
import V2VPass from "@/components/V2VPass";
import SidecarPill from "@/components/SidecarPill";
import { LeaseStatus } from "@/types/enums";

interface RequestData {
  id: number;
  patientName: string;
  patientUhid: string;
  hospitalName: string;
  hospitalLat: number;
  hospitalLng: number;
  component: string;
  bloodGroup: string;
  unitsNeeded: number;
  waveState: string;
  shortHash: string;
  expiresAt: string;
}

interface DonorData {
  id: number;
  name: string;
  bloodGroup: string;
  gender: string;
  weightKg: number;
}

interface LeaseData {
  id: number;
  status: string;
  leaseExpiresAt: string;
  handshakePin?: string | null;
}

interface DonorResponsePayload {
  success: boolean;
  token: string;
  request: RequestData;
  donor: DonorData;
  lease: LeaseData | null;
  targetSlots: number;
  activeCount: number;
  isSaturated: boolean;
  sidecarUrl: string;
}

export default function DonorRespondPage({
  params,
}: {
  params: { token: string };
}) {
  const { token } = params;

  const [data, setData] = useState<DonorResponsePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [screenerPassed, setScreenerPassed] = useState(false);
  const [lockingSlot, setLockingSlot] = useState(false);
  const [lockError, setLockError] = useState<string | null>(null);

  // Fetch initial token data and existing lease state
  const loadDonorData = useCallback(async () => {
    try {
      const res = await axios.get<DonorResponsePayload>(
        `/api/donor/respond/${token}`
      );
      setData(res.data);
      setError(null);

      // If donor already holds an active or standby lease, bypass screener
      if (res.data.lease) {
        setScreenerPassed(true);
      }
    } catch (err: any) {
      setError(
        err.response?.data?.error || err.message || "Failed to resolve dispatch token"
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadDonorData();
  }, [loadDonorData]);

  // Handle slot lock execution via POST /api/lease/lock
  const handleLockSlot = async () => {
    if (!data) return;
    setLockingSlot(true);
    setLockError(null);

    try {
      const res = await axios.post("/api/lease/lock", {
        requestId: data.request.id,
        donorId: data.donor.id,
      });

      // Update state with newly granted lease
      setData((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          lease: {
            id: res.data.leaseId,
            status: res.data.status,
            leaseExpiresAt: res.data.leaseExpiresAt,
            handshakePin: res.data.handshakePin,
          },
        };
      });
    } catch (err: any) {
      setLockError(
        err.response?.data?.error || err.message || "Failed to lock donation slot"
      );
    } finally {
      setLockingSlot(false);
    }
  };

  // Handle arrival declaration
  const handleArrive = async () => {
    if (!data?.lease) return;
    try {
      const res = await axios.post("/api/lease/arrive", {
        leaseId: data.lease.id,
      });

      setData((prev) => {
        if (!prev || !prev.lease) return null;
        return {
          ...prev,
          lease: {
            ...prev.lease,
            status: res.data.status,
            handshakePin: res.data.handshakePin ?? prev.lease.handshakePin,
          },
        };
      });
    } catch (err: any) {
      alert(err.response?.data?.error || "Arrival check-in failed");
    }
  };

  // Handle ETA update
  const handleUpdateEta = async (minutes: number) => {
    if (!data?.lease) return;
    try {
      const res = await axios.post("/api/lease/update-eta", {
        leaseId: data.lease.id,
        etaMinutes: minutes,
      });

      setData((prev) => {
        if (!prev || !prev.lease) return null;
        return {
          ...prev,
          lease: {
            ...prev.lease,
            status: res.data.status,
          },
        };
      });
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to update ETA");
    }
  };

  // 1. Loading State
  if (loading) {
    return (
      <main className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-800 text-white rounded-3xl p-8 text-center shadow-2xl border border-gray-700">
          <div className="inline-block h-12 w-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
          <h2 className="text-lg font-bold">Connecting to Emergency Dispatch...</h2>
          <p className="text-xs text-gray-400 mt-1">Verifying authorized WhatsApp token</p>
        </div>
      </main>
    );
  }

  // 2. Error / Not Found State
  if (error || !data) {
    return (
      <main className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-800 text-white rounded-3xl p-8 text-center shadow-2xl border border-red-500/40">
          <span className="text-4xl">⚠️</span>
          <h2 className="text-lg font-bold mt-3 text-red-400">Emergency Link Error</h2>
          <p className="text-xs text-gray-300 mt-2 leading-relaxed">{error}</p>
          <p className="text-[11px] text-gray-500 mt-4">
            If this emergency is ongoing, please request a refreshed dispatch link or contact the hospital blood bank helpline.
          </p>
        </div>
      </main>
    );
  }

  const { request, donor, lease } = data;
  const isStandby = lease?.status === LeaseStatus.STANDBY;
  const isActiveLease =
    lease &&
    (lease.status === LeaseStatus.JIT_PASSED ||
      lease.status === LeaseStatus.EN_ROUTE ||
      lease.status === LeaseStatus.ARRIVED);

  return (
    <main className="min-h-screen bg-slate-950 text-white pb-12">
      {/* Top Header with Sidecar Link */}
      <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-gray-800 px-4 py-3">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🚑</span>
            <span className="text-xs font-black tracking-widest text-emerald-400 uppercase">
              V2V JIT RESPONSE
            </span>
          </div>
          <SidecarPill compact />
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 mt-5 space-y-5">
        {/* Urgent Context Hero Banner */}
        <div className="bg-gradient-to-r from-red-950/80 to-slate-900 p-5 rounded-3xl border border-red-800/60 shadow-lg">
          <div className="flex items-center gap-2 text-red-400 text-xs font-bold uppercase tracking-wider mb-1">
            <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
            <span>Emergency Transfusion Mobilization</span>
          </div>
          <h1 className="text-xl font-black text-white leading-tight">
            {request.hospitalName}
          </h1>
          <p className="text-xs text-gray-300 mt-1">
            Patient UHID: <span className="font-mono text-sky-400">{request.patientUhid}</span>
          </p>

          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-red-900/60 border border-red-700/60 rounded-xl text-xs font-bold text-red-200">
            <span>Needed: {request.bloodGroup} • {request.component}</span>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* CASE 1: Active Donor En Route / Arrived -> Display V2V-PASS   */}
        {/* ------------------------------------------------------------- */}
        {isActiveLease && (
          <V2VPass
            leaseId={lease.id}
            donorId={donor.id}
            requestId={request.id}
            donorName={donor.name}
            patientUhid={request.patientUhid}
            hospitalName={request.hospitalName}
            bloodGroup={request.bloodGroup}
            component={request.component}
            handshakePin={lease.handshakePin}
            status={lease.status}
            leaseExpiresAt={lease.leaseExpiresAt}
            hospitalLat={request.hospitalLat}
            hospitalLng={request.hospitalLng}
            onArrive={handleArrive}
            onUpdateEta={handleUpdateEta}
          />
        )}

        {/* ------------------------------------------------------------- */}
        {/* CASE 2: Standby Buffer Screen                                */}
        {/* ------------------------------------------------------------- */}
        {isStandby && (
          <div className="bg-slate-900 p-6 rounded-3xl border-2 border-amber-500/60 shadow-2xl text-center space-y-4">
            <div className="h-16 w-16 mx-auto rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-3xl">
              ⏳
            </div>
            <div>
              <span className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full text-xs font-mono font-bold">
                STANDBY BUFFER QUEUE
              </span>
              <h2 className="text-lg font-bold text-white mt-2">
                You are Standby Donor #1
              </h2>
              <p className="text-xs text-gray-300 mt-1">
                Keep your phone nearby — High probability of activation
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-gray-800 text-left text-xs text-gray-300 space-y-2 leading-relaxed">
              <p>
                <strong>Why Standby?</strong> Under Counter-Loop 2, active travel slots are capped at {data.targetSlots} to avoid overburdening hospital triage with unneeded donors.
              </p>
              <p>
                <strong>Automatic Promotion:</strong> If an active en-route donor encounters traffic or fails to check in within 25 minutes, our dead-man’s switch watchdog will immediately promote you to active travel status.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={loadDonorData}
                className="w-full py-3 px-4 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-bold rounded-xl border border-gray-700 transition-colors"
              >
                🔄 Refresh Promotion Status
              </button>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* CASE 3: Initial Screener & Slot Lock Flow                     */}
        {/* ------------------------------------------------------------- */}
        {!lease && (
          <div className="space-y-5">
            <HealthChecklist
              component={request.component}
              donorWeightKg={donor.weightKg}
              donorGender={donor.gender}
              onPass={() => setScreenerPassed(true)}
              onDeferral={() => setScreenerPassed(false)}
            />

            {lockError && (
              <div className="p-3 bg-red-950 border border-red-800 rounded-xl text-red-300 text-xs">
                {lockError}
              </div>
            )}

            <button
              type="button"
              disabled={!screenerPassed || lockingSlot}
              onClick={handleLockSlot}
              className={`w-full py-4 px-6 rounded-2xl font-black text-sm tracking-wide uppercase transition-all shadow-xl flex items-center justify-center gap-2 ${
                screenerPassed && !lockingSlot
                  ? "bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white active:scale-[0.98]"
                  : "bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700"
              }`}
            >
              {lockingSlot ? (
                <>
                  <span className="inline-block h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Securing Atomic Slot...</span>
                </>
              ) : (
                <>
                  <span>🔒</span>
                  <span>I Can Donate Now — Lock My Slot</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
