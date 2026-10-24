// src/app/r/[shortHash]/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Link from "next/link";
import { PhoneCall, ArrowLeft, Droplet, ShieldCheck } from "lucide-react";
import WaveRadar from "@/components/WaveRadar";
import DonorRoster, { ActiveLease, StandbyLease } from "@/components/DonorRoster";
import SidecarPill from "@/components/SidecarPill";
import { WaveState } from "@/types/enums";

interface EmergencyRequestData {
  id: number;
  patientName: string;
  patientUhid: string;
  hospitalName: string;
  hospitalLat: number;
  hospitalLng: number;
  component: string;
  bloodGroup: string;
  requestMode: string;
  unitsNeeded: number;
  waveState: string;
  shortHash: string;
  expiresAt: string;
  isExpired: boolean;
  canInitiateCalls: boolean;
  trackingUrl: string;
  sidecarUrl: string;
}

interface CommandCenterResponse {
  request: EmergencyRequestData;
  activeLeases: ActiveLease[];
  standbyLeases: StandbyLease[];
  pingCount: number;
}

export default function FamilyCommandCenterPage({
  params,
}: {
  params: { shortHash: string };
}) {
  const { shortHash } = params;

  const [data, setData] = useState<CommandCenterResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [copiedLink, setCopiedLink] = useState(false);

  // Fetch command center state from API
  const fetchState = useCallback(async () => {
    try {
      const res = await axios.get<CommandCenterResponse>(`/api/request/${shortHash}`);
      setData(res.data);
      setError(null);
      setLastRefreshed(new Date());
    } catch (err: any) {
      if (err.response?.status === 404) {
        setError("NOT_FOUND");
      } else {
        setError(err.response?.data?.message || err.message || "Failed to load request status");
      }
    } finally {
      setLoading(false);
    }
  }, [shortHash]);

  // Initial fetch and 5-second polling interval
  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 5000);
    return () => clearInterval(interval);
  }, [fetchState]);

  // Copy tracking URL helper
  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  // 12-Hour TTL Expiration Calculation
  const getRemainingTtlFormatted = (expiresAtStr: string) => {
    const diffMs = new Date(expiresAtStr).getTime() - Date.now();
    if (diffMs <= 0) return "Expired";
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${mins}m remaining (12h TTL limit)`;
  };

  // -------------------------------------------------------------
  // 1. Loading Skeleton View
  // -------------------------------------------------------------
  if (loading && !data) {
    return (
      <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-xl bg-white rounded-3xl shadow-xl border border-slate-200 p-8 text-center">
          <div className="inline-block h-12 w-12 border-4 border-rose-600 border-t-transparent rounded-full animate-spin mb-4" />
          <h2 className="text-xl font-bold text-slate-900">Resolving Emergency Command Center</h2>
          <p className="text-sm text-slate-500 mt-1">Connecting to live dispatch radar for #{shortHash}...</p>
        </div>
      </main>
    );
  }

  // -------------------------------------------------------------
  // 2. 404 Clean Not Found View
  // -------------------------------------------------------------
  if (error === "NOT_FOUND" || !data) {
    return (
      <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200 p-8 text-center">
          <span className="text-5xl">🔍</span>
          <h1 className="text-2xl font-bold text-gray-900 mt-4">Emergency Request Not Found</h1>
          <p className="text-sm text-gray-600 mt-2">
            The tracking link <code className="bg-gray-100 px-1.5 py-0.5 rounded text-red-600 font-mono">/r/{shortHash}</code> could not be found or has expired from the dispatch cache.
          </p>
          <div className="mt-6 flex flex-col gap-2">
            <Link
              href="/request/new"
              className="w-full inline-flex justify-center items-center py-3 px-4 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 shadow-md transition"
            >
              🚨 Launch New Emergency SOS
            </Link>
            <Link
              href="/"
              className="w-full inline-flex justify-center items-center py-2.5 px-4 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition text-sm"
            >
              Return to Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const { request, activeLeases, standbyLeases, pingCount } = data;
  const isFulfilled = request.waveState === WaveState.FULFILLED_CLOSED;
  const isExpired = request.waveState === WaveState.EXPIRED || request.isExpired;
  const isPending = request.waveState === WaveState.PENDING_VERIFICATION;
  const isStockCheck = request.waveState === WaveState.STOCK_CHECK;

  return (
    <main
      className="min-h-screen bg-slate-50 pb-16 selection:bg-rose-500 selection:text-white"
      style={{
        backgroundImage: `linear-gradient(180deg, rgba(248, 250, 252, 0.96) 0%, rgba(241, 245, 249, 0.98) 100%), url('https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=1920&q=80')`,
        backgroundAttachment: "fixed",
        backgroundSize: "cover",
      }}
    >
      {/* 12-Hour TTL Top Warning Bar */}
      <div className={`w-full py-2.5 px-4 text-xs font-bold text-center flex items-center justify-center gap-2 shadow-xs ${
        isExpired
          ? "bg-red-600 text-white"
          : isFulfilled
          ? "bg-emerald-600 text-white"
          : "bg-amber-100 text-amber-900 border-b border-amber-300"
      }`}>
        <span>⏱️ 12-Hour Emergency Window:</span>
        <span className="font-mono">{getRemainingTtlFormatted(request.expiresAt)}</span>
        <span className="opacity-75 hidden sm:inline">| National Helpline: 104</span>
      </div>

      <div className="max-w-5xl mx-auto px-4 pt-6">
        {/* Navigation & Science Visualization Sidecar Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 bg-white/95 backdrop-blur-md p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-md shadow-slate-200/50">
          <div>
            <div className="flex items-center gap-2.5">
              <Link href="/" className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 mr-1" title="Back to Home">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <span className="h-3 w-3 rounded-full bg-rose-600 animate-ping" />
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                V2V Emergency Command Center
              </h1>
            </div>
            <p className="text-xs text-gray-500 mt-1 pl-8">
              Ref: <span className="font-mono text-gray-700 font-bold">{request.shortHash}</span> • Auto-refreshed: {lastRefreshed.toLocaleTimeString()}
            </p>
          </div>

          {/* Interactive Sidecar Pill per Science Visualization Priority Rules */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <SidecarPill compact />
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 shadow-2xs transition"
            >
              <span>📋</span>
              <span>{copiedLink ? "Link Copied!" : "Share Link"}</span>
            </button>
          </div>
        </header>

        {/* Anti-Tout Counter-Loop 4 Security Banner */}
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-2xl shadow-sm mb-6 flex items-start gap-3">
          <span className="text-xl">⚠️</span>
          <div>
            <h4 className="text-xs font-bold text-yellow-900 uppercase tracking-wider">
              Anti-Tout Safety Notice (Counter-Loop 4)
            </h4>
            <p className="text-xs text-yellow-800 mt-0.5 leading-relaxed font-medium">
              Never pay cash or disclose personal mobile numbers to unverified intermediaries. All volunteer donor communications are masked via virtual proxy lines. Counter-verification PINs are verified exclusively at the hospital blood bank desk.
            </p>
          </div>
        </div>

        {/* Patient & Hospital Details Card */}
        <section className="bg-white rounded-3xl p-6 shadow-md border border-slate-200/90 mb-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Patient UHID</span>
              <p className="font-extrabold text-slate-900 text-sm mt-0.5">{request.patientUhid}</p>
              <p className="text-xs text-slate-500 font-medium">{request.patientName}</p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Hospital Transfusion</span>
              <p className="font-extrabold text-slate-900 text-sm mt-0.5">{request.hospitalName}</p>
              <p className="text-xs text-slate-500 font-mono">
                {request.hospitalLat.toFixed(3)}°N, {request.hospitalLng.toFixed(3)}°E
              </p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Blood Group &amp; Component</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="px-2.5 py-0.5 bg-rose-100 text-rose-800 font-black rounded text-xs border border-rose-200">
                  {request.bloodGroup.replace("_", " ")}
                </span>
                <span className="text-xs font-bold text-slate-700">
                  {request.component}
                </span>
              </div>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Dispatch Mode</span>
              <p className="font-bold text-slate-800 text-xs mt-0.5">
                {request.requestMode === "EXACT_OR_SDP" ? "Exact Match Required" : "Replacement Allowed"}
              </p>
              <p className="text-xs text-rose-600 font-extrabold">{request.unitsNeeded} Unit(s) Required</p>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* LIFECYCLE STATE PANELS                                              */}
        {/* ------------------------------------------------------------------ */}

        {/* STATE 1: PENDING_VERIFICATION */}
        {isPending && (
          <div className="bg-amber-50 border border-amber-300 rounded-3xl p-6 mb-6 text-center shadow-sm">
            <div className="inline-block p-3 rounded-full bg-amber-100 mb-3 animate-spin text-xl">
              ⚙️
            </div>
            <h3 className="text-lg font-extrabold text-amber-900">Requisition Slip Under Verification</h3>
            <p className="text-xs text-amber-800 max-w-md mx-auto mt-1 font-medium">
              Automated OCR is parsing the doctor&apos;s requisition prescription and validating patient UHID. Wave dispatch will initiate immediately upon verification.
            </p>
          </div>
        )}

        {/* STATE 2: STOCK_CHECK */}
        {isStockCheck && (
          <div className="bg-blue-50 border border-blue-300 rounded-3xl p-6 mb-6 text-center shadow-sm">
            <div className="inline-block p-3 rounded-full bg-blue-100 mb-3 animate-pulse text-xl">
              🏥
            </div>
            <h3 className="text-lg font-extrabold text-blue-900">Querying Central e-RaktKosh Blood Banks</h3>
            <p className="text-xs text-blue-800 max-w-md mx-auto mt-1 font-medium">
              Scanning 5 nearest government blood banks for ready units before activating community donor waves.
            </p>
          </div>
        )}

        {/* STATE 5: FULFILLED_CLOSED (Anti-Tout Complete Lockdown) */}
        {isFulfilled && (
          <div className="bg-emerald-50 border-2 border-emerald-500 rounded-3xl p-8 mb-6 text-center shadow-md">
            <div className="inline-block p-4 rounded-full bg-emerald-100 text-3xl mb-3">
              🎉
            </div>
            <h2 className="text-2xl font-black text-emerald-900">Requirement Fulfilled — Thank You!</h2>
            <p className="text-sm text-emerald-800 max-w-lg mx-auto mt-2 leading-relaxed font-medium">
              All required blood units ({request.unitsNeeded} of {request.unitsNeeded}) have been collected and verified at the blood bank counter.
            </p>
            <div className="mt-4 p-3.5 bg-emerald-100/80 border border-emerald-300 rounded-2xl max-w-md mx-auto text-xs text-emerald-950 font-semibold">
              🔒 <strong>Counter-Loop 4 Enforced:</strong> All volunteer contact lines and masked call bridges have been permanently deactivated to safeguard donor privacy.
            </div>
          </div>
        )}

        {/* STATE 6: EXPIRED */}
        {isExpired && (
          <div className="bg-red-50 border-2 border-red-500 rounded-3xl p-8 mb-6 text-center shadow-md">
            <div className="inline-block p-4 rounded-full bg-red-100 text-3xl mb-3">
              ⚠️
            </div>
            <h2 className="text-2xl font-black text-red-900">Emergency Request Expired</h2>
            <p className="text-sm text-red-800 max-w-lg mx-auto mt-2 leading-relaxed font-medium">
              This request has exceeded the 12-hour maximum TTL without full fulfillment. All active waves and donor leases are closed.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href="tel:104"
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-red-600 text-white font-extrabold text-xs hover:bg-red-700 shadow-md"
              >
                📞 Call National Blood Helpline (104)
              </a>
              <Link
                href="/request/new"
                className="w-full sm:w-auto px-5 py-3 rounded-xl border border-red-300 bg-white text-red-800 font-bold text-xs hover:bg-red-50"
              >
                Launch New Emergency Request
              </Link>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* ACTIVE OPERATION: RADAR & DONOR ROSTER                             */}
        {/* ------------------------------------------------------------------ */}
        {!isFulfilled && !isExpired && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Wave Radar Visualizer (5 columns on desktop) */}
            <div className="lg:col-span-5">
              <WaveRadar
                waveState={request.waveState}
                pingCount={pingCount}
                activeDonorsCount={activeLeases.length}
                unitsNeeded={request.unitsNeeded}
                hospitalName={request.hospitalName}
              />
            </div>

            {/* Donor Roster & Countdown Panel (7 columns on desktop) */}
            <div className="lg:col-span-7">
              <DonorRoster
                requestId={request.id}
                activeLeases={activeLeases}
                standbyLeases={standbyLeases}
                canInitiateCalls={request.canInitiateCalls}
                isExpired={isExpired}
                isFulfilled={isFulfilled}
                onRefresh={fetchState}
              />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
