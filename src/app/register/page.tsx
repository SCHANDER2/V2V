"use client";

import React, { useState } from "react";
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
  Info
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
  { key: "AB_NEG", label: "AB-", donateTo: "AB+, AB-", receiveFrom: "AB-, A-, B-, O-" }
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
  const [willingPlatelets, setWillingPlatelets] = useState<boolean>(true);
  const [healthPassed, setHealthPassed] = useState<boolean>(false);
  const [generatedDonorId, setGeneratedDonorId] = useState<string>("");
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const selectedBgMeta = BLOOD_GROUPS.find((b) => b.key === bloodGroup) || BLOOD_GROUPS[0];

  const handleCompleteRegistration = () => {
    const id = `RK-${Math.floor(100000 + Math.random() * 900000)}`;
    setGeneratedDonorId(id);

    try {
      const existing = JSON.parse(localStorage.getItem("raktkhoj_registered_donors") || "[]");
      const newDonor = {
        id,
        name,
        phone,
        gender,
        age,
        weightKg,
        bloodGroup,
        district,
        willingPlatelets,
        registeredAt: new Date().toISOString()
      };
      localStorage.setItem("raktkhoj_registered_donors", JSON.stringify([...existing, newDonor]));
    } catch {
      // Local storage fallback
    }

    setStep(4);
  };

  return (
    <div className="min-h-screen bg-white text-[var(--text)] flex flex-col font-sans selection:bg-[var(--accent)] selection:text-white">
      {/* 1. Minimal Header (RaktKhoj Style) */}
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-white/90 backdrop-blur-md">
        <div className="max-w-[1200px] mx-auto flex h-[68px] items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[var(--accent)] text-white shadow-xs group-hover:scale-105 transition-transform">
              <Droplet className="h-5 w-5 fill-white" />
            </span>
            <div className="flex flex-col">
              <span className="font-extrabold text-xl tracking-tight text-[var(--text)]">
                RaktKhoj
              </span>
              <span className="text-[10px] text-[var(--text-dim)] font-medium -mt-1 hidden sm:block">
                Donor Registration
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-7 text-[13.5px] font-semibold text-[var(--text-dim)]">
            <Link href="/" className="hover:text-[var(--accent)] transition">
              Home
            </Link>
            <Link href="/directory" className="hover:text-[var(--accent)] transition">
              Blood Banks
            </Link>
            <Link href="/register" className="text-[var(--accent)] font-bold">
              Become a Donor
            </Link>
            <Link href="/camps" className="hover:text-[var(--accent)] transition">
              Donation Camps
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <SidecarPill compact />
            <Link
              href="/request/new"
              className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold px-4 py-2 rounded-full text-xs sm:text-sm flex items-center gap-1.5 shadow-sm transition-all"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Emergency SOS</span>
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Wizard Hero Header */}
      <section className="bg-[var(--surface)] border-b border-[var(--border)] py-10 px-4 text-center">
        <div className="max-w-[700px] mx-auto">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--accent)] block mb-1">
            Voluntary Lifesaver Network
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--text)] mb-2">
            Register as a Blood Donor
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-dim)] max-w-md mx-auto mb-6">
            Join thousands of verified donors. You will receive notifications only when an emergency patient nearby matches your blood group.
          </p>

          {/* Stepper Pills */}
          <div className="flex items-center justify-center gap-2 max-w-sm mx-auto text-xs font-bold">
            <div className={`px-3 py-1 rounded-full transition-all ${step === 1 ? "bg-[var(--accent)] text-white shadow-xs" : step > 1 ? "bg-[var(--good-wash)] text-[var(--good)]" : "bg-white border border-[var(--border)] text-[var(--text-faint)]"}`}>
              1. Profile
            </div>
            <div className={`px-3 py-1 rounded-full transition-all ${step === 2 ? "bg-[var(--accent)] text-white shadow-xs" : step > 2 ? "bg-[var(--good-wash)] text-[var(--good)]" : "bg-white border border-[var(--border)] text-[var(--text-faint)]"}`}>
              2. Blood Group
            </div>
            <div className={`px-3 py-1 rounded-full transition-all ${step === 3 ? "bg-[var(--accent)] text-white shadow-xs" : step > 3 ? "bg-[var(--good-wash)] text-[var(--good)]" : "bg-white border border-[var(--border)] text-[var(--text-faint)]"}`}>
              3. Screening
            </div>
            <div className={`px-3 py-1 rounded-full transition-all ${step === 4 ? "bg-[var(--accent)] text-white shadow-xs" : "bg-white border border-[var(--border)] text-[var(--text-faint)]"}`}>
              4. Pass
            </div>
          </div>
        </div>
      </section>

      {/* 3. Main Form Container */}
      <main className="max-w-[620px] mx-auto px-4 py-8 w-full flex-1">
        {/* STEP 1: Basic Info */}
        {step === 1 && (
          <div className="bg-white border border-[var(--border-strong)] rounded-2xl p-6 sm:p-8 shadow-[var(--shadow-card)]">
            <h2 className="text-lg font-bold text-[var(--text)] mb-1">Your Details</h2>
            <p className="text-xs text-[var(--text-dim)] mb-6">
              Your phone number is strictly protected and never displayed publicly.
            </p>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[var(--text)] mb-1">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--text)] text-sm font-medium focus:ring-2 focus:ring-[var(--accent)] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-[var(--text)] mb-1">Mobile Number (WhatsApp Enabled)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">+91</span>
                  <input
                    type="tel"
                    maxLength={10}
                    placeholder="9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                    className="w-full pl-12 pr-4 py-2.5 rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--text)] text-sm font-medium focus:ring-2 focus:ring-[var(--accent)] focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[var(--text)] mb-1">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--text)] text-sm font-medium focus:ring-2 focus:ring-[var(--accent)] focus:outline-hidden"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[var(--text)] mb-1">Age (18–65)</label>
                  <input
                    type="number"
                    min="18"
                    max="65"
                    value={age}
                    onChange={(e) => setAge(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--text)] text-sm font-medium focus:ring-2 focus:ring-[var(--accent)] focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[var(--text)] mb-1">Weight (&gt;50 kg)</label>
                  <input
                    type="number"
                    min="45"
                    max="150"
                    value={weightKg}
                    onChange={(e) => setWeightKg(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--text)] text-sm font-medium focus:ring-2 focus:ring-[var(--accent)] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[var(--text)] mb-1">District</label>
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--text)] text-sm font-medium focus:ring-2 focus:ring-[var(--accent)] focus:outline-hidden"
                  >
                    <option value="South Delhi">South Delhi</option>
                    <option value="Central Delhi">Central Delhi</option>
                    <option value="South East Delhi">South East Delhi</option>
                    <option value="North West Delhi">North West Delhi</option>
                    <option value="Faridabad">Faridabad</option>
                    <option value="Gurugram">Gurugram</option>
                  </select>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="button"
                  disabled={!name.trim() || phone.length < 10 || age < 18 || weightKg < 45}
                  onClick={() => setStep(2)}
                  className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:bg-slate-200 text-white font-bold py-3 rounded-full flex items-center justify-center gap-1.5 text-xs sm:text-sm shadow-xs transition"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Blood Details */}
        {step === 2 && (
          <div className="bg-white border border-[var(--border-strong)] rounded-2xl p-6 sm:p-8 shadow-[var(--shadow-card)]">
            <h2 className="text-lg font-bold text-[var(--text)] mb-1">Select Blood Group</h2>
            <p className="text-xs text-[var(--text-dim)] mb-6">
              Clinical compatibility mapping
            </p>

            <div className="grid grid-cols-4 gap-2 mb-6">
              {BLOOD_GROUPS.map((bg) => {
                const isSelected = bloodGroup === bg.key;
                return (
                  <button
                    key={bg.key}
                    type="button"
                    onClick={() => setBloodGroup(bg.key)}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      isSelected
                        ? "bg-[var(--accent)] border-[var(--accent)] text-white shadow-xs scale-105"
                        : "bg-[var(--surface)] hover:bg-[var(--surface-hover)] border-[var(--border)] text-[var(--text)]"
                    }`}
                  >
                    <span className="font-extrabold text-sm block">{bg.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Compatibility info card */}
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 mb-6 text-xs space-y-2">
              <div className="flex gap-2">
                <span className="font-bold text-[var(--good)] shrink-0">Can Donate To:</span>
                <span className="font-medium text-[var(--text)]">{selectedBgMeta.donateTo}</span>
              </div>
              <div className="flex gap-2">
                <span className="font-bold text-sky-700 shrink-0">Can Receive From:</span>
                <span className="font-medium text-[var(--text)]">{selectedBgMeta.receiveFrom}</span>
              </div>
            </div>

            {/* Platelet Toggle */}
            <div className="border border-[var(--border)] rounded-xl p-3.5 mb-6 bg-[var(--surface)] flex items-center justify-between gap-4">
              <div>
                <span className="font-bold text-xs text-[var(--text)] block">Single Donor Platelets (SDP)</span>
                <span className="text-[11px] text-[var(--text-dim)] block">Willing to be on-call for emergency dengue/cancer platelet requests?</span>
              </div>
              <input
                type="checkbox"
                checked={willingPlatelets}
                onChange={(e) => setWillingPlatelets(e.target.checked)}
                className="w-4 h-4 accent-[var(--accent)] rounded-sm cursor-pointer"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-1/3 py-2.5 rounded-full bg-[var(--surface)] text-[var(--text)] font-semibold text-xs border border-[var(--border)]"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="w-2/3 py-2.5 rounded-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs"
              >
                <span>Health Screening</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: NBTC Screener */}
        {step === 3 && (
          <div className="bg-white border border-[var(--border-strong)] rounded-2xl p-6 sm:p-8 shadow-[var(--shadow-card)]">
            <h2 className="text-lg font-bold text-[var(--text)] mb-1">Health Screening</h2>
            <p className="text-xs text-[var(--text-dim)] mb-5">
              Standard National Blood Transfusion Council (NBTC) safety questionnaire.
            </p>

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
                className="w-1/3 py-2.5 rounded-full bg-[var(--surface)] text-[var(--text)] font-semibold text-xs border border-[var(--border)]"
              >
                Back
              </button>
              <button
                type="button"
                disabled={!healthPassed}
                onClick={handleCompleteRegistration}
                className="w-2/3 py-2.5 rounded-full bg-[var(--good)] hover:opacity-90 disabled:bg-slate-200 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Complete &amp; Generate Pass</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Minimalist Digital Donor Card */}
        {step === 4 && (
          <div className="bg-white border border-[var(--border-strong)] rounded-2xl p-6 sm:p-8 shadow-[var(--shadow-card)] text-center">
            <div className="w-12 h-12 rounded-full bg-[var(--good-wash)] text-[var(--good)] flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <h2 className="text-xl font-bold text-[var(--text)] mb-1">
              Registration Successful
            </h2>
            <p className="text-xs text-[var(--text-dim)] max-w-sm mx-auto mb-6">
              You are now an active volunteer. Below is your official RaktKhoj donor identification card.
            </p>

            {/* Clean Minimalist Digital Card */}
            <div className="bg-[var(--surface)] border border-[var(--border-strong)] rounded-2xl p-5 max-w-sm mx-auto mb-6 text-left shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border)] mb-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[var(--accent)] text-white">
                    <Droplet className="w-3.5 h-3.5 fill-white" />
                  </span>
                  <span className="font-extrabold text-sm tracking-tight text-[var(--text)]">RaktKhoj Pass</span>
                </div>
                <span className="text-[10px] font-bold text-[var(--good)] bg-[var(--good-wash)] px-2 py-0.5 rounded-full">
                  Verified Donor
                </span>
              </div>

              <div className="mb-3">
                <span className="text-[10px] text-[var(--text-faint)] font-bold block">Donor Name</span>
                <span className="text-sm font-bold text-[var(--text)] block">{name}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <span className="text-[10px] text-[var(--text-faint)] font-bold block">Blood Group</span>
                  <span className="text-lg font-black text-[var(--accent)]">{selectedBgMeta.label}</span>
                </div>
                <div>
                  <span className="text-[10px] text-[var(--text-faint)] font-bold block">Donor ID</span>
                  <span className="text-xs font-mono font-bold text-[var(--text)]">{generatedDonorId}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]">
                <div>
                  <span className="text-[10px] text-[var(--text-faint)] block">District</span>
                  <span className="text-xs font-medium text-[var(--text)]">{district}</span>
                </div>

                <div className="bg-white p-1 rounded-md border border-[var(--border)]">
                  <DynamicQrCode
                    value={`https://raktkhoj.org/donor/${generatedDonorId}`}
                    size={42}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 justify-center max-w-sm mx-auto">
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(generatedDonorId);
                  setIsCopied(true);
                  setTimeout(() => setIsCopied(false), 2000);
                }}
                className="py-2 px-4 rounded-full bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--text)] text-xs font-semibold border border-[var(--border)]"
              >
                {isCopied ? "Donor ID Copied!" : "Copy Donor ID"}
              </button>
              <Link
                href="/directory"
                className="py-2 px-4 rounded-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-bold"
              >
                Browse Directory
              </Link>
            </div>
          </div>
        )}
      </main>

      {/* 4. Modern Dark Footer */}
      <footer className="bg-[#121114] text-white py-12 px-4 text-xs border-t border-white/5 mt-auto">
        <div className="max-w-[1100px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#e8394c] text-white">
              <Droplet className="h-4 w-4 fill-white" />
            </span>
            <div>
              <span className="font-extrabold text-white text-base tracking-tight">raktkhoj<span className="text-[#e8394c]">.</span></span>
              <p className="text-gray-400 text-[11px]">Voluntary Donor Network &bull; 24x7 Helpline: 104 / 1075</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-6 text-gray-300 font-semibold">
            <Link href="/" className="hover:text-[#e8394c] transition">Home</Link>
            <Link href="/directory" className="hover:text-[#e8394c] transition">Blood Banks</Link>
            <Link href="/register" className="hover:text-[#e8394c] transition">Donor Registry</Link>
            <Link href="/camps" className="hover:text-[#e8394c] transition">Donation Camps</Link>
            <Link href="/request/new" className="text-[#e8394c] hover:underline font-bold">SOS Dispatch</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
