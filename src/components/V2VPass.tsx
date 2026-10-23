// src/components/V2VPass.tsx
"use client";

import React, { useState, useEffect } from "react";
import DynamicQrCode from "./DynamicQrCode";
import { LeaseStatus } from "@/types/enums";

export interface V2VPassProps {
  leaseId: number;
  donorId: number;
  requestId: number;
  donorName?: string;
  patientUhid: string;
  hospitalName: string;
  bloodGroup: string;
  component: string;
  handshakePin?: string | null;
  status: string; // JIT_PASSED, EN_ROUTE, ARRIVED
  leaseExpiresAt: string; // ISO string
  hospitalLat?: number;
  hospitalLng?: number;
  onArrive?: () => Promise<void>;
  onUpdateEta?: (minutes: number) => Promise<void>;
  className?: string;
}

export default function V2VPass({
  leaseId,
  donorId,
  requestId,
  donorName = "Volunteer Donor",
  patientUhid,
  hospitalName,
  bloodGroup,
  component,
  handshakePin,
  status,
  leaseExpiresAt,
  hospitalLat,
  hospitalLng,
  onArrive,
  onUpdateEta,
  className = "",
}: V2VPassProps) {
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [selectedEta, setSelectedEta] = useState<number | null>(null);
  const [updatingEta, setUpdatingEta] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [showPin, setShowPin] = useState(false);

  const isArrived = status === LeaseStatus.ARRIVED;

  // Live second-by-second countdown timer for travel window
  useEffect(() => {
    if (isArrived) return;
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [isArrived]);

  // Compute remaining travel window (seconds)
  const remainingSeconds = Math.max(
    0,
    Math.floor((new Date(leaseExpiresAt).getTime() - currentTime) / 1000)
  );

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const formattedCountdown = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  // QR Code payload containing verification data
  const qrPayload = JSON.stringify({
    pass: "V2V-EMERGENCY-PASS",
    leaseId,
    donorId,
    requestId,
    uhid: patientUhid,
    grp: bloodGroup,
    cmp: component,
  });

  // Google Maps navigation deep link
  const mapsUrl =
    hospitalLat && hospitalLng
      ? `https://www.google.com/maps/dir/?api=1&destination=${hospitalLat},${hospitalLng}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hospitalName)}`;

  const handleEtaClick = async (mins: number) => {
    setSelectedEta(mins);
    if (onUpdateEta) {
      setUpdatingEta(true);
      try {
        await onUpdateEta(mins);
      } finally {
        setUpdatingEta(false);
      }
    }
  };

  const handleArriveClick = async () => {
    if (onArrive) {
      setCheckingIn(true);
      try {
        await onArrive();
      } finally {
        setCheckingIn(false);
      }
    }
  };

  return (
    <div className={`relative bg-slate-950 text-white rounded-3xl p-6 shadow-2xl border-2 border-emerald-500/80 overflow-hidden ${className}`}>
      {/* Background ambient glow */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Official Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🩸</span>
          <div>
            <h2 className="text-sm font-black tracking-widest uppercase text-emerald-400">
              V2V Emergency Donor Pass
            </h2>
            <p className="text-[10px] text-gray-400 font-mono tracking-wider">
              AUTHORIZATION: TRANSFUSION MEDICINE DISPATCH
            </p>
          </div>
        </div>

        <span
          className={`px-3 py-1 text-xs font-mono font-bold rounded-full border ${
            isArrived
              ? "bg-emerald-500 text-black border-emerald-400"
              : status === LeaseStatus.EN_ROUTE
              ? "bg-amber-400 text-black border-amber-300 animate-pulse"
              : "bg-sky-500 text-white border-sky-400"
          }`}
        >
          {isArrived ? "ARRIVED ON-SITE" : status}
        </span>
      </div>

      {/* Hospital & Patient Details Grid */}
      <div className="mt-5 space-y-3">
        <div className="bg-slate-900/90 p-4 rounded-2xl border border-gray-800">
          <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">
            Destination Blood Bank / Hospital
          </p>
          <p className="text-lg font-bold text-white mt-0.5">{hospitalName}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-gray-800">
            <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">
              Patient UHID
            </p>
            <p className="text-sm font-mono font-bold text-sky-400 mt-0.5">
              {patientUhid}
            </p>
          </div>

          <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-gray-800">
            <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">
              Required Component
            </p>
            <p className="text-sm font-bold text-red-400 mt-0.5">
              {bloodGroup} • {component}
            </p>
          </div>
        </div>
      </div>

      {/* QR Code Presentation Area */}
      <div className="mt-5 flex flex-col items-center justify-center p-5 bg-slate-900/60 rounded-2xl border border-gray-800">
        <p className="text-xs text-gray-400 mb-3 text-center">
          Present at Hospital Security Gate &amp; Blood Bank Reception
        </p>

        <DynamicQrCode
          value={qrPayload}
          size={160}
          darkColor="#0f172a"
          lightColor="#ffffff"
        />

        <p className="text-[11px] font-mono text-gray-400 mt-3 text-center">
          PASS ID: V2V-{requestId}-{donorId}-{leaseId}
        </p>
      </div>

      {/* Dead-Man's Switch Countdown */}
      <div className="mt-5 bg-slate-900/90 p-4 rounded-2xl border border-gray-800 text-center">
        {isArrived ? (
          <div className="text-emerald-400 font-bold text-sm flex items-center justify-center gap-2">
            <span>✅</span>
            <span>Check-In Verified: Arrival Countdown Halted</span>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between text-xs text-gray-400 mb-1.5">
              <span>Counter-Loop 3 Travel Window</span>
              <span className="font-mono text-gray-300">Max 25 Minutes</span>
            </div>

            <div
              className={`text-3xl font-black font-mono tracking-wider py-1 ${
                remainingSeconds < 300
                  ? "text-red-500 animate-pulse"
                  : remainingSeconds < 600
                  ? "text-amber-400 animate-pulse"
                  : "text-emerald-400"
              }`}
            >
              {formattedCountdown}
            </div>

            <p className="text-[11px] text-gray-400 mt-1">
              Please check in within this window to prevent automatic standby reassignment.
            </p>
          </div>
        )}
      </div>

      {/* Handshake Verification PIN */}
      {handshakePin && (
        <div className="mt-4 bg-slate-900/90 p-3.5 rounded-2xl border border-gray-800 flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">
              Counter Handshake PIN
            </p>
            <p className="text-xs text-gray-300 mt-0.5">
              Provide this 4-digit code to hospital blood bank counter
            </p>
          </div>

          <div className="text-right">
            {showPin ? (
              <span className="text-xl font-mono font-black text-amber-400 tracking-widest px-2 py-1 bg-amber-950/40 rounded border border-amber-800">
                {handshakePin}
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setShowPin(true)}
                className="text-xs font-mono font-bold text-sky-400 hover:text-sky-300 underline"
              >
                Reveal PIN
              </button>
            )}
          </div>
        </div>
      )}

      {/* Navigation Deep Link & ETA Sharing */}
      {!isArrived && (
        <div className="mt-5 space-y-3">
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl shadow-lg transition-transform active:scale-[0.98]"
          >
            <span>🗺️</span>
            <span>Open Google Maps Turn-by-Turn</span>
          </a>

          <div className="bg-slate-900/90 p-3 rounded-2xl border border-gray-800">
            <p className="text-[11px] text-gray-400 mb-2 text-center font-medium">
              Share Estimated Arrival Time (ETA):
            </p>
            <div className="grid grid-cols-4 gap-2">
              {[10, 15, 20, 25].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  disabled={updatingEta}
                  onClick={() => handleEtaClick(mins)}
                  className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                    selectedEta === mins
                      ? "bg-amber-400 text-black border-amber-300 shadow-md scale-105"
                      : "bg-gray-800/80 text-gray-300 border-gray-700 hover:bg-gray-700"
                  }`}
                >
                  {mins} min
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Arrival Check-In Action Button */}
      {!isArrived && (
        <div className="mt-5">
          <button
            type="button"
            disabled={checkingIn}
            onClick={handleArriveClick}
            className="w-full py-4 px-6 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-base rounded-2xl shadow-xl transition-transform active:scale-[0.98] flex items-center justify-center gap-2"
          >
            {checkingIn ? (
              <span className="inline-block h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>🏥</span>
                <span>I Have Arrived at Blood Bank</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
