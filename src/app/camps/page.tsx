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
  AlertCircle,
  ExternalLink,
  Droplet,
  Heart,
  ChevronRight
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
    title: "Indian Red Cross Society Permanent Centre",
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
    title: "AIIMS Blood Transfusion Outreach Drive",
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
    title: "Rotary Blood Bank Weekend Mega Camp",
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
    title: "Lions Club North Delhi Blood Drive",
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
    title: "Civil Hospital BK Chowk Blood Drive",
    hindiTitle: "सिविल अस्पताल बीके चौक रक्तदान अभियान",
    venue: "BK Civil Hospital Premises, NIT Faridabad 121001",
    district: "Faridabad",
    state: "Haryana",
    dateStr: "Monday to Friday",
    timing: "09:00 AM - 04:00 PM",
    organizer: "District Red Cross Society & Civil Hospital",
    contactPhone: "0129-2412600",
    campType: "Hospital Drive",
    targetUnits: 60,
    latitude: 28.4089,
    longitude: 77.3178
  },
  {
    id: "camp-gurugram-van",
    title: "Gurugram Corporate Mobile Blood Bus",
    hindiTitle: "गुरुग्राम कॉर्पोरेट मोबाइल ब्लड डोनेशन बस",
    venue: "Cyber City Hub, DLF Phase 2, Gurugram 122002",
    district: "Gurugram",
    state: "Haryana",
    dateStr: "Upcoming Tuesday & Thursday",
    timing: "11:00 AM - 05:00 PM",
    organizer: "Red Cross Blood Van & Health Mission",
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
    }, 2200);
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
                Donation Camps
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
            <Link href="/register" className="hover:text-[var(--accent)] transition">
              Become a Donor
            </Link>
            <Link href="/camps" className="text-[var(--accent)] font-bold">
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

      {/* 2. Hero Section */}
      <section className="bg-[var(--surface)] border-b border-[var(--border)] py-10 px-4 text-center">
        <div className="max-w-[700px] mx-auto">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--accent)] block mb-1">
            Voluntary Donation Drives
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[var(--text)] mb-2">
            Upcoming Blood Camps
          </h1>
          <p className="text-xs sm:text-sm text-[var(--text-dim)] max-w-lg mx-auto mb-6">
            Find certified community blood donation drives organized by Red Cross, AIIMS, and Rotary Clubs.
          </p>

          {/* Search bar */}
          <div className="bg-white border border-[var(--border-strong)] rounded-2xl p-4 shadow-[var(--shadow-card)] max-w-xl mx-auto text-left">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="relative sm:col-span-2">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search camp or organizer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[var(--surface)] text-[var(--text)] rounded-xl text-xs font-medium focus:ring-2 focus:ring-[var(--accent)] focus:outline-hidden border border-[var(--border)]"
                />
              </div>

              <div>
                <select
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  className="w-full py-2 px-2.5 bg-[var(--surface)] text-[var(--text)] rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[var(--accent)] focus:outline-hidden border border-[var(--border)]"
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

            <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-[var(--border)] text-xs">
              {["ALL", "Weekend Mega Camp", "Permanent Center", "Hospital Drive"].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setSelectedType(t)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                    selectedType === t
                      ? "bg-[var(--accent)] text-white shadow-xs"
                      : "bg-[var(--surface)] text-[var(--text-dim)] border border-[var(--border)]"
                  }`}
                >
                  {t === "ALL" ? "All Formats" : t}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 3. Camps Grid */}
      <main className="max-w-[1000px] mx-auto px-4 py-8 w-full flex-1">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-base font-extrabold text-[var(--text)]">
            Active Blood Camps ({filteredCamps.length})
          </h2>
          <Link
            href="/register"
            className="text-xs font-bold text-[var(--accent)] hover:underline flex items-center gap-1"
          >
            <span>Register as Individual Volunteer</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCamps.map((camp) => {
            const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${camp.latitude},${camp.longitude}`;

            return (
              <div
                key={camp.id}
                className="bg-white border border-[var(--border)] rounded-2xl p-5 hover:border-[var(--accent-dim)] transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[var(--surface)] text-[var(--text-dim)] border border-[var(--border)]">
                      {camp.campType}
                    </span>
                    <span className="text-xs text-[var(--text-dim)] font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {camp.timing}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm sm:text-base text-[var(--text)] mb-1">
                    {camp.title}
                  </h3>
                  <p className="text-xs text-[var(--text-dim)] mb-3">
                    {camp.venue}
                  </p>

                  <div className="bg-[var(--surface)] rounded-xl p-3 mb-4 space-y-1.5 text-xs text-[var(--text-dim)]">
                    <p className="flex items-center gap-1.5 font-bold text-[var(--text)]">
                      <Calendar className="w-3.5 h-3.5 text-[var(--accent)]" />
                      <span>{camp.dateStr}</span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>Organizer: <strong className="text-[var(--text)]">{camp.organizer}</strong></span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-[var(--border)] text-xs">
                  <a
                    href={`tel:${camp.contactPhone}`}
                    className="py-2 px-3 rounded-xl bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--text)] font-bold flex items-center justify-center gap-1 transition"
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
                  <button
                    onClick={() => setRsvpModalCamp(camp)}
                    className="flex-1 py-2 px-3 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold flex items-center justify-center gap-1.5 transition shadow-xs"
                  >
                    <Heart className="w-3.5 h-3.5 fill-white" />
                    <span>RSVP Slot</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* 4. Minimal RSVP Modal */}
      {rsvpModalCamp && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-[var(--border)]">
            {rsvpSuccess ? (
              <div className="text-center py-6">
                <div className="w-10 h-10 rounded-full bg-[var(--good-wash)] text-[var(--good)] flex items-center justify-center mx-auto mb-2">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-base text-[var(--text)] mb-1">Slot Reserved!</h3>
                <p className="text-xs text-[var(--text-dim)]">
                  Your appointment at {rsvpModalCamp.title} is confirmed.
                </p>
              </div>
            ) : (
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className="text-[10px] font-bold text-[var(--accent)] uppercase tracking-wider block">
                      Appointment Booking
                    </span>
                    <h3 className="font-bold text-sm text-[var(--text)]">
                      {rsvpModalCamp.title}
                    </h3>
                  </div>
                  <button
                    onClick={() => setRsvpModalCamp(null)}
                    className="text-slate-400 hover:text-slate-600 p-1"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleRsvpSubmit} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-bold text-[var(--text)] mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Vikas Nair"
                      value={rsvpName}
                      onChange={(e) => setRsvpName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--text)] font-medium focus:ring-2 focus:ring-[var(--accent)] focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[var(--text)] mb-1">Mobile Number</label>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      placeholder="9876543210"
                      value={rsvpPhone}
                      onChange={(e) => setRsvpPhone(e.target.value.replace(/\D/g, ""))}
                      className="w-full px-3 py-2 rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--text)] font-medium focus:ring-2 focus:ring-[var(--accent)] focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[var(--text)] mb-1">Time Slot</label>
                    <select
                      value={rsvpTime}
                      onChange={(e) => setRsvpTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--text)] font-medium focus:ring-2 focus:ring-[var(--accent)] focus:outline-hidden"
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
                      className="w-1/3 py-2 rounded-full bg-[var(--surface)] text-[var(--text)] font-semibold border border-[var(--border)]"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!rsvpName.trim() || rsvpPhone.length < 10}
                      className="w-2/3 py-2 rounded-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:bg-slate-200 text-white font-bold transition shadow-xs"
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

      {/* 5. Minimal Footer */}
      <footer className="bg-white border-t border-[var(--border)] py-8 px-4 text-xs text-[var(--text-dim)]">
        <div className="max-w-[1000px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[var(--accent)] text-white">
              <Droplet className="h-3.5 w-3.5 fill-white" />
            </span>
            <span className="font-bold text-[var(--text)]">RaktKhoj</span>
            <span>• Authorized Blood Donation Drives</span>
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
