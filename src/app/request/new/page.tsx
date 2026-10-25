// src/app/request/new/page.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import {
  ShieldAlert,
  Camera,
  CheckCircle2,
  AlertTriangle,
  Upload,
  LocateFixed,
  FileText,
  Radio,
  Info,
  Lock,
  ChevronRight,
  RefreshCw,
  Phone,
  Droplet,
  ArrowLeft,
  Building2,
  PhoneCall
} from "lucide-react";

import { BloodGroup, Component, RequestMode } from "@/types/enums";
import { mockRequisitionVerifierOCR } from "@/lib/adapters/mocks/mockRequisitionVerifierOCR";
import { mockEraktKoshAdapter } from "@/lib/adapters/mocks/mockEraktKoshAdapter";
import { OCRVerificationResult } from "@/lib/adapters/interfaces/ocr.interface";
import { ERaktKoshStockPreview } from "@/lib/adapters/interfaces/eraktkosh.interface";
import SidecarPill from "@/components/SidecarPill";
import { useLanguage } from "@/context/LanguageContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";

// Pre-calibrated Delhi NCR premier medical centres
const DELHI_NCR_HOSPITALS = [
  {
    id: "aiims",
    name: "AIIMS Delhi, Trauma Centre",
    lat: 28.5672,
    lng: 77.2100,
    area: "Ansari Nagar East, New Delhi",
  },
  {
    id: "apollo",
    name: "Indraprastha Apollo Hospital",
    lat: 28.5401,
    lng: 77.2832,
    area: "Sarita Vihar, South Delhi",
  },
  {
    id: "fortis_faridabad",
    name: "Fortis Escorts Hospital Faridabad",
    lat: 28.4089,
    lng: 77.3178,
    area: "Neelam Bata Road, Faridabad",
  },
  {
    id: "safdarjung",
    name: "Safdarjung Hospital",
    lat: 28.5924,
    lng: 77.2210,
    area: "Ring Road, New Delhi",
  },
  {
    id: "max_saket",
    name: "Max Super Speciality Hospital, Saket",
    lat: 28.5276,
    lng: 77.2120,
    area: "Saket Institutional Area, New Delhi",
  },
] as const;

export default function EmergencyRequestNewPage() {
  const router = useRouter();
  const { language, t } = useLanguage();

  // Core Form State
  const [patientName, setPatientName] = useState("");
  const [patientUhid, setPatientUhid] = useState("");
  const [hospitalName, setHospitalName] = useState("");
  const [selectedHospitalPreset, setSelectedHospitalPreset] = useState<string>("aiims");
  const [hospitalLat, setHospitalLat] = useState<number>(28.5672);
  const [hospitalLng, setHospitalLng] = useState<number>(77.2100);
  const [component, setComponent] = useState<Component>(Component.WHOLE_BLOOD);
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>(BloodGroup.O_POS);
  const [requestMode, setRequestMode] = useState<RequestMode>(RequestMode.REPLACEMENT_ANY);
  const [unitsNeeded, setUnitsNeeded] = useState<number>(1);

  // Geolocation state
  const [isLocating, setIsLocating] = useState(false);
  const [locationNotice, setLocationNotice] = useState<string | null>(null);

  // Live OCR Simulation State
  const [isScanningSlip, setIsScanningSlip] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStageText, setScanStageText] = useState("");
  const [ocrResult, setOcrResult] = useState<OCRVerificationResult | null>(null);
  const [ocrError, setOcrError] = useState<string | null>(null);

  // Live e-RaktKosh Preview State
  const [stockPreview, setStockPreview] = useState<ERaktKoshStockPreview | null>(null);
  const [isCheckingStock, setIsCheckingStock] = useState(false);
  const stockDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  // Initial preset configuration
  useEffect(() => {
    const defaultHosp = DELHI_NCR_HOSPITALS[0];
    setHospitalName(defaultHosp.name);
    setHospitalLat(defaultHosp.lat);
    setHospitalLng(defaultHosp.lng);
  }, []);

  // NBTC Rule Enforcement: When component is SDP, lock requestMode to EXACT_OR_SDP
  useEffect(() => {
    if (component === Component.SDP) {
      setRequestMode(RequestMode.EXACT_OR_SDP);
    }
  }, [component]);

  // Debounced Live e-RaktKosh Stock Preview
  useEffect(() => {
    if (stockDebounceRef.current) {
      clearTimeout(stockDebounceRef.current);
    }

    if (!hospitalLat || !hospitalLng) return;

    setIsCheckingStock(true);
    stockDebounceRef.current = setTimeout(async () => {
      try {
        const preview = await mockEraktKoshAdapter.getStockPreview(
          hospitalLat,
          hospitalLng,
          component,
          bloodGroup
        );
        setStockPreview(preview);
      } catch (err: any) {
        console.error("e-RaktKosh stock preview failed:", err);
      } finally {
        setIsCheckingStock(false);
      }
    }, 500);

    return () => {
      if (stockDebounceRef.current) {
        clearTimeout(stockDebounceRef.current);
      }
    };
  }, [hospitalLat, hospitalLng, component, bloodGroup]);

  // Hospital preset dropdown change handler
  const handleHospitalPresetChange = (presetId: string) => {
    setSelectedHospitalPreset(presetId);
    if (presetId === "custom") {
      setHospitalName("");
      setHospitalLat(0);
      setHospitalLng(0);
      return;
    }

    const match = DELHI_NCR_HOSPITALS.find((h) => h.id === presetId);
    if (match) {
      setHospitalName(match.name);
      setHospitalLat(match.lat);
      setHospitalLng(match.lng);
      setLocationNotice(null);
    }
  };

  // Browser Geolocation Detection
  const handleDetectGPS = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setLocationNotice("Geolocation is not supported by your browser. Please select a hospital preset.");
      return;
    }

    setIsLocating(true);
    setLocationNotice("Detecting your current hospital coordinates via GPS...");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const lat = parseFloat(pos.coords.latitude.toFixed(6));
        const lng = parseFloat(pos.coords.longitude.toFixed(6));
        setHospitalLat(lat);
        setHospitalLng(lng);
        setSelectedHospitalPreset("custom");
        setLocationNotice(`GPS Acquired: ${lat}°N, ${lng}°E (Accuracy ±${pos.coords.accuracy.toFixed(0)}m)`);
      },
      (err) => {
        setIsLocating(false);
        setLocationNotice(`GPS detection failed (${err.message}). Defaulted to AIIMS Delhi.`);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Live OCR Requisition Slip Simulation Handler
  const runOCRSimulation = async (
    presetType: "VALID_AIIMS_SDP" | "VALID_APOLLO_PRBC" | "MISSING_STAMP" | "BLURRY_UNREADABLE",
    fileName?: string
  ) => {
    setIsScanningSlip(true);
    setScanProgress(15);
    setScanStageText("Uploading requisition slip image...");
    setOcrError(null);

    try {
      await new Promise((r) => setTimeout(r, 200));
      setScanProgress(45);
      setScanStageText("Analyzing document structure & optical contrast...");

      await new Promise((r) => setTimeout(r, 200));
      setScanProgress(75);
      setScanStageText("Extracting clinical text, doctor seal & MCI registration...");

      await new Promise((r) => setTimeout(r, 200));
      setScanProgress(100);
      setScanStageText("Verifying NBTC prescription compliance...");

      const result = await mockRequisitionVerifierOCR.verifyRequisition({
        simulatedPreset: presetType,
        fileName: fileName || "doctor_requisition_slip.jpg",
      });

      setOcrResult(result);

      if (result.isValidRequisition && result.fields) {
        if (result.fields.patientName) setPatientName(result.fields.patientName);
        if (result.fields.patientUhid) setPatientUhid(result.fields.patientUhid);
        if (result.fields.hospitalName) {
          setHospitalName(result.fields.hospitalName);
          const matched = DELHI_NCR_HOSPITALS.find((h) =>
            result.fields.hospitalName!.toLowerCase().includes(h.name.toLowerCase().split(",")[0].toLowerCase())
          );
          if (matched) {
            setSelectedHospitalPreset(matched.id);
            setHospitalLat(matched.lat);
            setHospitalLng(matched.lng);
          }
        }
        if (result.fields.component && Object.values(Component).includes(result.fields.component as Component)) {
          setComponent(result.fields.component as Component);
        }
        if (result.fields.bloodGroup && Object.values(BloodGroup).includes(result.fields.bloodGroup as BloodGroup)) {
          setBloodGroup(result.fields.bloodGroup as BloodGroup);
        }
        if (result.fields.unitsNeeded) {
          setUnitsNeeded(Math.max(1, Math.min(10, result.fields.unitsNeeded)));
        }
      } else if (!result.isValidRequisition) {
        setOcrError(result.validationWarnings.join(". ") || "Requisition document requires manual verification.");
      }
    } catch {
      setOcrError("OCR processing pipeline failed. Please input requisition details manually.");
    } finally {
      setIsScanningSlip(false);
    }
  };

  // Form Submission Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmissionError(null);

    if (!patientName.trim()) {
      setSubmissionError("Patient full name is required.");
      return;
    }
    if (!patientUhid.trim()) {
      setSubmissionError("Hospital UHID / MRN is required for verification.");
      return;
    }
    if (!hospitalName.trim()) {
      setSubmissionError("Hospital name is required.");
      return;
    }
    if (isNaN(hospitalLat) || isNaN(hospitalLng) || hospitalLat === 0 || hospitalLng === 0) {
      setSubmissionError("Valid hospital geographic coordinates are required for geospatial wave dispatch.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        patientName: patientName.trim(),
        patientUhid: patientUhid.trim(),
        hospitalName: hospitalName.trim(),
        hospitalLat: Number(hospitalLat),
        hospitalLng: Number(hospitalLng),
        component,
        bloodGroup,
        requestMode: component === Component.SDP ? RequestMode.EXACT_OR_SDP : requestMode,
        unitsNeeded: Number(unitsNeeded),
      };

      const response = await axios.post("/api/request/create", payload, {
        headers: { "Content-Type": "application/json" },
      });

      if (response.data && response.data.shortHash) {
        router.push(`/r/${response.data.shortHash}`);
      } else {
        setSubmissionError("Request created but failed to receive tracking link. Check simulator or network.");
      }
    } catch (err: any) {
      console.error("Failed to create emergency request:", err);
      const detail = err.response?.data?.details?.join(", ") || err.response?.data?.error || err.message;
      setSubmissionError(`Dispatch launch failed: ${detail}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen text-slate-900 pb-16 selection:bg-rose-500 selection:text-white"
      style={{
        backgroundImage: `linear-gradient(180deg, rgba(248, 250, 252, 0.94) 0%, rgba(241, 245, 249, 0.96) 100%), url('https://images.unsplash.com/photo-1536856136534-bb679c52a9aa?auto=format&fit=crop&w=1920&q=80')`,
        backgroundAttachment: "fixed",
        backgroundSize: "cover",
      }}
    >
      {/* Top Emergency Red Header */}
      <header className="bg-gradient-to-r from-rose-800 via-red-800 to-rose-900 text-white shadow-md sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-1.5 rounded-lg bg-white/15 hover:bg-white/25 transition text-white"
              title="Return to Home"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-200 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
              </span>
              <div>
                <h1 className="text-base sm:text-lg font-black tracking-wide leading-none">
                  EMERGENCY SOS INTAKE
                </h1>
                <p className="text-[11px] text-rose-100 font-medium">
                  V2V Expanding-Ring Wave Dispatch Protocol • आपातकालीन मांग
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher className="bg-white/10 border-white/20 text-white" />
            <a
              href="tel:104"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 hover:bg-white/30 text-xs font-bold text-white transition border border-white/20"
            >
              <PhoneCall className="w-3.5 h-3.5 text-amber-300" />
              <span>104 Helpline</span>
            </a>
            <span className="px-2.5 py-1 rounded-lg bg-rose-950/60 border border-rose-500/50 text-[10px] font-bold uppercase tracking-wider text-rose-100">
              Priority Tier-1
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Reassurance Banner for Indian Families */}
        <section className="rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 p-4 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold">
              ✓
            </span>
            <div className="space-y-0.5">
              <h3 className="text-sm font-extrabold text-emerald-950">
                {t("reassuranceBanner")}
              </h3>
              <p className="text-xs text-emerald-800">
                {t("reassuranceHighlight")} • 24x7 National Helpline: <strong className="underline">104 / 1075 / 1910</strong>
              </p>
            </div>
          </div>
        </section>

        {/* Anti-Tout Safety Advisory Banner */}
        <section
          aria-label="Anti-Tout Safety Warning"
          className="rounded-2xl bg-amber-50 border-2 border-amber-400 p-4 sm:p-5 shadow-sm relative overflow-hidden"
        >
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-amber-100 border border-amber-300 text-amber-800 shrink-0">
              <ShieldAlert className="w-6 h-6 text-amber-700" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-extrabold text-amber-950 tracking-wide uppercase">
                  Anti-Tout Safety Warning (NBTC &amp; DPDP Act 2023)
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-amber-900 leading-relaxed font-medium">
                Voluntary blood &amp; platelet donation is completely <strong className="text-rose-700 underline font-extrabold">FREE</strong> under Indian law. Never pay cash, fees, or UPI to middlemen, agents, or hospital touts.
              </p>
              <div className="pt-1.5 text-[11px] text-amber-800 font-semibold flex flex-wrap gap-x-4 gap-y-1">
                <span>✓ Masked Telephony Line (+91-11-4000-xxxx)</span>
                <span>✓ On-Arrival Handshake PIN Verification</span>
                <span>✓ Zero Raw Phone Numbers Exposed</span>
              </div>
            </div>
          </div>
        </section>

        {/* Biomolecular Structure Viewer Sidecar Surface */}
        <SidecarPill variant="banner" />

        {/* Live OCR Requisition Slip Simulation Card */}
        <section className="rounded-3xl bg-white border border-slate-200/90 p-5 sm:p-7 shadow-lg shadow-slate-200/50 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <Camera className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                  Live Prescription Slip OCR Verification
                </h3>
                <p className="text-xs text-slate-500">
                  Scan hospital requisition slip to auto-populate patient &amp; blood parameters
                </p>
              </div>
            </div>
            <span className="text-[10px] uppercase font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              AI Vision Adapter
            </span>
          </div>

          {/* Quick Preset Buttons for Simulation */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Simulate Doctor&apos;s Prescription Slip (One-Tap Test Presets):
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => runOCRSimulation("VALID_AIIMS_SDP", "aiims_trauma_sdp_slip.jpg")}
                disabled={isScanningSlip}
                className="flex items-center justify-between p-3 rounded-xl text-left bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-300 transition group text-xs shadow-2xs"
              >
                <div>
                  <span className="font-extrabold text-slate-900 block group-hover:text-rose-700">
                    AIIMS Delhi • SDP
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    A+ve Platelet Apheresis
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-rose-600 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                type="button"
                onClick={() => runOCRSimulation("VALID_APOLLO_PRBC", "apollo_delhi_prbc_slip.jpg")}
                disabled={isScanningSlip}
                className="flex items-center justify-between p-3 rounded-xl text-left bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-300 transition group text-xs shadow-2xs"
              >
                <div>
                  <span className="font-extrabold text-slate-900 block group-hover:text-rose-700">
                    Apollo • PRBC
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    B+ve 2 Red Cell Units
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-rose-600 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                type="button"
                onClick={() => runOCRSimulation("MISSING_STAMP", "unverified_slip.jpg")}
                disabled={isScanningSlip}
                className="flex items-center justify-between p-3 rounded-xl text-left bg-amber-50/70 hover:bg-amber-100/60 border border-amber-200 hover:border-amber-400 transition group text-xs shadow-2xs"
              >
                <div>
                  <span className="font-extrabold text-amber-900 block">
                    Missing Stamp Test
                  </span>
                  <span className="text-[11px] text-amber-700 font-medium">
                    Warning Simulation
                  </span>
                </div>
                <AlertTriangle className="w-4 h-4 text-amber-600" />
              </button>
            </div>
          </div>

          {/* Upload / Camera Capture Button */}
          <div className="pt-1">
            <label className="flex items-center justify-center gap-2 w-full py-3.5 px-4 rounded-xl border border-dashed border-slate-300 hover:border-rose-500 bg-slate-50 hover:bg-rose-50/50 cursor-pointer transition text-xs font-bold text-slate-700">
              <Upload className="w-4 h-4 text-rose-600" />
              <span>Capture Photo or Upload Requisition Slip</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                disabled={isScanningSlip}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    runOCRSimulation("VALID_AIIMS_SDP", file.name);
                  }
                }}
              />
            </label>
          </div>

          {/* Animated Scanning Progress Bar */}
          {isScanningSlip && (
            <div className="space-y-2 pt-2 animate-fade-in">
              <div className="flex items-center justify-between text-xs">
                <span className="text-rose-700 font-bold flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-rose-600" />
                  {scanStageText}
                </span>
                <span className="font-bold text-rose-600">{scanProgress}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                <div
                  className="bg-rose-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${scanProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* OCR Result Pill / Confidence Badge */}
          {ocrResult && !isScanningSlip && (
            <div
              className={`p-4 rounded-xl border text-xs space-y-1.5 ${
                ocrResult.isValidRequisition
                  ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                  : "bg-amber-50 border-amber-300 text-amber-900"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold flex items-center gap-1.5">
                  {ocrResult.isValidRequisition ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                  )}
                  {ocrResult.isValidRequisition
                    ? `Requisition Verified (Confidence: ${(ocrResult.overallConfidence * 100).toFixed(0)}%)`
                    : "Prescription Requires Manual Review"}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white border border-slate-200 shadow-2xs">
                  {ocrResult.doctorStampDetected ? "✓ Stamp Detected" : "⚠️ Stamp Missing"}
                </span>
              </div>
              <p className="text-[11px] opacity-90 leading-relaxed font-medium">
                {ocrResult.isValidRequisition
                  ? `Extracted: Patient ${ocrResult.fields.patientName || "N/A"} (${ocrResult.fields.patientUhid || "N/A"}), Group ${ocrResult.fields.bloodGroup || "N/A"}, Component ${ocrResult.fields.component || "N/A"}. Fields autofilled below.`
                  : ocrResult.validationWarnings.join(". ") || "Please verify patient identifiers manually."}
              </p>
            </div>
          )}

          {ocrError && !isScanningSlip && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="font-medium">{ocrError}</span>
            </div>
          )}
        </section>

        {/* Live e-RaktKosh Stock Preview Badge */}
        <section aria-label="e-RaktKosh National Stock Preview" className="space-y-2">
          {isCheckingStock ? (
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200 text-xs text-slate-500 flex items-center gap-2 shadow-xs animate-pulse">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-rose-600" />
              <span>Querying e-RaktKosh national blood bank registry for {bloodGroup} {component}...</span>
            </div>
          ) : stockPreview ? (
            stockPreview.totalUnitsAvailable > 0 ? (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs space-y-2 shadow-xs">
                <div className="flex items-center justify-between font-bold">
                  <span className="flex items-center gap-1.5 text-amber-950 font-extrabold">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    e-RaktKosh Notice: {stockPreview.totalUnitsAvailable} Unit(s) Available in Vicinity
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-[10px] text-amber-800 font-bold border border-amber-300">
                    Nearest: {stockPreview.nearestBankDistanceKm ?? "N/A"} km
                  </span>
                </div>
                <p className="text-[11px] text-amber-900/90 leading-relaxed font-medium">
                  Units of <strong>{bloodGroup}</strong> ({component}) are reported in stock across licensed Delhi NCR blood banks. Verify with the hospital blood bank before triggering volunteer donor dispatch.
                </p>
                {stockPreview.bloodBanks.length > 0 && (
                  <div className="pt-2 border-t border-amber-200 text-[11px] text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span>
                      🏥 <strong>{stockPreview.bloodBanks[0].name}</strong> ({stockPreview.bloodBanks[0].unitsAvailable} units)
                    </span>
                    <span className="flex items-center gap-1 text-amber-800 font-bold">
                      <Phone className="w-3 h-3 text-amber-700" />
                      {stockPreview.bloodBanks[0].contactPhone}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-300 text-rose-900 text-xs flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-2">
                  <Droplet className="w-4 h-4 text-rose-600" />
                  <span>
                    <strong>Critical Shortage:</strong> 0 units of {bloodGroup} {component} reported across nearest licensed blood banks.
                  </span>
                </div>
                <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-rose-600 text-white shrink-0 ml-2 shadow-2xs">
                  Dispatch Required
                </span>
              </div>
            )
          ) : null}
        </section>

        {/* SOS Intake Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Patient Information */}
          <section className="rounded-3xl bg-white border border-slate-200/90 p-5 sm:p-7 shadow-lg shadow-slate-200/50 space-y-5">
            <h3 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-2.5 flex items-center gap-2">
              <FileText className="w-4 h-4 text-rose-600" />
              <span>1. Patient &amp; Hospital Details (रोगी व अस्पताल विवरण)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                  Patient Full Name (मरीज का नाम) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aarav Sharma"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-300 focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 text-slate-900 placeholder-slate-400 text-sm outline-none transition font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                  Patient UHID / MRN (अस्पताल रजिस्ट्रेशन नं.) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AIIMS-2026-8841"
                  value={patientUhid}
                  onChange={(e) => setPatientUhid(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-300 focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 text-slate-900 placeholder-slate-400 text-sm outline-none transition font-mono font-bold"
                />
              </div>
            </div>

            {/* Hospital Presets Dropdown */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Hospital Centre (Delhi NCR Presets) <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleDetectGPS}
                  disabled={isLocating}
                  className="inline-flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 font-bold transition"
                >
                  <LocateFixed className="w-3.5 h-3.5" />
                  <span>{isLocating ? "Acquiring GPS..." : "Detect Location via GPS"}</span>
                </button>
              </div>

              <select
                value={selectedHospitalPreset}
                onChange={(e) => handleHospitalPresetChange(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-300 focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 text-slate-900 text-sm outline-none transition font-semibold"
              >
                {DELHI_NCR_HOSPITALS.map((hosp) => (
                  <option key={hosp.id} value={hosp.id}>
                    {hosp.name} ({hosp.area})
                  </option>
                ))}
                <option value="custom">Other / Custom Hospital (Enter Below)</option>
              </select>

              {locationNotice && (
                <p className="text-[11px] text-amber-700 font-medium pt-0.5">{locationNotice}</p>
              )}
            </div>

            {/* Hospital Name & Coordinates */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                  Hospital Name (Transfusion Ward / Blood Bank)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AIIMS Delhi, Trauma Centre"
                  value={hospitalName}
                  onChange={(e) => setHospitalName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-300 focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 text-slate-900 text-sm outline-none transition font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    Latitude (°N)
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={hospitalLat}
                    onChange={(e) => setHospitalLat(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-xs font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    Longitude (°E)
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={hospitalLng}
                    onChange={(e) => setHospitalLng(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-xs font-mono outline-none"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Transfusion Requirements */}
          <section className="rounded-3xl bg-white border border-slate-200/90 p-5 sm:p-7 shadow-lg shadow-slate-200/50 space-y-5">
            <h3 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-2.5 flex items-center gap-2">
              <Droplet className="w-4 h-4 text-rose-600" />
              <span>2. Transfusion Specification (रक्त आवश्यकता)</span>
            </h3>

            {/* Blood Component Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                Blood Component Needed <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { value: Component.WHOLE_BLOOD, label: "Whole Blood", sub: "Standard" },
                  { value: Component.PRBC, label: "PRBC", sub: "Red Cells" },
                  { value: Component.PLASMA, label: "Plasma (FFP)", sub: "Coagulation" },
                  { value: Component.SDP, label: "Platelets (SDP)", sub: "Apheresis" },
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setComponent(item.value)}
                    className={`p-3 rounded-xl text-left border transition-all ${
                      component === item.value
                        ? "bg-rose-50 border-rose-600 text-rose-950 shadow-sm ring-1 ring-rose-500"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <span className="font-extrabold text-xs sm:text-sm block">{item.label}</span>
                    <span className="text-[11px] text-slate-500 block">{item.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Blood Group Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                Blood Group &amp; Rh Factor (रक्त समूह) <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {[
                  { group: BloodGroup.O_POS, label: "O Positive (O+)" },
                  { group: BloodGroup.O_NEG, label: "O Negative (O-)" },
                  { group: BloodGroup.A_POS, label: "A Positive (A+)" },
                  { group: BloodGroup.A_NEG, label: "A Negative (A-)" },
                  { group: BloodGroup.B_POS, label: "B Positive (B+)" },
                  { group: BloodGroup.B_NEG, label: "B Negative (B-)" },
                  { group: BloodGroup.AB_POS, label: "AB Positive (AB+)" },
                  { group: BloodGroup.AB_NEG, label: "AB Negative (AB-)" },
                  { group: BloodGroup.BOMBAY_OH, label: "Bombay (hh) Ultra-Rare" },
                ].map((item) => (
                  <button
                    key={item.group}
                    type="button"
                    onClick={() => setBloodGroup(item.group)}
                    className={`py-2.5 px-2.5 rounded-xl text-center border font-bold text-xs transition-all ${
                      bloodGroup === item.group
                        ? "bg-rose-600 border-rose-600 text-white shadow-md shadow-rose-600/30 scale-105"
                        : "bg-slate-50 border-slate-200 text-slate-800 hover:border-slate-300"
                    } ${item.group === BloodGroup.BOMBAY_OH ? "col-span-3 sm:col-span-2 text-amber-700 border-amber-300 bg-amber-50" : ""}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Request Mode Toggle (Replacement vs Exact) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                  Request Mode Protocol
                </label>
                {component === Component.SDP && (
                  <span className="text-[11px] font-bold text-amber-600 flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    Locked to EXACT_OR_SDP (NBTC Rule)
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={component === Component.SDP}
                  onClick={() => setRequestMode(RequestMode.REPLACEMENT_ANY)}
                  className={`p-3.5 rounded-2xl border text-left transition-all ${
                    component === Component.SDP
                      ? "opacity-40 cursor-not-allowed bg-slate-100 border-slate-200 text-slate-400"
                      : requestMode === RequestMode.REPLACEMENT_ANY
                      ? "bg-rose-50 border-rose-600 text-rose-950 shadow-sm"
                      : "bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs sm:text-sm">Replacement Mode</span>
                    {component === Component.SDP && <Lock className="w-3.5 h-3.5 text-slate-400" />}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 font-medium leading-relaxed">
                    Any donor blood group acceptable for hospital blood bank exchange inventory.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setRequestMode(RequestMode.EXACT_OR_SDP)}
                  className={`p-3.5 rounded-2xl border text-left transition-all ${
                    requestMode === RequestMode.EXACT_OR_SDP
                      ? "bg-rose-50 border-rose-600 text-rose-950 shadow-sm ring-1 ring-rose-500"
                      : "bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs sm:text-sm">Exact / Compatible Match</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-rose-600" />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 font-medium leading-relaxed">
                    Strictly matching or compatible donors required for direct patient transfusion.
                  </p>
                </button>
              </div>

              {/* NBTC Clinical Advisory Note when SDP is selected */}
              {component === Component.SDP && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] leading-relaxed font-medium">
                    <strong>NBTC Clinical Advisory:</strong> Single Donor Platelet (SDP) apheresis transfusions require strictly ABO/Rh compatible or exact matches to prevent severe immune-mediated platelet refractoriness and acute hemolytic reactions. Replacement mode is prohibited for SDP.
                  </p>
                </div>
              )}
            </div>

            {/* Units Needed Stepper */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                Units Needed (1 to 10) <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-3">
                <div className="flex items-center border border-slate-300 bg-slate-50 rounded-xl overflow-hidden shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setUnitsNeeded((prev) => Math.max(1, prev - 1))}
                    disabled={unitsNeeded <= 1}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-base font-bold disabled:opacity-30 disabled:cursor-not-allowed transition"
                  >
                    −
                  </button>
                  <span className="px-5 py-2.5 font-black text-sm text-slate-900 min-w-[3rem] text-center">
                    {unitsNeeded}
                  </span>
                  <button
                    type="button"
                    onClick={() => setUnitsNeeded((prev) => Math.min(10, prev + 1))}
                    disabled={unitsNeeded >= 10}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-base font-bold disabled:opacity-30 disabled:cursor-not-allowed transition"
                  >
                    +
                  </button>
                </div>
                <span className="text-xs text-slate-500 font-medium">
                  {component === Component.SDP ? "Platelet apheresis unit(s)" : "Blood bag unit(s)"} (Max 10)
                </span>
              </div>
            </div>
          </section>

          {/* Submission Error Banner */}
          {submissionError && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-900 text-xs flex items-start gap-3 shadow-md">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">Submission Blocked:</strong>
                <span>{submissionError}</span>
              </div>
            </div>
          )}

          {/* Emergency Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 px-6 rounded-2xl bg-rose-600 hover:bg-rose-700 active:scale-[0.99] text-white font-extrabold text-base tracking-wide shadow-xl shadow-rose-600/30 transition-all flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin text-white" />
                  <span>LAUNCHING EMERGENCY WAVE...</span>
                </>
              ) : (
                <>
                  <Radio className="w-5 h-5 text-rose-200 animate-pulse" />
                  <span>LAUNCH EMERGENCY DISPATCH WAVE (आपातकालीन मांग भेजें)</span>
                  <ChevronRight className="w-5 h-5 text-rose-200" />
                </>
              )}
            </button>
            <p className="text-center text-[11px] text-slate-500 mt-2 font-medium">
              Submitting triggers Wave 1 (0–3 km) dispatch pings to qualified volunteers.
            </p>
          </div>
        </form>
      </main>
    </div>
  );
}
