// src/lib/__tests__/i18n.test.ts
import { translations, getTranslation, createWhatsAppShareMessage } from "@/lib/i18n";

describe("Bilingual Support & Indian UX Engine Suite", () => {
  it("provides comprehensive parity across English and Hindi dictionaries", () => {
    const enKeys = Object.keys(translations.en) as Array<keyof typeof translations.en>;
    const hiKeys = Object.keys(translations.hi) as Array<keyof typeof translations.hi>;

    expect(enKeys.length).toBeGreaterThan(30);
    expect(hiKeys.length).toBe(enKeys.length);

    // Verify all keys have non-empty strings in both languages
    for (const key of enKeys) {
      expect(translations.en[key]).toBeTruthy();
      expect(translations.hi[key]).toBeTruthy();
    }
  });

  it("getTranslation falls back to English when given unknown language", () => {
    const textEn = getTranslation("brandName", "en");
    expect(textEn).toBe("V2V");

    const textHi = getTranslation("brandName", "hi");
    expect(textHi).toBe("V2V");

    // @ts-expect-error test fallback
    const textFallback = getTranslation("heroHeadline1", "fr");
    expect(textFallback).toBe("Become a donor,");
  });

  it("formats WhatsApp emergency broadcast messages for English", () => {
    const msg = createWhatsAppShareMessage({
      hospitalName: "AIIMS Delhi, Trauma Centre",
      patientName: "Aarav Sharma",
      patientUhid: "AIIMS-2026-9921",
      bloodGroup: "B_POS",
      component: "SDP",
      unitsNeeded: 2,
      trackingUrl: "https://v2v.network/r/v2v_test_hash",
      language: "en",
    });

    expect(msg).toContain("URGENT: BLOOD / PLATELETS REQUIRED");
    expect(msg).toContain("AIIMS Delhi, Trauma Centre");
    expect(msg).toContain("Aarav Sharma");
    expect(msg).toContain("AIIMS-2026-9921");
    expect(msg).toContain("B+");
    expect(msg).toContain("SDP (2 Units)");
    expect(msg).toContain("https://v2v.network/r/v2v_test_hash");
    expect(msg).toContain("100% Voluntary & Free");
  });

  it("formats WhatsApp emergency broadcast messages for Hindi", () => {
    const msg = createWhatsAppShareMessage({
      hospitalName: "सफदरजंग अस्पताल, नई दिल्ली",
      patientName: "आरव शर्मा",
      patientUhid: "SAF-2026-881",
      bloodGroup: "O_POS",
      component: "WHOLE_BLOOD",
      unitsNeeded: 1,
      trackingUrl: "https://v2v.network/r/v2v_hindi_hash",
      language: "hi",
    });

    expect(msg).toContain("अति आवश्यक: ब्लड की सख्त जरूरत");
    expect(msg).toContain("सफदरजंग अस्पताल, नई दिल्ली");
    expect(msg).toContain("आरव शर्मा");
    expect(msg).toContain("SAF-2026-881");
    expect(msg).toContain("O+");
    expect(msg).toContain("https://v2v.network/r/v2v_hindi_hash");
    expect(msg).toContain("100% स्वैच्छिक एवं निशुल्क");
  });
});
