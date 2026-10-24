"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Calendar,
  MapPin,
  Clock,
  Building2,
  PhoneCall,
  Search,
  CheckCircle2,
  Users,
  AlertCircle,
  ExternalLink,
  Droplet,
  Heart,
  Share2,
  Filter,
  ArrowRight
} from "lucide-react";
import SidecarPill from "@/components/SidecarPill";

interface DonationCamp {
  id: string;
  title: string;
  hindiTitle: string;
  venue: string;
  district: string;
  state: string;
  dateStr: string;
  timing: string;
  organizer: string;
  contactPhone: string;
  campType: "Permanent Center" | "Weekend Mega Camp" | "Mobile Donation Bus" | "Hospital Drive";
  targetUnits: number;
  latitude: number;
  longitude: number;
}

const CAMPS_DATA: DonationCamp[] = [
  {
    id: "camp-red-cross-daily",
    title: "Indian Red Cross Society Permanent Voluntary Blood Camp",
    hindiTitle: "भारतीय रेड क्रॉस सोसायटी दैनिक रक्तदान शिविर",
    venue: "Red Cross Bhawan, 1 Red Cross Road, Golf Links, New Delhi 110001",
    district: "Central Delhi",
    state: "Delhi NCR",
    dateStr: "Daily (Mon to Sun)",
    timing: "09:00 AM - 05:00 PM",
    organizer: "National Headquarters Blood Bank",
    contactPhone: "011-23716441",
    campType: "Permanent Center",
    targetUnits: 150,
    latitude: 28.6219,
    longitude: 77.2106
  },
  {
    id: "camp-aiims-community",
    title: "AIIMS Blood Transfusion Medicine Community Outreach",
    hindiTitle: "एम्स सामुदायिक रक्तदान महा-अभियान",
    venue: "Trauma Centre Blood Bank Wing, Ring Road, New Delhi 110029",
    district: "South Delhi",
    state: "Delhi NCR",
    dateStr: "Monday to Saturday",
    timing: "08:30 AM - 07:00 PM",
    organizer: "Department of Transfusion Medicine, AIIMS New Delhi",
    contactPhone: "011-26594444",
    campType: "Hospital Drive",
    targetUnits: 200,
    latitude: 28.5672,
    longitude: 77.2100
  },
  {
    id: "camp-rotary-mega-sunday",
    title: "Rotary Blood Bank Delhi NCR Mega Voluntary Camp",
    hindiTitle: "रोटरी ब्लड बैंक जन रक्तदान शिविर",
    venue: "Plot 56-57, Tughlakabad Institutional Area, Phase II, New Delhi 110062",
    district: "South Delhi",
    state: "Delhi NCR",
    dateStr: "Upcoming Sunday",
    timing: "10:00 AM - 04:00 PM",
    organizer: "Rotary Blood Bank Delhi NCR Central",
    contactPhone: "011-29955771",
    campType: "Weekend Mega Camp",
    targetUnits: 120,
    latitude: 28.5376,
    longitude: 77.2798
  },
  {
    id: "camp-lions-shalimar",
    title: "Lions Club North Delhi Blood Donation Drive",
    hindiTitle: "लायंस क्लब उत्तर दिल्ली रक्तदान शिविर",
    venue: "Lions Blood Bank, Block A, Phase 2, Shalimar Bagh, New Delhi 110088",
    district: "North West Delhi",
    state: "Delhi NCR",
    dateStr: "Every Saturday & Sunday",
    timing: "09:30 AM - 03:30 PM",
    organizer: "Lions Blood Bank & Research Foundation",
    contactPhone: "011-42258491",
    campType: "Weekend Mega Camp",
    targetUnits: 80,
    latitude: 28.7025,
    longitude: 77.1620
  },
  {
    id: "camp-faridabad-civil",
    title: "Civil Hospital BK Chowk Blood Drive (Govt of Haryana)",
    hindiTitle: "सिविल अस्पताल बीके चौक रक्तदान अभियान",
    venue: "BK Civil Hospital Premises, NIT Faridabad 121001",
    district: "Faridabad",
    state: "Haryana",
    dateStr: "Monday to Friday",
    timing: "09:00 AM - 04:00 PM",
    organizer: "District Red Cross Society & Civil Hospital Faridabad",
    contactPhone: "0129-2412600",
    campType: "Hospital Drive",
    targetUnits: 60,
    latitude: 28.4089,
    longitude: 77.3178
  },
  {
    id: "camp-gurugram-van",
    title: "Gurugram Corporate Sector Mobile Blood Donation Van",
    hindiTitle: "गुरुग्राम कॉर्पोरेट मोबाइल ब्लड डोनेशन बस",
    venue: "Cyber City Hub, DLF Phase 2, Gurugram 122002",
    district: "Gurugram",
    state: "Haryana",
    dateStr: "Upcoming Tuesday & Thursday",
    timing: "11:00 AM - 05:00 PM",
    organizer: "Red Cross Blood Van & Haryana Health Mission",
    contactPhone: "0124-2321455",
    campType: "Mobile Donation Bus",
    targetUnits: 90,
    latitude: 28.4907,
    longitude: 77.0898
  }
];

export default function CampsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("ALL");
  const [rsvpModalCamp, setRsvpModalCamp] = useState<DonationCamp | null>(null);
  const [rsvpName, setRsvpName] = useState("");
  const [rsvpPhone, setRsvpPhone] = useState("");
  const [rsvpTime, setRsvpTime] = useState("10:00 AM");
  const [rsvpSuccess, setRsvpSuccess] = useState(false);

  const filteredCamps = useMemo(() => {
    return CAMPS_DATA.filter((camp) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          camp.title.toLowerCase().includes(q) ||
          camp.venue.toLowerCase().includes(q) ||
          camp.organizer.toLowerCase().includes(q);
        if (!matches) return false;
      }

      if (selectedType !== "ALL" && camp.campType !== selectedType) {
        return false;
      }

      if (selectedDistrict !== "ALL" && camp.district !== selectedDistrict) {
        return false;
      }

      return true;
    });
  }, [searchQuery, selectedType, selectedDistrict]);

  const handleRsvpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rsvpName.trim() || rsvpPhone.length < 10) return;
    setRsvpSuccess(true);
    setTimeout(() => {
      setRsvpSuccess(false);
      setRsvpModalCamp(null);
      setRsvpName("");
      setRsvpPhone("");
    }, 2500);
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
              <span>National Voluntary Blood Donation Camps • e-RaktKosh Verified</span>
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
                  Donation Camps
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
            <Link href="/register" className="hover:text-rose-600 transition">
              Register as Donor
            </Link>
            <Link href="/camps" className="text-rose-600 font-bold border-b-2 border-rose-600 pb-0.5">
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
        <div className="max-w-5xl mx-auto text-center">
          <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-1 rounded-full text-xs font-semibold text-rose-200 border border-white/15 mb-3">
            <Calendar className="w-3.5 h-3.5 text-amber-300" />
            <span>Community Blood Donation Drives • Safe, Clean, Licensed</span>
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight mb-3">
            Voluntary Blood Donation Camps
          </h1>
          <p className="text-rose-200 text-sm sm:text-base max-w-2xl mx-auto mb-8">
            Find authorized voluntary blood donation camps near you, schedule your donation slot, and help ensure local hospital blood banks are never empty.
          </p>

          {/* Search & Filter Bar */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 sm:p-5 rounded-2xl shadow-xl max-w-3xl mx-auto text-left">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="relative sm:col-span-2">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search camp venue, organizer, or landmark..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white text-slate-900 rounded-xl text-xs sm:text-sm font-medium placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <select
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  className="w-full py-2.5 px-3 bg-white text-slate-900 rounded-xl text-xs sm:text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-amber-400"
                >
                  <option value="ALL">All Districts</option>
                  <option value="Central Delhi">Central Delhi</option>
                  <option value="South Delhi">South Delhi</option>
                  <option value="North West Delhi">North West Delhi</option>
                  <option value="Faridabad">Faridabad</option>
                  <option value="Gurugram">Gurugram</option>
                </select>
              </div>
            </div>

            {/* Quick Filter Badges */}
            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-white/10 text-xs">
              <span className="font-bold text-rose-200 self-center">Camp Type:</span>
              {[
                { key: "ALL", label: "All Formats" },
                { key: "Weekend Mega Camp", label: "Weekend Mega Camps" },
                { key: "Permanent Center", label: "Permanent Centres" },
                { key: "Hospital Drive", label: "Hospital Drives" },
                { key: "Mobile Donation Bus", label: "Mobile Buses" }
              ].map((t) => (
                <button
                  key={t.key}
                  onClick={() => setSelectedType(t.key)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    selectedType === t.key
                      ? "bg-amber-400 text-slate-950 shadow-sm"
                      : "bg-white/10 text-white hover:bg-white/20"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 4. Camps Listing */}
      <main className="max-w-5xl mx-auto px-4 py-8 w-full flex-1">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">
              Active &amp; Upcoming Camps ({filteredCamps.length})
            </h2>
            <p className="text-xs text-slate-500">Every donation gives someone another birthday</p>
          </div>

          <Link
            href="/register"
            className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1"
          >
            <span>Register as Individual Volunteer</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredCamps.map((camp) => {
            const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${camp.latitude},${camp.longitude}`;

            return (
              <div
                key={camp.id}
                className="bg-white border border-slate-200 hover:border-rose-300 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200">
                      {camp.campType}
                    </span>
                    <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {camp.timing}
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-slate-900 leading-snug mb-1">
                    {camp.title}
                  </h3>
                  <p className="text-xs text-rose-700 font-medium mb-3">{camp.hindiTitle}</p>

                  <div className="space-y-2 text-xs text-slate-600 mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="flex items-start gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                      <span className="font-bold text-slate-800">{camp.dateStr}</span>
                    </p>
                    <p className="flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span>{camp.venue}</span>
                    </p>
                    <p className="flex items-start gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span>Organizer: <strong className="text-slate-800">{camp.organizer}</strong></span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                  <a
                    href={`tel:${camp.contactPhone}`}
                    className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition flex items-center justify-center gap-1.5"
                  >
                    <PhoneCall className="w-3.5 h-3.5 text-rose-600" />
                    <span>Call</span>
                  </a>

                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition flex items-center justify-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-slate-600" />
                    <span>Map</span>
                  </a>

                  <button
                    onClick={() => setRsvpModalCamp(camp)}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-xs"
                  >
                    <Heart className="w-3.5 h-3.5 fill-white" />
                    <span>RSVP to Donate</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* 5. RSVP Modal */}
      {rsvpModalCamp && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            {rsvpSuccess ? (
              <div className="text-center py-6">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg text-slate-900 mb-1">Appointment Confirmed!</h3>
                <p className="text-xs text-slate-500">
                  We have registered your slot for {rsvpModalCamp.title}. An SMS confirmation has been dispatched.
                </p>
              </div>
            ) : (
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 block">
                      Donor Appointment
                    </span>
                    <h3 className="font-bold text-base text-slate-900 leading-snug">
                      {rsvpModalCamp.title}
                    </h3>
                  </div>
                  <button
                    onClick={() => setRsvpModalCamp(null)}
                    className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleRsvpSubmit} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Your Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ankit Sharma"
                      value={rsvpName}
                      onChange={(e) => setRsvpName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">10-Digit Mobile Number</label>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      placeholder="9876543210"
                      value={rsvpPhone}
                      onChange={(e) => setRsvpPhone(e.target.value.replace(/\D/g, ""))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Preferred Time Slot</label>
                    <select
                      value={rsvpTime}
                      onChange={(e) => setRsvpTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                    >
                      <option value="10:00 AM">Morning: 10:00 AM - 11:30 AM</option>
                      <option value="12:00 PM">Noon: 12:00 PM - 01:30 PM</option>
                      <option value="02:30 PM">Afternoon: 02:30 PM - 04:00 PM</option>
                    </select>
                  </div>

                  <div className="pt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setRsvpModalCamp(null)}
                      className="w-1/3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!rsvpName.trim() || rsvpPhone.length < 10}
                      className="w-2/3 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 text-white font-bold transition shadow-xs"
                    >
                      Confirm RSVP
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 6. Footer */}
      <footer className="bg-slate-900 text-slate-400 py-8 px-4 text-xs mt-12 border-t border-slate-800">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-4">
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
