"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Building2,
  Search,
  MapPin,
  PhoneCall,
  Clock,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  Filter,
  Droplet,
  Compass,
  ArrowRight,
  Activity,
  CheckCircle2,
  Share2,
  Calendar,
  Heart
} from "lucide-react";
import SidecarPill from "@/components/SidecarPill";

interface BloodBankItem {
  id: string;
  name: string;
  category: "Government Hub" | "Regional Central" | "NABH Licensed" | "Charitable Centre";
  state: string;
  district: string;
  address: string;
  contactPhone: string;
  latitude: number;
  longitude: number;
  status: "OPEN 24x7" | "08:00 AM - 08:00 PM";
  stock: Record<string, number>;
  updatedMinutesAgo: number;
  verified: boolean;
}

const EXTENDED_BLOOD_BANKS: BloodBankItem[] = [
  {
    id: "aiims-trauma",
    name: "AIIMS Central Blood Centre, Jai Prakash Narayan Apex Trauma Centre",
    category: "Government Hub",
    state: "Delhi NCR",
    district: "South Delhi",
    address: "Ansari Nagar East, Ring Road, New Delhi 110029",
    contactPhone: "+91-11-2659-4438",
    latitude: 28.5672,
    longitude: 77.2100,
    status: "OPEN 24x7",
    stock: {
      O_POS: 16,
      B_POS: 12,
      A_POS: 9,
      AB_POS: 5,
      O_NEG: 3,
      B_NEG: 2,
      A_NEG: 2,
      AB_NEG: 1,
      BOMBAY_OH: 1,
      SDP: 6
    },
    updatedMinutesAgo: 8,
    verified: true
  },
  {
    id: "safdarjung-rbc",
    name: "Safdarjung Hospital Regional Blood Centre & Transfusion Facility",
    category: "Government Hub",
    state: "Delhi NCR",
    district: "South Delhi",
    address: "Opposite AIIMS, Sri Aurobindo Marg, New Delhi 110029",
    contactPhone: "+91-11-2616-5060",
    latitude: 28.5700,
    longitude: 77.2070,
    status: "OPEN 24x7",
    stock: {
      O_POS: 11,
      B_POS: 14,
      A_POS: 7,
      AB_POS: 4,
      O_NEG: 2,
      B_NEG: 1,
      A_NEG: 1,
      AB_NEG: 0,
      BOMBAY_OH: 0,
      SDP: 3
    },
    updatedMinutesAgo: 19,
    verified: true
  },
  {
    id: "red-cross-nhq",
    name: "Indian Red Cross Society National Headquarters Blood Centre",
    category: "Charitable Centre",
    state: "Delhi NCR",
    district: "Central Delhi",
    address: "1, Red Cross Road, Sansad Marg Area, New Delhi 110001",
    contactPhone: "+91-11-2371-1551",
    latitude: 28.6219,
    longitude: 77.2106,
    status: "OPEN 24x7",
    stock: {
      O_POS: 22,
      B_POS: 18,
      A_POS: 14,
      AB_POS: 7,
      O_NEG: 4,
      B_NEG: 3,
      A_NEG: 3,
      AB_NEG: 2,
      BOMBAY_OH: 0,
      SDP: 5
    },
    updatedMinutesAgo: 5,
    verified: true
  },
  {
    id: "apollo-sarita-vihar",
    name: "Indraprastha Apollo Hospital Blood Bank & Transfusion Medicine",
    category: "NABH Licensed",
    state: "Delhi NCR",
    district: "South East Delhi",
    address: "Delhi-Mathura Road, Sarita Vihar, New Delhi 110076",
    contactPhone: "+91-11-2692-5858",
    latitude: 28.5372,
    longitude: 77.2845,
    status: "OPEN 24x7",
    stock: {
      O_POS: 19,
      B_POS: 15,
      A_POS: 11,
      AB_POS: 6,
      O_NEG: 5,
      B_NEG: 2,
      A_NEG: 2,
      AB_NEG: 1,
      BOMBAY_OH: 0,
      SDP: 8
    },
    updatedMinutesAgo: 12,
    verified: true
  },
  {
    id: "rotary-tughlakabad",
    name: "Rotary Blood Bank Delhi NCR Central Facility",
    category: "Charitable Centre",
    state: "Delhi NCR",
    district: "South Delhi",
    address: "56-57, Institutional Area, Phase II, Tughlakabad, New Delhi 110062",
    contactPhone: "+91-11-4225-8300",
    latitude: 28.5376,
    longitude: 77.2798,
    status: "OPEN 24x7",
    stock: {
      O_POS: 25,
      B_POS: 21,
      A_POS: 16,
      AB_POS: 8,
      O_NEG: 6,
      B_NEG: 4,
      A_NEG: 3,
      AB_NEG: 2,
      BOMBAY_OH: 0,
      SDP: 7
    },
    updatedMinutesAgo: 15,
    verified: true
  },
  {
    id: "fortis-escorts",
    name: "Fortis Escorts Heart Institute Blood Transfusion Centre",
    category: "NABH Licensed",
    state: "Delhi NCR",
    district: "South East Delhi",
    address: "Okhla Road, Sukhdev Vihar Metro Station, New Delhi 110025",
    contactPhone: "+91-11-4713-5000",
    latitude: 28.5606,
    longitude: 77.2789,
    status: "OPEN 24x7",
    stock: {
      O_POS: 8,
      B_POS: 9,
      A_POS: 5,
      AB_POS: 3,
      O_NEG: 1,
      B_NEG: 1,
      A_NEG: 0,
      AB_NEG: 0,
      BOMBAY_OH: 0,
      SDP: 4
    },
    updatedMinutesAgo: 24,
    verified: true
  },
  {
    id: "ganga-ram-hospital",
    name: "Sir Ganga Ram Hospital Department of Blood Transfusion",
    category: "NABH Licensed",
    state: "Delhi NCR",
    district: "Central Delhi",
    address: "Sir Ganga Ram Hospital Marg, Rajinder Nagar, New Delhi 110060",
    contactPhone: "+91-11-2575-0000",
    latitude: 28.6385,
    longitude: 77.1895,
    status: "OPEN 24x7",
    stock: {
      O_POS: 18,
      B_POS: 16,
      A_POS: 12,
      AB_POS: 6,
      O_NEG: 4,
      B_NEG: 3,
      A_NEG: 2,
      AB_NEG: 1,
      BOMBAY_OH: 0,
      SDP: 6
    },
    updatedMinutesAgo: 10,
    verified: true
  },
  {
    id: "lions-blood-bank",
    name: "Lions Blood Bank & Research Foundation",
    category: "Charitable Centre",
    state: "Delhi NCR",
    district: "North West Delhi",
    address: "Plot No. 1, Block A, Phase 2, Shalimar Bagh, New Delhi 110088",
    contactPhone: "+91-11-4225-8491",
    latitude: 28.7025,
    longitude: 77.1620,
    status: "OPEN 24x7",
    stock: {
      O_POS: 14,
      B_POS: 11,
      A_POS: 8,
      AB_POS: 4,
      O_NEG: 2,
      B_NEG: 2,
      A_NEG: 1,
      AB_NEG: 1,
      BOMBAY_OH: 0,
      SDP: 3
    },
    updatedMinutesAgo: 32,
    verified: true
  },
  {
    id: "max-healthcare-saket",
    name: "Max Super Speciality Hospital Blood Bank Centre",
    category: "NABH Licensed",
    state: "Delhi NCR",
    district: "South Delhi",
    address: "1, 2, Press Enclave Road, Saket, New Delhi 110017",
    contactPhone: "+91-11-2651-5050",
    latitude: 28.5273,
    longitude: 77.2117,
    status: "OPEN 24x7",
    stock: {
      O_POS: 15,
      B_POS: 13,
      A_POS: 10,
      AB_POS: 5,
      O_NEG: 3,
      B_NEG: 2,
      A_NEG: 1,
      AB_NEG: 1,
      BOMBAY_OH: 0,
      SDP: 5
    },
    updatedMinutesAgo: 14,
    verified: true
  },
  {
    id: "bksa-faridabad",
    name: "BK Civil Hospital Blood Centre (Govt of Haryana)",
    category: "Government Hub",
    state: "Haryana",
    district: "Faridabad",
    address: "NIT Faridabad, Near Metro Station, Faridabad 121001",
    contactPhone: "+91-129-241-2600",
    latitude: 28.4089,
    longitude: 77.3178,
    status: "OPEN 24x7",
    stock: {
      O_POS: 12,
      B_POS: 10,
      A_POS: 6,
      AB_POS: 3,
      O_NEG: 2,
      B_NEG: 1,
      A_NEG: 1,
      AB_NEG: 0,
      BOMBAY_OH: 0,
      SDP: 2
    },
    updatedMinutesAgo: 45,
    verified: true
  }
];

const BLOOD_GROUPS = [
  { key: "ALL", label: "All Groups" },
  { key: "O_POS", label: "O+" },
  { key: "O_NEG", label: "O-" },
  { key: "A_POS", label: "A+" },
  { key: "A_NEG", label: "A-" },
  { key: "B_POS", label: "B+" },
  { key: "B_NEG", label: "B-" },
  { key: "AB_POS", label: "AB+" },
  { key: "AB_NEG", label: "AB-" },
  { key: "SDP", label: "Platelets (SDP)" },
  { key: "BOMBAY_OH", label: "Bombay (hh)" }
];

const DISTRICT_LIST = [
  "All Districts",
  "South Delhi",
  "Central Delhi",
  "South East Delhi",
  "North West Delhi",
  "Faridabad",
  "Gurugram",
  "Noida"
];

// Reference User Location (e.g. Connaught Place / Central Delhi)
const USER_REF_LAT = 28.6139;
const USER_REF_LNG = 77.2090;

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export default function DirectoryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("ALL");
  const [selectedDistrict, setSelectedDistrict] = useState("All Districts");
  const [maxRadiusKm, setMaxRadiusKm] = useState<number>(30);
  const [only24x7, setOnly24x7] = useState(false);
  const [onlyInStock, setOnlyInStock] = useState(false);

  // Filtered Blood Banks
  const filteredBanks = useMemo(() => {
    return EXTENDED_BLOOD_BANKS.map((bank) => {
      const dist = calculateDistance(USER_REF_LAT, USER_REF_LNG, bank.latitude, bank.longitude);
      return { ...bank, calculatedDistance: dist };
    })
      .filter((bank) => {
        // Query match
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matches =
            bank.name.toLowerCase().includes(q) ||
            bank.address.toLowerCase().includes(q) ||
            bank.district.toLowerCase().includes(q);
          if (!matches) return false;
        }

        // District match
        if (selectedDistrict !== "All Districts" && bank.district !== selectedDistrict) {
          return false;
        }

        // Radius match
        if (bank.calculatedDistance > maxRadiusKm) {
          return false;
        }

        // 24x7 match
        if (only24x7 && bank.status !== "OPEN 24x7") {
          return false;
        }

        // Stock match
        if (selectedGroup !== "ALL") {
          const units = bank.stock[selectedGroup] || 0;
          if (onlyInStock && units <= 0) return false;
        }

        return true;
      })
      .sort((a, b) => a.calculatedDistance - b.calculatedDistance);
  }, [searchQuery, selectedGroup, selectedDistrict, maxRadiusKm, only24x7, onlyInStock]);

  const totalUnitsAvailable = useMemo(() => {
    return filteredBanks.reduce((acc, bank) => {
      if (selectedGroup === "ALL") {
        const sum = Object.values(bank.stock).reduce((s, v) => s + v, 0);
        return acc + sum;
      }
      return acc + (bank.stock[selectedGroup] || 0);
    }, 0);
  }, [filteredBanks, selectedGroup]);

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
              <span>National Blood Directory • e-RaktKosh Verified Centres</span>
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
                  Directory
                </span>
              </div>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-700">
            <Link href="/" className="hover:text-rose-600 transition">
              Home
            </Link>
            <Link href="/directory" className="text-rose-600 font-bold border-b-2 border-rose-600 pb-0.5">
              Blood Bank Directory
            </Link>
            <Link href="/register" className="hover:text-rose-600 transition">
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

      {/* 3. Hero Header & Search Controls */}
      <section className="bg-gradient-to-b from-slate-900 via-rose-950 to-slate-900 text-white py-10 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-1 rounded-full text-xs font-semibold text-rose-200 border border-white/15 mb-3">
              <Building2 className="w-3.5 h-3.5 text-amber-300" />
              <span>Real-Time Government &amp; Hospital Stock Availability</span>
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight mb-3">
              Live Blood Bank Directory
            </h1>
            <p className="text-rose-200 text-sm sm:text-base max-w-2xl mx-auto">
              Find licensed blood centres, verify real-time component availability, and initiate instant V2V emergency dispatch.
            </p>
          </div>

          {/* Search Box & Primary Filter Grid */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 sm:p-6 rounded-2xl shadow-xl max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              {/* Search text */}
              <div className="relative md:col-span-2">
                <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search hospital, blood bank, or locality..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white text-slate-900 rounded-xl text-sm font-medium placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-400 shadow-inner"
                />
              </div>

              {/* District Select */}
              <div>
                <select
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  className="w-full py-3 px-3.5 bg-white text-slate-900 rounded-xl text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-amber-400"
                >
                  {DISTRICT_LIST.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Blood Group Select Chips */}
            <div className="mb-4">
              <span className="text-xs font-bold text-rose-200 uppercase tracking-wider block mb-2">
                Select Blood Group or Component:
              </span>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {BLOOD_GROUPS.map((bg) => (
                  <button
                    key={bg.key}
                    onClick={() => setSelectedGroup(bg.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                      selectedGroup === bg.key
                        ? "bg-amber-400 text-slate-950 shadow-md scale-105"
                        : "bg-white/15 text-white hover:bg-white/25"
                    }`}
                  >
                    {bg.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Secondary Controls: Radius Slider & Toggles */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-white/15 text-xs text-rose-100">
              <div className="flex items-center gap-3">
                <span className="font-semibold">Search Radius:</span>
                <input
                  type="range"
                  min="5"
                  max="50"
                  step="5"
                  value={maxRadiusKm}
                  onChange={(e) => setMaxRadiusKm(Number(e.target.value))}
                  className="accent-amber-400 cursor-pointer w-28 sm:w-36"
                />
                <span className="font-black text-amber-300">{maxRadiusKm} km</span>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={only24x7}
                    onChange={(e) => setOnly24x7(e.target.checked)}
                    className="rounded-sm accent-amber-400 h-4 w-4"
                  />
                  <span>24x7 Only</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={onlyInStock}
                    onChange={(e) => setOnlyInStock(e.target.checked)}
                    className="rounded-sm accent-amber-400 h-4 w-4"
                  />
                  <span>In Stock Only</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Live Results Header Ribbon */}
      <section className="max-w-6xl mx-auto px-4 py-6 w-full flex flex-wrap items-center justify-between gap-4 border-b border-slate-200">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <span>Verified Centres Found:</span>
            <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-sm font-black">
              {filteredBanks.length}
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Showing results within {maxRadiusKm} km • Sorted by shortest transit distance
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span>Total Units ({selectedGroup}): {totalUnitsAvailable}</span>
          </div>

          <Link
            href="/request/new"
            className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition"
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Cannot find? Launch SOS</span>
          </Link>
        </div>
      </section>

      {/* 5. Directory Cards Grid */}
      <main className="max-w-6xl mx-auto px-4 py-8 w-full flex-1">
        {filteredBanks.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center max-w-lg mx-auto shadow-sm">
            <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <Search className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">No Matching Blood Centres</h3>
            <p className="text-sm text-slate-600 mb-6">
              We couldn&apos;t find blood banks matching your current filters within {maxRadiusKm} km. Try expanding your search radius or trigger immediate community donor dispatch.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedGroup("ALL");
                  setSelectedDistrict("All Districts");
                  setMaxRadiusKm(50);
                  setOnlyInStock(false);
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-xl text-xs transition"
              >
                Reset All Filters
              </button>
              <Link
                href="/request/new"
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition"
              >
                Launch Emergency SOS
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredBanks.map((bank) => {
              const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${bank.latitude},${bank.longitude}`;
              const targetUnits =
                selectedGroup === "ALL"
                  ? Object.values(bank.stock).reduce((s, v) => s + v, 0)
                  : bank.stock[selectedGroup] || 0;

              return (
                <div
                  key={bank.id}
                  className="bg-white border border-slate-200 hover:border-rose-300 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Header: Name, Distance & Category */}
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200">
                            {bank.category}
                          </span>
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {bank.status}
                          </span>
                          {bank.verified && (
                            <span className="text-[11px] font-semibold text-rose-600 flex items-center gap-0.5">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              e-RaktKosh
                            </span>
                          )}
                        </div>

                        <h3 className="font-bold text-base text-slate-900 leading-snug">
                          {bank.name}
                        </h3>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-black text-rose-600 bg-rose-50 px-2 py-1 rounded-lg border border-rose-200 inline-block">
                          {bank.calculatedDistance} km
                        </span>
                        <span className="block text-[10px] text-slate-400 mt-0.5">from center</span>
                      </div>
                    </div>

                    {/* Address & Freshness */}
                    <p className="text-xs text-slate-600 flex items-start gap-1.5 mb-3">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span>{bank.address}</span>
                    </p>

                    <div className="text-[11px] text-slate-400 flex items-center gap-2 mb-4">
                      <span>Updated {bank.updatedMinutesAgo}m ago</span>
                      <span>•</span>
                      <span>Contact: {bank.contactPhone}</span>
                    </div>

                    {/* Stock Matrix Display */}
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 mb-4">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
                        <span className="flex items-center gap-1 text-slate-900">
                          <Droplet className="w-3.5 h-3.5 text-rose-600 fill-rose-600" />
                          <span>Component Stock:</span>
                        </span>
                        <span className="text-emerald-700 font-extrabold">
                          {targetUnits} {selectedGroup === "ALL" ? "Total Units" : `${selectedGroup} Units`}
                        </span>
                      </div>

                      <div className="grid grid-cols-5 gap-1.5 text-center">
                        {["O_POS", "B_POS", "A_POS", "AB_POS", "SDP"].map((gKey) => {
                          const units = bank.stock[gKey] || 0;
                          const isTarget = selectedGroup === gKey;
                          return (
                            <div
                              key={gKey}
                              className={`p-1.5 rounded-lg border text-xs ${
                                isTarget
                                  ? "bg-amber-100 border-amber-300 font-black text-amber-950"
                                  : units > 0
                                  ? "bg-white border-slate-200 text-slate-800"
                                  : "bg-slate-100/50 border-slate-100 text-slate-400"
                              }`}
                            >
                              <span className="block text-[10px] font-bold text-slate-500">
                                {gKey === "SDP" ? "SDP" : gKey.replace("_POS", "+").replace("_NEG", "-")}
                              </span>
                              <span className="font-extrabold text-xs">
                                {units > 0 ? `${units}` : "0"}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100">
                    <a
                      href={`tel:${bank.contactPhone}`}
                      className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 transition"
                    >
                      <PhoneCall className="w-3.5 h-3.5 text-rose-600" />
                      <span>Call</span>
                    </a>

                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 transition"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-slate-600" />
                      <span>Directions</span>
                    </a>

                    <Link
                      href={`/request/new?hospital=${encodeURIComponent(bank.name)}&bloodGroup=${selectedGroup !== "ALL" ? selectedGroup : "O_POS"}`}
                      className="py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-xs"
                    >
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>V2V SOS</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* 6. Footer */}
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
            <Link href="/admin/simulator" className="hover:text-white transition">Control Room</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
