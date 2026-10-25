// src/components/WhatsAppShareButton.tsx
"use client";

import React, { useState } from "react";
import { Share2, Check, MessageSquare } from "lucide-react";
import { createWhatsAppShareMessage } from "@/lib/i18n";
import { useLanguage } from "@/context/LanguageContext";

interface WhatsAppShareButtonProps {
  hospitalName: string;
  patientName: string;
  patientUhid: string;
  bloodGroup: string;
  component: string;
  unitsNeeded: number;
  trackingUrl: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export default function WhatsAppShareButton({
  hospitalName,
  patientName,
  patientUhid,
  bloodGroup,
  component,
  unitsNeeded,
  trackingUrl,
  className = "",
  size = "md",
}: WhatsAppShareButtonProps) {
  const { language, t } = useLanguage();
  const [copied, setCopied] = useState(false);

  // Ensure absolute tracking URL for recipients
  const resolvedUrl =
    typeof window !== "undefined" && !trackingUrl.startsWith("http")
      ? `${window.location.origin}${trackingUrl}`
      : trackingUrl;

  const handleShare = () => {
    const message = createWhatsAppShareMessage({
      hospitalName,
      patientName,
      patientUhid,
      bloodGroup,
      component,
      unitsNeeded,
      trackingUrl: resolvedUrl,
      language,
    });

    // Copy to clipboard as convenient fallback
    if (typeof window !== "undefined" && navigator?.clipboard) {
      navigator.clipboard.writeText(message).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }

    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    if (typeof window !== "undefined") {
      window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    }
  };

  const sizeClasses =
    size === "sm"
      ? "px-3 py-1.5 text-xs gap-1.5"
      : size === "lg"
      ? "px-6 py-3.5 text-base gap-2.5"
      : "px-4 py-2.5 text-sm gap-2";

  return (
    <button
      onClick={handleShare}
      className={`inline-flex items-center justify-center font-bold text-white bg-[#25D366] hover:bg-[#20bd5a] active:scale-95 transition-all rounded-full shadow-md shadow-[#25D366]/20 cursor-pointer ${sizeClasses} ${className}`}
      title="Share urgent emergency alert directly on WhatsApp groups"
    >
      {copied ? (
        <Check className="w-4 h-4 text-white" />
      ) : (
        <MessageSquare className="w-4 h-4 fill-white text-[#25D366]" />
      )}
      <span>{copied ? t("whatsAppSharedSuccess") : t("btnShareWhatsApp")}</span>
    </button>
  );
}
