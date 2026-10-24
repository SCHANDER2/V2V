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
  Droplet,
  ArrowRight,
  ChevronRight,
  Filter
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
  { key: "SDP", label: "Platelets (SDP)" }
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

const USER_REF_LAT = 28.6139;
const USER_REF_LNG = 77.2090;

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
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

  const filteredBanks = useMemo(() => {
    return EXTENDED_BLOOD_BANKS.map((bank) => {
      const dist = calculateDistance(USER_REF_LAT, USER_REF_LNG, bank.latitude, bank.longitude);
      return { ...bank, calculatedDistance: dist };
    })
      .filter((bank) => {
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matches =
            bank.name.toLowerCase().includes(q) ||
            bank.address.toLowerCase().includes(q) ||
            bank.district.toLowerCase().includes(q);
          if (!matches) return false;
        }

        if (selectedDistrict !== "All Districts" && bank.district !== selectedDistrict) {
          return false;
        }

        if (bank.calculatedDistance > maxRadiusKm) {
          return false;
        }

        if (only24x7 && bank.status !== "OPEN 24x7") {
          return false;
        }

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
                Directory
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-7 text-[13.5px] font-semibold text-[var(--text-dim)]">
            <Link href="/" className="hover:text-[var(--accent)] transition">
              Home
            </Link>
            <Link href="/directory" className="text-[var(--accent)] font-bold">
              Blood Banks
            </Link>
            <Link href="/register" className="hover:text-[var(--accent)] transition">
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

      {/* 2. Directory Hero & Filter Bar */}
      <section className="bg-[var(--surface)] border-b border-[var(--border)] py-10 px-4">
        <div className="max-w-[1000px] mx-auto">
          <div className="text-center mb-8">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--accent)] block mb-1">
              Live e-RaktKosh Directory
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--text)] mb-2">
              Find Blood Banks Near You
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-dim)] max-w-lg mx-auto">
              Real-time component inventory across licensed hospital blood centres. Sorted by proximity.
            </p>
          </div>

          {/* Minimal Filter Widget */}
          <div className="bg-white border border-[var(--border-strong)] rounded-2xl p-4 sm:p-5 shadow-[var(--shadow-card)]">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              <div className="relative md:col-span-2">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search blood bank, hospital, or locality..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[var(--surface)] text-[var(--text)] rounded-xl text-xs sm:text-sm font-medium placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[var(--accent)] border border-[var(--border)]"
                />
              </div>

              <div>
                <select
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  className="w-full py-2.5 px-3 bg-[var(--surface)] text-[var(--text)] rounded-xl text-xs sm:text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-[var(--accent)] border border-[var(--border)]"
                >
                  {DISTRICT_LIST.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Blood group chips */}
            <div className="mb-4">
              <span className="text-[11px] font-bold text-[var(--text-faint)] uppercase tracking-wider block mb-2">
                Filter by Blood Group / Component:
              </span>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {BLOOD_GROUPS.map((bg) => (
                  <button
                    key={bg.key}
                    type="button"
                    onClick={() => setSelectedGroup(bg.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      selectedGroup === bg.key
                        ? "bg-[var(--accent)] text-white shadow-xs scale-105"
                        : "bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--text)] border border-[var(--border)]"
                    }`}
                  >
                    {bg.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Radius slider & toggles */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-[var(--border)] text-xs text-[var(--text-dim)]">
              <div className="flex items-center gap-3">
                <span className="font-semibold">Radius:</span>
                <input
                  type="range"
                  min="5"
                  max="50"
                  step="5"
                  value={maxRadiusKm}
                  onChange={(e) => setMaxRadiusKm(Number(e.target.value))}
                  className="accent-[var(--accent)] cursor-pointer w-28 sm:w-36"
                />
                <span className="font-bold text-[var(--accent)]">{maxRadiusKm} km</span>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={only24x7}
                    onChange={(e) => setOnly24x7(e.target.checked)}
                    className="accent-[var(--accent)] rounded-sm h-3.5 w-3.5"
                  />
                  <span>24x7 Only</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={onlyInStock}
                    onChange={(e) => setOnlyInStock(e.target.checked)}
                    className="accent-[var(--accent)] rounded-sm h-3.5 w-3.5"
                  />
                  <span>In Stock Only</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Results Ribbon */}
      <section className="max-w-[1000px] mx-auto px-4 py-5 w-full flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)]">
        <div>
          <h2 className="text-base font-extrabold text-[var(--text)] flex items-center gap-2">
            <span>Verified Blood Centres:</span>
            <span className="px-2 py-0.5 rounded-full bg-[var(--accent-wash)] text-[var(--accent)] text-xs font-black">
              {filteredBanks.length}
            </span>
          </h2>
          <p className="text-[11px] text-[var(--text-faint)] mt-0.5">
            Within {maxRadiusKm} km of Central Delhi • Live inventory availability
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="bg-[var(--good-wash)] text-[var(--good)] px-3 py-1 rounded-full text-xs font-bold">
            Total Units Available: {totalUnitsAvailable}
          </div>
          <Link
            href="/request/new"
            className="text-xs font-bold text-[var(--accent)] hover:underline flex items-center gap-1"
          >
            <span>Need emergency blood?</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>

      {/* 4. Directory Grid */}
      <main className="max-w-[1000px] mx-auto px-4 py-8 w-full flex-1">
        {filteredBanks.length === 0 ? (
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-12 text-center max-w-md mx-auto">
            <Building2 className="w-10 h-10 text-[var(--text-faint)] mx-auto mb-3" />
            <h3 className="text-base font-bold text-[var(--text)] mb-1">No Matching Centres Found</h3>
            <p className="text-xs text-[var(--text-dim)] mb-4">
              Try increasing your radius or clearing blood group filters.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedGroup("ALL");
                setSelectedDistrict("All Districts");
                setMaxRadiusKm(50);
              }}
              className="px-4 py-2 bg-[var(--accent)] text-white text-xs font-bold rounded-full"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredBanks.map((bank) => {
              const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${bank.latitude},${bank.longitude}`;

              return (
                <div
                  key={bank.id}
                  className="bg-white border border-[var(--border)] rounded-2xl p-5 hover:border-[var(--accent-dim)] transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[var(--surface)] text-[var(--text-dim)] border border-[var(--border)]">
                          {bank.category}
                        </span>
                        <span className="text-[10px] font-bold text-[var(--good)] bg-[var(--good-wash)] px-2 py-0.5 rounded-md">
                          {bank.status}
                        </span>
                      </div>
                      <span className="text-xs font-extrabold text-[var(--accent)] shrink-0">
                        {bank.calculatedDistance} km
                      </span>
                    </div>

                    <h3 className="font-bold text-sm sm:text-base text-[var(--text)] mb-1">
                      {bank.name}
                    </h3>
                    <p className="text-xs text-[var(--text-dim)] flex items-start gap-1 mb-3">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span>{bank.address}</span>
                    </p>

                    {/* Stock Grid */}
                    <div className="bg-[var(--surface)] rounded-xl p-2.5 mb-4 grid grid-cols-5 gap-1 text-center text-xs">
                      {["O_POS", "B_POS", "A_POS", "AB_POS", "SDP"].map((gKey) => {
                        const units = bank.stock[gKey] || 0;
                        const isMatch = selectedGroup === gKey;
                        return (
                          <div
                            key={gKey}
                            className={`p-1 rounded-lg ${
                              isMatch ? "bg-[var(--accent)] text-white" : ""
                            }`}
                          >
                            <span className={`text-[10px] font-bold block ${isMatch ? "text-white/80" : "text-[var(--text-faint)]"}`}>
                              {gKey === "SDP" ? "SDP" : gKey.replace("_POS", "+")}
                            </span>
                            <span className="font-black text-xs">{units}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-[var(--border)] text-xs">
                    <a
                      href={`tel:${bank.contactPhone}`}
                      className="flex-1 py-2 rounded-xl bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--text)] font-bold flex items-center justify-center gap-1.5 transition"
                    >
                      <PhoneCall className="w-3.5 h-3.5 text-[var(--accent)]" />
                      <span>Call</span>
                    </a>
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--text)] transition"
                    >
                      <ExternalLink className="w-4 h-4 text-slate-500" />
                    </a>
                    <Link
                      href={`/request/new?hospital=${encodeURIComponent(bank.name)}`}
                      className="flex-1 py-2 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold flex items-center justify-center gap-1.5 transition shadow-xs"
                    >
                      <span>Request SOS</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* 5. Minimal Footer */}
      <footer className="bg-white border-t border-[var(--border)] py-8 px-4 text-xs text-[var(--text-dim)]">
        <div className="max-w-[1000px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[var(--accent)] text-white">
              <Droplet className="h-3.5 w-3.5 fill-white" />
            </span>
            <span className="font-bold text-[var(--text)]">RaktKhoj</span>
            <span>• Verified Blood Directory</span>
          </div>
          <div className="flex gap-4">
            <Link href="/" className="hover:text-[var(--text)] transition">Home</Link>
            <Link href="/directory" className="hover:text-[var(--text)] transition">Directory</Link>
            <Link href="/register" className="hover:text-[var(--text)] transition">Donor Registry</Link>
            <Link href="/camps" className="hover:text-[var(--text)] transition">Camps</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
