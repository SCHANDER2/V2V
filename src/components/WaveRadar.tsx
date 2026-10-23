// src/components/WaveRadar.tsx
"use client";

import React from "react";
import { WaveState } from "@/types/enums";

export interface WaveRadarProps {
  waveState: string;
  pingCount?: number;
  activeDonorsCount?: number;
  unitsNeeded?: number;
  hospitalName?: string;
  className?: string;
}

export default function WaveRadar({
  waveState,
  pingCount = 0,
  activeDonorsCount = 0,
  unitsNeeded = 1,
  hospitalName = "Hospital",
  className = "",
}: WaveRadarProps) {
  // Determine active rings based on wave state
  const isWave1 =
    waveState === WaveState.WAVE_1_DISPATCH ||
    waveState === WaveState.WAVE_2_DISPATCH ||
    waveState === WaveState.WAVE_3_DISPATCH ||
    waveState === WaveState.LEASE_LOCKED;

  const isWave2 =
    waveState === WaveState.WAVE_2_DISPATCH ||
    waveState === WaveState.WAVE_3_DISPATCH ||
    waveState === WaveState.LEASE_LOCKED;

  const isWave3 =
    waveState === WaveState.WAVE_3_DISPATCH ||
    waveState === WaveState.LEASE_LOCKED;

  const isLocked = waveState === WaveState.LEASE_LOCKED;
  const isFulfilled = waveState === WaveState.FULFILLED_CLOSED;
  const isExpired = waveState === WaveState.EXPIRED;
  const isScanning =
    waveState === WaveState.PENDING_VERIFICATION ||
    waveState === WaveState.STOCK_CHECK;

  // Active wave radius label
  const getRadiusLabel = () => {
    switch (waveState) {
      case WaveState.WAVE_1_DISPATCH:
        return "Wave 1 Active: 0 – 3 km (Vicinity)";
      case WaveState.WAVE_2_DISPATCH:
        return "Wave 2 Active: 3 – 7 km (City Cluster)";
      case WaveState.WAVE_3_DISPATCH:
        return "Wave 3 Active: 7 – 15 km (Metro NCR Ring)";
      case WaveState.LEASE_LOCKED:
        return "Dispatch Locked: Full Donor Travel Quota Filled";
      case WaveState.FULFILLED_CLOSED:
        return "Transfusion Completed: Waves Deactivated";
      case WaveState.EXPIRED:
        return "Request Expired: Waves Inactive";
      case WaveState.STOCK_CHECK:
        return "Querying Central e-RaktKosh Banks";
      case WaveState.PENDING_VERIFICATION:
        return "Requisition Verification In Progress";
      default:
        return `State: ${waveState}`;
    }
  };

  return (
    <div className={`relative flex flex-col items-center bg-gray-900 rounded-2xl p-6 text-white shadow-xl border border-gray-800 ${className}`}>
      {/* Header status bar */}
      <div className="w-full flex items-center justify-between mb-4 pb-3 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <span
            className={`h-3 w-3 rounded-full ${
              isFulfilled
                ? "bg-emerald-500 animate-pulse"
                : isExpired
                ? "bg-red-500"
                : isLocked
                ? "bg-green-400"
                : isScanning
                ? "bg-amber-400 animate-ping"
                : "bg-red-500 animate-ping"
            }`}
          />
          <h3 className="text-sm font-semibold tracking-wide uppercase text-gray-300">
            Geospatial Dispatch Radar
          </h3>
        </div>
        <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-gray-800 text-gray-300 border border-gray-700">
          {waveState}
        </span>
      </div>

      {/* SVG Radar Visualizer */}
      <div className="relative w-72 h-72 sm:w-80 sm:h-80 flex items-center justify-center my-2">
        <svg
          viewBox="0 0 300 300"
          className="w-full h-full transform -rotate-90 select-none overflow-visible"
        >
          <defs>
            {/* Radar scanner sweep gradient */}
            <linearGradient id="scannerSweep" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#ef4444" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
            </linearGradient>

            {/* Glowing filter */}
            <filter id="radarGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background grid lines */}
          <line x1="150" y1="10" x2="150" y2="290" stroke="#374151" strokeWidth="1" strokeDasharray="3 3" />
          <line x1="10" y1="150" x2="290" y2="150" stroke="#374151" strokeWidth="1" strokeDasharray="3 3" />

          {/* Wave 3 Ring (7 - 15 km) */}
          <circle
            cx="150"
            cy="150"
            r="135"
            fill="none"
            stroke={isWave3 ? (isLocked || isFulfilled ? "#10b981" : "#ef4444") : "#374151"}
            strokeWidth={isWave3 ? "2" : "1"}
            strokeDasharray={isWave3 ? "none" : "4 4"}
            className={isWave3 && !isLocked && !isFulfilled && !isExpired ? "opacity-90" : "opacity-40"}
          />

          {/* Wave 2 Ring (3 - 7 km) */}
          <circle
            cx="150"
            cy="150"
            r="95"
            fill="none"
            stroke={isWave2 ? (isLocked || isFulfilled ? "#10b981" : "#f97316") : "#374151"}
            strokeWidth={isWave2 ? "2" : "1"}
            strokeDasharray={isWave2 ? "none" : "4 4"}
            className={isWave2 && !isLocked && !isFulfilled && !isExpired ? "opacity-90" : "opacity-40"}
          />

          {/* Wave 1 Ring (0 - 3 km) */}
          <circle
            cx="150"
            cy="150"
            r="55"
            fill="none"
            stroke={isWave1 ? (isLocked || isFulfilled ? "#10b981" : "#ef4444") : "#374151"}
            strokeWidth={isWave1 ? "2.5" : "1"}
            className={isWave1 && !isLocked && !isFulfilled && !isExpired ? "animate-pulse" : "opacity-50"}
          />

          {/* Active sweeping beam (only during active wave dispatch) */}
          {!isLocked && !isFulfilled && !isExpired && !isScanning && (
            <g className="origin-center animate-[spin_4s_linear_infinite]" style={{ transformOrigin: "150px 150px" }}>
              <path
                d="M 150 150 L 285 150 A 135 135 0 0 0 245 55 Z"
                fill="url(#scannerSweep)"
              />
              <line x1="150" y1="150" x2="285" y2="150" stroke="#ef4444" strokeWidth="2" filter="url(#radarGlow)" />
            </g>
          )}

          {/* Sample Donors Blips based on wave states */}
          {isWave1 && (
            <circle cx="175" cy="130" r="4" fill="#38bdf8" className="animate-ping" />
          )}
          {isWave1 && (
            <circle cx="175" cy="130" r="3" fill="#38bdf8" />
          )}
          {isWave2 && (
            <circle cx="215" cy="185" r="3.5" fill="#38bdf8" />
          )}
          {isWave3 && (
            <circle cx="95" cy="235" r="3.5" fill="#38bdf8" />
          )}

          {/* Hospital Center Marker */}
          <circle cx="150" cy="150" r="10" fill="#dc2626" />
          <circle cx="150" cy="150" r="18" fill="none" stroke="#dc2626" strokeWidth="1.5" className="animate-ping opacity-75" />
          {/* Hospital Cross (+) */}
          <line x1="150" y1="145" x2="150" y2="155" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
          <line x1="145" y1="150" x2="155" y2="150" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
        </svg>

        {/* Distance Labels */}
        <div className="absolute bottom-2 left-2 text-[10px] font-mono text-gray-400 bg-gray-800/80 px-2 py-0.5 rounded border border-gray-700">
          W1: 3km | W2: 7km | W3: 15km
        </div>

        {/* Central Lock / Complete Badge Overlay */}
        {isLocked && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-950/60 rounded-full backdrop-blur-[2px]">
            <span className="text-2xl">🔒</span>
            <span className="text-xs font-bold text-green-400 mt-1">SLOTS LOCKED</span>
          </div>
        )}
        {isFulfilled && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-emerald-950/70 rounded-full backdrop-blur-[2px]">
            <span className="text-3xl">✅</span>
            <span className="text-xs font-bold text-emerald-300 mt-1">FULFILLED</span>
          </div>
        )}
      </div>

      {/* Radius Subtitle */}
      <div className="mt-3 text-center">
        <p className="text-sm font-medium text-gray-200">{getRadiusLabel()}</p>
        <p className="text-xs text-gray-400 mt-0.5">Epicenter: {hospitalName}</p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-3 gap-2 w-full mt-4 pt-4 border-t border-gray-800 text-center">
        <div className="bg-gray-800/60 p-2 rounded-lg">
          <div className="text-[10px] uppercase tracking-wider text-gray-400">Needed</div>
          <div className="text-lg font-bold text-red-400">{unitsNeeded} Units</div>
        </div>
        <div className="bg-gray-800/60 p-2 rounded-lg">
          <div className="text-[10px] uppercase tracking-wider text-gray-400">Active Slots</div>
          <div className="text-lg font-bold text-amber-400">{activeDonorsCount} / {unitsNeeded + 1}</div>
        </div>
        <div className="bg-gray-800/60 p-2 rounded-lg">
          <div className="text-[10px] uppercase tracking-wider text-gray-400">Pinged</div>
          <div className="text-lg font-bold text-sky-400">{pingCount}</div>
        </div>
      </div>
    </div>
  );
}
