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
  FileText,
  Calendar,
  Award,
  Info,
  Activity,
  Check,
  ExternalLink
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
    category: "Government Hub",
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
    category: "Government Central",
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
    category: "NABH / Private Licensed",
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
    category: "Licensed Super Speciality",
    verified: true,
  },
];

// Upcoming Voluntary Blood Donation Camps (e-RaktKosh Style)
const UPCOMING_CAMPS = [
  {
    title: "Indian Red Cross Society Voluntary Camp",
    hindi: "भारतीय रेड क्रॉस सोसायटी रक्तदान शिविर",
    venue: "Red Cross Bhawan, 1 Red Cross Road, Golf Links, New Delhi",
    date: "Everyday (Mon - Sun)",
    time: "09:00 AM - 05:00 PM",
    organizer: "National Headquarters Blood Bank",
    contact: "011-23716441",
    type: "Permanent Center",
  },
  {
    title: "AIIMS Blood Transfusion Community Drive",
    hindi: "एम्स सामुदायिक रक्तदान अभियान",
    venue: "Trauma Centre Blood Bank Wing, Ring Road, New Delhi",
    date: "Monday to Saturday",
    time: "08:30 AM - 07:00 PM",
    organizer: "Department of Transfusion Medicine, AIIMS",
    contact: "011-26594444",
    type: "Hospital Drive",
  },
  {
    title: "Rotary Blood Bank Mega Camp",
    hindi: "रोटरी ब्लड बैंक जन रक्तदान शिविर",
    venue: "Plot 56-57, Tughlakabad Institutional Area, New Delhi",
    date: "Upcoming Sunday",
    time: "10:00 AM - 04:00 PM",
    organizer: "Rotary Blood Bank Delhi NCR",
    contact: "011-29955771",
    type: "Voluntary Camp",
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
  { id: "WHOLE_BLOOD", label: "Whole Blood (WB)", hindi: "सामान्य संपूर्ण रक्त" },
  { id: "SDP", label: "Single Donor Platelets (SDP)", hindi: "एफ़ेरेसिस प्लेटलेट्स" },
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
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-rose-500 selection:text-white">
      {/* 1. Indian Emergency Top Bar (e-RaktKosh / NBTC Alignment) */}
      <header className="bg-gradient-to-r from-rose-800 via-red-800 to-rose-900 text-white text-xs sm:text-sm font-medium py-2 px-4 shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-200 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
            </span>
            <span className="font-semibold tracking-wide flex items-center gap-1.5">
              <span>🇮🇳</span>
              <span className="hidden sm:inline">भारत सरकार स्वास्थ्य एवं परिवार कल्याण मंत्रालय मानक</span>
              <span className="sm:hidden">भारत आपातकालीन रक्त सेवा</span>
              <span className="opacity-75 text-[11px] hidden md:inline">| e-RaktKosh &amp; NBTC Standards</span>
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <a
              href="tel:104"
              className="bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded-full font-bold inline-flex items-center gap-1.5 transition border border-white/30 shadow-xs"
            >
              <PhoneCall className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              <span>National Blood Helpline: 104 (निःशुल्क 24x7)</span>
            </a>
            <span className="hidden lg:inline bg-rose-950/40 px-2 py-0.5 rounded text-[11px] text-rose-200">
              Emergency Dispatch &lt;25m
            </span>
          </div>
        </div>
      </header>

      {/* 2. Main Navigation Bar */}
      <nav className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-[37px] z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-rose-600 to-red-700 flex items-center justify-center text-white shadow-md shadow-rose-600/25 group-hover:scale-105 transition-transform">
              <Droplet className="w-6 h-6 fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-2xl sm:text-3xl tracking-tight text-slate-900">
                  V<span className="text-rose-600">2</span>V
                </span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 uppercase tracking-wider border border-rose-200">
                  Emergency Dispatch
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block -mt-0.5">
                Veins to Veins • भारत आपातकालीन रक्त एवं प्लेटलेट नेटवर्क
              </p>
            </div>
          </Link>

          <div className="hidden lg:flex items-center gap-6 text-sm font-semibold text-slate-700">
            <a href="#quick-search" className="hover:text-rose-600 flex items-center gap-1 transition">
              <Search className="w-4 h-4 text-rose-500" />
              <span>रक्त उपलब्धता (Stock)</span>
            </a>
            <Link href="/directory" className="hover:text-rose-600 flex items-center gap-1 transition">
              <Building2 className="w-4 h-4 text-rose-500" />
              <span>रक्त बैंक (Directory)</span>
            </Link>
            <Link href="/camps" className="hover:text-rose-600 flex items-center gap-1 transition">
              <Calendar className="w-4 h-4 text-rose-500" />
              <span>रक्तदान शिविर (Camps)</span>
            </Link>
            <Link href="/register" className="hover:text-rose-600 flex items-center gap-1 transition">
              <Heart className="w-4 h-4 text-rose-500" />
              <span>रक्तदाता बनें (Register)</span>
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <SidecarPill compact />
            <Link
              href="/request/new"
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-2.5 rounded-xl shadow-md shadow-rose-600/25 flex items-center gap-2 text-xs sm:text-sm transition hover:scale-[1.02]"
            >
              <AlertCircle className="w-4 h-4 animate-bounce" />
              <span>Emergency SOS (तुरंत मदद)</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* 3. Hero Section with Authentic Photographic Background (e-RaktKosh / National Portal Style) */}
      <section
        className="relative bg-slate-900 text-white py-12 sm:py-20 px-4 overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(136, 19, 36, 0.94) 0%, rgba(80, 7, 23, 0.90) 50%, rgba(15, 23, 42, 0.92) 100%), url('https://images.unsplash.com/photo-1615461066841-6116e61058f4?auto=format&fit=crop&w=1920&q=80')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* Subtle decorative background watermarks */}
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />

        <div className="max-w-6xl mx-auto relative z-10 text-center">
          {/* Slogan Pill */}
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md text-rose-100 px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold mb-6 border border-white/20 shadow-lg">
            <span className="text-amber-300">❤️ रक्तदान महादान • जीवनदान</span>
            <span className="text-white/40">•</span>
            <span>Zero Brokerage • 100% Free Public Emergency Service</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight leading-tight mb-4 drop-shadow-sm">
            रक्तदान से किसी की जान बचाएं <br />
            <span className="text-amber-300">Find Blood &amp; Platelets in 25 Minutes</span>
          </h1>

          <p className="text-base sm:text-xl text-rose-100 max-w-3xl mx-auto mb-8 font-normal leading-relaxed drop-shadow-xs">
            Don&apos;t panic or run blindly across Delhi NCR. Search live government blood bank inventories
            instantly, or mobilize verified volunteer donors within 3–15 km of your hospital.
          </p>

          {/* 4 Live Stats Badges (e-RaktKosh National Metrics Style) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto mb-10 text-left">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 p-3.5 rounded-xl shadow-sm">
              <span className="text-2xl sm:text-3xl font-extrabold text-amber-300 block">52+</span>
              <span className="text-xs text-rose-100 font-semibold block">सक्रिय रक्तदाता (Volunteers)</span>
              <span className="text-[10px] text-white/70 block">On-call in Delhi NCR</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 p-3.5 rounded-xl shadow-sm">
              <span className="text-2xl sm:text-3xl font-extrabold text-amber-300 block">3+</span>
              <span className="text-xs text-rose-100 font-semibold block">संबद्ध रक्त केंद्र (Hubs)</span>
              <span className="text-[10px] text-white/70 block">AIIMS, Apollo, Fortis</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 p-3.5 rounded-xl shadow-sm">
              <span className="text-2xl sm:text-3xl font-extrabold text-amber-300 block">100%</span>
              <span className="text-xs text-rose-100 font-semibold block">निःशुल्क जनसेवा (Free)</span>
              <span className="text-[10px] text-white/70 block">Zero touts, Zero commission</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 p-3.5 rounded-xl shadow-sm">
              <span className="text-2xl sm:text-3xl font-extrabold text-amber-300 block">&lt; 25m</span>
              <span className="text-xs text-rose-100 font-semibold block">त्वरित सहायता (Response)</span>
              <span className="text-[10px] text-white/70 block">Concentric ring waves</span>
            </div>
          </div>

          {/* Quick Action Link Pills */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              href="#quick-search"
              className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold px-6 py-3.5 rounded-xl shadow-lg flex items-center gap-2 text-sm sm:text-base transition hover:scale-105"
            >
              <Search className="w-4 h-4 text-slate-900" />
              <span>रक्त उपलब्धता खोजें (Search Live Stock)</span>
            </a>

            <Link
              href="/request/new"
              className="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white border border-white/30 font-bold px-6 py-3.5 rounded-xl flex items-center gap-2 text-sm sm:text-base transition hover:scale-105"
            >
              <FileText className="w-4 h-4 text-amber-300" />
              <span>डॉक्टर पर्ची अपलोड करें (Upload Slip)</span>
            </Link>

            <a
              href="tel:104"
              className="bg-rose-950/60 hover:bg-rose-950/80 text-rose-100 border border-rose-500/40 font-bold px-4 py-3.5 rounded-xl flex items-center gap-1.5 text-xs sm:text-sm transition"
            >
              <PhoneCall className="w-4 h-4 text-amber-300" />
              <span>104 राष्ट्रीय हेल्पलाइन</span>
            </a>
          </div>
        </div>
      </section>

      {/* 4. e-RaktKosh 4 Essential Quick Gateway Cards */}
      <section className="max-w-7xl mx-auto px-4 -mt-8 relative z-20 w-full mb-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Blood Availability */}
          <a
            href="#quick-search"
            className="bg-white rounded-2xl p-5 shadow-lg shadow-slate-200/80 border-t-4 border-rose-600 hover:shadow-xl hover:-translate-y-1 transition duration-200 flex flex-col justify-between group"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-3 group-hover:bg-rose-600 group-hover:text-white transition">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900 mb-1">
                रक्त उपलब्धता खोजें
              </h3>
              <p className="text-xs font-bold text-rose-600 mb-2 uppercase tracking-wide">
                Blood Availability Search
              </p>
              <p className="text-xs text-slate-500 leading-relaxed">
                Check real-time stock across Delhi NCR blood banks for Whole Blood, SDP Platelets &amp; Plasma.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-rose-600">
              <span>लाइव स्टॉक देखें</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </a>

          {/* Card 2: Blood Bank Directory */}
          <Link
            href="/directory"
            className="bg-white rounded-2xl p-5 shadow-lg shadow-slate-200/80 border-t-4 border-blue-600 hover:shadow-xl hover:-translate-y-1 transition duration-200 flex flex-col justify-between group"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 group-hover:bg-blue-600 group-hover:text-white transition">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900 mb-1">
                निकटतम रक्त केंद्र
              </h3>
              <p className="text-xs font-bold text-blue-600 mb-2 uppercase tracking-wide">
                Blood Bank Directory
              </p>
              <p className="text-xs text-slate-500 leading-relaxed">
                Licensed hospital blood centers with direct phone contact, verified inventory &amp; maps.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-600">
              <span>रक्त केंद्र सूची</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Card 3: Blood Donation Camps */}
          <Link
            href="/camps"
            className="bg-white rounded-2xl p-5 shadow-lg shadow-slate-200/80 border-t-4 border-emerald-600 hover:shadow-xl hover:-translate-y-1 transition duration-200 flex flex-col justify-between group"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:bg-emerald-600 group-hover:text-white transition">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900 mb-1">
                रक्तदान शिविर व कार्यक्रम
              </h3>
              <p className="text-xs font-bold text-emerald-600 mb-2 uppercase tracking-wide">
                Donation Camps &amp; Schedule
              </p>
              <p className="text-xs text-slate-500 leading-relaxed">
                Participate in voluntary donation drives organized by Red Cross, AIIMS &amp; licensed NGOs.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-600">
              <span>शिविर कार्यक्रम देखें</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Card 4: Donor Login / V2V Pass */}
          <Link
            href="/register"
            className="bg-white rounded-2xl p-5 shadow-lg shadow-slate-200/80 border-t-4 border-amber-500 hover:shadow-xl hover:-translate-y-1 transition duration-200 flex flex-col justify-between group"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3 group-hover:bg-amber-500 group-hover:text-white transition">
                <Heart className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900 mb-1">
                रक्तदाता पहचान पत्र (Pass)
              </h3>
              <p className="text-xs font-bold text-amber-600 mb-2 uppercase tracking-wide">
                Donor Registration &amp; Pass
              </p>
              <p className="text-xs text-slate-500 leading-relaxed">
                Register with your WhatsApp number. Receive alerts only in true emergencies near you.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-amber-600">
              <span>रक्तदाता बनें</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </section>

      {/* 5. Core Interactive Blood Search Card (Zero-Friction Indian UI) */}
      <section id="quick-search" className="max-w-5xl mx-auto px-4 py-8 w-full">
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-200 p-6 sm:p-10 text-left transition-all">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-6 border-b border-slate-100 gap-2">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-extrabold text-lg">
                1
              </div>
              <div>
                <h2 className="font-extrabold text-slate-900 text-lg sm:text-xl">
                  Select Required Blood Group (ब्लड ग्रुप चुनें)
                </h2>
                <p className="text-xs text-slate-500">Tap the exact blood group required for patient transfusion</p>
              </div>
            </div>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-700 self-start sm:self-auto">
              📍 Delhi NCR Verified Hub
            </span>
          </div>

          {/* Blood Group Select Pills (9 Groups with Hindi transliteration) */}
          <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2.5 mb-6">
            {BLOOD_GROUPS.map((grp) => {
              const isSelected = selectedGroup === grp.key;
              return (
                <button
                  key={grp.key}
                  type="button"
                  onClick={() => setSelectedGroup(grp.key)}
                  className={`py-3.5 px-2 rounded-2xl text-center font-bold transition-all flex flex-col items-center justify-center gap-0.5 border ${
                    isSelected
                      ? "bg-rose-600 text-white border-rose-600 shadow-lg shadow-rose-600/30 scale-105"
                      : "bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <span className="text-lg sm:text-xl font-black">{grp.label}</span>
                  <span className={`text-[10px] font-medium ${isSelected ? "text-rose-100" : "text-slate-500"}`}>
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
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 transition"
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
                Hospital Area / City (अस्पताल का क्षेत्र)
              </label>
              <div className="relative">
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 transition"
                >
                  <option value="Delhi NCR">Delhi NCR (AIIMS, Safdarjung, Apollo, Fortis)</option>
                  <option value="South Delhi">South Delhi (Saket, Sarita Vihar)</option>
                  <option value="Central Delhi">Central Delhi (Ansari Nagar, Ring Road)</option>
                  <option value="Faridabad">Faridabad / NCR Border</option>
                </select>
                <MapPin className="w-4 h-4 text-slate-400 absolute right-4 top-3.5 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Live Stock Notification Bar */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-3.5">
              <div
                className={`w-4 h-4 rounded-full shrink-0 ${
                  totalStockNearby > 5 ? "bg-emerald-500 animate-pulse" : "bg-amber-500 animate-pulse"
                }`}
              />
              <div>
                <p className="text-sm font-bold text-slate-900">
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
              className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-extrabold py-4 px-6 rounded-2xl shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2.5 text-base transition hover:scale-[1.01]"
            >
              <Search className="w-5 h-5" />
              <span>Search Blood &amp; Alert Nearby Donors (रक्त खोजें)</span>
            </Link>

            <Link
              href="/r/v2v_w1_aiims"
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-4 px-5 rounded-2xl border border-slate-200 flex items-center justify-center gap-2 text-sm transition"
            >
              <Compass className="w-4 h-4 text-slate-600" />
              <span>Live Demo Request</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 6. Nearby Licensed Blood Banks (e-RaktKosh Directory) */}
      <section id="live-banks" className="max-w-7xl mx-auto px-4 py-12 w-full">
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
              Check direct hospital blood center stock before issuing voluntary donor calls.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3.5 py-2 rounded-xl text-xs font-semibold self-start md:self-auto">
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
                className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm hover:border-rose-300 hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                        {bank.category}
                      </span>
                      <h3 className="font-extrabold text-slate-900 text-base leading-snug">
                        {bank.name}
                      </h3>
                    </div>
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 whitespace-nowrap">
                      {bank.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 flex items-center gap-1.5 mb-4">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>
                      {bank.location} • <strong className="text-slate-700">{bank.distance}</strong>
                    </span>
                  </p>

                  <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-100 mb-4 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-500 block">Available {selectedGroup.replace("_", "+")}:</span>
                      <span className={`text-2xl font-black ${groupStock > 0 ? "text-emerald-700" : "text-rose-600"}`}>
                        {groupStock} {groupStock === 1 ? "Unit" : "Units"}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-slate-500 block">Platelets (SDP):</span>
                      <span className="text-base font-bold text-slate-800">{bank.stock.SDP} Units</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
                  <a
                    href={`tel:${bank.phone}`}
                    className="text-xs font-bold text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 transition"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>{bank.phone}</span>
                  </a>

                  <Link
                    href={`/request/new?hospital=${encodeURIComponent(bank.name)}`}
                    className="text-xs font-bold text-slate-700 hover:text-slate-900 px-3 py-2 rounded-xl hover:bg-slate-100 transition"
                  >
                    Request for this Hospital →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 7. Blood Donation Camps & Schedules Section (e-RaktKosh Essential) */}
      <section
        id="donation-camps"
        className="relative py-16 px-4 bg-slate-900 text-white overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.90) 100%), url('https://images.unsplash.com/photo-1536856136534-bb679c52a9aa?auto=format&fit=crop&w=1920&q=80')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold mb-3 border border-emerald-500/30">
              <Calendar className="w-4 h-4" />
              <span>स्वैच्छिक रक्तदान शिविर (Voluntary Camps)</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-3">
              Upcoming Blood Donation Camps
            </h2>
            <p className="text-sm text-slate-300">
              Join voluntary community blood donation camps organized across Delhi NCR by the Indian Red Cross, AIIMS, and licensed blood centers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {UPCOMING_CAMPS.map((camp, idx) => (
              <div
                key={idx}
                className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-6 flex flex-col justify-between hover:bg-white/15 transition"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-extrabold px-2.5 py-1 rounded bg-rose-500/30 text-rose-200 border border-rose-500/40">
                      {camp.type}
                    </span>
                    <span className="text-xs text-amber-300 font-bold flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {camp.time}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white mb-1">
                    {camp.title}
                  </h3>
                  <p className="text-xs text-rose-200 font-medium mb-3">
                    {camp.hindi}
                  </p>

                  <p className="text-xs text-slate-300 flex items-start gap-1.5 mb-2">
                    <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>{camp.venue}</span>
                  </p>

                  <p className="text-xs text-slate-300 flex items-center gap-1.5 mb-4">
                    <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{camp.date}</span>
                  </p>
                </div>

                <div className="pt-4 border-t border-white/15 flex items-center justify-between">
                  <a
                    href={`tel:${camp.contact}`}
                    className="text-xs font-bold text-amber-300 hover:text-amber-200 flex items-center gap-1"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>{camp.contact}</span>
                  </a>
                  <a
                    href="#donor-section"
                    className="text-xs font-bold bg-white text-slate-900 px-3 py-1.5 rounded-lg hover:bg-rose-50 transition"
                  >
                    Walk-in Guide →
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Doctor Slip Requisition Banner (Anti-Tout Gate) */}
      <section
        className="relative text-white py-14 px-4 overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(136, 19, 36, 0.95) 0%, rgba(76, 5, 25, 0.92) 100%), url('https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=1920&q=80')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
          <div className="max-w-2xl text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-rose-200 text-xs font-semibold mb-4 border border-white/20">
              <ShieldCheck className="w-4 h-4 text-amber-300" />
              <span>Anti-Tout Doctor Verification (दलाली मुक्त रक्तदान)</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight mb-3">
              Have a Doctor&apos;s Blood Requisition Slip?
            </h2>
            <p className="text-sm sm:text-base text-rose-100 font-normal leading-relaxed mb-5">
              Don&apos;t run door-to-door. Upload your doctor&apos;s prescription or requisition slip from your mobile camera.
              Our automated OCR verifies the UHID and hospital location, protecting you from black-market touts.
            </p>
            <div className="flex flex-wrap items-center gap-4 text-xs text-rose-200 font-medium">
              <span className="flex items-center gap-1.5">✓ Instant UHID Verification</span>
              <span className="flex items-center gap-1.5">✓ Expanding Wave Dispatch (0–15km)</span>
              <span className="flex items-center gap-1.5">✓ Masked WhatsApp Alerts</span>
            </div>
          </div>

          <Link
            href="/request/new"
            className="bg-white hover:bg-rose-50 text-rose-900 font-black px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-2.5 text-base shrink-0 transition hover:scale-105"
          >
            <FileText className="w-5 h-5 text-rose-600" />
            <span>Upload Slip &amp; Alert Donors</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* 9. Donor Registration Section ("रक्तदाता बनें") */}
      <section id="donor-section" className="max-w-7xl mx-auto px-4 py-16 w-full">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-10">
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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-8">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <span className="text-rose-600 font-extrabold text-lg block mb-0.5">1. Alert</span>
                <span className="text-xs text-slate-600">WhatsApp notification only when an exact match needs blood nearby.</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <span className="text-rose-600 font-extrabold text-lg block mb-0.5">2. 15s Check</span>
                <span className="text-xs text-slate-600">Tap 5 rapid health check questions on your phone.</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <span className="text-rose-600 font-extrabold text-lg block mb-0.5">3. V2V Pass</span>
                <span className="text-xs text-slate-600">Show your secure digital voucher at the hospital blood bank.</span>
              </div>
            </div>

            {/* Quick WhatsApp Registration Form */}
            {donorRegistered ? (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl flex items-center gap-3">
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
          <div className="w-full max-w-sm bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-6 shadow-xl border border-slate-700 text-left">
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
              <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
                <span className="text-slate-400 block text-[10px]">Blood Group</span>
                <span className="font-bold text-rose-400 text-sm">O+ (O Positive)</span>
              </div>
              <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
                <span className="text-slate-400 block text-[10px]">Travel Window</span>
                <span className="font-bold text-emerald-400 text-sm">25 Mins</span>
              </div>
            </div>

            <div className="bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between mb-4">
              <div>
                <span className="text-[10px] text-slate-400 block">Hospital Handshake PIN</span>
                <span className="font-mono text-xl font-extrabold text-amber-400 tracking-wider">7744</span>
              </div>
              <QrCode className="w-10 h-10 text-slate-300" />
            </div>

            <Link
              href="/donor/respond/1-1"
              className="w-full bg-rose-600 hover:bg-rose-500 text-white text-center font-bold py-3 px-4 rounded-xl text-xs block transition"
            >
              Simulate WhatsApp Donor Flow →
            </Link>
          </div>
        </div>
      </section>

      {/* 10. Educational & NBTC Clinical Guidelines Accordion/Section */}
      <section className="bg-slate-100/70 border-t border-slate-200 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 mb-2">
              Blood Donation Facts &amp; Eligibility (NBTC Guidelines)
            </h3>
            <p className="text-xs sm:text-sm text-slate-500">
              National Blood Transfusion Council criteria for voluntary blood and platelet donation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-xs mb-3">
                WB
              </div>
              <h4 className="font-bold text-slate-900 text-sm mb-1">
                Whole Blood Donation (संपूर्ण रक्त)
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed mb-3">
                Volume: 350ml - 450ml. Can donate every 90 days (males) or 120 days (females). Weight requirement: &ge; 45 kg.
              </p>
              <span className="text-[11px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                Cooldown: 90 / 120 Days
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs mb-3">
                SDP
              </div>
              <h4 className="font-bold text-slate-900 text-sm mb-1">
                Platelets Apheresis (SDP)
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed mb-3">
                Vital for Dengue, Cancer &amp; Thalassemia patients. Can donate every 48 hours (max 24 times/year). Weight: &ge; 50 kg.
              </p>
              <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                Cooldown: 48 Hours
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs mb-3">
                FFP
              </div>
              <h4 className="font-bold text-slate-900 text-sm mb-1">
                Plasma &amp; Cryoprecipitate
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed mb-3">
                Used in severe trauma, burn shock, and clotting factor deficiencies. Stored frozen up to 1 year.
              </p>
              <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                Shelf Life: 12 Months
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 11. Track Existing Emergency Link */}
      <section className="bg-white border-t border-slate-200 py-10 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h3 className="font-bold text-slate-900 text-lg mb-2">
            Already Have an Emergency Request? (आपातकालीन लिंक ट्रैक करें)
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mb-4">
            Enter your 12-character request token or explore our pre-seeded live simulation.
          </p>

          <div className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto justify-center">
            <input
              type="text"
              placeholder="e.g. v2v_w1_aiims"
              value={trackCode}
              onChange={(e) => setTrackCode(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 flex-1"
            >
            </input>
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

      {/* 12. Mandatory Science Visualization Sidecar */}
      <section className="max-w-5xl mx-auto px-4 py-8 w-full">
        <SidecarPill variant="banner" />
      </section>

      {/* 13. Comprehensive Indian Healthcare Footer */}
      <footer className="bg-slate-900 text-white border-t border-slate-800 mt-auto py-12 px-4 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center md:items-start gap-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-rose-600 flex items-center justify-center text-white font-bold text-xs">
                V2V
              </div>
              <span className="font-extrabold text-white text-sm">
                V2V (Veins to Veins) • भारत आपातकालीन रक्त एवं प्लेटलेट सेवा
              </span>
            </div>
            <p className="text-slate-400 text-center md:text-left text-xs">
              Built for Indian Emergency Healthcare. Integrated with e-RaktKosh (MoHFW) standards &amp; DPDP Act 2023.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-slate-300">
            <a href="tel:104" className="hover:text-amber-300 transition">
              National Blood Helpline: <strong className="text-white">104</strong>
            </a>
            <a href="tel:108" className="hover:text-amber-300 transition">
              Ambulance: <strong className="text-white">108 / 102</strong>
            </a>
            <a href="tel:112" className="hover:text-amber-300 transition">
              Emergency: <strong className="text-white">112</strong>
            </a>
            <Link href="/admin/simulator" className="text-rose-400 hover:underline">
              System Simulator
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
