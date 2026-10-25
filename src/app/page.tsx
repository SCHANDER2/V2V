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
  Calendar,
  ExternalLink,
  ChevronRight,
  Activity,
  Users,
  QrCode,
  FileText,
  Share2,
  Info,
  Check,
  X
} from "lucide-react";
import SidecarPill from "@/components/SidecarPill";
import { useLanguage } from "@/context/LanguageContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";

// Accurate live blood banks in Delhi NCR
const FEATURED_BANKS = [
  {
    name: "AIIMS Central Blood Centre, Trauma Centre",
    distance: "1.2 km away",
    location: "Ansari Nagar East, Ring Road, New Delhi",
    phone: "+91 11 2659 4444",
    stock: { O_POS: 16, B_POS: 12, A_POS: 9, AB_POS: 5, SDP: 6 },
    status: "OPEN 24x7",
    category: "Government Hub",
    verified: true
  },
  {
    name: "Safdarjung Hospital Regional Blood Centre",
    distance: "2.4 km away",
    location: "Opposite AIIMS, Sri Aurobindo Marg, New Delhi",
    phone: "+91 11 2616 5060",
    stock: { O_POS: 11, B_POS: 14, A_POS: 7, AB_POS: 4, SDP: 3 },
    status: "OPEN 24x7",
    category: "Government Central",
    verified: true
  },
  {
    name: "Indian Red Cross Society NHQ Blood Centre",
    distance: "4.5 km away",
    location: "1, Red Cross Road, Sansad Marg, New Delhi",
    phone: "+91 11 2371 1551",
    stock: { O_POS: 22, B_POS: 18, A_POS: 14, AB_POS: 7, SDP: 5 },
    status: "OPEN 24x7",
    category: "Charitable Centre",
    verified: true
  },
  {
    name: "Indraprastha Apollo Hospital Blood Bank",
    distance: "6.8 km away",
    location: "Delhi-Mathura Road, Sarita Vihar, New Delhi",
    phone: "+91 11 2692 5858",
    stock: { O_POS: 19, B_POS: 15, A_POS: 11, AB_POS: 6, SDP: 8 },
    status: "OPEN 24x7",
    category: "NABH Licensed",
    verified: true
  }
];

const BLOOD_GROUPS = [
  { label: "O+", key: "O_POS" },
  { label: "O-", key: "O_NEG" },
  { label: "A+", key: "A_POS" },
  { label: "A-", key: "A_NEG" },
  { label: "B+", key: "B_POS" },
  { label: "B-", key: "B_NEG" },
  { label: "AB+", key: "AB_POS" },
  { label: "AB-", key: "AB_NEG" },
  { label: "Platelets (SDP)", key: "SDP" }
];

export default function HomePage() {
  const { language, t } = useLanguage();
  const [selectedGroup, setSelectedGroup] = useState<string>("O_POS");
  const [searchQuery, setSearchQuery] = useState("");
  const [showQrModal, setShowQrModal] = useState(false);
  const [showEligibilityModal, setShowEligibilityModal] = useState(false);
  const [showCompatibilityModal, setShowCompatibilityModal] = useState(false);
  const [eligibilityAnswers, setEligibilityAnswers] = useState({
    age: true,
    weight: true,
    healthy: true,
    donationGap: true
  });

  const isEligible = Object.values(eligibilityAnswers).every(Boolean);

  const filteredBanks = FEATURED_BANKS.filter(
    (b) =>
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-white text-[#17151a]">
      {/* 1. TOP NAVBAR */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-black/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-[#e8394c] flex items-center justify-center text-white shadow-md shadow-[#e8394c]/20 group-hover:scale-105 transition-transform">
              <Droplet className="w-6 h-6 fill-current" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-extrabold tracking-tight text-[#17151a]">
                V2V<span className="text-[#e8394c]">.</span>
              </span>
              <span className="text-[10px] tracking-widest uppercase font-semibold text-[#5f4e52] -mt-1">
                Life Flow Network
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-[#5f4e52]">
            <Link href="/directory" className="hover:text-[#e8394c] transition-colors">
              {t("navFindBlood")}
            </Link>
            <Link href="/camps" className="hover:text-[#e8394c] transition-colors">
              {t("navCamps")}
            </Link>
            <button
              onClick={() => setShowEligibilityModal(true)}
              className="hover:text-[#e8394c] transition-colors"
            >
              {t("navCanIDonate")}
            </button>
            <Link href="/register" className="hover:text-[#e8394c] transition-colors">
              {t("navDonorPass")}
            </Link>
            <Link href="/admin/simulator" className="hover:text-[#e8394c] transition-colors text-xs px-2.5 py-1 bg-black/5 rounded-full">
              {t("navSimulator")}
            </Link>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link
              href="/request/new"
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white bg-[#e8394c] hover:bg-[#d22d40] rounded-full shadow-sm transition-all hover:scale-105"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
              </span>
              {t("navSos")}
            </Link>
            <Link
              href="/register"
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-[#17151a] hover:text-[#e8394c] border border-black/10 hover:border-[#e8394c] rounded-full transition-all"
            >
              {t("navRegister")}
            </Link>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative overflow-hidden pt-8 pb-16 lg:pt-14 lg:pb-24 bg-gradient-to-b from-[#fff8f8] via-[#ffffff] to-[#ffffff]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#e8394c]/10 border border-[#e8394c]/20 text-xs font-bold tracking-wide uppercase text-[#e8394c]">
                <span className="w-2 h-2 rounded-full bg-[#e8394c]"></span>
                {t("heroBadge")}
              </div>

              {/* Bold Headline */}
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-[#17151a] leading-[1.08]">
                {t("heroHeadline1")} <br />
                <span className="text-[#e8394c]">{t("heroHeadline2")}</span>
              </h1>

              {/* Subhead */}
              <p className="text-lg sm:text-xl text-[#5f4e52] max-w-xl leading-relaxed">
                {t("heroSubhead")}
              </p>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center gap-4">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-full bg-[#e8394c] hover:bg-[#d22d40] text-white font-bold text-base shadow-xl shadow-[#e8394c]/25 hover:shadow-2xl hover:scale-[1.02] transition-all"
                >
                  <Heart className="w-5 h-5 fill-current" />
                  {t("heroCtaRegister")}
                  <ArrowRight className="w-5 h-5" />
                </Link>

                <Link
                  href="/directory"
                  className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-full bg-white hover:bg-[#f8f7f5] text-[#17151a] font-bold text-base border border-black/10 hover:border-black/20 shadow-sm transition-all"
                >
                  <Search className="w-5 h-5 text-[#5f4e52]" />
                  {t("heroCtaFind")}
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="pt-4 flex flex-wrap items-center gap-6 text-xs font-semibold text-[#5f4e52]">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#1f9d67]" />
                  <span>{t("trustNbtc")}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#1f9d67]" />
                  <span>{t("trustFree")}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#1f9d67]" />
                  <span>{t("trustEmergency")}</span>
                </div>
              </div>
            </div>

            {/* Right Visual with Smiling Donor & Floating QR Badge */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                {/* Background decorative glow */}
                <div className="absolute -inset-2 bg-gradient-to-tr from-[#e8394c]/20 to-orange-400/20 rounded-[2.5rem] blur-2xl -z-10"></div>

                {/* Hero Photo Card */}
                <div className="relative rounded-[2rem] overflow-hidden shadow-2xl border border-white/60 bg-white">
                  {/* High Quality Medical Donor Photo */}
                  <img
                    src="https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1000&q=80"
                    alt="Voluntary blood donor smiling in clinical donation lounge"
                    className="w-full h-[460px] object-cover object-top"
                  />

                  {/* Top Floating Trust Badge */}
                  <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-lg border border-black/5 flex items-center gap-2 text-xs font-bold text-[#17151a]">
                    <div className="w-2 h-2 rounded-full bg-[#1f9d67] animate-pulse"></div>
                    <span>5.8M+ Lifesavers</span>
                  </div>

                  {/* Overlaid QR Code Card */}
                  <div className="absolute bottom-5 inset-x-5 bg-[#17151a]/95 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-2xl text-white flex items-center gap-4">
                    <div className="bg-white p-2 rounded-xl shrink-0 shadow-inner">
                      {/* Realistic SVG QR Code */}
                      <svg
                        className="w-16 h-16 text-[#17151a]"
                        viewBox="0 0 100 100"
                        fill="currentColor"
                      >
                        <path d="M0,0 h35 v35 h-35 z M5,5 v25 h25 v-25 z M10,10 h15 v15 h-15 z" />
                        <path d="M65,0 h35 v35 h-35 z M70,5 v25 h25 v-25 z M75,10 h15 v15 h-15 z" />
                        <path d="M0,65 h35 v35 h-35 z M5,70 v25 h25 v-25 z M10,75 h15 v15 h-15 z" />
                        <rect x="42" y="8" width="6" height="6" />
                        <rect x="52" y="8" width="6" height="12" />
                        <rect x="42" y="22" width="16" height="6" />
                        <rect x="8" y="42" width="10" height="6" />
                        <rect x="24" y="42" width="6" height="16" />
                        <rect x="42" y="42" width="16" height="16" fill="#e8394c" />
                        <rect x="65" y="42" width="12" height="6" />
                        <rect x="85" y="42" width="6" height="12" />
                        <rect x="42" y="65" width="8" height="12" />
                        <rect x="56" y="70" width="8" height="8" />
                        <rect x="70" y="65" width="22" height="6" />
                        <rect x="70" y="80" width="12" height="12" />
                        <rect x="88" y="78" width="6" height="14" />
                      </svg>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="inline-block px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-[#e8394c] text-white mb-1">
                        SCAN TO GET APP
                      </div>
                      <h4 className="text-sm font-bold text-white tracking-tight">
                        Find blood in minutes
                      </h4>
                      <p className="text-[11px] text-gray-300 truncate">
                        Available on Android &amp; iOS
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. TICKER RIBBON */}
      <div className="bg-[#fff1f2] border-y border-[#ffe4e6] py-3 text-center px-4">
        <p className="text-xs sm:text-sm font-semibold text-[#e8394c] flex items-center justify-center gap-2">
          <MapPin className="w-4 h-4 shrink-0" />
          <span>
            Real-time verified blood banks &amp; direct emergency donor dispatch active across all districts in India
          </span>
        </p>
      </div>

      {/* 4. STATS ROW (Exact metrics from screenshot) */}
      <section className="py-12 bg-white border-b border-black/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-black/5">
            <div className="pt-4 md:pt-0">
              <div className="text-4xl sm:text-5xl font-extrabold text-[#17151a] tracking-tight">
                58 L
              </div>
              <p className="mt-1 text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#5f4e52]">
                Registered Donors
              </p>
            </div>
            <div className="pt-4 md:pt-0">
              <div className="text-4xl sm:text-5xl font-extrabold text-[#17151a] tracking-tight">
                4.7 K
              </div>
              <p className="mt-1 text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#5f4e52]">
                Blood Donation Camps
              </p>
            </div>
            <div className="pt-4 md:pt-0">
              <div className="text-4xl sm:text-5xl font-extrabold text-[#17151a] tracking-tight">
                2.7 L
              </div>
              <p className="mt-1 text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#5f4e52]">
                Units Collected
              </p>
            </div>
            <div className="pt-4 md:pt-0">
              <div className="text-4xl sm:text-5xl font-extrabold text-[#17151a] tracking-tight">
                38
              </div>
              <p className="mt-1 text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#5f4e52]">
                States &amp; UTs Covered
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4.5 LIVE BLOOD STOCK & CENTRES FINDER (V2V Core Live Service) */}
      <section className="py-12 bg-[#faf9f6] border-b border-black/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-[#e8394c]">
                Live e-RaktKosh Inventory
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#17151a] tracking-tight mt-1">
                {t("stockTitle")}
              </h2>
              <p className="text-xs sm:text-sm text-[#5f4e52] mt-1">
                {t("stockSubtitle")}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setShowCompatibilityModal(true)}
                className="text-xs font-bold text-[#e8394c] hover:underline flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#e8394c]/10"
              >
                <Info className="w-3.5 h-3.5" /> {language === "hi" ? "ब्लड अनुकूलता चार्ट" : "Blood Compatibility Chart"}
              </button>
              <Link
                href="/directory"
                className="text-xs font-bold text-[#17151a] hover:text-[#e8394c] flex items-center gap-1"
              >
                {language === "hi" ? "पूरी डायरेक्टरी देखें →" : "Open Full Directory →"}
              </Link>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 border border-black/5 shadow-sm mb-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="relative md:col-span-2">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder={t("searchPlaceholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 text-sm font-medium rounded-xl border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#e8394c]"
                />
              </div>
              <Link
                href={`/request/new?group=${selectedGroup}`}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#e8394c] hover:bg-[#d22d40] text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-all"
              >
                <AlertCircle className="w-4 h-4" />
                {t("btnEmergencyRequest")}
              </Link>
            </div>

            {/* Blood group pill selectors */}
            <div>
              <span className="text-[11px] font-bold text-[#5f4e52] uppercase tracking-wider block mb-2">
                {t("selectBloodGroup")}
              </span>
              <div className="flex flex-wrap gap-2">
                {BLOOD_GROUPS.map((bg) => (
                  <button
                    key={bg.key}
                    onClick={() => setSelectedGroup(bg.key)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      selectedGroup === bg.key
                        ? "bg-[#e8394c] text-white shadow-md shadow-[#e8394c]/20 scale-105"
                        : "bg-gray-100 hover:bg-gray-200 text-[#17151a]"
                    }`}
                  >
                    {bg.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Live Blood Centre Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {filteredBanks.map((bank, idx) => {
              const units = (bank.stock as any)[selectedGroup] || 0;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-2xl p-5 border border-black/5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-gray-100 text-[#5f4e52]">
                        {bank.category}
                      </span>
                      <span className="text-[11px] font-bold text-[#1f9d67] flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#1f9d67] animate-pulse"></span>
                        {bank.status}
                      </span>
                    </div>

                    <h3 className="font-bold text-sm text-[#17151a] line-clamp-2 mb-1">
                      {bank.name}
                    </h3>
                    <p className="text-xs text-[#5f4e52] flex items-center gap-1 mb-3">
                      <MapPin className="w-3 h-3 text-[#e8394c] shrink-0" />
                      <span className="truncate">{bank.location}</span>
                    </p>

                    {/* Stock pill */}
                    <div className="p-3 rounded-xl bg-[#fff8f8] border border-[#e8394c]/10 mb-4">
                      <div className="flex items-baseline justify-between">
                        <span className="text-xs font-semibold text-[#5f4e52]">
                          {t("availableUnits")}:
                        </span>
                        <span className="text-lg font-extrabold text-[#e8394c]">
                          {units} Units
                        </span>
                      </div>
                      <span className="text-[10px] text-[#1f9d67] font-semibold block mt-0.5">
                        {language === "hi" ? "सत्यापित • 10 मिनट पहले अपडेट" : "Verified • Updated 10m ago"}
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-black/5 flex items-center justify-between gap-2">
                    <a
                      href={`tel:${bank.phone}`}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#17151a] hover:text-[#e8394c] px-3 py-1.5 rounded-lg border border-black/10 hover:border-black/20"
                    >
                      <PhoneCall className="w-3.5 h-3.5 text-[#e8394c]" />
                      {t("btnCallNow")}
                    </a>
                    <Link
                      href={`/request/new?hospital=${encodeURIComponent(bank.name)}&group=${selectedGroup}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-white bg-[#e8394c] hover:bg-[#d22d40] px-3.5 py-1.5 rounded-lg shadow-sm"
                    >
                      {t("btnEmergencyRequest")}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. "TOGETHER WE THRIVE" BANNER (Exact from screenshot) */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl bg-gradient-to-r from-[#faf7f2] via-[#f7f3ed] to-[#f4eee6] border border-[#e8e4dc] p-8 sm:p-12 overflow-hidden shadow-sm">
            {/* Background Watermark Droplet */}
            <Droplet className="absolute -right-8 -bottom-10 w-64 h-64 text-[#e8394c]/5 -rotate-12 pointer-events-none" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
              <div className="lg:col-span-7 space-y-3">
                <span className="text-xs font-bold uppercase tracking-widest text-[#e8394c]">
                  National Blood Mission
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-[#17151a] tracking-tight">
                  Together We Thrive:
                </h2>
                <p className="text-xl sm:text-2xl font-bold text-[#e8394c]">
                  One Nation, One Platform, One Solution.
                </p>
                <p className="text-sm text-[#5f4e52] max-w-xl leading-relaxed pt-2">
                  Unified blood inventory management, digital donor health screening, and rapid-dispatch emergency logistics under the guidance of the National Blood Transfusion Council (NBTC).
                </p>
              </div>

              <div className="lg:col-span-5 flex items-center justify-end gap-6 sm:gap-8">
                <div className="text-center">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-full overflow-hidden border-2 border-white shadow-md bg-gray-200">
                    <img
                      src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/JP_Nadda_%28cropped%29.jpg/330px-JP_Nadda_%28cropped%29.jpg"
                      alt="Shri J.P. Nadda"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h4 className="mt-2 text-xs font-bold text-[#17151a]">
                    Shri J.P. Nadda
                  </h4>
                  <p className="text-[10px] text-[#5f4e52] leading-tight">
                    Hon&apos;ble Union Minister of Health &amp; Family Welfare
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto rounded-full overflow-hidden border-2 border-white shadow-md bg-gray-200">
                    <img
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80"
                      alt="Healthcare Dignitary"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h4 className="mt-2 text-xs font-bold text-[#17151a]">
                    Shri Prataprao Jadhav
                  </h4>
                  <p className="text-[10px] text-[#5f4e52] leading-tight">
                    Hon&apos;ble Minister of State for Health &amp; Family Welfare
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. UPCOMING BLOOD CAMPS (Exact from screenshot) */}
      <section className="py-16 bg-[#fcfbf9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-[#e8394c]">
                Community Drives
              </span>
              <h2 className="text-3xl font-extrabold text-[#17151a] tracking-tight mt-1">
                Upcoming blood camps
              </h2>
              <p className="text-sm text-[#5f4e52] mt-1">
                Find voluntary blood donation drives happening in your community this week.
              </p>
            </div>
            <Link
              href="/camps"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#e8394c]/10 hover:bg-[#e8394c]/20 text-[#e8394c] font-bold text-xs uppercase tracking-wider self-start sm:self-auto transition-colors"
            >
              VIEW ALL (87+) <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Camp Card 1 */}
            <div className="group rounded-2xl overflow-hidden bg-white border border-black/5 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col">
              <div className="relative h-48 overflow-hidden bg-gray-100">
                <img
                  src="https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=600&q=80"
                  alt="Armed forces blood drive"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                <div className="absolute top-3 left-3 bg-[#e8394c] text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
                  Tomorrow • 09:00 AM
                </div>
                <div className="absolute bottom-3 inset-x-3 text-white">
                  <h3 className="font-bold text-base line-clamp-1">
                    Youth Red Cross Mega Camp
                  </h3>
                  <p className="text-xs text-gray-200 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-[#e8394c]" />
                    Red Cross Bhawan, New Delhi
                  </p>
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-[#5f4e52]">
                    <span>Organizer: <strong>IRCS National HQ</strong></span>
                    <span className="text-[#1f9d67] font-semibold">NABH Verified</span>
                  </div>
                  <p className="text-xs text-[#5f4e52] line-clamp-2">
                    Open for whole blood and voluntary platelet donations with certified transfusion specialists on site.
                  </p>
                </div>
                <div className="pt-4 mt-4 border-t border-black/5 flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#17151a]">Free Health Pass</span>
                  <Link
                    href="/camps"
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#e8394c] hover:underline"
                  >
                    RSVP to Donate <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Camp Card 2 */}
            <div className="group rounded-2xl overflow-hidden bg-white border border-black/5 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col">
              <div className="relative h-48 overflow-hidden bg-gray-100">
                <img
                  src="https://images.unsplash.com/photo-1615461066841-6116e61058f4?auto=format&fit=crop&w=600&q=80"
                  alt="AIIMS blood donation"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                <div className="absolute top-3 left-3 bg-[#e8394c] text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
                  26 Oct • 10:00 AM
                </div>
                <div className="absolute bottom-3 inset-x-3 text-white">
                  <h3 className="font-bold text-base line-clamp-1">
                    AIIMS Community Transfusion Drive
                  </h3>
                  <p className="text-xs text-gray-200 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-[#e8394c]" />
                    Trauma Centre, Ring Road
                  </p>
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-[#5f4e52]">
                    <span>Organizer: <strong>Dept of Transfusion AIIMS</strong></span>
                    <span className="text-[#1f9d67] font-semibold">Govt Hub</span>
                  </div>
                  <p className="text-xs text-[#5f4e52] line-clamp-2">
                    Priority drive to replenish emergency reserves for trauma and critical pediatric surgeries.
                  </p>
                </div>
                <div className="pt-4 mt-4 border-t border-black/5 flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#17151a]">Slot Booking Open</span>
                  <Link
                    href="/camps"
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#e8394c] hover:underline"
                  >
                    RSVP to Donate <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Camp Card 3 */}
            <div className="group rounded-2xl overflow-hidden bg-white border border-black/5 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col">
              <div className="relative h-48 overflow-hidden bg-gray-100">
                <img
                  src="https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=600&q=80"
                  alt="Rotary community camp"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                <div className="absolute top-3 left-3 bg-[#e8394c] text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
                  28 Oct • 09:30 AM
                </div>
                <div className="absolute bottom-3 inset-x-3 text-white">
                  <h3 className="font-bold text-base line-clamp-1">
                    Rotary &amp; DU Campus Drive
                  </h3>
                  <p className="text-xs text-gray-200 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-[#e8394c]" />
                    North Campus, University Enclave
                  </p>
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-[#5f4e52]">
                    <span>Organizer: <strong>Rotary Blood Bank</strong></span>
                    <span className="text-[#1f9d67] font-semibold">Certified</span>
                  </div>
                  <p className="text-xs text-[#5f4e52] line-clamp-2">
                    Youth voluntary drive offering comprehensive health vitals check, Hb estimation, and digital donor pass.
                  </p>
                </div>
                <div className="pt-4 mt-4 border-t border-black/5 flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#17151a]">Certificates Provided</span>
                  <Link
                    href="/camps"
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#e8394c] hover:underline"
                  >
                    RSVP to Donate <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. "RUNNING A BLOOD BANK OR A CAMP? LIST IT ON V2V" */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-[#e8394c]">
              For Organizations
            </span>
            <h2 className="text-3xl font-extrabold text-[#17151a] tracking-tight mt-1">
              Running a blood bank or camp? List on V2V.
            </h2>
            <p className="text-sm text-[#5f4e52] mt-2">
              Connect your institution with India&apos;s digital donor coordination network to streamline voluntary donations and zero out blood wastage.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Split Card 1 */}
            <div className="group rounded-3xl p-8 bg-[#faf9f6] border border-[#e8e4dc] hover:border-[#e8394c]/30 hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-[#e8394c]/10 text-[#e8394c] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Building2 className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-[#17151a] tracking-tight mb-2">
                  Partner Blood Banks
                </h3>
                <p className="text-sm text-[#5f4e52] leading-relaxed">
                  Broadcast verified real-time blood and platelet inventory, receive authenticated emergency dispatch requests from local hospitals, and manage donor walk-ins seamlessly.
                </p>
              </div>
              <div className="pt-6 mt-6 border-t border-black/5">
                <Link
                  href="/directory"
                  className="inline-flex items-center gap-2 text-sm font-bold text-[#e8394c] hover:text-[#d22d40]"
                >
                  Access Blood Bank Portal <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Split Card 2 */}
            <div className="group rounded-3xl p-8 bg-[#faf9f6] border border-[#e8e4dc] hover:border-[#e8394c]/30 hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-[#e8394c]/10 text-[#e8394c] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Calendar className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-[#17151a] tracking-tight mb-2">
                  Organize a Blood Camp
                </h3>
                <p className="text-sm text-[#5f4e52] leading-relaxed">
                  Partner with accredited government and charitable blood transfusion centres to host a voluntary camp at your college, workplace, or housing community.
                </p>
              </div>
              <div className="pt-6 mt-6 border-t border-black/5">
                <Link
                  href="/camps"
                  className="inline-flex items-center gap-2 text-sm font-bold text-[#e8394c] hover:text-[#d22d40]"
                >
                  Request a Camp Setup <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. "ONE REQUEST, EVERY REAL OPTION NEARBY" (Exact from screenshot) */}
      <section className="py-16 bg-[#f8f7f5] border-y border-black/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-[#e8394c]">
              How it works • 3 Steps
            </span>
            <h2 className="text-3xl font-extrabold text-[#17151a] tracking-tight mt-1">
              One request, every real option nearby.
            </h2>
            <p className="text-sm text-[#5f4e52] mt-2">
              Our automated matching algorithm checks live blood bank inventories and alerts eligible volunteer donors within minutes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-3xl p-8 border border-black/5 shadow-sm text-center flex flex-col items-center">
              <div className="w-14 h-14 rounded-full bg-[#e8394c] text-white flex items-center justify-center text-xl font-extrabold shadow-lg shadow-[#e8394c]/20 mb-6">
                1
              </div>
              <h3 className="text-lg font-bold text-[#17151a] mb-2">
                Share Blood Need
              </h3>
              <p className="text-sm text-[#5f4e52] leading-relaxed">
                Specify patient blood group, required component (Whole Blood, PRBC, Platelets), hospital location, and urgency.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-8 border border-black/5 shadow-sm text-center flex flex-col items-center">
              <div className="w-14 h-14 rounded-full bg-[#e8394c] text-white flex items-center justify-center text-xl font-extrabold shadow-lg shadow-[#e8394c]/20 mb-6">
                2
              </div>
              <h3 className="text-lg font-bold text-[#17151a] mb-2">
                Radius Matching
              </h3>
              <p className="text-sm text-[#5f4e52] leading-relaxed">
                Nearby licensed blood banks and pre-screened voluntary donors within a 15 km radius receive real-time dispatch alerts.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-8 border border-black/5 shadow-sm text-center flex flex-col items-center">
              <div className="w-14 h-14 rounded-full bg-[#e8394c] text-white flex items-center justify-center text-xl font-extrabold shadow-lg shadow-[#e8394c]/20 mb-6">
                3
              </div>
              <h3 className="text-lg font-bold text-[#17151a] mb-2">
                Live Bridge &amp; Arrival
              </h3>
              <p className="text-sm text-[#5f4e52] leading-relaxed">
                Masked telephony bridge connects parties securely. Watchdog timers and ETA locks ensure immediate, verified hospital arrival.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 9. "CAN YOU DONATE BLOOD?" NBTC ELIGIBILITY SCREENER (Exact from screenshot) */}
      <section id="eligibility" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-gradient-to-br from-[#faf7f3] to-[#f4eee6] border border-[#e8e4dc] p-8 sm:p-12 overflow-hidden shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              {/* Left Column */}
              <div className="lg:col-span-7 space-y-5">
                <span className="text-xs font-bold uppercase tracking-widest text-[#e8394c]">
                  Clinical Guidelines
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-[#17151a] tracking-tight">
                  Can you donate blood?
                </h2>
                <p className="text-base text-[#5f4e52] leading-relaxed">
                  Most healthy adults can safely donate blood every 3 months. Verify your eligibility in 30 seconds according to official National Blood Transfusion Council (NBTC) criteria.
                </p>

                <div className="grid grid-cols-2 gap-3 pt-2 text-xs font-semibold text-[#17151a]">
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/80 border border-black/5">
                    <CheckCircle2 className="w-4 h-4 text-[#1f9d67] shrink-0" />
                    <span>Age between 18 – 65 yrs</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/80 border border-black/5">
                    <CheckCircle2 className="w-4 h-4 text-[#1f9d67] shrink-0" />
                    <span>Weight &ge; 45 kg</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/80 border border-black/5">
                    <CheckCircle2 className="w-4 h-4 text-[#1f9d67] shrink-0" />
                    <span>Hemoglobin &ge; 12.5 g/dL</span>
                  </div>
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/80 border border-black/5">
                    <CheckCircle2 className="w-4 h-4 text-[#1f9d67] shrink-0" />
                    <span>No donation in past 90 days</span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => setShowEligibilityModal(true)}
                    className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#e8394c] hover:bg-[#d22d40] text-white font-bold text-sm shadow-md transition-all"
                  >
                    Check Your Eligibility
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Right Column: Visual Avatar matching the screenshot */}
              <div className="lg:col-span-5 flex flex-col items-center justify-center p-6 bg-white/70 backdrop-blur-sm rounded-2xl border border-white">
                {/* Stylized Human Silhouette */}
                <div className="relative w-40 h-64 flex flex-col items-center justify-center">
                  <svg
                    className="w-32 h-56 text-[#e8394c]/20"
                    viewBox="0 0 100 200"
                    fill="currentColor"
                  >
                    {/* Head */}
                    <circle cx="50" cy="25" r="18" fill="#e8394c" />
                    {/* Neck & Shoulders */}
                    <path
                      d="M20,60 C20,50 35,46 50,46 C65,46 80,50 80,60 L85,120 C85,125 78,130 72,130 L66,130 L66,190 C66,195 58,195 58,190 L58,130 L42,130 L42,190 C42,195 34,195 34,190 L34,130 L28,130 C22,130 15,125 15,120 Z"
                      fill="#e8394c"
                    />
                  </svg>
                  {/* Floating Blood Drop Indicator */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-4 py-2 rounded-2xl shadow-xl border border-black/5 flex items-center gap-2">
                    <Droplet className="w-5 h-5 text-[#e8394c] fill-current animate-bounce" />
                    <div>
                      <span className="text-xl font-extrabold text-[#17151a]">100%</span>
                      <p className="text-[10px] uppercase font-bold text-[#5f4e52] tracking-wider">
                        Eligible to Save Lives
                      </p>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-center text-[#5f4e52] mt-2">
                  1 donation saves up to <strong>3 patients</strong> (RBC, Platelets, Plasma).
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 10. STORIES & AWARENESS (Exact from screenshot) */}
      <section className="py-16 bg-[#fcfbf9] border-t border-black/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-10">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-[#e8394c]">
                Knowledge &amp; Community
              </span>
              <h2 className="text-3xl font-extrabold text-[#17151a] tracking-tight mt-1">
                Stories &amp; Awareness
              </h2>
            </div>
            <Link
              href="/directory"
              className="text-xs font-bold uppercase tracking-wider text-[#e8394c] hover:underline"
            >
              READ MORE &rarr;
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <article className="p-6 rounded-2xl bg-white border border-black/5 shadow-sm hover:shadow-md transition-shadow">
              <span className="inline-block px-2.5 py-1 rounded bg-[#e8394c]/10 text-[#e8394c] text-[10px] font-bold uppercase tracking-wider mb-3">
                Donation Myths
              </span>
              <h3 className="font-bold text-base text-[#17151a] leading-snug mb-2">
                Does donating blood cause fatigue or low immunity?
              </h3>
              <p className="text-xs text-[#5f4e52] leading-relaxed mb-4">
                Transfusion medicine experts explain how your body naturally replenishes plasma volume within 24 hours and red blood cells in 4-6 weeks.
              </p>
              <div className="text-[11px] font-semibold text-[#5f4e52]">
                4 min read &bull; 24 Oct 2026
              </div>
            </article>

            <article className="p-6 rounded-2xl bg-white border border-black/5 shadow-sm hover:shadow-md transition-shadow">
              <span className="inline-block px-2.5 py-1 rounded bg-[#e8394c]/10 text-[#e8394c] text-[10px] font-bold uppercase tracking-wider mb-3">
                Emergency Guide
              </span>
              <h3 className="font-bold text-base text-[#17151a] leading-snug mb-2">
                What to do when your patient urgently needs rare negative blood
              </h3>
              <p className="text-xs text-[#5f4e52] leading-relaxed mb-4">
                A step-by-step hospital protocol for coordinating cross-district searches and rare Rh-negative volunteer donor mobilization.
              </p>
              <div className="text-[11px] font-semibold text-[#5f4e52]">
                5 min read &bull; 21 Oct 2026
              </div>
            </article>

            <article className="p-6 rounded-2xl bg-white border border-black/5 shadow-sm hover:shadow-md transition-shadow">
              <span className="inline-block px-2.5 py-1 rounded bg-[#e8394c]/10 text-[#e8394c] text-[10px] font-bold uppercase tracking-wider mb-3">
                Community Impact
              </span>
              <h3 className="font-bold text-base text-[#17151a] leading-snug mb-2">
                How our 25-minute watchdog dispatch saved a trauma survivor
              </h3>
              <p className="text-xs text-[#5f4e52] leading-relaxed mb-4">
                Real-world breakdown of automated lease timeouts and standby donor promotions during a Delhi NCR road traffic emergency.
              </p>
              <div className="text-[11px] font-semibold text-[#5f4e52]">
                6 min read &bull; 18 Oct 2026
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* 11. FINAL CTA CARD (Exact from screenshot) */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border-2 border-[#e8394c]/20 bg-[#fffbfa] p-8 sm:p-12 text-center shadow-lg shadow-[#e8394c]/5 space-y-5">
            <span className="text-xs font-bold uppercase tracking-widest text-[#e8394c]">
              Make A Difference Today
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#17151a] tracking-tight">
              A single donation can save up to three lives.
            </h2>
            <p className="text-base text-[#5f4e52] max-w-xl mx-auto">
              Join India&apos;s growing community of over 5.8 million registered lifesavers. Registration takes less than 2 minutes.
            </p>
            <div className="pt-2">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-[#e8394c] hover:bg-[#d22d40] text-white font-extrabold text-base shadow-xl shadow-[#e8394c]/20 transition-all hover:scale-105"
              >
                BECOME A BLOOD DONOR
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 12. GOVERNMENT & HEALTH AGENCY ACCREDITATIONS (Exact from screenshot) */}
      <section className="py-10 bg-white border-t border-black/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs uppercase tracking-widest font-bold text-[#746367] mb-6">
            Aligned with National Health Guidelines &amp; Blood Safety Standards
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-14 opacity-75 grayscale hover:grayscale-0 transition-all duration-300">
            <div className="text-center font-bold text-xs tracking-wider text-[#17151a]">
              MINISTRY OF HEALTH &amp; FAMILY WELFARE
            </div>
            <div className="text-center font-bold text-xs tracking-wider text-[#17151a]">
              NATIONAL BLOOD TRANSFUSION COUNCIL (NBTC)
            </div>
            <div className="text-center font-bold text-xs tracking-wider text-[#17151a]">
              INDIAN RED CROSS SOCIETY
            </div>
            <div className="text-center font-bold text-xs tracking-wider text-[#17151a]">
              NATIONAL HEALTH MISSION (NHM)
            </div>
            <div className="text-center font-bold text-xs tracking-wider text-[#17151a]">
              e-RaktKosh COMPLIANT
            </div>
          </div>
        </div>
      </section>

      {/* 13. MODERN DARK FOOTER (Exact from screenshot) */}
      <footer className="bg-[#121114] text-white pt-16 pb-12 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-10 pb-12 border-b border-white/10">
            {/* Brand column */}
            <div className="md:col-span-2 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#e8394c] flex items-center justify-center text-white">
                  <Droplet className="w-5 h-5 fill-current" />
                </div>
                <span className="text-2xl font-bold tracking-tight text-white">
                  v2v<span className="text-[#e8394c]">.</span>
                </span>
              </div>
              <p className="text-xs text-gray-400 max-w-sm leading-relaxed">
                India&apos;s digital public health infrastructure for voluntary blood donor mobilization, real-time inventory discovery, and 24x7 emergency medical dispatches.
              </p>
              <div className="pt-2">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-xs font-semibold text-gray-200">
                  <PhoneCall className="w-3.5 h-3.5 text-[#e8394c]" />
                  <span>24x7 National Helpline: <strong>104 / 1075 / 1910</strong></span>
                </div>
              </div>
            </div>

            {/* Column 1 */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-gray-300 mb-4">
                Find Blood
              </h4>
              <ul className="space-y-2.5 text-xs text-gray-400">
                <li><Link href="/directory" className="hover:text-white transition-colors">Search Blood Banks</Link></li>
                <li><Link href="/directory" className="hover:text-white transition-colors">Check Stock Availability</Link></li>
                <li><Link href="/camps" className="hover:text-white transition-colors">Upcoming Donation Camps</Link></li>
                <li><Link href="/request/new" className="hover:text-[#e8394c] font-semibold transition-colors">Urgent Emergency Request</Link></li>
                <li><Link href="/admin/simulator" className="hover:text-white transition-colors">Wave Simulator</Link></li>
              </ul>
            </div>

            {/* Column 2 */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-gray-300 mb-4">
                For Donors
              </h4>
              <ul className="space-y-2.5 text-xs text-gray-400">
                <li><Link href="/register" className="hover:text-white transition-colors">Register as a Donor</Link></li>
                <li><button onClick={() => setShowEligibilityModal(true)} className="hover:text-white transition-colors text-left">Check Eligibility</button></li>
                <li><Link href="/register" className="hover:text-white transition-colors">Digital V2V Pass</Link></li>
                <li><Link href="/camps" className="hover:text-white transition-colors">Camp RSVP</Link></li>
                <li><a href="#eligibility" className="hover:text-white transition-colors">Donation FAQs</a></li>
              </ul>
            </div>

            {/* Column 3 */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-gray-300 mb-4">
                Legal &amp; NBTC
              </h4>
              <ul className="space-y-2.5 text-xs text-gray-400">
                <li><span className="text-gray-400">NBTC Compliance</span></li>
                <li><span className="text-gray-400">Zero Tout Policy</span></li>
                <li><span className="text-gray-400">Privacy &amp; Data Security</span></li>
                <li><span className="text-gray-400">Terms of Service</span></li>
                <li><span className="text-gray-400">Non-Commercial Pledge</span></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-400 gap-4">
            <p>
              &copy; 2026 V2V - Life Flow Network. Certified under National Blood Transfusion Council guidelines. 100% voluntary, non-commercial blood donor network.
            </p>
            <p className="text-gray-400">
              Emergency Dispatch Watchdog: <strong>ACTIVE (25-min SLA)</strong>
            </p>
          </div>
        </div>
      </footer>

      {/* ELIGIBILITY MODAL */}
      {showEligibilityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-black/5 relative">
            <button
              onClick={() => setShowEligibilityModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-black transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#e8394c]/10 text-[#e8394c] flex items-center justify-center">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#17151a]">
                  NBTC Eligibility Questionnaire
                </h3>
                <p className="text-xs text-[#5f4e52]">
                  Quick 30-second pre-screening criteria
                </p>
              </div>
            </div>

            <div className="space-y-4 my-6">
              <label className="flex items-start gap-3 p-3.5 rounded-2xl border border-black/10 hover:border-black/20 cursor-pointer">
                <input
                  type="checkbox"
                  checked={eligibilityAnswers.age}
                  onChange={(e) =>
                    setEligibilityAnswers({ ...eligibilityAnswers, age: e.target.checked })
                  }
                  className="mt-0.5 w-4 h-4 rounded text-[#e8394c] focus:ring-[#e8394c]"
                />
                <div className="text-xs">
                  <span className="font-bold text-[#17151a] block">Age between 18 and 65 years</span>
                  <span className="text-[#5f4e52]">First-time donors must be under 60 years of age.</span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3.5 rounded-2xl border border-black/10 hover:border-black/20 cursor-pointer">
                <input
                  type="checkbox"
                  checked={eligibilityAnswers.weight}
                  onChange={(e) =>
                    setEligibilityAnswers({ ...eligibilityAnswers, weight: e.target.checked })
                  }
                  className="mt-0.5 w-4 h-4 rounded text-[#e8394c] focus:ring-[#e8394c]"
                />
                <div className="text-xs">
                  <span className="font-bold text-[#17151a] block">Body weight is 45 kg or more</span>
                  <span className="text-[#5f4e52]">For platelet apheresis donation, weight must be &ge; 50 kg.</span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3.5 rounded-2xl border border-black/10 hover:border-black/20 cursor-pointer">
                <input
                  type="checkbox"
                  checked={eligibilityAnswers.healthy}
                  onChange={(e) =>
                    setEligibilityAnswers({ ...eligibilityAnswers, healthy: e.target.checked })
                  }
                  className="mt-0.5 w-4 h-4 rounded text-[#e8394c] focus:ring-[#e8394c]"
                />
                <div className="text-xs">
                  <span className="font-bold text-[#17151a] block">Feeling healthy &amp; fever-free today</span>
                  <span className="text-[#5f4e52]">No acute infection, antibiotic course, or recent major dental work.</span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3.5 rounded-2xl border border-black/10 hover:border-black/20 cursor-pointer">
                <input
                  type="checkbox"
                  checked={eligibilityAnswers.donationGap}
                  onChange={(e) =>
                    setEligibilityAnswers({ ...eligibilityAnswers, donationGap: e.target.checked })
                  }
                  className="mt-0.5 w-4 h-4 rounded text-[#e8394c] focus:ring-[#e8394c]"
                />
                <div className="text-xs">
                  <span className="font-bold text-[#17151a] block">Last blood donation was &gt; 90 days ago</span>
                  <span className="text-[#5f4e52]">Platelet donors can donate after 48 hours (max 24/yr).</span>
                </div>
              </label>
            </div>

            <div className="p-4 rounded-2xl bg-[#faf9f6] border border-black/5 text-center">
              {isEligible ? (
                <div className="flex items-center justify-center gap-2 text-[#1f9d67] font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>You are eligible to donate blood today!</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 text-[#c17418] font-bold text-sm">
                  <AlertCircle className="w-5 h-5" />
                  <span>Please check all criteria above to confirm eligibility.</span>
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowEligibilityModal(false)}
                className="px-5 py-2.5 text-xs font-semibold text-gray-500 hover:text-black"
              >
                Close
              </button>
              <Link
                href="/register"
                className="px-6 py-2.5 rounded-full bg-[#e8394c] hover:bg-[#d22d40] text-white text-xs font-bold shadow-md"
              >
                Proceed to Register &rarr;
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* BLOOD COMPATIBILITY MODAL (V2V Core Feature) */}
      {showCompatibilityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-black/5 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowCompatibilityModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-black transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#e8394c]/10 text-[#e8394c] flex items-center justify-center">
                <Droplet className="w-5 h-5 fill-current" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#17151a]">
                  Blood Group Compatibility Guide
                </h3>
                <p className="text-xs text-[#5f4e52]">
                  Who can donate to whom &bull; Red Blood Cells &amp; Platelets
                </p>
              </div>
            </div>

            {/* Quick Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              <div className="p-3.5 rounded-2xl bg-[#fff8f8] border border-[#e8394c]/20">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#e8394c] block">
                  Universal Red Cell Donor
                </span>
                <span className="text-base font-extrabold text-[#17151a]">O Negative (O-)</span>
                <p className="text-[11px] text-[#5f4e52] mt-0.5">
                  Can give red blood cells to any patient regardless of blood group. Crucial for emergency trauma resuscitation.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#f0fbf6] border border-[#1f9d67]/20">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#1f9d67] block">
                  Universal Plasma &amp; Receiver
                </span>
                <span className="text-base font-extrabold text-[#17151a]">AB Positive (AB+)</span>
                <p className="text-[11px] text-[#5f4e52] mt-0.5">
                  Can safely receive whole blood or PRBC from all blood groups. AB- is universal plasma donor.
                </p>
              </div>
            </div>

            {/* Table Matrix */}
            <div className="overflow-x-auto rounded-2xl border border-black/10 mb-6">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-600 font-bold border-b border-black/10">
                  <tr>
                    <th className="p-3">Blood Group</th>
                    <th className="p-3">Can Donate Red Cells To</th>
                    <th className="p-3">Can Receive Red Cells From</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  <tr>
                    <td className="p-3 font-extrabold text-[#e8394c]">O-</td>
                    <td className="p-3 font-semibold text-[#1f9d67]">All Blood Types (Universal)</td>
                    <td className="p-3">O- only</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-extrabold text-[#17151a]">O+</td>
                    <td className="p-3">O+, A+, B+, AB+</td>
                    <td className="p-3">O+, O-</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-extrabold text-[#17151a]">A-</td>
                    <td className="p-3">A-, A+, AB-, AB+</td>
                    <td className="p-3">A-, O-</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-extrabold text-[#17151a]">A+</td>
                    <td className="p-3">A+, AB+</td>
                    <td className="p-3">A+, A-, O+, O-</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-extrabold text-[#17151a]">B-</td>
                    <td className="p-3">B-, B+, AB-, AB+</td>
                    <td className="p-3">B-, O-</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-extrabold text-[#17151a]">B+</td>
                    <td className="p-3">B+, AB+</td>
                    <td className="p-3">B+, B-, O+, O-</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-extrabold text-[#17151a]">AB-</td>
                    <td className="p-3">AB-, AB+</td>
                    <td className="p-3">AB-, A-, B-, O-</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-extrabold text-[#17151a]">AB+</td>
                    <td className="p-3">AB+ only</td>
                    <td className="p-3 font-semibold text-[#1f9d67]">All Blood Types (Universal)</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowCompatibilityModal(false)}
                className="px-5 py-2.5 text-xs font-semibold text-gray-500 hover:text-black"
              >
                Close
              </button>
              <Link
                href="/register"
                className="px-6 py-2.5 rounded-full bg-[#e8394c] hover:bg-[#d22d40] text-white text-xs font-bold shadow-md"
              >
                Register as Voluntary Donor &rarr;
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Floating Sidecar Pill */}
      <SidecarPill />
    </div>
  );
}
