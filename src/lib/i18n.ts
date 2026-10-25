// src/lib/i18n.ts
/**
 * V2V Bilingual Translation Engine (English & Hindi)
 * Engineered for Indian users to make emergency blood coordination
 * natural, non-intimidating, and accessible regardless of English fluency.
 */

export type Language = "en" | "hi";

export interface TranslationDictionary {
  // Brand & Common
  brandName: string;
  brandTagline: string;
  brandSubtitle: string;
  brandCertified: string;
  languageToggle: string;
  emergencyHelpline: string;
  call24x7: string;

  // Navigation
  navHome: string;
  navFindBlood: string;
  navCamps: string;
  navCanIDonate: string;
  navDonorPass: string;
  navSos: string;
  navRegister: string;
  navSimulator: string;

  // Hero Section
  heroBadge: string;
  heroHeadline1: string;
  heroHeadline2: string;
  heroSubhead: string;
  heroCtaRegister: string;
  heroCtaFind: string;
  trustNbtc: string;
  trustFree: string;
  trustEmergency: string;
  activeDonorsBadge: string;

  // Live Stock & Centres
  stockTitle: string;
  stockSubtitle: string;
  selectBloodGroup: string;
  searchPlaceholder: string;
  availableUnits: string;
  statusOpen24x7: string;
  btnCallNow: string;
  btnEmergencyRequest: string;

  // Can I Donate Modal
  eligibilityTitle: string;
  eligibilitySubtitle: string;
  qAge: string;
  qWeight: string;
  qHealth: string;
  qGap: string;
  eligibleResult: string;
  eligibleSub: string;
  notEligibleResult: string;
  notEligibleSub: string;
  btnClose: string;

  // Emergency SOS Intake (/request/new)
  sosTitle: string;
  sosSubtitle: string;
  reassuranceBanner: string;
  reassuranceHighlight: string;
  scanSlipTitle: string;
  scanSlipSubtitle: string;
  btnScanValidAiims: string;
  btnScanValidApollo: string;
  patientNameLabel: string;
  patientNamePlaceholder: string;
  patientUhidLabel: string;
  patientUhidPlaceholder: string;
  hospitalNameLabel: string;
  selectHospitalPreset: string;
  btnDetectGps: string;
  bloodGroupLabel: string;
  componentLabel: string;
  unitsNeededLabel: string;
  requestModeLabel: string;
  replacementModeTitle: string;
  replacementModeDesc: string;
  exactModeTitle: string;
  exactModeDesc: string;
  sdpLockBadge: string;
  sdpAdvisoryTitle: string;
  sdpAdvisoryBody: string;
  btnBroadcastEmergency: string;
  btnBroadcasting: string;

  // Family Command Center (/r/[shortHash])
  commandCenterTitle: string;
  commandCenterSubtitle: string;
  btnShareWhatsApp: string;
  whatsAppSharedSuccess: string;
  radarTitle: string;
  radarSubtitle: string;
  rosterTitle: string;
  antiToutNotice: string;
  handshakePinLabel: string;
  btnCallDonorMasked: string;

  // Donor Registration (/register)
  registerTitle: string;
  registerSubtitle: string;
  donorNameLabel: string;
  donorPhoneLabel: string;
  donorGenderLabel: string;
  donorWeightLabel: string;
  donorDistrictLabel: string;
  btnCompleteRegistration: string;
  digitalPassTitle: string;
  digitalPassSubtitle: string;
  verifiedDonorBadge: string;
  btnCopyDonorId: string;
  donorIdCopied: string;

  // Footer
  footerDesc: string;
  footerFindBlood: string;
  footerForDonors: string;
  footerLegal: string;
  footerCopyright: string;
  footerWatchdog: string;
}

export const translations: Record<Language, TranslationDictionary> = {
  en: {
    // Brand & Common
    brandName: "V2V",
    brandTagline: "Life Flow Network",
    brandSubtitle: "National Emergency Blood & Platelet Network",
    brandCertified: "Certified under National Blood Transfusion Council guidelines. 100% voluntary, non-commercial.",
    languageToggle: "हिंदी में बदलें (Hindi)",
    emergencyHelpline: "24x7 National Helpline: 104 / 1075 / 1910",
    call24x7: "Call 24x7",

    // Navigation
    navHome: "Home",
    navFindBlood: "Find Blood",
    navCamps: "Blood Camps",
    navCanIDonate: "Can I Donate?",
    navDonorPass: "Donor Pass",
    navSos: "SOS 24x7",
    navRegister: "Register as Donor",
    navSimulator: "Simulator",

    // Hero Section
    heroBadge: "India's Largest Voluntary Blood Donor Network",
    heroHeadline1: "Become a donor,",
    heroHeadline2: "Save lives.",
    heroSubhead: "Join India's voluntary blood donor collective. Find verified blood banks nearby, request emergency units in minutes, or register to save lives in your neighborhood.",
    heroCtaRegister: "Register as Donor",
    heroCtaFind: "Find Blood Near You",
    trustNbtc: "NBTC Certified Standards",
    trustFree: "100% Free & Voluntary",
    trustEmergency: "24x7 Emergency Dispatch",
    activeDonorsBadge: "5.8M+ Lifesavers",

    // Live Stock & Centres
    stockTitle: "Live Blood Stock & Verified Centres",
    stockSubtitle: "Real-time blood bank inventory across Delhi NCR. Directly verify stock or broadcast an emergency request.",
    selectBloodGroup: "Select Blood Group:",
    searchPlaceholder: "Search hospital name, area, or district...",
    availableUnits: "units available",
    statusOpen24x7: "OPEN 24x7",
    btnCallNow: "Call Centre",
    btnEmergencyRequest: "Request This Group",

    // Can I Donate Modal
    eligibilityTitle: "Can I Donate Blood Today?",
    eligibilitySubtitle: "Quick 10-second NBTC screener to verify your eligibility.",
    qAge: "Are you between 18 and 65 years of age?",
    qWeight: "Is your weight at least 45 kg (50 kg for SDP platelets)?",
    qHealth: "Are you feeling completely well today with no fever or active medications?",
    qGap: "Has it been at least 90 days (male) / 120 days (female) since your last whole blood donation?",
    eligibleResult: "You Are Eligible to Donate Blood!",
    eligibleSub: "Your voluntary donation can save up to 3 precious lives in an emergency.",
    notEligibleResult: "Temporary Deferral Advised",
    notEligibleSub: "Based on NBTC clinical safety guidelines, please allow adequate rest before donating.",
    btnClose: "Close Screener",

    // Emergency SOS Intake (/request/new)
    sosTitle: "24x7 Emergency Blood & Platelet Request",
    sosSubtitle: "Rapid geospatial mobilization connecting hospital patients with verified voluntary donors.",
    reassuranceBanner: "Don't panic • V2V automatically pings verified nearby donors in your hospital's 3 km cluster • 100% Free & Voluntary",
    reassuranceHighlight: "Zero touts, direct hospital coordination.",
    scanSlipTitle: "Scan Doctor's Requisition Slip",
    scanSlipSubtitle: "Upload your hospital blood request slip. AI automatically fills patient and hospital details.",
    btnScanValidAiims: "Sample Slip (AIIMS SDP)",
    btnScanValidApollo: "Sample Slip (Apollo PRBC)",
    patientNameLabel: "Patient Full Name",
    patientNamePlaceholder: "e.g. Aarav Sharma",
    patientUhidLabel: "Hospital UHID / IPD Registration No.",
    patientUhidPlaceholder: "e.g. AIIMS-2026-9921",
    hospitalNameLabel: "Hospital Name",
    selectHospitalPreset: "Select Hospital or Use Current GPS:",
    btnDetectGps: "Detect My GPS Location",
    bloodGroupLabel: "Blood Group Needed",
    componentLabel: "Blood Component Required",
    unitsNeededLabel: "Units Needed",
    requestModeLabel: "Coordination Mode",
    replacementModeTitle: "Replacement Mode",
    replacementModeDesc: "Any donor blood group acceptable for hospital blood bank exchange inventory.",
    exactModeTitle: "Exact / Compatible Match Only",
    exactModeDesc: "Direct ABO/Rh compatibility required for direct patient transfusion.",
    sdpLockBadge: "Locked to EXACT_OR_SDP (NBTC Rule)",
    sdpAdvisoryTitle: "NBTC Clinical Advisory:",
    sdpAdvisoryBody: "Single Donor Platelet (SDP) apheresis transfusions require strictly ABO/Rh compatible or exact matches to prevent severe immune-mediated platelet refractoriness. Replacement mode is prohibited for SDP.",
    btnBroadcastEmergency: "Broadcast Emergency Alert Now",
    btnBroadcasting: "Dispatching Wave 1 (0-3 km)...",

    // Family Command Center (/r/[shortHash])
    commandCenterTitle: "Emergency Dispatch Command Center",
    commandCenterSubtitle: "Live radar and community volunteer response for patient",
    btnShareWhatsApp: "Share on WhatsApp",
    whatsAppSharedSuccess: "Link Copied & Ready to Share!",
    radarTitle: "Geospatial Dispatch Radar",
    radarSubtitle: "Live donor search radius expanding automatically every 25 minutes",
    rosterTitle: "Community Donor Roster",
    antiToutNotice: "Anti-Tout Protection: Direct phone numbers masked. Use secure bridge or counter PIN.",
    handshakePinLabel: "Counter Handshake PIN:",
    btnCallDonorMasked: "Call Donor (Masked)",

    // Donor Registration (/register)
    registerTitle: "Register as a Voluntary Lifesaver",
    registerSubtitle: "Join V2V to be notified only when emergency blood is needed within 3-7 km of your location.",
    donorNameLabel: "Full Name",
    donorPhoneLabel: "Mobile Phone (+91)",
    donorGenderLabel: "Gender",
    donorWeightLabel: "Weight (kg)",
    donorDistrictLabel: "City / District",
    btnCompleteRegistration: "Generate V2V Donor Pass",
    digitalPassTitle: "Registration Successful",
    digitalPassSubtitle: "You are now an active volunteer. Below is your official V2V donor identification card.",
    verifiedDonorBadge: "Verified Lifesaver",
    btnCopyDonorId: "Copy Donor ID",
    donorIdCopied: "Donor ID Copied!",

    // Footer
    footerDesc: "India's digital public health infrastructure for voluntary blood donor mobilization, real-time inventory discovery, and 24x7 emergency medical dispatches.",
    footerFindBlood: "Find Blood",
    footerForDonors: "For Donors",
    footerLegal: "Legal & NBTC",
    footerCopyright: "© 2026 V2V - Life Flow Network. Certified under National Blood Transfusion Council guidelines. 100% voluntary, non-commercial blood donor network.",
    footerWatchdog: "Emergency Dispatch Watchdog: ACTIVE (25-min SLA)",
  },

  hi: {
    // Brand & Common
    brandName: "V2V",
    brandTagline: "लाइफ फ्लो नेटवर्क",
    brandSubtitle: "राष्ट्रीय आपातकालीन रक्त व प्लेटलेट्स नेटवर्क",
    brandCertified: "राष्ट्रीय रक्त संचरण परिषद (NBTC) दिशानिर्देशों के तहत प्रमाणित। 100% स्वैच्छिक एवं निशुल्क।",
    languageToggle: "Switch to English",
    emergencyHelpline: "24x7 राष्ट्रीय हेल्पलाइन: 104 / 1075 / 1910",
    call24x7: "24x7 कॉल करें",

    // Navigation
    navHome: "होम",
    navFindBlood: "ब्लड खोजें",
    navCamps: "रक्तदान शिविर",
    navCanIDonate: "क्या मैं रक्तदान कर सकता हूँ?",
    navDonorPass: "दाता पास",
    navSos: "आपातकालीन SOS",
    navRegister: "रक्तदाता बनें",
    navSimulator: "सिम्युलेटर",

    // Hero Section
    heroBadge: "भारत का सबसे बड़ा स्वैच्छिक रक्तदाता नेटवर्क",
    heroHeadline1: "रक्तदाता बनें,",
    heroHeadline2: "जीवन बचाएं।",
    heroSubhead: "भारत के स्वैच्छिक रक्तदाता समूह से जुड़ें। नजदीकी सत्यापित ब्लड बैंक खोजें, मिनटों में इमरजेंसी ब्लड प्राप्त करें या अपने क्षेत्र में जीवन रक्षक बनें।",
    heroCtaRegister: "रक्तदाता पंजीकरण",
    heroCtaFind: "नजदीकी ब्लड खोजें",
    trustNbtc: "NBTC प्रमाणित मानक",
    trustFree: "100% निशुल्क एवं स्वैच्छिक",
    trustEmergency: "24x7 आपातकालीन सहायता",
    activeDonorsBadge: "58 लाख+ जीवन रक्षक",

    // Live Stock & Centres
    stockTitle: "लाइव ब्लड स्टॉक एवं सत्यापित ब्लड बैंक",
    stockSubtitle: "दिल्ली एनसीआर और भारत के प्रमाणित ब्लड बैंकों का लाइव स्टॉक। तुरंत उपलब्धता जांचें या आपातकालीन अनुरोध भेजें।",
    selectBloodGroup: "रक्त समूह चुनें:",
    searchPlaceholder: "अस्पताल का नाम, क्षेत्र या जिला खोजें...",
    availableUnits: "यूनिट्स उपलब्ध",
    statusOpen24x7: "24x7 खुला",
    btnCallNow: "ब्लड बैंक को कॉल करें",
    btnEmergencyRequest: "इस ग्रुप का अनुरोध करें",

    // Can I Donate Modal
    eligibilityTitle: "क्या आज मैं रक्तदान कर सकता हूँ?",
    eligibilitySubtitle: "आपकी पात्रता जांचने के लिए 10 सेकंड का सरल NBTC स्वास्थ्य परीक्षण।",
    qAge: "क्या आपकी उम्र 18 से 65 वर्ष के बीच है?",
    qWeight: "क्या आपका वजन कम से कम 45 किलो (प्लेटलेट्स के लिए 50 किलो) है?",
    qHealth: "क्या आप आज पूर्णतः स्वस्थ महसूस कर रहे हैं और बुखार या किसी दवा पर नहीं हैं?",
    qGap: "क्या आपके पिछले पूर्ण रक्तदान को 90 दिन (पुरुष) / 120 दिन (महिला) बीत चुके हैं?",
    eligibleResult: "बधाई हो! आप रक्तदान के लिए पूरी तरह पात्र हैं",
    eligibleSub: "आपका एक रक्तदान किसी आपातकालीन स्थिति में 3 अनमोल जिंदगियां बचा सकता है।",
    notEligibleResult: "फिलहाल थोड़े समय प्रतीक्षा की सलाह",
    notEligibleSub: "NBTC स्वास्थ्य दिशानिर्देशों के अनुसार, कृपया पूरी तरह स्वस्थ होने के बाद ही रक्तदान करें।",
    btnClose: "परीक्षण बंद करें",

    // Emergency SOS Intake (/request/new)
    sosTitle: "24x7 आपातकालीन रक्त व प्लेटलेट्स अनुरोध",
    sosSubtitle: "मरीज के अस्पताल के निकटतम सत्यापित रक्तदाताओं तक सीधा एवं त्वरित संपर्क।",
    reassuranceBanner: "घबराएं नहीं • V2V अस्पताल के 3 किमी दायरे में मौजूद सत्यापित दाताओं को तुरंत सूचित करता है • 100% निशुल्क",
    reassuranceHighlight: "कोई बिचौलिया नहीं, अस्पताल से सीधा तालमेल।",
    scanSlipTitle: "डॉक्टर का पर्चा (Requisition Slip) स्कैन करें",
    scanSlipSubtitle: "अस्पताल के पर्चे की फोटो अपलोड करें। आवश्यक विवरण स्वतः भर जाएगा।",
    btnScanValidAiims: "सैंपल पर्चा (AIIMS SDP)",
    btnScanValidApollo: "सैंपल पर्चा (Apollo PRBC)",
    patientNameLabel: "मरीज का पूरा नाम",
    patientNamePlaceholder: "उदा. आरव शर्मा",
    patientUhidLabel: "अस्पताल UHID / रजिस्ट्रेशन नंबर",
    patientUhidPlaceholder: "उदा. AIIMS-2026-9921",
    hospitalNameLabel: "अस्पताल का नाम",
    selectHospitalPreset: "अस्पताल चुनें या GPS लोकेशन उपयोग करें:",
    btnDetectGps: "मेरी GPS लोकेशन पता करें",
    bloodGroupLabel: "आवश्यक रक्त समूह",
    componentLabel: "आवश्यक रक्त घटक",
    unitsNeededLabel: "यूनिट्स की आवश्यकता",
    requestModeLabel: "समन्वय प्रकार",
    replacementModeTitle: "रिप्लेसमेंट मोड",
    replacementModeDesc: "अस्पताल ब्लड बैंक एक्सचेंज के लिए कोई भी रक्त समूह स्वीकार्य है।",
    exactModeTitle: "सटीक / संगत मैच ही चाहिए",
    exactModeDesc: "मरीज को सीधे ट्रांसफ्यूजन के लिए सटीक एबीओ/आरएच मिलान अनिवार्य है।",
    sdpLockBadge: "Locked to EXACT_OR_SDP (NBTC Rule)",
    sdpAdvisoryTitle: "NBTC क्लिनिकल निर्देश:",
    sdpAdvisoryBody: "Single Donor Platelet (SDP) apheresis transfusions require strictly ABO/Rh compatible or exact matches to prevent severe immune-mediated platelet refractoriness. Replacement mode is prohibited for SDP.",
    btnBroadcastEmergency: "आपातकालीन अलर्ट तुरंत भेजें (SOS)",
    btnBroadcasting: "वेव 1 (0-3 किमी) में अलर्ट भेजा जा रहा है...",

    // Family Command Center (/r/[shortHash])
    commandCenterTitle: "आपातकालीन प्रेषण नियंत्रण कक्ष",
    commandCenterSubtitle: "मरीज के लिए लाइव डोनर रडार और स्वयंसेवक प्रतिक्रिया",
    btnShareWhatsApp: "व्हाट्सएप पर शेयर करें",
    whatsAppSharedSuccess: "लिंक कॉपी हो गया! व्हाट्सएप पर भेजें",
    radarTitle: "भौगोलिक प्रेषण रडार (Wave Radar)",
    radarSubtitle: "हर 25 मिनट में स्वतः विस्तृत होता डोनर खोज दायरा",
    rosterTitle: "सामुदायिक रक्तदाता सूची",
    antiToutNotice: "दलाल-विरोधी सुरक्षा: फोन नंबर सुरक्षित हैं। सुरक्षित कॉल ब्रिज या काउंटर पिन का उपयोग करें।",
    handshakePinLabel: "काउंटर हैंडशेक पिन:",
    btnCallDonorMasked: "दाता को कॉल करें (मास्क्ड)",

    // Donor Registration (/register)
    registerTitle: "स्वैच्छिक जीवन रक्षक के रूप में जुड़ें",
    registerSubtitle: "V2V से जुड़ें ताकि आपके क्षेत्र के 3-7 किमी में आपात स्थिति होने पर ही आपको सूचित किया जाए।",
    donorNameLabel: "पूरा नाम",
    donorPhoneLabel: "मोबाइल नंबर (+91)",
    donorGenderLabel: "लिंग",
    donorWeightLabel: "वजन (किलो)",
    donorDistrictLabel: "शहर / जिला",
    btnCompleteRegistration: "डिजिटल V2V पास बनाएं",
    digitalPassTitle: "पंजीकरण सफल!",
    digitalPassSubtitle: "अब आप एक सक्रिय स्वयंसेवक हैं। नीचे आपका आधिकारिक V2V पहचान पत्र है।",
    verifiedDonorBadge: "सत्यापित जीवन रक्षक",
    btnCopyDonorId: "दाता आईडी कॉपी करें",
    donorIdCopied: "आईडी कॉपी हो गई!",

    // Footer
    footerDesc: "स्वैच्छिक रक्तदान, वास्तविक समय स्टॉक खोज और 24x7 आपातकालीन सहायता के लिए भारत का डिजिटल सार्वजनिक स्वास्थ्य नेटवर्क।",
    footerFindBlood: "ब्लड खोजें",
    footerForDonors: "रक्तदाताओं के लिए",
    footerLegal: "कानूनी व NBTC",
    footerCopyright: "© 2026 V2V - Life Flow Network. Certified under National Blood Transfusion Council guidelines. 100% voluntary, non-commercial blood donor network.",
    footerWatchdog: "Emergency Dispatch Watchdog: ACTIVE (25-min SLA)",
  },
};

/**
 * Formats a pre-composed WhatsApp emergency share message for Indian users.
 */
export function createWhatsAppShareMessage(params: {
  hospitalName: string;
  patientName: string;
  patientUhid: string;
  bloodGroup: string;
  component: string;
  unitsNeeded: number;
  trackingUrl: string;
  language?: Language;
}): string {
  const {
    hospitalName,
    patientName,
    patientUhid,
    bloodGroup,
    component,
    unitsNeeded,
    trackingUrl,
    language = "en",
  } = params;

  if (language === "hi") {
    return (
      `🚨 *अति आवश्यक: ब्लड की सख्त जरूरत (V2V नेटवर्क)* 🚨\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `🏥 *अस्पताल:* ${hospitalName}\n` +
      `👤 *मरीज:* ${patientName} (${patientUhid})\n` +
      `🩸 *ब्लड ग्रुप:* ${bloodGroup.replace("_POS", "+").replace("_NEG", "-")}\n` +
      `💉 *घटक:* ${component} (${unitsNeeded} यूनिट्स)\n` +
      `📍 *लाइव ट्रैकिंग व डोनर समन्वय لنک:* \n${trackingUrl}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `🙏 *यदि आप निकट हैं और रक्तदान कर सकते हैं, तो कृपया ऊपर दिए गए लिंक पर तुरंत क्लिक करें।*\n` +
      `*100% स्वैच्छिक एवं निशुल्क • NBTC दिशानिर्देशों के तहत प्रमाणित*`
    );
  }

  return (
    `🚨 *URGENT: BLOOD / PLATELETS REQUIRED (V2V LIFE FLOW)* 🚨\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `🏥 *Hospital:* ${hospitalName}\n` +
    `👤 *Patient:* ${patientName} (${patientUhid})\n` +
    `🩸 *Blood Group:* ${bloodGroup.replace("_POS", "+").replace("_NEG", "-")}\n` +
    `💉 *Component:* ${component} (${unitsNeeded} Units)\n` +
    `📍 *Live Dispatch Radar & Donor Coordination:* \n${trackingUrl}\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━\n` +
    `🙏 *If you are nearby and eligible to donate, please tap the link above immediately to lock a donation slot.*\n` +
    `*100% Voluntary & Free • Certified under National Blood Transfusion Council Guidelines*`
  );
}

/**
 * Returns translation for key in given language, defaulting gracefully to English.
 */
export function getTranslation(key: keyof TranslationDictionary, lang: Language = "en"): string {
  const dict = translations[lang] || translations.en;
  return dict[key] || translations.en[key] || String(key);
}

export default translations;
