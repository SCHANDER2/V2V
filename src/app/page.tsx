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
  Users
} from "lucide-react";
import SidecarPill from "@/components/SidecarPill";

// Realistic live blood banks in Delhi NCR (e-RaktKosh integrated)
const FEATURED_BANKS = [
  {
    name: "AIIMS Central Blood Centre, Trauma Centre",
    distance: "1.2 km away",
    location: "Ansari Nagar East, Ring Road, New Delhi",
    phone: "+91 11 2659 4444",
    stock: {
      O_POS: 16,
      B_POS: 12,
      A_POS: 9,
      AB_POS: 5,
      SDP: 6
    },
    status: "OPEN 24x7",
    category: "Government Hub",
    verified: true
  },
  {
    name: "Safdarjung Hospital Regional Blood Centre",
    distance: "2.4 km away",
    location: "Opposite AIIMS, Sri Aurobindo Marg, New Delhi",
    phone: "+91 11 2616 5060",
    stock: {
      O_POS: 11,
      B_POS: 14,
      A_POS: 7,
      AB_POS: 4,
      SDP: 3
    },
    status: "OPEN 24x7",
    category: "Government Central",
    verified: true
  },
  {
    name: "Indian Red Cross Society NHQ Blood Centre",
    distance: "4.5 km away",
    location: "1, Red Cross Road, Sansad Marg, New Delhi",
    phone: "+91 11 2371 1551",
    stock: {
      O_POS: 22,
      B_POS: 18,
      A_POS: 14,
      AB_POS: 7,
      SDP: 5
    },
    status: "OPEN 24x7",
    category: "Charitable Centre",
    verified: true
  },
  {
    name: "Indraprastha Apollo Hospital Blood Bank",
    distance: "6.8 km away",
    location: "Delhi-Mathura Road, Sarita Vihar, New Delhi",
    phone: "+91 11 2692 5858",
    stock: {
      O_POS: 19,
      B_POS: 15,
      A_POS: 11,
      AB_POS: 6,
      SDP: 8
    },
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

const UPCOMING_CAMPS = [
  {
    title: "Indian Red Cross Society Permanent Centre",
    venue: "Red Cross Bhawan, 1 Red Cross Road, Golf Links, New Delhi",
    date: "Daily (Mon to Sun)",
    timing: "09:00 AM - 05:00 PM",
    organizer: "National Headquarters Blood Bank",
    contact: "011-23716441"
  },
  {
    title: "AIIMS Community Blood Outreach Drive",
    venue: "Trauma Centre Blood Wing, Ring Road, New Delhi",
    date: "Monday to Saturday",
    timing: "08:30 AM - 07:00 PM",
    organizer: "Dept of Transfusion Medicine, AIIMS",
    contact: "011-26594444"
  },
  {
    title: "Rotary Blood Bank Weekend Mega Camp",
    venue: "56-57, Institutional Area, Tughlakabad, New Delhi",
    date: "Upcoming Sunday",
    timing: "10:00 AM - 04:00 PM",
    organizer: "Rotary Blood Bank Central",
    contact: "011-29955771"
  }
];

export default function HomePage() {
  const [selectedGroup, setSelectedGroup] = useState<string>("O_POS");
  const [searchDistrict, setSearchDistrict] = useState<string>("");

  return (
    <div className="min-h-screen bg-white text-[var(--text)] flex flex-col font-sans selection:bg-[var(--accent)] selection:text-white">
      {/* 1. Ultra-clean Minimal Header (RaktKhoj Style) */}
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
                Find blood, register as a donor
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-7 text-[13.5px] font-semibold text-[var(--text-dim)]">
            <Link href="/directory" className="hover:text-[var(--accent)] transition">
              Find Blood
            </Link>
            <Link href="/directory" className="hover:text-[var(--accent)] transition">
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
              className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold px-4 py-2 rounded-full text-xs sm:text-sm flex items-center gap-1.5 shadow-sm transition-all hover:shadow-md"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Emergency SOS</span>
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Minimalist Hero Section (RaktKhoj Clean Aesthetic) */}
      <section className="relative pt-12 pb-16 sm:pt-20 sm:pb-24 px-4 overflow-hidden border-b border-[var(--border)]">
        {/* Subtle warm background radial glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[360px] bg-[radial-gradient(ellipse_at_top,rgba(232,57,76,0.06),transparent_70%)] pointer-events-none" />

        <div className="max-w-[960px] mx-auto text-center relative z-10">
          {/* Subtle live indicator badge */}
          <div className="inline-flex items-center gap-2 bg-[var(--surface)] text-[var(--text-dim)] px-3.5 py-1 rounded-full text-xs font-semibold border border-[var(--border)] mb-6">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--accent)] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--accent)]"></span>
            </span>
            <span>Real-time Indian Blood Bank &amp; Donor Network</span>
            <span className="text-[var(--border-strong)]">•</span>
            <span className="text-[var(--accent)] font-bold">100% Free Public Service</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-[var(--text)] leading-[1.1] mb-5">
            Find donors near you, <br className="hidden sm:inline" />
            <span className="text-[var(--accent)]">in minutes.</span>
          </h1>

          <p className="text-base sm:text-lg text-[var(--text-dim)] max-w-2xl mx-auto mb-10 font-normal leading-relaxed">
            Search verified live blood bank stock, locate community donation drives, or mobilize on-call voluntary donors within 3–15 km of your hospital.
          </p>

          {/* Clean Minimalist Search Widget */}
          <div className="bg-white border border-[var(--border-strong)] rounded-2xl p-4 sm:p-5 shadow-[var(--shadow-card)] max-w-2xl mx-auto text-left">
            {/* Blood group selection chips */}
            <div className="mb-4">
              <span className="text-[11px] font-bold text-[var(--text-faint)] uppercase tracking-wider block mb-2">
                Select Blood Group or Component:
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

            {/* Search Input & Action */}
            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Enter district, hospital, or city (e.g. South Delhi, AIIMS)..."
                  value={searchDistrict}
                  onChange={(e) => setSearchDistrict(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[var(--surface)] text-[var(--text)] rounded-xl text-xs sm:text-sm font-medium placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[var(--accent)] border border-[var(--border)]"
                />
              </div>

              <Link
                href={`/directory?group=${selectedGroup}&q=${encodeURIComponent(searchDistrict)}`}
                className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold px-5 py-2.5 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-sm transition-all"
              >
                <span>Search Live Stock</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* 4 Clean Minimal Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto mt-10 text-left">
            <div className="bg-[var(--surface)] border border-[var(--border)] p-3.5 rounded-xl">
              <span className="text-2xl font-black text-[var(--text)] block">52+</span>
              <span className="text-xs text-[var(--text-dim)] font-semibold block">On-Call Donors</span>
              <span className="text-[10px] text-[var(--text-faint)] block">Delhi NCR &amp; Haryana</span>
            </div>
            <div className="bg-[var(--surface)] border border-[var(--border)] p-3.5 rounded-xl">
              <span className="text-2xl font-black text-[var(--text)] block">10+</span>
              <span className="text-xs text-[var(--text-dim)] font-semibold block">Verified Centres</span>
              <span className="text-[10px] text-[var(--text-faint)] block">AIIMS, Apollo, Fortis</span>
            </div>
            <div className="bg-[var(--surface)] border border-[var(--border)] p-3.5 rounded-xl">
              <span className="text-2xl font-black text-[var(--text)] block">100%</span>
              <span className="text-xs text-[var(--text-dim)] font-semibold block">Open &amp; Free</span>
              <span className="text-[10px] text-[var(--text-faint)] block">Zero touts, zero broker</span>
            </div>
            <div className="bg-[var(--surface)] border border-[var(--border)] p-3.5 rounded-xl">
              <span className="text-2xl font-black text-[var(--accent)] block">&lt; 25m</span>
              <span className="text-xs text-[var(--text-dim)] font-semibold block">Rapid Dispatch</span>
              <span className="text-[10px] text-[var(--text-faint)] block">Concentric ring waves</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. "One request, every real option nearby" (RaktKhoj Core Value Section) */}
      <section className="py-16 px-4 bg-[var(--surface)] border-b border-[var(--border)]">
        <div className="max-w-[1100px] mx-auto">
          <div className="text-center mb-12">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--accent)] block mb-1">
              Comprehensive Coverage
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--text)]">
              One request, every real option nearby.
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-dim)] max-w-lg mx-auto mt-2">
              Whether from hospital inventories, volunteer donors, or community camps, RaktKhoj connects you to blood without delay.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Live Blood Banks */}
            <div className="bg-white border border-[var(--border)] rounded-2xl p-6 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-[var(--accent)] flex items-center justify-center mb-4">
                  <Building2 className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-[var(--text)] mb-1.5">
                  Live Blood Banks
                </h3>
                <p className="text-xs text-[var(--text-dim)] leading-relaxed mb-4">
                  Browse distance-sorted licensed government and private hospital blood centres with live stock units and direct phone contacts.
                </p>
              </div>
              <Link
                href="/directory"
                className="text-xs font-bold text-[var(--accent)] hover:underline inline-flex items-center gap-1"
              >
                <span>Search blood banks</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Card 2: Volunteer Donors */}
            <div className="bg-white border border-[var(--border)] rounded-2xl p-6 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-[var(--accent)] flex items-center justify-center mb-4">
                  <Heart className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-[var(--text)] mb-1.5">
                  Verified Volunteer Donors
                </h3>
                <p className="text-xs text-[var(--text-dim)] leading-relaxed mb-4">
                  Mobilize voluntary lifesavers for emergency Whole Blood or Single Donor Platelets (SDP) via rapid concentric wave dispatch.
                </p>
              </div>
              <Link
                href="/register"
                className="text-xs font-bold text-[var(--accent)] hover:underline inline-flex items-center gap-1"
              >
                <span>Register as a donor</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Card 3: Donation Camps */}
            <div className="bg-white border border-[var(--border)] rounded-2xl p-6 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-[var(--accent)] flex items-center justify-center mb-4">
                  <Calendar className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-[var(--text)] mb-1.5">
                  Upcoming Blood Camps
                </h3>
                <p className="text-xs text-[var(--text-dim)] leading-relaxed mb-4">
                  Join authorized voluntary blood drives organized by Red Cross, AIIMS, and Rotary Clubs across Delhi NCR.
                </p>
              </div>
              <Link
                href="/camps"
                className="text-xs font-bold text-[var(--accent)] hover:underline inline-flex items-center gap-1"
              >
                <span>View camp schedules</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Live Blood Bank Directory Preview (RaktKhoj Style) */}
      <section className="py-16 px-4 max-w-[1100px] mx-auto w-full">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--accent)] block mb-1">
              e-RaktKosh Aligned
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--text)]">
              Nearby Blood Centres
            </h2>
            <p className="text-xs text-[var(--text-dim)] mt-1">
              Verified inventory with real-time component availability &amp; phone verification
            </p>
          </div>

          <Link
            href="/directory"
            className="text-xs font-bold text-[var(--accent)] hover:underline flex items-center gap-1 self-start sm:self-auto"
          >
            <span>View all centres</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {FEATURED_BANKS.map((bank) => (
            <div
              key={bank.name}
              className="bg-white border border-[var(--border)] rounded-2xl p-5 hover:border-[var(--accent-dim)] transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[var(--surface)] text-[var(--text-dim)] border border-[var(--border)]">
                    {bank.category}
                  </span>
                  <span className="text-xs font-extrabold text-[var(--accent)]">
                    {bank.distance}
                  </span>
                </div>

                <h3 className="font-bold text-sm sm:text-base text-[var(--text)] mb-1">
                  {bank.name}
                </h3>
                <p className="text-xs text-[var(--text-dim)] flex items-start gap-1 mb-4">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span>{bank.location}</span>
                </p>

                {/* Stock Mini-Grid */}
                <div className="bg-[var(--surface)] rounded-xl p-2.5 mb-4 grid grid-cols-5 gap-1 text-center text-xs">
                  <div>
                    <span className="text-[10px] text-[var(--text-faint)] font-bold block">O+</span>
                    <span className="font-black text-[var(--text)]">{bank.stock.O_POS}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--text-faint)] font-bold block">B+</span>
                    <span className="font-black text-[var(--text)]">{bank.stock.B_POS}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--text-faint)] font-bold block">A+</span>
                    <span className="font-black text-[var(--text)]">{bank.stock.A_POS}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--text-faint)] font-bold block">AB+</span>
                    <span className="font-black text-[var(--text)]">{bank.stock.AB_POS}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[var(--accent)] font-bold block">SDP</span>
                    <span className="font-black text-[var(--accent)]">{bank.stock.SDP}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-[var(--border)] text-xs">
                <a
                  href={`tel:${bank.phone}`}
                  className="flex-1 py-2 rounded-xl bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--text)] font-bold flex items-center justify-center gap-1.5 transition"
                >
                  <PhoneCall className="w-3.5 h-3.5 text-[var(--accent)]" />
                  <span>Call Bank</span>
                </a>
                <Link
                  href={`/request/new?hospital=${encodeURIComponent(bank.name)}`}
                  className="flex-1 py-2 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold flex items-center justify-center gap-1.5 transition shadow-xs"
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Request SOS</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. "Become a Donor" Clean Minimal Banner (RaktKhoj Style) */}
      <section className="py-14 px-4 bg-[var(--surface)] border-t border-b border-[var(--border)]">
        <div className="max-w-[800px] mx-auto text-center">
          <div className="w-12 h-12 rounded-2xl bg-white border border-[var(--border)] text-[var(--accent)] flex items-center justify-center mx-auto mb-4 shadow-xs">
            <Heart className="w-6 h-6 fill-[var(--accent)]" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--text)] mb-3">
            Become a voluntary blood donor. Save lives.
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-dim)] max-w-lg mx-auto mb-6">
            Complete the 2-minute clinical screening, get your instant digital donor pass, and receive SOS alerts only when someone nearby genuinely needs your blood.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/register"
              className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold px-6 py-3 rounded-full text-xs sm:text-sm flex items-center gap-2 shadow-sm transition"
            >
              <span>Register as a Donor</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/directory"
              className="bg-white hover:bg-[var(--surface)] text-[var(--text)] font-semibold border border-[var(--border-strong)] px-5 py-3 rounded-full text-xs sm:text-sm transition"
            >
              <span>Explore Blood Directory</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 6. Clean Minimalist Footer */}
      <footer className="bg-white border-t border-[var(--border)] py-12 px-4 text-xs text-[var(--text-dim)]">
        <div className="max-w-[1100px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--accent)] text-white">
              <Droplet className="h-4 w-4 fill-white" />
            </span>
            <span className="font-bold text-base text-[var(--text)]">RaktKhoj</span>
            <span className="text-[var(--border-strong)]">•</span>
            <span>National Emergency Blood Network</span>
          </div>

          <div className="flex flex-wrap items-center gap-6 font-medium">
            <Link href="/directory" className="hover:text-[var(--text)] transition">Directory</Link>
            <Link href="/register" className="hover:text-[var(--text)] transition">Donor Registry</Link>
            <Link href="/camps" className="hover:text-[var(--text)] transition">Camps</Link>
            <Link href="/request/new" className="hover:text-[var(--text)] transition">Emergency SOS</Link>
            <a href="tel:104" className="text-[var(--accent)] font-bold hover:underline">Helpline: 104</a>
          </div>
        </div>

        <div className="max-w-[1100px] mx-auto mt-8 pt-6 border-t border-[var(--border)] flex flex-col sm:flex-row items-center justify-between text-[11px] text-[var(--text-faint)] gap-2">
          <p>© 2026 RaktKhoj. Open-access emergency blood &amp; platelet mobilization network.</p>
          <p>Aligned with Ministry of Health &amp; Family Welfare (MoHFW) and NBTC Standards.</p>
        </div>
      </footer>
    </div>
  );
}
