// src/components/LanguageSwitcher.tsx
"use client";

import React from "react";
import { Globe } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface LanguageSwitcherProps {
  className?: string;
  variant?: "pill" | "button" | "minimal";
}

export default function LanguageSwitcher({
  className = "",
  variant = "pill",
}: LanguageSwitcherProps) {
  const { language, setLanguage, toggleLanguage } = useLanguage();

  if (variant === "minimal") {
    return (
      <button
        onClick={toggleLanguage}
        className={`inline-flex items-center gap-1.5 text-xs font-bold text-gray-700 hover:text-[#e8394c] transition-colors ${className}`}
        title="Toggle Language / भाषा बदलें"
      >
        <Globe className="w-3.5 h-3.5" />
        <span>{language === "en" ? "हिन्दी" : "English"}</span>
      </button>
    );
  }

  return (
    <div
      className={`inline-flex items-center rounded-full bg-black/5 p-0.5 border border-black/10 text-xs font-semibold ${className}`}
    >
      <button
        onClick={() => setLanguage("en")}
        className={`px-2.5 py-1 rounded-full transition-all ${
          language === "en"
            ? "bg-white text-[#17151a] shadow-xs font-bold"
            : "text-gray-500 hover:text-[#17151a]"
        }`}
      >
        EN
      </button>
      <button
        onClick={() => setLanguage("hi")}
        className={`px-2.5 py-1 rounded-full transition-all ${
          language === "hi"
            ? "bg-[#e8394c] text-white shadow-xs font-bold"
            : "text-gray-500 hover:text-[#17151a]"
        }`}
      >
        हिन्दी
      </button>
    </div>
  );
}
