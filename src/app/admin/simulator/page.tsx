// src/app/admin/simulator/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import SidecarPill from "@/components/SidecarPill";
import { isEligible } from "@/lib/engines/eligibility";
import { BloodGroup, Component, Gender } from "@/types/enums";

interface SimulatorRequest {
  id: number;
  patientName: string;
  patientUhid: string;
  hospitalName: string;
  component: string;
  bloodGroup: string;
  requestMode: string;
  unitsNeeded: number;
  waveState: string;
  shortHash: string;
  expiresAt: string;
  leases: Array<{
    id: number;
    donorId: number;
    status: string;
    leaseExpiresAt: string;
    handshakePin?: string | null;
    donor: {
      id: number;
      name: string;
      phoneNumber: string;
      bloodGroup: string;
    };
  }>;
}

export default function ChaosSimulatorDashboard() {
  const [requests, setRequests] = useState<SimulatorRequest[]>([]);
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"WAVE" | "GHOST" | "NBTC">("WAVE");

  // Terminal Logs
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    "[SIMULATOR_BOOT] V2V Chaos Engine initialized.",
    "[SIMULATOR_BOOT] Telemetry connected to SQLite engine.",
  ]);

  // Wave Dispatch Simulator state
  const [triggeringWave, setTriggeringWave] = useState(false);

  // Ghosting Simulator state
  const [selectedLeaseId, setSelectedLeaseId] = useState<number | null>(null);
  const [ghostingDonor, setGhostingDonor] = useState(false);

  // NBTC Eligibility Lab interactive state
  const [nbtcGender, setNbtcGender] = useState<Gender>(Gender.MALE);
  const [nbtcComponent, setNbtcComponent] = useState<Component>(Component.WHOLE_BLOOD);
  const [nbtcWeightKg, setNbtcWeightKg] = useState<number>(70);
  const [nbtcDaysSinceWB, setNbtcDaysSinceWB] = useState<number>(100);
  const [nbtcHoursSincePlatelet, setNbtcHoursSincePlatelet] = useState<number>(72);

  const appendLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setTerminalLogs((prev) => [`[${timestamp}] ${msg}`, ...prev.slice(0, 49)]);
  };

  // Fetch active emergency requests
  const loadRequests = useCallback(async () => {
    try {
      // Query sample requests from database via seed shortHash or create API
      const res = await axios.get("/api/request/kJ8_2mNp9xLq");
      if (res.data?.request) {
        setRequests([
          {
            ...res.data.request,
            leases: [
              ...(res.data.activeLeases || []).map((l: any) => ({
                id: l.id,
                donorId: l.donorId,
                status: l.status,
                leaseExpiresAt: l.leaseExpiresAt,
                handshakePin: l.handshakePin,
                donor: {
                  id: l.donor.id,
                  name: l.donor.name,
                  phoneNumber: l.donor.maskedPhone,
                  bloodGroup: l.donor.bloodGroup,
                },
              })),
              ...(res.data.standbyLeases || []).map((l: any) => ({
                id: l.id,
                donorId: l.donorId,
                status: l.status,
                leaseExpiresAt: l.leaseExpiresAt,
                donor: {
                  id: l.donor.id,
                  name: l.donor.name,
                  phoneNumber: l.donor.maskedPhone,
                  bloodGroup: l.donor.bloodGroup,
                },
              })),
            ],
          },
        ]);
        setSelectedRequestId(res.data.request.id);
      }
    } catch {
      // Fallback sandbox request
      setRequests([
        {
          id: 1,
          patientName: "Simranjeet Singh",
          patientUhid: "AIIMS-2026-9921",
          hospitalName: "AIIMS Delhi, Trauma Centre",
          component: "SDP",
          bloodGroup: "B_POS",
          requestMode: "EXACT_OR_SDP",
          unitsNeeded: 2,
          waveState: "WAVE_1_DISPATCH",
          shortHash: "kJ8_2mNp9xLq",
          expiresAt: new Date(Date.now() + 10 * 3600 * 1000).toISOString(),
          leases: [
            {
              id: 101,
              donorId: 4,
              status: "JIT_PASSED",
              leaseExpiresAt: new Date(Date.now() + 20 * 60 * 1000).toISOString(),
              handshakePin: "4829",
              donor: {
                id: 4,
                name: "Vikram S.",
                phoneNumber: "+91 98••••0004",
                bloodGroup: "B_POS",
              },
            },
            {
              id: 102,
              donorId: 8,
              status: "STANDBY",
              leaseExpiresAt: new Date(Date.now() + 25 * 60 * 1000).toISOString(),
              donor: {
                id: 8,
                name: "Pooja M.",
                phoneNumber: "+91 98••••0008",
                bloodGroup: "B_POS",
              },
            },
          ],
        },
      ]);
      setSelectedRequestId(1);
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const activeRequest = requests.find((r) => r.id === selectedRequestId);

  // Trigger Wave Simulator Handler
  const handleTriggerWave = async () => {
    if (!selectedRequestId) return;
    setTriggeringWave(true);
    appendLog(`Sending wave dispatch trigger for Request #${selectedRequestId}...`);

    try {
      const res = await axios.post("/api/simulator/trigger-wave", {
        requestId: selectedRequestId,
      });

      appendLog(`Wave advanced: ${res.data.previousWaveState} -> ${res.data.newWaveState}`);
      appendLog(`Expansion Radius: ${res.data.waveRadius}`);
      appendLog(`Pings dispatched: ${res.data.pingedDonorsCount} donors.`);

      // Update local state
      setRequests((prev) =>
        prev.map((r) =>
          r.id === selectedRequestId ? { ...r, waveState: res.data.newWaveState } : r
        )
      );
    } catch (err: any) {
      appendLog(`[ERROR] Trigger wave failed: ${err.response?.data?.error || err.message}`);
    } finally {
      setTriggeringWave(false);
    }
  };

  // Donor Ghosting Simulator Handler
  const handleGhostDonor = async () => {
    if (!selectedLeaseId) return;
    setGhostingDonor(true);
    appendLog(`Ghosting Lease #${selectedLeaseId} (Rewinding expiry to now - 1s)...`);

    try {
      const res = await axios.post("/api/simulator/ghost-donor", {
        leaseId: selectedLeaseId,
      });

      appendLog(`Lease #${selectedLeaseId} evicted: ${res.data.newStatus}`);
      appendLog(`Evicted Count: ${res.data.evictionSummary.evictedCount}`);
      appendLog(`Promoted Count: ${res.data.evictionSummary.promotedCount}`);

      if (res.data.promotedDonors?.length > 0) {
        res.data.promotedDonors.forEach((d: any) => {
          appendLog(`🎉 Standby Lease #${d.leaseId} (Donor: ${d.donorName}) PROMOTED to JIT_PASSED!`);
        });
      }

      loadRequests();
    } catch (err: any) {
      appendLog(`[ERROR] Ghost donor failed: ${err.response?.data?.error || err.message}`);
    } finally {
      setGhostingDonor(false);
    }
  };

  // Run Cron Watchdog manually
  const handleRunWatchdog = async () => {
    appendLog("Executing lease watchdog cron handler (/api/cron/lease-watchdog)...");
    try {
      const res = await axios.get("/api/cron/lease-watchdog");
      appendLog(`Watchdog executed in ${res.data.executionTimeMs}ms: Evicted ${res.data.summary?.evictedCount ?? 0}, Promoted ${res.data.summary?.promotedCount ?? 0}`);
      loadRequests();
    } catch (err: any) {
      appendLog(`[ERROR] Watchdog execution failed: ${err.message}`);
    }
  };

  // NBTC Eligibility calculation
  const computedEligible = isEligible(
    {
      gender: nbtcGender,
      bloodGroup: BloodGroup.O_POS,
      weightKg: nbtcWeightKg,
      lastWholeBlood:
        nbtcDaysSinceWB >= 0
          ? new Date(Date.now() - nbtcDaysSinceWB * 24 * 3600 * 1000)
          : null,
      lastPlatelet:
        nbtcHoursSincePlatelet >= 0
          ? new Date(Date.now() - nbtcHoursSincePlatelet * 3600 * 1000)
          : null,
    },
    nbtcComponent
  );

  return (
    <main className="min-h-screen bg-slate-950 text-white pb-12">
      {/* Header Bar */}
      <header className="sticky top-0 z-30 bg-slate-900 border-b border-gray-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚡</span>
            <div>
              <h1 className="text-base font-black tracking-wider uppercase text-emerald-400">
                V2V Chaos Control &amp; Counter-Loop Simulator
              </h1>
              <p className="text-[11px] text-gray-400 font-mono">
                ADMIN ENGINE SANDBOX — DELHI / NCR TESTBED
              </p>
            </div>
          </div>
          <SidecarPill compact />
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 mt-6 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-800 space-x-4">
          <button
            type="button"
            onClick={() => setActiveTab("WAVE")}
            className={`pb-3 text-sm font-bold border-b-2 transition-all ${
              activeTab === "WAVE"
                ? "border-emerald-400 text-emerald-400"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            1. Wave Dispatch (CL1)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("GHOST")}
            className={`pb-3 text-sm font-bold border-b-2 transition-all ${
              activeTab === "GHOST"
                ? "border-emerald-400 text-emerald-400"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            2. Donor Ghosting &amp; Eviction (CL3)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("NBTC")}
            className={`pb-3 text-sm font-bold border-b-2 transition-all ${
              activeTab === "NBTC"
                ? "border-emerald-400 text-emerald-400"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            3. NBTC Eligibility Lab
          </button>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* TAB 1: WAVE ADVANCEMENT SIMULATOR                             */}
        {/* ------------------------------------------------------------- */}
        {activeTab === "WAVE" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              <div className="bg-slate-900 p-6 rounded-3xl border border-gray-800 shadow-xl">
                <h3 className="text-base font-bold text-white mb-2">
                  Counter-Loop 1: Geospatial Expanding Ring Simulator
                </h3>
                <p className="text-xs text-gray-400 mb-4 leading-relaxed">
                  Trigger sequential wave advancement across 3 concentric radii: Wave 1 (0–3km), Wave 2 (3–7km), and Wave 3 (7–15km). Evaluates donor cooldowns and batch limits (5 × remaining slots).
                </p>

                {activeRequest && (
                  <div className="bg-slate-950 p-4 rounded-2xl border border-gray-800 space-y-2 text-xs mb-4">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Target Request:</span>
                      <span className="font-bold text-white">#{activeRequest.id} ({activeRequest.hospitalName})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Required:</span>
                      <span className="font-bold text-red-400">{activeRequest.bloodGroup} • {activeRequest.component} ({activeRequest.unitsNeeded} units)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Current WaveState:</span>
                      <span className="font-mono font-bold text-amber-400">{activeRequest.waveState}</span>
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  disabled={triggeringWave}
                  onClick={handleTriggerWave}
                  className="w-full py-3.5 px-6 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl shadow-lg transition-transform active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  {triggeringWave ? (
                    <span className="inline-block h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>⚡</span>
                      <span>Trigger Next Wave Dispatch</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="bg-slate-900 p-6 rounded-3xl border border-gray-800 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                System Cron Utilities
              </h4>
              <button
                type="button"
                onClick={handleRunWatchdog}
                className="w-full py-2.5 px-4 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-bold rounded-xl border border-gray-700"
              >
                🔄 Run Lease-Watchdog Cron
              </button>
              <button
                type="button"
                onClick={loadRequests}
                className="w-full py-2.5 px-4 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-bold rounded-xl border border-gray-700"
              >
                📥 Refresh Database State
              </button>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 2: DONOR GHOSTING SIMULATOR                               */}
        {/* ------------------------------------------------------------- */}
        {activeTab === "GHOST" && (
          <div className="bg-slate-900 p-6 rounded-3xl border border-gray-800 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white">
              Counter-Loop 3: Dead-Man&apos;s Switch Ghosting Accelerator
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Test dead-man&apos;s switch eviction without waiting 25 minutes. Selecting a donor will fast-forward their lease expiry (`leaseExpiresAt = now - 1s`), trigger `evictExpiredLeases()`, and automatically promote the queued `STANDBY` donor.
            </p>

            <div className="space-y-3">
              <label className="block text-xs font-semibold text-gray-300">
                Select Active En-Route Donor to Ghost:
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {activeRequest?.leases
                  .filter((l) => l.status === "JIT_PASSED" || l.status === "EN_ROUTE")
                  .map((lease) => (
                    <div
                      key={lease.id}
                      onClick={() => setSelectedLeaseId(lease.id)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                        selectedLeaseId === lease.id
                          ? "bg-red-950/60 border-red-500 shadow-lg"
                          : "bg-slate-950 border-gray-800 hover:border-gray-700"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-white text-sm">
                          {lease.donor.name} (Lease #{lease.id})
                        </span>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-sky-950 text-sky-400 border border-sky-800">
                          {lease.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        Phone: {lease.donor.phoneNumber} • Group: {lease.donor.bloodGroup}
                      </p>
                      <p className="text-[10px] text-gray-500 font-mono mt-1">
                        Expires: {new Date(lease.leaseExpiresAt).toLocaleTimeString()}
                      </p>
                    </div>
                  ))}
              </div>

              <button
                type="button"
                disabled={!selectedLeaseId || ghostingDonor}
                onClick={handleGhostDonor}
                className={`w-full py-3.5 px-6 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                  selectedLeaseId && !ghostingDonor
                    ? "bg-red-600 hover:bg-red-500 text-white shadow-xl"
                    : "bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700"
                }`}
              >
                {ghostingDonor ? (
                  <span className="inline-block h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>👻</span>
                    <span>Simulate Ghosting (Fast-Forward Expiry &amp; Promote Standby)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 3: NBTC ELIGIBILITY LAB                                   */}
        {/* ------------------------------------------------------------- */}
        {activeTab === "NBTC" && (
          <div className="bg-slate-900 p-6 rounded-3xl border border-gray-800 shadow-xl space-y-6">
            <div>
              <h3 className="text-base font-bold text-white">
                NBTC Eligibility Rule Playground
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Interactively evaluate boundary conditions across gender, component cooldowns, and weight limits against `isEligible()`.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Form Controls */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Gender:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[Gender.MALE, Gender.FEMALE].map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setNbtcGender(g)}
                        className={`py-2 text-xs font-bold rounded-xl border ${
                          nbtcGender === g
                            ? "bg-emerald-600 text-white border-emerald-500"
                            : "bg-slate-950 text-gray-400 border-gray-800"
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-1">
                    Target Component:
                  </label>
                  <select
                    value={nbtcComponent}
                    onChange={(e) => setNbtcComponent(e.target.value as Component)}
                    className="w-full bg-slate-950 border border-gray-800 rounded-xl px-3 py-2 text-xs font-bold text-white"
                  >
                    <option value={Component.WHOLE_BLOOD}>WHOLE_BLOOD</option>
                    <option value={Component.PRBC}>PRBC</option>
                    <option value={Component.PLASMA}>PLASMA</option>
                    <option value={Component.SDP}>SDP (Single Donor Platelets)</option>
                  </select>
                </div>

                <div>
                  <div className="flex justify-between text-xs text-gray-300 mb-1">
                    <span>Body Weight (kg):</span>
                    <span className="font-bold text-emerald-400">{nbtcWeightKg} kg</span>
                  </div>
                  <input
                    type="range"
                    min={40}
                    max={100}
                    value={nbtcWeightKg}
                    onChange={(e) => setNbtcWeightKg(Number(e.target.value))}
                    className="w-full accent-emerald-500"
                  />
                  <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                    <span>40 kg</span>
                    <span>45 kg (WB)</span>
                    <span>50 kg (SDP)</span>
                    <span>100 kg</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs text-gray-300 mb-1">
                    <span>Days Since Last Whole Blood:</span>
                    <span className="font-bold text-emerald-400">{nbtcDaysSinceWB} days</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={150}
                    value={nbtcDaysSinceWB}
                    onChange={(e) => setNbtcDaysSinceWB(Number(e.target.value))}
                    className="w-full accent-emerald-500"
                  />
                  <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                    <span>0d</span>
                    <span>28d (SDP)</span>
                    <span>90d (M)</span>
                    <span>120d (F)</span>
                  </div>
                </div>

                {nbtcComponent === Component.SDP && (
                  <div>
                    <div className="flex justify-between text-xs text-gray-300 mb-1">
                      <span>Hours Since Last Platelet Donation:</span>
                      <span className="font-bold text-emerald-400">{nbtcHoursSincePlatelet} hrs</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={96}
                      value={nbtcHoursSincePlatelet}
                      onChange={(e) => setNbtcHoursSincePlatelet(Number(e.target.value))}
                      className="w-full accent-emerald-500"
                    />
                    <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                      <span>0 hrs</span>
                      <span>48 hrs (Threshold)</span>
                      <span>96 hrs</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Live Calculation Output Card */}
              <div className="flex flex-col justify-between bg-slate-950 p-6 rounded-2xl border border-gray-800">
                <div>
                  <h4 className="text-xs uppercase tracking-wider text-gray-400 font-semibold mb-3">
                    Evaluation Result
                  </h4>
                  <div
                    className={`py-4 px-6 rounded-2xl text-center font-black text-xl mb-4 border ${
                      computedEligible
                        ? "bg-emerald-950/80 text-emerald-300 border-emerald-500/80"
                        : "bg-red-950/80 text-red-300 border-red-500/80"
                    }`}
                  >
                    {computedEligible ? "✅ ELIGIBLE TO DONATE" : "❌ DISQUALIFIED (DEFERRED)"}
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between border-b border-gray-800 pb-1">
                      <span className="text-gray-400">Weight Threshold:</span>
                      <span className={nbtcComponent === "SDP" ? (nbtcWeightKg >= 50 ? "text-emerald-400 font-bold" : "text-red-400 font-bold") : (nbtcWeightKg >= 45 ? "text-emerald-400 font-bold" : "text-red-400 font-bold")}>
                        {nbtcComponent === "SDP" ? "Requires ≥ 50 kg" : "Requires ≥ 45 kg"} ({nbtcWeightKg} kg)
                      </span>
                    </div>

                    <div className="flex justify-between border-b border-gray-800 pb-1">
                      <span className="text-gray-400">Whole Blood Cooldown:</span>
                      <span className={nbtcGender === "MALE" ? (nbtcDaysSinceWB >= 90 ? "text-emerald-400 font-bold" : "text-red-400 font-bold") : (nbtcDaysSinceWB >= 120 ? "text-emerald-400 font-bold" : "text-red-400 font-bold")}>
                        {nbtcGender === "MALE" ? "Male: ≥ 90 days" : "Female: ≥ 120 days"} ({nbtcDaysSinceWB}d)
                      </span>
                    </div>

                    {nbtcComponent === "SDP" && (
                      <div className="flex justify-between border-b border-gray-800 pb-1">
                        <span className="text-gray-400">Platelet Cooldown:</span>
                        <span className={nbtcHoursSincePlatelet >= 48 ? "text-emerald-400 font-bold" : "text-red-400 font-bold"}>
                          Requires ≥ 48 hrs ({nbtcHoursSincePlatelet} hrs)
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Preset Edge Case Testers */}
                <div className="pt-4 mt-4 border-t border-gray-800">
                  <p className="text-[10px] text-gray-500 font-semibold mb-2">QUICK EDGE CASE TESTS:</p>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setNbtcGender(Gender.MALE);
                        setNbtcComponent(Component.WHOLE_BLOOD);
                        setNbtcWeightKg(60);
                        setNbtcDaysSinceWB(89);
                      }}
                      className="px-2 py-1 bg-gray-800 text-[10px] rounded hover:bg-gray-700"
                    >
                      Male 89d (Fail)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setNbtcGender(Gender.MALE);
                        setNbtcComponent(Component.WHOLE_BLOOD);
                        setNbtcWeightKg(60);
                        setNbtcDaysSinceWB(90);
                      }}
                      className="px-2 py-1 bg-gray-800 text-[10px] rounded hover:bg-gray-700"
                    >
                      Male 90d (Pass)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setNbtcGender(Gender.FEMALE);
                        setNbtcComponent(Component.WHOLE_BLOOD);
                        setNbtcWeightKg(55);
                        setNbtcDaysSinceWB(119);
                      }}
                      className="px-2 py-1 bg-gray-800 text-[10px] rounded hover:bg-gray-700"
                    >
                      Female 119d (Fail)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setNbtcComponent(Component.SDP);
                        setNbtcWeightKg(49);
                        setNbtcHoursSincePlatelet(72);
                      }}
                      className="px-2 py-1 bg-gray-800 text-[10px] rounded hover:bg-gray-700"
                    >
                      SDP 49kg (Fail)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* REAL-TIME TERMINAL LOG VIEWER                                 */}
        {/* ------------------------------------------------------------- */}
        <div className="bg-slate-900 rounded-3xl border border-gray-800 p-4 shadow-xl font-mono text-xs">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-800">
            <span className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">
              Simulator Telemetry Console
            </span>
            <button
              type="button"
              onClick={() => setTerminalLogs([])}
              className="text-[10px] text-gray-500 hover:text-gray-300"
            >
              Clear Logs
            </button>
          </div>
          <div className="max-h-48 overflow-y-auto space-y-1 text-gray-300 text-[11px]">
            {terminalLogs.map((log, idx) => (
              <div key={idx} className="leading-snug">
                {log}
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
