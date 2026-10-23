import React from "react";
import Link from "next/link";
import { 
  HeartHandshake, 
  ShieldAlert, 
  Radio, 
  Users, 
  ArrowRight, 
  PhoneCall, 
  CheckCircle,
  Activity,
  Layers,
  Sparkles
} from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-rose-500 selection:text-white">
      {/* Top Banner */}
      <div className="bg-rose-600 text-white text-xs sm:text-sm font-semibold py-2 px-4 text-center tracking-wide flex items-center justify-center gap-2 shadow-lg">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-200 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
        </span>
        V2V EMERGENCY DISPATCH NETWORK — NBTC &amp; DPDP ACT 2023 COMPLIANT
      </div>

      {/* Hero Section */}
      <div className="max-w-5xl mx-auto px-4 py-12 sm:py-16 flex-1 flex flex-col justify-center items-center text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-rose-950/80 border border-rose-800/60 text-rose-300 text-xs sm:text-sm font-medium mb-6">
          <Activity className="w-4 h-4 text-rose-400" />
          <span>Real-time Anti-Loop Emergency Response</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white mb-6 max-w-3xl leading-tight">
          Veins to Veins <span className="text-rose-500">(V2V)</span>
        </h1>
        
        <p className="text-base sm:text-lg text-slate-300 max-w-2xl mb-10 leading-relaxed font-normal">
          A zero-friction, phone-optimized emergency blood &amp; Single Donor Platelet (SDP) dispatch engine.
          Powered by expanding-ring geospatial waves, atomic $N+1$ token locks, and anti-tout verification.
        </p>

        {/* Primary CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md justify-center mb-14">
          <Link
            href="/request/new"
            className="flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-500 text-white font-bold px-6 py-4 rounded-xl shadow-lg shadow-rose-900/40 hover:scale-[1.02] transition-all text-base"
          >
            <ShieldAlert className="w-5 h-5" />
            <span>Create Emergency SOS</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/admin/simulator"
            className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold px-6 py-4 rounded-xl hover:scale-[1.02] transition-all text-base"
          >
            <Layers className="w-5 h-5 text-amber-400" />
            <span>Chaos Simulator</span>
          </Link>
        </div>

        {/* 4 Core Pillars Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full text-left">
          <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-xl hover:border-slate-700 transition">
            <Radio className="w-7 h-7 text-rose-400 mb-3" />
            <h3 className="font-bold text-white text-base mb-1">Expanding Waves</h3>
            <p className="text-xs text-slate-400 leading-normal">
              Concentric rings (0-3km, 3-7km, 7-15km) prevent community broadcast storms.
            </p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-xl hover:border-slate-700 transition">
            <Users className="w-7 h-7 text-blue-400 mb-3" />
            <h3 className="font-bold text-white text-base mb-1">Atomic N+1 Lock</h3>
            <p className="text-xs text-slate-400 leading-normal">
              Caps active donor travel slots at Units + 1. Excess volunteers enter hot standby.
            </p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-xl hover:border-slate-700 transition">
            <PhoneCall className="w-7 h-7 text-emerald-400 mb-3" />
            <h3 className="font-bold text-white text-base mb-1">Masked Telephony</h3>
            <p className="text-xs text-slate-400 leading-normal">
              Zero raw phone numbers exposed. Virtual proxy bridges with automated deactivation.
            </p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-xl hover:border-slate-700 transition">
            <CheckCircle className="w-7 h-7 text-amber-400 mb-3" />
            <h3 className="font-bold text-white text-base mb-1">NBTC Biological Engine</h3>
            <p className="text-xs text-slate-400 leading-normal">
              Gender donation cooldowns, SDP 48h rules, and rare Bombay ($hh$) isolation.
            </p>
          </div>
        </div>

        {/* Sidecar Link Banner */}
        <div className="mt-12 p-4 rounded-xl bg-slate-900 border border-slate-800 max-w-xl w-full flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-left">
            <Sparkles className="w-5 h-5 text-cyan-400 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-slate-200">Interactive 3D Biomolecular Structure</p>
              <p className="text-[11px] text-slate-400">Inspect hemoglobin &amp; molecular compatibility structures in real-time</p>
            </div>
          </div>
          <a
            href="sidecar://science/biomolecular_structure_viewer/ui.html"
            className="text-xs font-semibold text-cyan-400 bg-cyan-950/70 border border-cyan-800/60 hover:bg-cyan-900/80 px-3 py-1.5 rounded-lg whitespace-nowrap transition"
          >
            Open Viewer ↗
          </a>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        <p>V2V (Veins to Veins) Emergency Dispatch Network • Built with Next.js 14, Prisma &amp; Tailwind CSS</p>
      </footer>
    </main>
  );
}
