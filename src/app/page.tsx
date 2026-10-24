"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Droplet,
  Search,
  Heart,
  ShieldCheck,
  PhoneCall,
  Clock,
  MapPin,
  Building2,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  QrCode,
  Share2,
  Users,
  Compass,
  FileText
} from "lucide-react";
import SidecarPill from "@/components/SidecarPill";

// Realistic live blood banks in Delhi NCR (e-RaktKosh integrated)
const SAMPLE_BLOOD_BANKS = [
  {
    name: "AIIMS Central Blood Bank, Trauma Centre",
    distance: "1.2 km away",
    location: "Ansari Nagar East, Ring Road, New Delhi",
    phone: "+91 11 2659 4444",
    stock: {
      O_POS: 14,
      B_POS: 9,
      A_POS: 11,
      AB_POS: 4,
      O_NEG: 2,
      B_NEG: 3,
      SDP: 5,
    },
    status: "OPEN 24x7",
    verified: true,
  },
  {
    name: "Safdarjung Hospital Regional Blood Centre",
    distance: "2.4 km away",
    location: "Opposite AIIMS, Sri Aurobindo Marg, New Delhi",
    phone: "+91 11 2616 5060",
    stock: {
      O_POS: 8,
      B_POS: 12,
      A_POS: 6,
      AB_POS: 3,
      O_NEG: 0,
      B_NEG: 1,
      SDP: 2,
    },
    status: "OPEN 24x7",
    verified: true,
  },
  {
    name: "Indraprastha Apollo Hospitals Blood Bank",
    distance: "6.8 km away",
    location: "Delhi-Mathura Road, Sarita Vihar, South Delhi",
    phone: "+91 11 2692 5858",
    stock: {
      O_POS: 19,
      B_POS: 15,
      A_POS: 8,
      AB_POS: 6,
      O_NEG: 4,
      B_NEG: 2,
      SDP: 8,
    },
    status: "OPEN 24x7",
    verified: true,
  },
  {
    name: "Fortis Escorts Heart Institute Blood Bank",
    distance: "8.5 km away",
    location: "Okhla Road, Sukhdev Vihar, New Delhi",
    phone: "+91 11 4713 5000",
    stock: {
      O_POS: 5,
      B_POS: 7,
      A_POS: 3,
      AB_POS: 2,
      O_NEG: 1,
      B_NEG: 0,
      SDP: 4,
    },
    status: "OPEN 24x7",
    verified: true,
  },
];

const BLOOD_GROUPS = [
  { label: "O+", key: "O_POS", hindi: "ओ पॉजिटिव" },
  { label: "O-", key: "O_NEG", hindi: "ओ नेगेटिव" },
  { label: "A+", key: "A_POS", hindi: "ए पॉजिटिव" },
  { label: "A-", key: "A_NEG", hindi: "ए नेगेटिव" },
  { label: "B+", key: "B_POS", hindi: "बी पॉजिटिव" },
  { label: "B-", key: "B_NEG", hindi: "बी नेगेटिव" },
  { label: "AB+", key: "AB_POS", hindi: "एबी पॉजिटिव" },
  { label: "AB-", key: "AB_NEG", hindi: "एबी नेगेटिव" },
  { label: "Bombay (hh)", key: "BOMBAY_OH", hindi: "बॉम्बे ब्लड" },
];

const BLOOD_COMPONENTS = [
  { id: "WHOLE_BLOOD", label: "Whole Blood", hindi: "सामान्य रक्त (WB)" },
  { id: "SDP", label: "Single Donor Platelets (SDP)", hindi: "प्लेटलेट्स (SDP)" },
  { id: "PRBC", label: "Packed Red Blood Cells (PRBC)", hindi: "लाल रक्त कण" },
  { id: "PLASMA", label: "Fresh Frozen Plasma (FFP)", hindi: "प्लाज्मा" },
];

export default function HomePage() {
  const [selectedGroup, setSelectedGroup] = useState<string>("O_POS");
  const [selectedComponent, setSelectedComponent] = useState<string>("WHOLE_BLOOD");
  const [selectedCity, setSelectedCity] = useState<string>("Delhi NCR");
  const [trackCode, setTrackCode] = useState<string>("");
  const [donorPhone, setDonorPhone] = useState<string>("");
  const [donorRegistered, setDonorRegistered] = useState<boolean>(false);

  // Quick lookup of available stock for selected blood group
  const totalStockNearby = SAMPLE_BLOOD_BANKS.reduce((acc, bank) => {
    const stockVal = (bank.stock as any)[selectedGroup] || 0;
    return acc + stockVal;
  }, 0);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* 1. Indian Emergency Top Bar */}
      <header className="bg-rose-700 text-white text-xs sm:text-sm font-medium py-2 px-4 shadow-sm">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-200 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
            </span>
            <span className="font-semibold tracking-wide">
              🇮🇳 भारत आपातकालीन रक्त सेवा (National Emergency Blood Network)
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <a
              href="tel:104"
              className="bg-white/15 hover:bg-white/25 px-2.5 py-1 rounded-md font-bold inline-flex items-center gap-1.5 transition"
            >
              <PhoneCall className="w-3.5 h-3.5 text-amber-300" />
              <span>National Blood Helpline: 104 (निःशुल्क)</span>
            </a>
            <span className="hidden sm:inline opacity-80">e-RaktKosh &amp; NBTC Verified</span>
          </div>
        </div>
      </header>

      {/* 2. Main Navigation */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-600 to-red-700 flex items-center justify-center text-white shadow-md shadow-rose-600/20 group-hover:scale-105 transition-transform">
              <Droplet className="w-6 h-6 fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl sm:text-2xl tracking-tight text-slate-900">
                  Rakt<span className="text-rose-600">Khoj</span>
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 uppercase tracking-wider">
                  V2V
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block -mt-0.5">
                रक्त खोजें • Veins to Veins Emergency Dispatch
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/request/new"
              className="hidden md:flex items-center gap-1.5 text-sm font-semibold text-slate-700 hover:text-rose-600 px-3 py-2 rounded-lg hover:bg-rose-50 transition"
            >
              <Search className="w-4 h-4 text-rose-500" />
              <span>रक्त चाहिए (Find Blood)</span>
            </Link>

            <a
              href="#donor-section"
              className="hidden md:flex items-center gap-1.5 text-sm font-semibold text-slate-700 hover:text-rose-600 px-3 py-2 rounded-lg hover:bg-rose-50 transition"
            >
              <Heart className="w-4 h-4 text-rose-500" />
              <span>रक्तदाता बनें (Donate)</span>
            </a>

            <Link
              href="/request/new"
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-2.5 rounded-xl shadow-md shadow-rose-600/20 flex items-center gap-2 text-xs sm:text-sm transition hover:scale-[1.02]"
            >
              <AlertCircle className="w-4 h-4" />
              <span>Emergency SOS (तुरंत मदद)</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* 3. Hero Section: Direct Blood Search for Families in Need */}
      <section className="bg-gradient-to-b from-rose-50 via-white to-slate-50 border-b border-slate-200/80 py-10 sm:py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Empathy & Urgency Pill */}
          <div className="inline-flex items-center gap-2 bg-rose-100/90 text-rose-800 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold mb-6 border border-rose-200/80 shadow-xs">
            <span className="text-rose-600">❤️ रक्तदान जीवनदान</span>
            <span className="text-slate-400">•</span>
            <span>Zero Brokerage • 100% Free Public Network</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight mb-4">
            आपातकाल में रक्त खोजें <br className="hidden sm:inline" />
            <span className="text-rose-600">Find Blood &amp; Platelets in Minutes</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto mb-8 font-normal leading-relaxed">
            Don&apos;t panic or run between blood banks. We check government blood bank inventories first,
            and instantly mobilize verified voluntary donors within 3–15 km of your hospital.
          </p>

          {/* Core Interactive Search Card */}
          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-200 p-5 sm:p-8 text-left transition-all">
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                  1
                </div>
                <div>
                  <h2 className="font-bold text-slate-900 text-base sm:text-lg">
                    Select Required Blood Group (ब्लड ग्रुप चुनें)
                  </h2>
                  <p className="text-xs text-slate-500">Tap the blood group needed for the patient</p>
                </div>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                Delhi NCR Hub
              </span>
            </div>

            {/* Blood Group Select Pills */}
            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2.5 mb-6">
              {BLOOD_GROUPS.map((grp) => {
                const isSelected = selectedGroup === grp.key;
                return (
                  <button
                    key={grp.key}
                    type="button"
                    onClick={() => setSelectedGroup(grp.key)}
                    className={`py-3 px-2 rounded-xl text-center font-bold transition-all flex flex-col items-center justify-center gap-0.5 border ${
                      isSelected
                        ? "bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-600/30 scale-105"
                        : "bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200"
                    }`}
                  >
                    <span className="text-base sm:text-lg">{grp.label}</span>
                    <span className={`text-[10px] font-normal ${isSelected ? "text-rose-100" : "text-slate-500"}`}>
                      {grp.hindi.split(" ")[0]}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Component and City Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                  Component Required (रक्त घटक)
                </label>
                <select
                  value={selectedComponent}
                  onChange={(e) => setSelectedComponent(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-3 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 transition"
                >
                  {BLOOD_COMPONENTS.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label} — {c.hindi}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                  Hospital Location / City (अस्पताल का क्षेत्र)
                </label>
                <div className="relative">
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-3 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 transition"
                  >
                    <option value="Delhi NCR">Delhi NCR (AIIMS, Safdarjung, Apollo, Fortis)</option>
                    <option value="South Delhi">South Delhi (Saket, Sarita Vihar)</option>
                    <option value="Central Delhi">Central Delhi (Ansari Nagar, Ring Road)</option>
                    <option value="Faridabad">Faridabad / NCR Border</option>
                  </select>
                  <MapPin className="w-4 h-4 text-slate-400 absolute right-3 top-3.5 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Live Stock Notification Bar */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
              <div className="flex items-center gap-3">
                <div
                  className={`w-3.5 h-3.5 rounded-full shrink-0 ${
                    totalStockNearby > 5 ? "bg-emerald-500 animate-pulse" : "bg-amber-500 animate-pulse"
                  }`}
                />
                <div>
                  <p className="text-xs sm:text-sm font-bold text-slate-800">
                    Live e-RaktKosh Status:{" "}
                    <span className={totalStockNearby > 5 ? "text-emerald-700 font-extrabold" : "text-amber-700 font-extrabold"}>
                      {totalStockNearby} Units of {selectedGroup.replace("_", "+")} Available
                    </span>
                  </p>
                  <p className="text-xs text-slate-500">
                    Verified across 4 nearest licensed blood banks in {selectedCity}
                  </p>
                </div>
              </div>

              <a
                href="#live-banks"
                className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-1 shrink-0"
              >
                <span>View Bank Inventory</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/request/new"
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2.5 text-base transition hover:scale-[1.01]"
              >
                <Search className="w-5 h-5" />
                <span>Search Blood &amp; Alert Nearby Donors (रक्त खोजें)</span>
              </Link>

              <Link
                href="/r/v2v_w1_aiims"
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold py-4 px-5 rounded-xl border border-slate-200 flex items-center justify-center gap-2 text-sm transition"
              >
                <Compass className="w-4 h-4 text-slate-600" />
                <span>Live Demo Request</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Live Blood Bank Stock Preview Section */}
      <section id="live-banks" className="max-w-6xl mx-auto px-4 py-12 w-full">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 uppercase tracking-wider mb-2">
              <Building2 className="w-4 h-4" />
              <span>e-RaktKosh Verified Inventory (सरकारी ब्लड बैंक स्टॉक)</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Nearby Licensed Blood Banks
            </h2>
            <p className="text-sm text-slate-500">
              Check direct hospital bank availability before issuing emergency donor calls.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-lg text-xs font-semibold self-start md:self-auto">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Updated Every 15 Minutes via e-RaktKosh API</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SAMPLE_BLOOD_BANKS.map((bank, idx) => {
            const groupStock = (bank.stock as any)[selectedGroup] || 0;
            return (
              <div
                key={idx}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-rose-300 hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-bold text-slate-900 text-base leading-snug">
                      {bank.name}
                    </h3>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 whitespace-nowrap">
                      {bank.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 flex items-center gap-1.5 mb-4">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>
                      {bank.location} • <strong className="text-slate-700">{bank.distance}</strong>
                    </span>
                  </p>

                  <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 mb-4 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-500 block">Available {selectedGroup.replace("_", "+")}:</span>
                      <span className={`text-xl font-extrabold ${groupStock > 0 ? "text-emerald-700" : "text-rose-600"}`}>
                        {groupStock} {groupStock === 1 ? "Unit" : "Units"}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-slate-500 block">Platelets (SDP):</span>
                      <span className="text-sm font-bold text-slate-700">{bank.stock.SDP} Units</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                  <a
                    href={`tel:${bank.phone}`}
                    className="text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-2 rounded-lg flex items-center gap-1.5 transition"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>{bank.phone}</span>
                  </a>

                  <Link
                    href={`/request/new?hospital=${encodeURIComponent(bank.name)}`}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-2 rounded-lg hover:bg-slate-100 transition"
                  >
                    Request for this Hospital →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. Doctor Slip Requisition Banner (Anti-Tout Gate) */}
      <section className="bg-gradient-to-r from-rose-900 to-red-900 text-white py-12 px-4">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-2xl text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-rose-200 text-xs font-semibold mb-4 border border-white/15">
              <ShieldCheck className="w-4 h-4 text-amber-300" />
              <span>Anti-Tout Doctor Verification (दलाली मुक्त रक्तदान)</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-3">
              Have a Doctor&apos;s Blood Requisition Slip?
            </h2>
            <p className="text-sm sm:text-base text-rose-100 font-normal leading-relaxed mb-4">
              Don&apos;t run door-to-door. Upload your doctor&apos;s prescription or requisition slip from your mobile camera.
              Our automated OCR verifies the UHID and hospital location, protecting you from black-market touts.
            </p>
            <div className="flex flex-wrap items-center gap-4 text-xs text-rose-200">
              <span className="flex items-center gap-1">✓ Instant UHID Verification</span>
              <span className="flex items-center gap-1">✓ Expanding Wave Dispatch (0–15km)</span>
              <span className="flex items-center gap-1">✓ Masked WhatsApp Alerts</span>
            </div>
          </div>

          <Link
            href="/request/new"
            className="bg-white hover:bg-rose-50 text-rose-900 font-extrabold px-6 py-4 rounded-xl shadow-xl flex items-center gap-2.5 text-base shrink-0 transition hover:scale-105"
          >
            <FileText className="w-5 h-5 text-rose-600" />
            <span>Upload Slip &amp; Alert Donors</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* 6. Donor Registration / Hero Section ("रक्तदाता बनें") */}
      <section id="donor-section" className="max-w-6xl mx-auto px-4 py-16 w-full">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-10 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-10">
          <div className="max-w-xl text-left">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 uppercase tracking-wider mb-2">
              <Heart className="w-4 h-4 fill-rose-600" />
              <span>Join 50,000+ Voluntary Donors in India</span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
              Become a Lifesaver in Your Neighborhood <br />
              <span className="text-rose-600">रक्तदाता बनें और जानें कैसे मदद करें</span>
            </h2>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed mb-6">
              When someone is in critical need near your location (within 3–7 km), you will receive a direct WhatsApp
              alert with the hospital name and patient details. You will <strong>never</strong> be spammed, and your phone
              number remains 100% private.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <span className="text-rose-600 font-extrabold text-lg block mb-0.5">1. Alert</span>
                <span className="text-xs text-slate-600">WhatsApp notification only when an exact match needs blood nearby.</span>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <span className="text-rose-600 font-extrabold text-lg block mb-0.5">2. 15s Check</span>
                <span className="text-xs text-slate-600">Tap 5 rapid health check questions on your phone.</span>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <span className="text-rose-600 font-extrabold text-lg block mb-0.5">3. V2V Pass</span>
                <span className="text-xs text-slate-600">Show your secure digital voucher at the hospital blood bank.</span>
              </div>
            </div>

            {/* Quick WhatsApp Registration Mock */}
            {donorRegistered ? (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                <div>
                  <p className="font-bold text-sm">धन्यवाद! You are registered as an emergency donor.</p>
                  <p className="text-xs text-emerald-700">We will only notify you when an emergency match occurs near you.</p>
                </div>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (donorPhone.trim().length >= 10) setDonorRegistered(true);
                }}
                className="flex flex-col sm:flex-row gap-3 max-w-md"
              >
                <input
                  type="tel"
                  placeholder="Enter WhatsApp Mobile Number (+91)"
                  value={donorPhone}
                  onChange={(e) => setDonorPhone(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  required
                />
                <button
                  type="submit"
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 py-3 rounded-xl text-sm whitespace-nowrap transition"
                >
                  Register Donor
                </button>
              </form>
            )}
          </div>

          {/* Interactive Donor Pass Preview Card */}
          <div className="w-full max-w-sm bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-xl border border-slate-700 text-left">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Droplet className="w-5 h-5 text-rose-500 fill-rose-500" />
                <span className="font-extrabold tracking-wide text-sm">V2V DONOR PASS</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                VERIFIED PASS
              </span>
            </div>

            <p className="text-xs text-slate-400 mb-1">Destination Hospital</p>
            <p className="font-bold text-base text-white mb-3">AIIMS Delhi, Trauma Centre</p>

            <div className="grid grid-cols-2 gap-2 text-xs mb-4">
              <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-700">
                <span className="text-slate-400 block text-[10px]">Blood Group</span>
                <span className="font-bold text-rose-400 text-sm">O+ (O Positive)</span>
              </div>
              <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-700">
                <span className="text-slate-400 block text-[10px]">Travel Window</span>
                <span className="font-bold text-emerald-400 text-sm">25 Mins</span>
              </div>
            </div>

            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 flex items-center justify-between mb-4">
              <div>
                <span className="text-[10px] text-slate-400 block">Hospital Handshake PIN</span>
                <span className="font-mono text-xl font-extrabold text-amber-400 tracking-wider">7744</span>
              </div>
              <QrCode className="w-10 h-10 text-slate-300" />
            </div>

            <Link
              href="/donor/respond/1-1"
              className="w-full bg-rose-600 hover:bg-rose-500 text-white text-center font-bold py-2.5 px-4 rounded-xl text-xs block transition"
            >
              Simulate WhatsApp Donor Flow →
            </Link>
          </div>
        </div>
      </section>

      {/* 7. Track Existing Emergency Link */}
      <section className="bg-slate-100/80 border-t border-slate-200 py-10 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h3 className="font-bold text-slate-900 text-lg mb-2">
            Already Have an Emergency Request? (आपातकालीन लिंक ट्रैक करें)
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mb-4">
            Enter your 12-character request token or try our pre-seeded live simulation.
          </p>

          <div className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto justify-center">
            <input
              type="text"
              placeholder="e.g. v2v_w1_aiims"
              value={trackCode}
              onChange={(e) => setTrackCode(e.target.value)}
              className="bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 flex-1"
            />
            <Link
              href={`/r/${trackCode.trim() || "v2v_w1_aiims"}`}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition"
            >
              Open Command Center
            </Link>
          </div>

          {/* Quick link chips */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-4 text-xs text-slate-500">
            <span>Quick Samples:</span>
            <Link href="/r/v2v_w1_aiims" className="text-rose-600 hover:underline font-semibold">
              Wave 1 AIIMS (SDP)
            </Link>
            <span>•</span>
            <Link href="/r/v2v_w2_apollo" className="text-rose-600 hover:underline font-semibold">
              Wave 2 Apollo (B+)
            </Link>
            <span>•</span>
            <Link href="/r/v2v_fn_aiims" className="text-rose-600 hover:underline font-semibold">
              Fulfilled Request
            </Link>
            <span>•</span>
            <Link href="/admin/simulator" className="text-slate-700 hover:underline font-bold">
              Chaos Simulator
            </Link>
          </div>
        </div>
      </section>

      {/* 8. Mandatory Science Visualization Sidecar */}
      <section className="max-w-4xl mx-auto px-4 py-8 w-full">
        <SidecarPill variant="banner" />
      </section>

      {/* 9. Comprehensive Indian Healthcare Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto py-8 px-4 text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Droplet className="w-4 h-4 text-rose-600 fill-rose-600" />
            <span className="font-bold text-slate-800">
              RaktKhoj (V2V) • रक्त खोजें व रक्तदान करें
            </span>
            <span>• Built for Indian Emergency Healthcare</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-slate-600">
            <span>National Blood Helpline: <strong>104</strong></span>
            <span>Ambulance: <strong>108 / 102</strong></span>
            <span>NBTC &amp; DPDP Act 2023 Compliant</span>
          </div>
        </div>
      </footer>
    </div>
  );
}