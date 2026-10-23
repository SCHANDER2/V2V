// src/app/request/new/page.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
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
  Droplet
} from "lucide-react";

import { BloodGroup, Component, RequestMode } from "@/types/enums";
import { mockRequisitionVerifierOCR } from "@/lib/adapters/mocks/mockRequisitionVerifierOCR";
import { mockEraktKoshAdapter } from "@/lib/adapters/mocks/mockEraktKoshAdapter";
import { OCRVerificationResult } from "@/lib/adapters/interfaces/ocr.interface";
import { ERaktKoshStockPreview } from "@/lib/adapters/interfaces/eraktkosh.interface";
import SidecarPill from "@/components/SidecarPill";

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

  // Hospital Preset Handler
  const handleHospitalPresetChange = (presetId: string) => {
    setSelectedHospitalPreset(presetId);
    if (presetId === "custom") {
      setLocationNotice("Custom hospital mode enabled. Enter name and exact coordinates below.");
      return;
    }
    const hosp = DELHI_NCR_HOSPITALS.find((h) => h.id === presetId);
    if (hosp) {
      setHospitalName(hosp.name);
      setHospitalLat(hosp.lat);
      setHospitalLng(hosp.lng);
      setLocationNotice(null);
    }
  };

  // Browser GPS Geolocation Resolver
  const handleDetectGPS = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocationNotice("Geolocation is not supported by your browser. Please select a preset.");
      return;
    }

    setIsLocating(true);
    setLocationNotice(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = Math.round(position.coords.latitude * 10000) / 10000;
        const lng = Math.round(position.coords.longitude * 10000) / 10000;
        setHospitalLat(lat);
        setHospitalLng(lng);
        setSelectedHospitalPreset("custom");
        if (!hospitalName || hospitalName.includes("AIIMS")) {
          setHospitalName("Emergency Medical Centre (GPS Detected)");
        }
        setIsLocating(false);
        setLocationNotice(`GPS Lock Acquired: ${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E (Accuracy: ±${Math.round(position.coords.accuracy)}m)`);
      },
      (error) => {
        setIsLocating(false);
        setLocationNotice(`GPS Unavailable (${error.message}). Please select your hospital from the preset list.`);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  };

  // OCR Requisition Simulation Runner
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
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16 selection:bg-rose-500 selection:text-white">
      {/* Top Emergency Red Header */}
      <header className="bg-rose-700 text-white shadow-lg sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
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
                V2V Expanding-Ring Wave Dispatch Protocol
              </p>
            </div>
          </div>
          <span className="px-2 py-1 rounded bg-rose-800/80 border border-rose-600 text-[10px] font-bold uppercase tracking-wider text-rose-100">
            Priority Tier-1
          </span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Anti-Tout Safety Advisory Banner */}
        <section
          aria-label="Anti-Tout Safety Warning"
          className="rounded-2xl bg-amber-950/70 border-2 border-amber-500/80 p-4 sm:p-5 shadow-lg shadow-amber-950/40 relative overflow-hidden"
        >
          <div className="flex items-start gap-3.5">
            <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-300 shrink-0">
              <ShieldAlert className="w-6 h-6 text-amber-400" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-extrabold text-amber-200 tracking-wide uppercase">
                  Anti-Tout Safety Warning (NBTC &amp; DPDP Act 2023)
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-amber-100/90 leading-relaxed">
                Voluntary blood &amp; platelet donation is completely <strong className="text-white underline">FREE</strong> under Indian law. Never pay cash, fees, or UPI to middlemen, agents, or hospital touts.
              </p>
              <div className="pt-1 text-[11px] text-amber-300/80 flex flex-wrap gap-x-4 gap-y-1">
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
        <section className="rounded-2xl bg-slate-900 border border-slate-800 p-4 sm:p-5 shadow-md space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <Camera className="w-5 h-5 text-rose-400" />
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white">
                  Live Prescription Slip OCR Verification
                </h3>
                <p className="text-xs text-slate-400">
                  Scan hospital requisition slip to auto-populate patient &amp; blood parameters
                </p>
              </div>
            </div>
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              AI Vision Adapter
            </span>
          </div>

          {/* Quick Preset Buttons for Simulation */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-300">
              Simulate Doctor&apos;s Prescription Slip (One-Tap Test Presets):
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => runOCRSimulation("VALID_AIIMS_SDP", "aiims_trauma_sdp_slip.jpg")}
                disabled={isScanningSlip}
                className="flex items-center justify-between p-2.5 rounded-xl text-left bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-rose-500/60 transition group text-xs"
              >
                <div>
                  <span className="font-bold text-slate-200 block group-hover:text-rose-300">
                    AIIMS Delhi • SDP
                  </span>
                  <span className="text-[11px] text-slate-400">
                    A+ve Platelet Apheresis
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-rose-400" />
              </button>

              <button
                type="button"
                onClick={() => runOCRSimulation("VALID_APOLLO_PRBC", "apollo_delhi_prbc_slip.jpg")}
                disabled={isScanningSlip}
                className="flex items-center justify-between p-2.5 rounded-xl text-left bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-rose-500/60 transition group text-xs"
              >
                <div>
                  <span className="font-bold text-slate-200 block group-hover:text-rose-300">
                    Apollo • PRBC
                  </span>
                  <span className="text-[11px] text-slate-400">
                    B+ve 2 Red Cell Units
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-rose-400" />
              </button>

              <button
                type="button"
                onClick={() => runOCRSimulation("MISSING_STAMP", "unverified_slip.jpg")}
                disabled={isScanningSlip}
                className="flex items-center justify-between p-2.5 rounded-xl text-left bg-slate-800/80 hover:bg-slate-800 border border-amber-900/60 hover:border-amber-500/60 transition group text-xs"
              >
                <div>
                  <span className="font-bold text-amber-300 block">
                    Missing Stamp Test
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Warning Simulation
                  </span>
                </div>
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              </button>
            </div>
          </div>

          {/* Upload / Camera Capture Button */}
          <div className="pt-1">
            <label className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl border border-dashed border-slate-700 hover:border-rose-500 bg-slate-950/60 hover:bg-slate-900 cursor-pointer transition text-xs font-semibold text-slate-300">
              <Upload className="w-4 h-4 text-rose-400" />
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
                <span className="text-rose-300 font-medium flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-rose-400" />
                  {scanStageText}
                </span>
                <span className="font-bold text-rose-400">{scanProgress}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
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
              className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                ocrResult.isValidRequisition
                  ? "bg-emerald-950/60 border-emerald-700/60 text-emerald-200"
                  : "bg-amber-950/60 border-amber-700/60 text-amber-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold flex items-center gap-1.5">
                  {ocrResult.isValidRequisition ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                  )}
                  {ocrResult.isValidRequisition
                    ? `Requisition Verified (Confidence: ${(ocrResult.overallConfidence * 100).toFixed(0)}%)`
                    : "Prescription Requires Manual Review"}
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-900/60 border border-slate-700">
                  {ocrResult.doctorStampDetected ? "✓ Stamp Detected" : "⚠️ Stamp Missing"}
                </span>
              </div>
              <p className="text-[11px] opacity-90">
                {ocrResult.isValidRequisition
                  ? `Extracted: Patient ${ocrResult.fields.patientName || "N/A"} (${ocrResult.fields.patientUhid || "N/A"}), Group ${ocrResult.fields.bloodGroup || "N/A"}, Component ${ocrResult.fields.component || "N/A"}. Fields autofilled below.`
                  : ocrResult.validationWarnings.join(". ") || "Please verify patient identifiers manually."}
              </p>
            </div>
          )}

          {ocrError && !isScanningSlip && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-200 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{ocrError}</span>
            </div>
          )}
        </section>

        {/* Live e-RaktKosh Stock Preview Badge */}
        <section aria-label="e-RaktKosh National Stock Preview" className="space-y-2">
          {isCheckingStock ? (
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 flex items-center gap-2 animate-pulse">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-400" />
              <span>Querying e-RaktKosh national blood bank registry for {bloodGroup} {component}...</span>
            </div>
          ) : stockPreview ? (
            stockPreview.totalUnitsAvailable > 0 ? (
              <div className="p-4 rounded-xl bg-amber-950/50 border border-amber-600/70 text-amber-200 text-xs space-y-2 shadow-md">
                <div className="flex items-center justify-between font-bold">
                  <span className="flex items-center gap-1.5 text-amber-300">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    e-RaktKosh Notice: {stockPreview.totalUnitsAvailable} Unit(s) Available in Vicinity
                  </span>
                  <span className="px-2 py-0.5 rounded bg-amber-900/80 text-[10px] text-amber-100 border border-amber-700">
                    Nearest: {stockPreview.nearestBankDistanceKm ?? "N/A"} km
                  </span>
                </div>
                <p className="text-[11px] text-amber-100/90 leading-relaxed">
                  Units of <strong>{bloodGroup}</strong> ({component}) are reported in stock across licensed Delhi NCR blood banks. Verify with the hospital blood bank before triggering volunteer donor dispatch.
                </p>
                {stockPreview.bloodBanks.length > 0 && (
                  <div className="pt-1 border-t border-amber-900/40 text-[11px] text-amber-300/90 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span>
                      🏥 <strong>{stockPreview.bloodBanks[0].name}</strong> ({stockPreview.bloodBanks[0].unitsAvailable} units)
                    </span>
                    <span className="flex items-center gap-1 text-amber-200">
                      <Phone className="w-3 h-3 text-amber-400" />
                      {stockPreview.bloodBanks[0].contactPhone}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-200 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Droplet className="w-4 h-4 text-rose-400" />
                  <span>
                    <strong>Critical Shortage:</strong> 0 units of {bloodGroup} {component} reported across nearest licensed blood banks.
                  </span>
                </div>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-rose-900 text-rose-200 shrink-0 ml-2">
                  Dispatch Required
                </span>
              </div>
            )
          ) : null}
        </section>

        {/* SOS Intake Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Patient Information */}
          <section className="rounded-2xl bg-slate-900 border border-slate-800 p-4 sm:p-5 shadow-md space-y-4">
            <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-2 flex items-center gap-2">
              <FileText className="w-4 h-4 text-rose-400" />
              <span>1. Patient &amp; Hospital Details</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Patient Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aarav Sharma"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 text-white placeholder-slate-500 text-sm outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Patient UHID / MRN <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AIIMS-2026-8841"
                  value={patientUhid}
                  onChange={(e) => setPatientUhid(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 text-white placeholder-slate-500 text-sm outline-none transition font-mono"
                />
              </div>
            </div>

            {/* Hospital Presets Dropdown */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-300">
                  Hospital Centre (Delhi NCR Presets) <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleDetectGPS}
                  disabled={isLocating}
                  className="inline-flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 font-semibold transition"
                >
                  <LocateFixed className="w-3.5 h-3.5" />
                  <span>{isLocating ? "Acquiring GPS..." : "Detect Location via GPS"}</span>
                </button>
              </div>

              <select
                value={selectedHospitalPreset}
                onChange={(e) => handleHospitalPresetChange(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 text-white text-sm outline-none transition"
              >
                {DELHI_NCR_HOSPITALS.map((hosp) => (
                  <option key={hosp.id} value={hosp.id}>
                    {hosp.name} ({hosp.area})
                  </option>
                ))}
                <option value="custom">Other / Custom Hospital (Enter Below)</option>
              </select>

              {locationNotice && (
                <p className="text-[11px] text-amber-300/90 pt-0.5">{locationNotice}</p>
              )}
            </div>

            {/* Hospital Name & Coordinates */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Hospital Name (Transfusion Ward / Blood Bank)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AIIMS Delhi, Trauma Centre"
                  value={hospitalName}
                  onChange={(e) => setHospitalName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 text-white text-sm outline-none transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Latitude (°N)
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={hospitalLat}
                    onChange={(e) => setHospitalLat(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-300 text-xs font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Longitude (°E)
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={hospitalLng}
                    onChange={(e) => setHospitalLng(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-300 text-xs font-mono outline-none"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Transfusion Requirements */}
          <section className="rounded-2xl bg-slate-900 border border-slate-800 p-4 sm:p-5 shadow-md space-y-5">
            <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-2 flex items-center gap-2">
              <Droplet className="w-4 h-4 text-rose-400" />
              <span>2. Transfusion Specification</span>
            </h3>

            {/* Blood Component Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">
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
                        ? "bg-rose-950/70 border-rose-500 text-white shadow-md shadow-rose-950/60"
                        : "bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700"
                    }`}
                  >
                    <span className="font-bold text-xs sm:text-sm block">{item.label}</span>
                    <span className="text-[11px] text-slate-400 block">{item.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Blood Group Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">
                Blood Group &amp; Rh Factor <span className="text-rose-500">*</span>
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
                    className={`py-2 px-2.5 rounded-xl text-center border font-semibold text-xs transition-all ${
                      bloodGroup === item.group
                        ? "bg-rose-600 border-rose-500 text-white shadow-sm"
                        : "bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white"
                    } ${item.group === BloodGroup.BOMBAY_OH ? "col-span-3 sm:col-span-2 text-amber-300 border-amber-900/60" : ""}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Request Mode Toggle (Replacement vs Exact) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-300">
                  Request Mode Protocol
                </label>
                {component === Component.SDP && (
                  <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
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
                  className={`p-3 rounded-xl border text-left transition-all ${
                    component === Component.SDP
                      ? "opacity-40 cursor-not-allowed bg-slate-950/40 border-slate-800 text-slate-500"
                      : requestMode === RequestMode.REPLACEMENT_ANY
                      ? "bg-rose-950/70 border-rose-500 text-white"
                      : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs sm:text-sm">Replacement Mode</span>
                    {component === Component.SDP && <Lock className="w-3.5 h-3.5 text-slate-500" />}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Any donor blood group acceptable for hospital blood bank exchange inventory.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setRequestMode(RequestMode.EXACT_OR_SDP)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    requestMode === RequestMode.EXACT_OR_SDP
                      ? "bg-rose-950/70 border-rose-500 text-white shadow-md shadow-rose-950/60"
                      : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs sm:text-sm">Exact / Compatible Match</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-rose-400" />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Strictly matching or compatible donors required for direct patient transfusion.
                  </p>
                </button>
              </div>

              {/* NBTC Clinical Advisory Note when SDP is selected */}
              {component === Component.SDP && (
                <div className="p-3.5 rounded-xl bg-amber-950/50 border border-amber-600/70 text-amber-200 text-xs flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] leading-relaxed">
                    <strong>NBTC Clinical Advisory:</strong> Single Donor Platelet (SDP) apheresis transfusions require strictly ABO/Rh compatible or exact matches to prevent severe immune-mediated platelet refractoriness and acute hemolytic reactions. Replacement mode is prohibited for SDP.
                  </p>
                </div>
              )}
            </div>

            {/* Units Needed Stepper */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">
                Units Needed (1 to 10) <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-3">
                <div className="flex items-center border border-slate-800 bg-slate-950 rounded-xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setUnitsNeeded((prev) => Math.max(1, prev - 1))}
                    disabled={unitsNeeded <= 1}
                    className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-200 text-base font-bold disabled:opacity-30 disabled:cursor-not-allowed transition"
                  >
                    −
                  </button>
                  <span className="px-5 py-2.5 font-bold text-sm text-white min-w-[3rem] text-center">
                    {unitsNeeded}
                  </span>
                  <button
                    type="button"
                    onClick={() => setUnitsNeeded((prev) => Math.min(10, prev + 1))}
                    disabled={unitsNeeded >= 10}
                    className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-200 text-base font-bold disabled:opacity-30 disabled:cursor-not-allowed transition"
                  >
                    +
                  </button>
                </div>
                <span className="text-xs text-slate-400">
                  {component === Component.SDP ? "Platelet apheresis unit(s)" : "Blood bag unit(s)"} (Max 10)
                </span>
              </div>
            </div>
          </section>

          {/* Submission Error Banner */}
          {submissionError && (
            <div className="p-4 rounded-xl bg-rose-950/90 border border-rose-600 text-rose-200 text-xs flex items-start gap-3 shadow-lg">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
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
              className="w-full py-4 px-6 rounded-2xl bg-rose-600 hover:bg-rose-500 active:scale-[0.99] text-white font-extrabold text-base tracking-wide shadow-xl shadow-rose-950/60 transition-all flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin text-white" />
                  <span>LAUNCHING EMERGENCY WAVE...</span>
                </>
              ) : (
                <>
                  <Radio className="w-5 h-5 text-rose-200" />
                  <span>LAUNCH EMERGENCY DISPATCH WAVE</span>
                  <ChevronRight className="w-5 h-5 text-rose-200" />
                </>
              )}
            </button>
            <p className="text-center text-[11px] text-slate-500 mt-2">
              Submitting triggers Wave 1 (0–3 km) dispatch pings to qualified volunteers.
            </p>
          </div>
        </form>
      </main>
    </div>
  );
}
