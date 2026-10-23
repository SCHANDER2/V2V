// src/components/HealthChecklist.tsx
"use client";

import React, { useState } from "react";

export interface HealthChecklistProps {
  component: string; // e.g. "SDP", "WHOLE_BLOOD", "PRBC"
  donorWeightKg?: number;
  donorGender?: string;
  onPass: () => void;
  onDeferral: (reason: string) => void;
  disabled?: boolean;
  className?: string;
}

interface QuestionDef {
  id: string;
  text: string;
  clinicalNote: string;
  disqualifyingAnswer: "YES" | "NO";
  deferralReason: string;
}

export default function HealthChecklist({
  component,
  donorWeightKg,
  donorGender,
  onPass,
  onDeferral,
  disabled = false,
  className = "",
}: HealthChecklistProps) {
  const isSdp = component === "SDP";

  const questions: QuestionDef[] = [
    {
      id: "fever",
      text: "Feeling completely well today? No fever, chills, cough, sore throat, or infectious symptoms in past 48 hours?",
      clinicalNote: "Protects recipient from transfusion-transmitted bacterial/viral load.",
      disqualifyingAnswer: "NO",
      deferralReason:
        "Active symptoms or recent fever requires a minimum 48-hour symptom-free recovery to protect recipient and donor health.",
    },
    {
      id: "alcohol",
      text: "Have you consumed alcohol within the last 24 hours?",
      clinicalNote: "Alcohol induces dehydration, plasma volume shifts, and altered platelet aggregation.",
      disqualifyingAnswer: "YES",
      deferralReason:
        "Alcohol consumption within 24 hours impairs hydration and blood quality under NBTC clinical safety standards.",
    },
    {
      id: "surgery",
      text: "Have you had any dental extraction, root canal, minor surgery, or antibiotic therapy in the last 72 hours?",
      clinicalNote: "Recent dental/surgical trauma presents elevated risk of transient bacteremia.",
      disqualifyingAnswer: "YES",
      deferralReason:
        "Dental extractions or procedures within 72 hours carry risk of transient bacteremia, requiring temporary deferral.",
    },
    {
      id: "tattoo",
      text: "Have you received a tattoo, body piercing, microblading, or acupuncture in the past 6 months?",
      clinicalNote: "Mandated 6-month window period for Hepatitis B, C, and retroviral clearance.",
      disqualifyingAnswer: "YES",
      deferralReason:
        "Under NBTC guidelines, tattoos and body piercings require a 6-month safety window to clear diagnostic window periods.",
    },
    isSdp
      ? {
          id: "nsaids",
          text: "Painkillers & Weight: Have you refrained from Aspirin/NSAIDs for 48 hours, and is your body weight at least 50 kg?",
          clinicalNote: "Aspirin permanently acetylates platelet COX-1, disabling clotting power. SDP requires ≥50kg.",
          disqualifyingAnswer: "NO",
          deferralReason:
            "Platelet donors must be free from Aspirin/NSAIDs for 48 hours to maintain platelet viability, and weigh at least 50 kg.",
        }
      : {
          id: "weight",
          text: "Is your current body weight at least 45 kg, and are you free from prescription blood thinners?",
          clinicalNote: "Whole blood donation requires minimum 45 kg donor mass for standard 350ml/450ml collections.",
          disqualifyingAnswer: "NO",
          deferralReason:
            "Whole blood donation requires a minimum body weight of 45 kg to prevent vasovagal hypovolemic reactions.",
        },
  ];

  const [answers, setAnswers] = useState<Record<string, "YES" | "NO">>({});
  const [deferredReason, setDeferredReason] = useState<string | null>(null);

  const handleAnswer = (q: QuestionDef, ans: "YES" | "NO") => {
    if (disabled) return;

    const newAnswers = { ...answers, [q.id]: ans };
    setAnswers(newAnswers);

    // Check if this answer disqualifies
    if (ans === q.disqualifyingAnswer) {
      setDeferredReason(q.deferralReason);
      onDeferral(q.deferralReason);
      return;
    }

    // Check if all answered and all passed
    const answeredCount = Object.keys(newAnswers).length;
    if (answeredCount === questions.length) {
      const anyDisqualified = questions.some(
        (item) => newAnswers[item.id] === item.disqualifyingAnswer
      );
      if (!anyDisqualified) {
        setDeferredReason(null);
        onPass();
      }
    }
  };

  const handleReset = () => {
    setAnswers({});
    setDeferredReason(null);
  };

  // If deferred, render empathetic clinical deferral card
  if (deferredReason) {
    return (
      <div className={`bg-amber-50 border-2 border-amber-300 rounded-2xl p-6 shadow-md text-amber-950 ${className}`}>
        <div className="flex items-center gap-3 mb-3">
          <div className="h-10 w-10 rounded-full bg-amber-200 flex items-center justify-center text-xl shrink-0">
            🛡️
          </div>
          <div>
            <h3 className="font-bold text-lg text-amber-900">
              Temporary Clinical Deferral (NBTC Guidelines)
            </h3>
            <p className="text-xs text-amber-800">
              National Blood Transfusion Council Safety Standard
            </p>
          </div>
        </div>

        <div className="bg-white/80 p-4 rounded-xl border border-amber-200 text-sm mb-4 leading-relaxed">
          <p className="font-semibold text-amber-900 mb-1">Reason for Deferral:</p>
          <p className="text-gray-700">{deferredReason}</p>
        </div>

        <p className="text-xs text-amber-800 leading-relaxed mb-4">
          Thank you deeply for your willingness to respond in an emergency. This temporary deferral is designed to safeguard both recipient immunity and your personal health. It does not affect your future eligibility once this safety window elapses.
        </p>

        <button
          type="button"
          onClick={handleReset}
          className="text-xs font-semibold text-amber-900 underline hover:text-amber-950"
        >
          ← Retake Self-Assessment
        </button>
      </div>
    );
  }

  const allPassed =
    Object.keys(answers).length === questions.length &&
    questions.every((q) => answers[q.id] && answers[q.id] !== q.disqualifyingAnswer);

  return (
    <div className={`bg-white rounded-2xl p-6 shadow-md border border-gray-200 ${className}`}>
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
        <div>
          <h3 className="text-base font-bold text-gray-900">
            Rapid Health &amp; Safety Screener
          </h3>
          <p className="text-xs text-gray-500">
            5 quick questions per National Blood Transfusion Council (NBTC) protocols
          </p>
        </div>
        <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
          {Object.keys(answers).length} / {questions.length} Answered
        </span>
      </div>

      <div className="space-y-4">
        {questions.map((q, idx) => {
          const currentAns = answers[q.id];
          return (
            <div
              key={q.id}
              className={`p-3.5 rounded-xl border transition-all ${
                currentAns ? "bg-gray-50/80 border-gray-300" : "bg-white border-gray-200"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <span className="inline-block text-xs font-bold text-gray-400 mr-1.5">
                    Q{idx + 1}.
                  </span>
                  <span className="text-sm font-medium text-gray-800 leading-snug">
                    {q.text}
                  </span>
                  <p className="text-[11px] text-gray-500 mt-1 italic">
                    Clinical Rationale: {q.clinicalNote}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => handleAnswer(q, "YES")}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                      currentAns === "YES"
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Yes
                  </button>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => handleAnswer(q, "NO")}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                      currentAns === "NO"
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    No
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {allPassed && (
        <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs flex items-center gap-2">
          <span>✅</span>
          <span>
            <strong>Screener Passed:</strong> All clinical criteria met. You are authorized to lock an emergency donation slot.
          </span>
        </div>
      )}
    </div>
  );
}
