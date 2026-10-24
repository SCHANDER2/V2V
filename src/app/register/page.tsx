"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Heart,
  Droplet,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  PhoneCall,
  User,
  Calendar,
  MapPin,
  QrCode,
  Share2,
  Download,
  ArrowRight,
  ChevronRight,
  Info,
  Activity,
  Check,
  X
} from "lucide-react";
import SidecarPill from "@/components/SidecarPill";
import HealthChecklist from "@/components/HealthChecklist";
import DynamicQrCode from "@/components/DynamicQrCode";

const BLOOD_GROUPS = [
  { key: "O_POS", label: "O+", donateTo: "O+, A+, B+, AB+", receiveFrom: "O+, O-" },
  { key: "O_NEG", label: "O-", donateTo: "All Blood Groups (Universal Donor)", receiveFrom: "O- Only" },
  { key: "A_POS", label: "A+", donateTo: "A+, AB+", receiveFrom: "A+, A-, O+, O-" },
  { key: "A_NEG", label: "A-", donateTo: "A+, A-, AB+, AB-", receiveFrom: "A-, O-" },
  { key: "B_POS", label: "B+", donateTo: "B+, AB+", receiveFrom: "B+, B-, O+, O-" },
  { key: "B_NEG", label: "B-", donateTo: "B+, B-, AB+, AB-", receiveFrom: "B-, O-" },
  { key: "AB_POS", label: "AB+", donateTo: "AB+ Only", receiveFrom: "All Blood Groups (Universal Receiver)" },
  { key: "AB_NEG", label: "AB-", donateTo: "AB+, AB-", receiveFrom: "AB-, A-, B-, O-" },
  { key: "BOMBAY_OH", label: "Bombay (hh)", donateTo: "All ABO Groups", receiveFrom: "Bombay (hh) Only" }
];

export default function RegisterPage() {
  const [step, setStep] = useState<number>(1);

  // Form State
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("MALE");
  const [age, setAge] = useState<number>(25);
  const [weightKg, setWeightKg] = useState<number>(65);
  const [bloodGroup, setBloodGroup] = useState<string>("O_POS");
  const [district, setDistrict] = useState<string>("South Delhi");
  const [state, setState] = useState<string>("Delhi NCR");
  const [willingPlatelets, setWillingPlatelets] = useState<boolean>(true);
  const [healthPassed, setHealthPassed] = useState<boolean>(false);
  const [generatedDonorId, setGeneratedDonorId] = useState<string>("");
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const selectedBgMeta = BLOOD_GROUPS.find((b) => b.key === bloodGroup) || BLOOD_GROUPS[0];

  const handleCompleteRegistration = () => {
    const id = `V2V-IND-${Math.floor(100000 + Math.random() * 900000)}`;
    setGeneratedDonorId(id);

    // Save to local storage for persistence
    try {
      const existing = JSON.parse(localStorage.getItem("v2v_registered_donors") || "[]");
      const newDonor = {
        id,
        name,
        phone,
        gender,
        age,
        weightKg,
        bloodGroup,
        district,
        state,
        willingPlatelets,
        registeredAt: new Date().toISOString()
      };
      localStorage.setItem("v2v_registered_donors", JSON.stringify([...existing, newDonor]));
    } catch {
      // Local storage fallback
    }

    setStep(4);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-rose-500 selection:text-white">
      {/* 1. Indian Emergency Top Bar */}
      <header className="bg-gradient-to-r from-rose-800 via-red-800 to-rose-900 text-white text-xs sm:text-sm font-medium py-2 px-4 shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-200 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
            </span>
            <span className="font-semibold tracking-wide flex items-center gap-1.5">
              <span>🇮🇳</span>
              <span>National Voluntary Blood Donor Registry • NBTC Standards</span>
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <a
              href="tel:104"
              className="bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded-full font-bold inline-flex items-center gap-1.5 transition border border-white/30"
            >
              <PhoneCall className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              <span>National Blood Helpline: 104 (24x7)</span>
            </a>
          </div>
        </div>
      </header>

      {/* 2. Main Navigation Bar */}
      <nav className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-[37px] z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-600 to-red-700 flex items-center justify-center text-white shadow-md shadow-rose-600/25 group-hover:scale-105 transition-transform">
              <Droplet className="w-5 h-5 fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-2xl tracking-tight text-slate-900">
                  V<span className="text-rose-600">2</span>V
                </span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 uppercase tracking-wider border border-rose-200">
                  Donor Registry
                </span>
              </div>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-700">
            <Link href="/" className="hover:text-rose-600 transition">
              Home
            </Link>
            <Link href="/directory" className="hover:text-rose-600 transition">
              Blood Bank Directory
            </Link>
            <Link href="/register" className="text-rose-600 font-bold border-b-2 border-rose-600 pb-0.5">
              Register as Donor
            </Link>
            <Link href="/camps" className="hover:text-rose-600 transition">
              Donation Camps
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <SidecarPill compact />
            <Link
              href="/request/new"
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-2.5 rounded-xl shadow-md shadow-rose-600/25 flex items-center gap-2 text-xs sm:text-sm transition hover:scale-[1.02]"
            >
              <AlertCircle className="w-4 h-4 animate-bounce" />
              <span>Emergency SOS</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* 3. Hero Header & Step Tracker */}
      <section className="bg-gradient-to-b from-slate-900 via-rose-950 to-slate-900 text-white py-10 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-1 rounded-full text-xs font-semibold text-rose-200 border border-white/15 mb-3">
            <Heart className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
            <span>Join 52,000+ Verified Lifesavers Across Delhi NCR</span>
          </span>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-2">
            Voluntary Donor Registration
          </h1>
          <p className="text-rose-200 text-sm max-w-xl mx-auto mb-8">
            Complete the 2-minute clinical screening, get your instant V2V digital donor pass, and receive SOS pings only when an emergency patient nearby matches your blood.
          </p>

          {/* Stepper Wizard */}
          <div className="flex items-center justify-center gap-2 sm:gap-4 max-w-md mx-auto text-xs">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold ${step === 1 ? "bg-amber-400 text-slate-950 shadow-md" : step > 1 ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-white/10 text-white/50"}`}>
              <span>1</span>
              <span className="hidden sm:inline">Profile</span>
            </div>
            <div className="w-4 h-px bg-white/20"></div>
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold ${step === 2 ? "bg-amber-400 text-slate-950 shadow-md" : step > 2 ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-white/10 text-white/50"}`}>
              <span>2</span>
              <span className="hidden sm:inline">Blood Group</span>
            </div>
            <div className="w-4 h-px bg-white/20"></div>
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold ${step === 3 ? "bg-amber-400 text-slate-950 shadow-md" : step > 3 ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-white/10 text-white/50"}`}>
              <span>3</span>
              <span className="hidden sm:inline">Clinical NBTC</span>
            </div>
            <div className="w-4 h-px bg-white/20"></div>
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold ${step === 4 ? "bg-amber-400 text-slate-950 shadow-md" : "bg-white/10 text-white/50"}`}>
              <span>4</span>
              <span className="hidden sm:inline">V2V Pass</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Main Wizard Content */}
      <main className="max-w-2xl mx-auto px-4 py-8 w-full flex-1">
        {/* STEP 1: Personal Details */}
        {step === 1 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h2 className="font-extrabold text-lg text-slate-900">Personal &amp; Contact Information</h2>
                <p className="text-xs text-slate-500">Real phone numbers are never made public (Anti-Tout Protection)</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name (As per Govt ID)</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Rajesh Verma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">10-Digit Mobile Number (For WhatsApp SOS)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">+91</span>
                  <input
                    type="tel"
                    maxLength={10}
                    placeholder="9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                    className="w-full pl-12 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Age (18–65 Yrs)</label>
                  <input
                    type="number"
                    min="18"
                    max="65"
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Weight in Kg (&gt;50kg required)</label>
                  <input
                    type="number"
                    min="40"
                    max="150"
                    value={weightKg}
                    onChange={(e) => setWeightKg(Number(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">District / City</label>
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                  >
                    <option value="South Delhi">South Delhi</option>
                    <option value="Central Delhi">Central Delhi</option>
                    <option value="South East Delhi">South East Delhi</option>
                    <option value="North West Delhi">North West Delhi</option>
                    <option value="Faridabad">Faridabad</option>
                    <option value="Gurugram">Gurugram</option>
                    <option value="Noida">Noida</option>
                  </select>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="button"
                  disabled={!name.trim() || phone.length < 10 || age < 18 || weightKg < 45}
                  onClick={() => setStep(2)}
                  className="w-full bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 text-sm shadow-md transition"
                >
                  <span>Continue to Blood Compatibility</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Blood Group & Compatibility Visualizer */}
        {step === 2 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h2 className="font-extrabold text-lg text-slate-900">Select Your Blood Group</h2>
                <p className="text-xs text-slate-500">Live clinical compatibility mapping</p>
              </div>
            </div>

            {/* Blood Group Radio Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5 mb-6">
              {BLOOD_GROUPS.map((bg) => {
                const isSelected = bloodGroup === bg.key;
                return (
                  <button
                    key={bg.key}
                    type="button"
                    onClick={() => setBloodGroup(bg.key)}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      isSelected
                        ? "bg-rose-600 border-rose-600 text-white shadow-md scale-105"
                        : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800"
                    }`}
                  >
                    <Droplet className={`w-5 h-5 mx-auto mb-1 ${isSelected ? "fill-white text-white" : "text-rose-500"}`} />
                    <span className="font-black text-sm block">{bg.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Live Compatibility Card */}
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-2 font-bold text-rose-950 text-sm mb-3">
                <ShieldCheck className="w-4 h-4 text-rose-600" />
                <span>Your Compatibility Matrix ({selectedBgMeta.label}):</span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-start gap-2 bg-white/70 p-2.5 rounded-lg border border-rose-100">
                  <span className="font-bold text-emerald-700 shrink-0">Can Donate To:</span>
                  <span className="text-slate-800 font-semibold">{selectedBgMeta.donateTo}</span>
                </div>
                <div className="flex items-start gap-2 bg-white/70 p-2.5 rounded-lg border border-rose-100">
                  <span className="font-bold text-sky-700 shrink-0">Can Receive From:</span>
                  <span className="text-slate-800 font-semibold">{selectedBgMeta.receiveFrom}</span>
                </div>
              </div>
            </div>

            {/* Platelet / SDP Willingness Toggle */}
            <div className="border border-slate-200 rounded-xl p-4 mb-6 bg-slate-50 flex items-center justify-between gap-4">
              <div>
                <span className="font-bold text-xs text-slate-900 block">Single Donor Platelets (SDP / Apheresis)</span>
                <span className="text-[11px] text-slate-500 block">Willing to be on-call for critical dengue/cancer platelet emergencies?</span>
              </div>
              <input
                type="checkbox"
                checked={willingPlatelets}
                onChange={(e) => setWillingPlatelets(e.target.checked)}
                className="w-5 h-5 accent-rose-600 rounded-sm cursor-pointer"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-3 rounded-xl text-sm transition"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="w-2/3 bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 text-sm shadow-md transition"
              >
                <span>Proceed to NBTC Screener</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: NBTC Clinical Health Checklist */}
        {step === 3 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h2 className="font-extrabold text-lg text-slate-900">NBTC Health &amp; Safety Screener</h2>
                <p className="text-xs text-slate-500">Government clinical eligibility questionnaire</p>
              </div>
            </div>

            <div className="mb-6">
              <HealthChecklist
                component={willingPlatelets ? "SDP" : "WHOLE_BLOOD"}
                donorWeightKg={weightKg}
                donorGender={gender}
                onPass={() => setHealthPassed(true)}
                onDeferral={() => setHealthPassed(false)}
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-3 rounded-xl text-sm transition"
              >
                Back
              </button>
              <button
                type="button"
                disabled={!healthPassed}
                onClick={handleCompleteRegistration}
                className="w-2/3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 text-sm shadow-md transition"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Complete Registration &amp; Get Pass</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Digital V2V-PASS Confirmation */}
        {step === 4 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-md text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h2 className="text-2xl font-black text-slate-900 mb-1">
              Registration Successful!
            </h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto mb-6">
              You are now an active V2V Lifesaver. Below is your official digital donor pass and identification credential.
            </p>

            {/* The V2V Digital Badge */}
            <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-rose-950 text-white rounded-2xl p-6 shadow-xl max-w-sm mx-auto mb-6 border border-white/20 relative overflow-hidden text-left">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Droplet className="w-5 h-5 text-rose-500 fill-rose-500" />
                  <span className="font-black text-lg tracking-tight">V2V PASS</span>
                </div>
                <span className="text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  VERIFIED DONOR
                </span>
              </div>

              <div className="mb-4">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Donor Name</span>
                <span className="text-base font-bold text-white block">{name}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Blood Group</span>
                  <span className="text-xl font-black text-amber-300">{selectedBgMeta.label}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Donor ID</span>
                  <span className="text-xs font-mono font-bold text-slate-200">{generatedDonorId}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-white/10">
                <div>
                  <span className="text-[10px] text-slate-400 block">District</span>
                  <span className="text-xs font-semibold text-slate-300">{district}, {state}</span>
                </div>

                <div className="bg-white p-1 rounded-lg">
                  <DynamicQrCode
                    value={`https://v2v.health/donor/${generatedDonorId}`}
                    size={48}
                  />
                </div>
              </div>
            </div>

            {/* Next Actions */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(generatedDonorId);
                  setIsCopied(true);
                  setTimeout(() => setIsCopied(false), 2000);
                }}
                className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition flex items-center justify-center gap-1.5"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>{isCopied ? "Donor ID Copied!" : "Copy Donor ID"}</span>
              </button>

              <Link
                href="/directory"
                className="py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
              >
                <span>View Blood Directory</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}
      </main>

      {/* 5. Footer */}
      <footer className="bg-slate-900 text-slate-400 py-8 px-4 text-xs mt-12 border-t border-slate-800">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-white font-bold text-sm">V2V Emergency Blood Network</p>
            <p className="text-slate-500 mt-0.5">Aligned with e-RaktKosh and NBTC Clinical Blood Banking Standards</p>
          </div>
          <div className="flex gap-4">
            <Link href="/" className="hover:text-white transition">Home</Link>
            <Link href="/directory" className="hover:text-white transition">Directory</Link>
            <Link href="/register" className="hover:text-white transition">Register Donor</Link>
            <Link href="/camps" className="hover:text-white transition">Camps</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
