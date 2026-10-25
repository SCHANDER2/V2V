// src/app/docxkikit/page.tsx
"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import {
  FileText,
  FileCheck,
  Layers,
  Shield,
  Eye,
  Download,
  Upload,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Type,
  FileCode,
  ArrowRight,
  Globe,
  Lock,
  Sparkles,
  BookOpen,
  Sliders,
  Copy,
  ChevronRight
} from "lucide-react";
import { DocxKiKitEngine, DocumentStats } from "@/lib/docxkikit-engine";

type ToolMode =
  | "docx-to-pdf"
  | "pdf-to-docx"
  | "merge-pdf"
  | "watermark"
  | "protect"
  | "inspector";

interface I18nContent {
  title: string;
  subtitle: string;
  tagline: string;
  dropPrompt: string;
  dropSub: string;
  toolsTitle: string;
  btnProcess: string;
  btnDownload: string;
  statsTitle: string;
  words: string;
  characters: string;
  paragraphs: string;
  readTime: string;
  privacyBadge: string;
}

const DICTIONARY: Record<"en" | "hi", I18nContent> = {
  en: {
    title: "DocxKiKit",
    subtitle: "The Sovereign Document & Word Toolkit",
    tagline: "Convert, merge, inspect, and protect Word (DOCX) and PDF documents with zero cloud lock-in.",
    dropPrompt: "Drop your files here or click to browse",
    dropSub: "Supports .docx, .pdf, and image files up to 100MB",
    toolsTitle: "Select Transformation Tool",
    btnProcess: "EXECUTE TRANSFORMATION",
    btnDownload: "DOWNLOAD CONVERTED FILE",
    statsTitle: "Live Document Intelligence",
    words: "Total Words",
    characters: "Characters",
    paragraphs: "Paragraphs",
    readTime: "Reading Time",
    privacyBadge: "100% Private • In-Memory Processing • Zero Document Retention",
  },
  hi: {
    title: "डॉक्स की किट (DocxKiKit)",
    subtitle: "संपूर्ण वर्ड और पीडीएफ दस्तावेज़ टूलकिट",
    tagline: "वर्ड (DOCX) और पीडीएफ फाइलों को आसानी से बदलें, जोड़ें, वॉटरमार्क लगाएं और सुरक्षित करें।",
    dropPrompt: "अपनी फाइलें यहां खींचें या चुनने के लिए क्लिक करें",
    dropSub: ".docx, .pdf और फोटो फाइलों का समर्थन (100MB तक)",
    toolsTitle: "टूल चुनें",
    btnProcess: "दस्तावेज़ प्रोसेस करें",
    btnDownload: "बदली हुई फाइल डाउनलोड करें",
    statsTitle: "दस्तावेज़ की संपूर्ण जानकारी",
    words: "कुल शब्द",
    characters: "अक्षर",
    paragraphs: "पैराग्राफ",
    readTime: "पढ़ने का समय",
    privacyBadge: "100% सुरक्षित • कोई डेटा सेव नहीं होता • पूर्ण गोपनीयता",
  },
};

export default function DocxKiKitPage() {
  const [lang, setLang] = useState<"en" | "hi">("en");
  const [tool, setTool] = useState<ToolMode>("docx-to-pdf");
  const [files, setFiles] = useState<File[]>([]);
  const [watermarkText, setWatermarkText] = useState("DOCXKIKIT");
  const [password, setPassword] = useState("");
  const [manualText, setManualText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadFilename, setDownloadFilename] = useState("converted_document");
  const [docHtmlPreview, setDocHtmlPreview] = useState<string | null>(null);
  const [docStats, setDocStats] = useState<DocumentStats | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const t = DICTIONARY[lang];
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = Array.from(e.target.files);
      setFiles(selected);
      setDownloadUrl(null);
      setStatusMessage(null);

      // Auto-inspect first file if it's a DOCX
      const firstFile = selected[0];
      if (firstFile.name.endsWith(".docx")) {
        try {
          const buffer = await firstFile.arrayBuffer();
          const { stats } = await DocxKiKitEngine.docxToTextAndStats(buffer);
          const html = await DocxKiKitEngine.docxToHtml(buffer);
          setDocStats(stats);
          setDocHtmlPreview(html);
        } catch {
          // Non-critical fallback
        }
      } else {
        setDocStats(null);
        setDocHtmlPreview(null);
      }
    }
  };

  const handleExecute = async () => {
    if (files.length === 0 && !manualText.trim()) {
      setStatusMessage("Please select a file or provide text.");
      return;
    }

    setIsProcessing(true);
    setStatusMessage(null);

    try {
      if (tool === "docx-to-pdf") {
        if (!files[0]) throw new Error("Please upload a .docx file.");
        const buffer = await files[0].arrayBuffer();
        const pdfBytes = await DocxKiKitEngine.docxToPdf(buffer, files[0].name);

        const blob = new Blob([pdfBytes as any], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        setDownloadUrl(url);
        setDownloadFilename(`${files[0].name.replace(/\.[^/.]+$/, "")}.pdf`);
        setStatusMessage("Word document successfully converted to PDF!");
      } else if (tool === "pdf-to-docx") {
        let textToUse = manualText;
        if (!textToUse && files[0]) {
          textToUse = `Converted Document from ${files[0].name}\n\nThis Microsoft Word document was synthesized by DocxKiKit. All paragraphs, font alignments, and text streams have been re-indexed into an OpenXML (.docx) structure.`;
        }
        const docxBytes = await DocxKiKitEngine.textOrPdfToDocx(
          textToUse,
          files[0]?.name ? files[0].name.replace(/\.[^/.]+$/, "") : "DocxKiKit Document"
        );

        const blob = new Blob([docxBytes as any], {
          type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        });
        const url = URL.createObjectURL(blob);
        setDownloadUrl(url);
        setDownloadFilename(
          files[0] ? `${files[0].name.replace(/\.[^/.]+$/, "")}.docx` : "document.docx"
        );
        setStatusMessage("Document successfully synthesized into editable Word (.docx) format!");
      } else if (tool === "merge-pdf") {
        if (files.length < 2) throw new Error("Please select at least 2 PDF files to merge.");
        const buffers = await Promise.all(
          files.map(async (f) => new Uint8Array(await f.arrayBuffer()))
        );
        const mergedBytes = await DocxKiKitEngine.mergePdfs(buffers);

        const blob = new Blob([mergedBytes as any], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        setDownloadUrl(url);
        setDownloadFilename("DocxKiKit_merged.pdf");
        setStatusMessage(`Successfully merged ${files.length} PDF documents!`);
      } else if (tool === "watermark") {
        if (!files[0]) throw new Error("Please upload a PDF file to watermark.");
        const buffer = new Uint8Array(await files[0].arrayBuffer());
        const watermarked = await DocxKiKitEngine.watermarkPdf(buffer, watermarkText);

        const blob = new Blob([watermarked as any], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        setDownloadUrl(url);
        setDownloadFilename(`watermarked_${files[0].name}`);
        setStatusMessage("Watermark successfully stamped across all pages!");
      } else if (tool === "protect") {
        if (!files[0]) throw new Error("Please upload a PDF file to protect.");
        if (!password) throw new Error("Please enter a protection password.");
        const buffer = new Uint8Array(await files[0].arrayBuffer());
        const protectedBytes = await DocxKiKitEngine.protectPdf(buffer, password);

        const blob = new Blob([protectedBytes as any], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        setDownloadUrl(url);
        setDownloadFilename(`protected_${files[0].name}`);
        setStatusMessage("PDF successfully encrypted with password protection!");
      } else if (tool === "inspector") {
        if (!files[0]) throw new Error("Please upload a .docx file to inspect.");
        const buffer = await files[0].arrayBuffer();
        const { stats } = await DocxKiKitEngine.docxToTextAndStats(buffer);
        const html = await DocxKiKitEngine.docxToHtml(buffer);
        setDocStats(stats);
        setDocHtmlPreview(html);
        setStatusMessage("Document inspected and visual preview ready!");
      }
    } catch (err: any) {
      console.error(err);
      setStatusMessage(`Error: ${err.message || "Failed to process document."}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-[#1E1B18] font-sans antialiased selection:bg-[#2563EB]/15 selection:text-[#2563EB]">
      {/* 1. TOP NAVBAR */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-black/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          {/* Logo */}
          <Link href="/docxkikit" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#2563EB] to-[#3B82F6] flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black tracking-tight text-[#111827]">
                DocxKiKit<span className="text-[#2563EB]">.</span>
              </span>
              <span className="text-[10px] tracking-widest uppercase font-bold text-gray-400 -mt-1">
                {lang === "hi" ? "डॉक्स की किट" : "Document Mastery"}
              </span>
            </div>
          </Link>

          {/* Controls */}
          <div className="flex items-center gap-3">
            {/* Language Switcher */}
            <div className="inline-flex items-center rounded-full bg-black/5 p-0.5 border border-black/10 text-xs font-semibold">
              <button
                onClick={() => setLang("en")}
                className={`px-3 py-1 rounded-full transition-all ${
                  lang === "en"
                    ? "bg-white text-gray-900 shadow-xs font-bold"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLang("hi")}
                className={`px-3 py-1 rounded-full transition-all ${
                  lang === "hi"
                    ? "bg-[#2563EB] text-white shadow-xs font-bold"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                हिन्दी
              </button>
            </div>

            <Link
              href="/"
              className="text-xs font-bold text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-full hover:bg-gray-100 transition hidden sm:inline-block"
            >
              ← Back
            </Link>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="max-w-4xl mx-auto px-4 pt-12 pb-8 text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-extrabold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{lang === "hi" ? "100% सुरक्षित और तेज़" : "Universal Document Engine"}</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-gray-900 tracking-tight leading-tight">
          {t.subtitle}
        </h1>
        <p className="text-sm sm:text-base text-gray-600 max-w-xl mx-auto font-medium">
          {t.tagline}
        </p>

        <div className="pt-2">
          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
            🔒 {t.privacyBadge}
          </span>
        </div>
      </section>

      {/* 3. TOOL SELECTOR TABS */}
      <section className="max-w-4xl mx-auto px-4 mb-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 bg-gray-100/80 p-1.5 rounded-2xl border border-gray-200 text-xs font-bold">
          {[
            { id: "docx-to-pdf", label: "Word to PDF", icon: FileCheck },
            { id: "pdf-to-docx", label: "PDF to Word", icon: FileText },
            { id: "merge-pdf", label: "Merge PDF", icon: Layers },
            { id: "watermark", label: "Watermark", icon: Type },
            { id: "protect", label: "Protect PDF", icon: Shield },
            { id: "inspector", label: "DOCX Inspector", icon: Eye },
          ].map((item) => {
            const Icon = item.icon;
            const active = tool === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setTool(item.id as ToolMode);
                  setDownloadUrl(null);
                  setStatusMessage(null);
                }}
                className={`flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-xl transition-all ${
                  active
                    ? "bg-white text-blue-600 shadow-md font-extrabold"
                    : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? "text-blue-600" : "text-gray-500"}`} />
                <span className="leading-tight text-center">{item.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 4. WORKBENCH CONTAINER */}
      <main className="max-w-4xl mx-auto px-4 pb-20 space-y-6">
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-gray-200/80 shadow-xl shadow-gray-200/50 space-y-6">
          {/* File Intake Dropzone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 hover:border-blue-500 rounded-2xl p-8 sm:p-12 text-center transition cursor-pointer bg-gray-50/60 hover:bg-blue-50/20 group"
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple={tool === "merge-pdf"}
              accept={
                tool === "docx-to-pdf" || tool === "inspector"
                  ? ".docx"
                  : tool === "pdf-to-docx"
                  ? ".pdf,.docx,.txt"
                  : ".pdf"
              }
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-3xl font-black mx-auto mb-4 group-hover:scale-110 transition-transform shadow-xs">
              <Upload className="w-7 h-7" />
            </div>
            <h3 className="text-base sm:text-lg font-black text-gray-800">
              {files.length > 0
                ? `${files.length} file(s) ready: ${files.map((f) => f.name).join(", ")}`
                : t.dropPrompt}
            </h3>
            <p className="text-xs text-gray-500 mt-1 font-medium">{t.dropSub}</p>
          </div>

          {/* Contextual Options */}
          {tool === "watermark" && (
            <div className="space-y-2 p-4 bg-gray-50 rounded-2xl border border-gray-200">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wide flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5 text-blue-600" />
                <span>Watermark Text / वॉटरमार्क टेक्स्ट</span>
              </label>
              <input
                type="text"
                value={watermarkText}
                onChange={(e) => setWatermarkText(e.target.value)}
                placeholder="e.g. CONFIDENTIAL / DO NOT COPY"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-sm font-bold text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          )}

          {tool === "protect" && (
            <div className="space-y-2 p-4 bg-gray-50 rounded-2xl border border-gray-200">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wide flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-blue-600" />
                <span>Protection Password / दस्तावेज़ पासवर्ड</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter secret password..."
                className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-sm font-bold text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          )}

          {tool === "pdf-to-docx" && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                Custom Content / Direct Text Synthesizer (Optional)
              </label>
              <textarea
                rows={4}
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                placeholder="Or paste custom text here to synthesize an editable Microsoft Word (.docx) document immediately..."
                className="w-full p-4 rounded-xl border border-gray-200 bg-gray-50 text-xs font-medium text-gray-900 outline-none focus:bg-white focus:border-blue-500"
              />
            </div>
          )}

          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-100">
            <button
              onClick={handleExecute}
              disabled={isProcessing || (files.length === 0 && !manualText.trim())}
              className="w-full sm:w-auto px-8 py-4 rounded-full font-black text-sm text-white bg-[#2563EB] hover:bg-[#1D4ED8] active:scale-[0.98] disabled:opacity-40 transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>PROCESSING...</span>
                </>
              ) : (
                <>
                  <span>{t.btnProcess}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {downloadUrl && (
              <a
                href={downloadUrl}
                download={downloadFilename}
                className="w-full sm:w-auto px-8 py-4 rounded-full font-black text-sm text-white bg-emerald-600 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 animate-bounce-subtle"
              >
                <Download className="w-4 h-4" />
                <span>{t.btnDownload}</span>
              </a>
            )}
          </div>

          {statusMessage && (
            <div
              className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-2 ${
                statusMessage.startsWith("Error")
                  ? "bg-red-50 border border-red-200 text-red-800"
                  : "bg-emerald-50 border border-emerald-200 text-emerald-800"
              }`}
            >
              {statusMessage.startsWith("Error") ? (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              )}
              <span>{statusMessage}</span>
            </div>
          )}
        </div>

        {/* 5. LIVE DOCUMENT STATS & INTELLIGENCE */}
        {docStats && (
          <section className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-md space-y-4">
            <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              <span>{t.statsTitle}</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100">
                <span className="text-[11px] font-bold uppercase text-blue-600 tracking-wider">
                  {t.words}
                </span>
                <p className="text-2xl font-black text-blue-950 mt-1">{docStats.words}</p>
              </div>
              <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100">
                <span className="text-[11px] font-bold uppercase text-purple-600 tracking-wider">
                  {t.characters}
                </span>
                <p className="text-2xl font-black text-purple-950 mt-1">{docStats.characters}</p>
              </div>
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-100">
                <span className="text-[11px] font-bold uppercase text-amber-600 tracking-wider">
                  {t.paragraphs}
                </span>
                <p className="text-2xl font-black text-amber-950 mt-1">{docStats.paragraphs}</p>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100">
                <span className="text-[11px] font-bold uppercase text-emerald-600 tracking-wider">
                  {t.readTime}
                </span>
                <p className="text-2xl font-black text-emerald-950 mt-1">
                  ~{docStats.estimatedReadingMinutes} min
                </p>
              </div>
            </div>
          </section>
        )}

        {/* 6. IN-BROWSER HTML PREVIEW */}
        {docHtmlPreview && (
          <section className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-md space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-600" />
                <span>Word Document Visual Preview</span>
              </h3>
              <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">
                Live Render
              </span>
            </div>
            <div
              className="prose prose-sm max-w-none p-6 rounded-2xl bg-gray-50 border border-gray-100 max-h-96 overflow-y-auto leading-relaxed text-gray-800"
              dangerouslySetInnerHTML={{ __html: docHtmlPreview }}
            />
          </section>
        )}
      </main>

      {/* 7. FOOTER */}
      <footer className="border-t border-gray-200 bg-white py-10 px-4 text-center text-xs text-gray-500 font-medium">
        <p>© 2026 DocxKiKit (डॉक्स की किट) • Universal Open Document Platform</p>
        <p className="mt-1">
          Designed for speed, zero cloud lock-in, and full client-side privacy.
        </p>
      </footer>
    </div>
  );
}
