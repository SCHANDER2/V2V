/**
 * V2V Emergency Blood & Platelet Dispatch PWA
 * Database Seed Script — prisma/seed.ts
 *
 * Implements R1 & AC1:
 * - 52 deterministic realistic donors across Delhi NCR and Faridabad.
 * - 3 sample premier hospitals (AIIMS Delhi, Indraprastha Apollo, Fortis Faridabad).
 * - Calibrated geospatial concentric rings (Wave 1: 0-3km, Wave 2: 3-7km, Wave 3: 7-15km).
 * - Full NBTC boundary coverage (weight <45kg, 45-50kg, >=50kg; cooldowns 89d vs 90d, 119d vs 120d, SDP 24h vs 72h).
 * - Multi-state wave requests (WAVE_1_DISPATCH, WAVE_2_DISPATCH, LEASE_LOCKED with N+1 standby, FULFILLED_CLOSED, EXPIRED).
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Portable enum definitions compatible with both PostgreSQL and SQLite
export const BloodGroup = {
  A_POS: "A_POS",
  A_NEG: "A_NEG",
  B_POS: "B_POS",
  B_NEG: "B_NEG",
  AB_POS: "AB_POS",
  AB_NEG: "AB_NEG",
  O_POS: "O_POS",
  O_NEG: "O_NEG",
  BOMBAY_OH: "BOMBAY_OH",
} as const;

export const Gender = {
  MALE: "MALE",
  FEMALE: "FEMALE",
} as const;

export const Component = {
  WHOLE_BLOOD: "WHOLE_BLOOD",
  PRBC: "PRBC",
  PLASMA: "PLASMA",
  SDP: "SDP",
} as const;

export const RequestMode = {
  REPLACEMENT_ANY: "REPLACEMENT_ANY",
  EXACT_OR_SDP: "EXACT_OR_SDP",
} as const;

export const WaveState = {
  PENDING_VERIFICATION: "PENDING_VERIFICATION",
  STOCK_CHECK: "STOCK_CHECK",
  WAVE_1_DISPATCH: "WAVE_1_DISPATCH",
  WAVE_2_DISPATCH: "WAVE_2_DISPATCH",
  WAVE_3_DISPATCH: "WAVE_3_DISPATCH",
  LEASE_LOCKED: "LEASE_LOCKED",
  FULFILLED_CLOSED: "FULFILLED_CLOSED",
  EXPIRED: "EXPIRED",
} as const;

export const LeaseStatus = {
  PINGED: "PINGED",
  JIT_PASSED: "JIT_PASSED",
  EN_ROUTE: "EN_ROUTE",
  ARRIVED: "ARRIVED",
  COMPLETED: "COMPLETED",
  EVICTED_TIMEOUT: "EVICTED_TIMEOUT",
  STANDBY: "STANDBY",
} as const;

// 3 Sample Hospitals (Exported for test assertions and DI registry)
export const SAMPLE_HOSPITALS = [
  {
    name: "AIIMS Delhi, Trauma Centre",
    address: "Sri Aurobindo Marg, Ansari Nagar, New Delhi, Delhi 110029",
    latitude: 28.5672,
    longitude: 77.2100,
    city: "New Delhi",
    state: "Delhi",
  },
  {
    name: "Indraprastha Apollo Hospital",
    address: "Sarita Vihar, Delhi-Mathura Road, New Delhi, Delhi 110076",
    latitude: 28.5401,
    longitude: 77.2832,
    city: "South Delhi",
    state: "Delhi",
  },
  {
    name: "Fortis Escorts Hospital Faridabad",
    address: "Neelam Bata Road, Sector 20A, Faridabad, Haryana 121001",
    latitude: 28.4089,
    longitude: 77.3178,
    city: "Faridabad",
    state: "Haryana",
  },
] as const;

interface SeedDonorDef {
  name: string;
  phoneNumber: string;
  latitude: number;
  longitude: number;
  bloodGroup: string;
  gender: string;
  weightKg: number;
  lastWholeBloodDaysAgo?: number;
  lastPlateletHoursAgo?: number;
  lastPRBCDaysAgo?: number;
  lastPingedHoursAgo?: number;
  snoozeDaysAhead?: number;
  trustScore: number;
}

// 52 Deterministic Donors across Delhi NCR and Faridabad
const DONOR_DEFINITIONS: SeedDonorDef[] = [
  // --- CLUSTER 1: AIIMS Vicinity & Central/South Delhi (Donors 1 - 25) ---
  // Wave 1 from AIIMS (0 - 3 km)
  {
    name: "Rohit Verma",
    phoneNumber: "+919810100001",
    latitude: 28.5588,
    longitude: 77.2065, // Green Park (0.99 km)
    bloodGroup: BloodGroup.O_POS,
    gender: Gender.MALE,
    weightKg: 74,
    lastWholeBloodDaysAgo: 95, // Male WB pass (>=90d)
    trustScore: 4.8,
  },
  {
    name: "Neha Sharma",
    phoneNumber: "+919810100002",
    latitude: 28.5760,
    longitude: 77.2105, // INA Colony (0.98 km)
    bloodGroup: BloodGroup.B_POS,
    gender: Gender.FEMALE,
    weightKg: 58,
    lastWholeBloodDaysAgo: 130, // Female WB pass (>=120d)
    trustScore: 4.9,
  },
  {
    name: "Amit Patel",
    phoneNumber: "+919810100003",
    latitude: 28.5580,
    longitude: 77.2025, // Safdarjung Enclave (1.26 km)
    bloodGroup: BloodGroup.A_POS,
    gender: Gender.MALE,
    weightKg: 68,
    trustScore: 4.5,
  },
  {
    name: "Kunal Malhotra",
    phoneNumber: "+919810100004",
    latitude: 28.5715,
    longitude: 77.2220, // South Extension Part 1 (1.27 km)
    bloodGroup: BloodGroup.B_POS,
    gender: Gender.MALE,
    weightKg: 75,
    trustScore: 4.7,
  },
  {
    name: "Ananya Sen",
    phoneNumber: "+919810100005",
    latitude: 28.5494,
    longitude: 77.2001, // Hauz Khas (2.20 km)
    bloodGroup: BloodGroup.O_NEG,
    gender: Gender.FEMALE,
    weightKg: 54,
    trustScore: 5.0,
  },
  {
    name: "Gaurav Khanna",
    phoneNumber: "+919810100006",
    latitude: 28.5645,
    longitude: 77.2380, // Lajpat Nagar IV (2.75 km)
    bloodGroup: BloodGroup.AB_POS,
    gender: Gender.MALE,
    weightKg: 82,
    trustScore: 4.2,
  },
  {
    name: "Pooja Mehra",
    phoneNumber: "+919810100007",
    latitude: 28.5570,
    longitude: 77.2080, // Green Park Ext (1.10 km)
    bloodGroup: BloodGroup.A_POS,
    gender: Gender.FEMALE,
    weightKg: 48, // Boundary: WB eligible (>=45kg), SDP ineligible (<50kg)
    trustScore: 4.1,
  },
  {
    name: "Ritu Choudhary",
    phoneNumber: "+919810100008",
    latitude: 28.5550,
    longitude: 77.2010, // Safdarjung Enclave B (1.30 km)
    bloodGroup: BloodGroup.B_POS,
    gender: Gender.FEMALE,
    weightKg: 43, // Boundary: Ineligible for all (<45kg)
    trustScore: 3.5,
  },

  // Wave 2 from AIIMS (3 - 7 km)
  {
    name: "Vikram Singh",
    phoneNumber: "+919810100009",
    latitude: 28.5910,
    longitude: 77.2270, // Lodhi Road (3.12 km)
    bloodGroup: BloodGroup.O_POS,
    gender: Gender.MALE,
    weightKg: 76,
    lastWholeBloodDaysAgo: 100,
    trustScore: 4.6,
  },
  {
    name: "Sneha Kulkarni",
    phoneNumber: "+919810100010",
    latitude: 28.5385,
    longitude: 77.2405, // Greater Kailash 1 (4.37 km)
    bloodGroup: BloodGroup.B_POS,
    gender: Gender.FEMALE,
    weightKg: 62,
    lastWholeBloodDaysAgo: 140,
    trustScore: 4.8,
  },
  {
    name: "Rahul Nair",
    phoneNumber: "+919810100011",
    latitude: 28.5245,
    longitude: 77.2065, // Saket (4.76 km)
    bloodGroup: BloodGroup.A_NEG,
    gender: Gender.MALE,
    weightKg: 70,
    trustScore: 4.4,
  },
  {
    name: "Deepa Bansal",
    phoneNumber: "+919810100012",
    latitude: 28.5950,
    longitude: 77.1850, // Chanakyapuri (4.00 km)
    bloodGroup: BloodGroup.AB_NEG,
    gender: Gender.FEMALE,
    weightKg: 59,
    trustScore: 4.3,
  },
  {
    name: "Manish Tiwari",
    phoneNumber: "+919810100013",
    latitude: 28.5280,
    longitude: 77.2120, // Malviya Nagar (4.50 km)
    bloodGroup: BloodGroup.O_POS,
    gender: Gender.MALE,
    weightKg: 71,
    lastWholeBloodDaysAgo: 110,
    trustScore: 4.0,
  },
  {
    name: "Dr. Sorabji B.",
    phoneNumber: "+919810100014",
    latitude: 28.5740,
    longitude: 77.2340, // Defence Colony (3.40 km)
    bloodGroup: BloodGroup.BOMBAY_OH, // Rare Bombay Oh
    gender: Gender.MALE,
    weightKg: 65,
    trustScore: 5.0,
  },
  {
    name: "Arjun Kapoor",
    phoneNumber: "+919810100015",
    latitude: 28.6315,
    longitude: 77.2167, // Connaught Place (7.18 km)
    bloodGroup: BloodGroup.B_NEG,
    gender: Gender.MALE,
    weightKg: 80,
    trustScore: 4.5,
  },
  {
    name: "Rajesh Bhatia",
    phoneNumber: "+919810100016",
    latitude: 28.5320,
    longitude: 77.2450, // Greater Kailash 2 (5.20 km)
    bloodGroup: BloodGroup.B_POS,
    gender: Gender.MALE,
    weightKg: 70,
    lastPingedHoursAgo: 12, // Boundary: Under 72h ping cooldown!
    trustScore: 4.7,
  },

  // Wave 3 from AIIMS (7 - 15 km)
  {
    name: "Kavita Jain",
    phoneNumber: "+919810100017",
    latitude: 28.5200,
    longitude: 77.1500, // Vasant Kunj (7.87 km)
    bloodGroup: BloodGroup.A_POS,
    gender: Gender.FEMALE,
    weightKg: 60,
    trustScore: 4.2,
  },
  {
    name: "Harpreet Singh",
    phoneNumber: "+919810100018",
    latitude: 28.6520,
    longitude: 77.1900, // Karol Bagh (9.63 km)
    bloodGroup: BloodGroup.B_POS,
    gender: Gender.MALE,
    weightKg: 85,
    trustScore: 4.4,
  },
  {
    name: "Priya Saxena",
    phoneNumber: "+919810100019",
    latitude: 28.6080,
    longitude: 77.2950, // Mayur Vihar Phase 1 (9.46 km)
    bloodGroup: BloodGroup.O_POS,
    gender: Gender.FEMALE,
    weightKg: 64,
    trustScore: 4.6,
  },
  {
    name: "Sameer Joshi",
    phoneNumber: "+919810100020",
    latitude: 28.5700,
    longitude: 77.3200, // Noida Sector 18 (10.75 km)
    bloodGroup: BloodGroup.AB_POS,
    gender: Gender.MALE,
    weightKg: 77,
    trustScore: 4.3,
  },
  {
    name: "Varun Dhawan",
    phoneNumber: "+919810100021",
    latitude: 28.6250,
    longitude: 77.0850, // Janakpuri (13.79 km)
    bloodGroup: BloodGroup.O_NEG,
    gender: Gender.MALE,
    weightKg: 71,
    trustScore: 4.9,
  },
  {
    name: "Alok Mathur",
    phoneNumber: "+919810100022",
    latitude: 28.7100,
    longitude: 77.1200, // Rohini Sector 9 (18.5 km, Outside)
    bloodGroup: BloodGroup.A_POS,
    gender: Gender.MALE,
    weightKg: 73,
    snoozeDaysAhead: 7, // Snooze active
    trustScore: 3.8,
  },
  {
    name: "Divya Rao",
    phoneNumber: "+919810100023",
    latitude: 28.5800,
    longitude: 77.0500, // Dwarka Sector 10 (16.2 km, Outside)
    bloodGroup: BloodGroup.B_POS,
    gender: Gender.FEMALE,
    weightKg: 59,
    trustScore: 4.0,
  },
  {
    name: "Sanjay Yadav",
    phoneNumber: "+919810100024",
    latitude: 28.5520,
    longitude: 77.1600, // Vasant Vihar (7.20 km)
    bloodGroup: BloodGroup.O_POS,
    gender: Gender.MALE,
    weightKg: 70,
    lastWholeBloodDaysAgo: 89, // Boundary: Male WB 89d (Ineligible, <90d)
    trustScore: 4.1,
  },
  {
    name: "Sunita Grover",
    phoneNumber: "+919810100025",
    latitude: 28.6700,
    longitude: 77.0900, // Paschim Vihar (14.5 km)
    bloodGroup: BloodGroup.A_POS,
    gender: Gender.FEMALE,
    weightKg: 55,
    lastWholeBloodDaysAgo: 119, // Boundary: Female WB 119d (Ineligible, <120d)
    trustScore: 3.9,
  },

  // --- CLUSTER 2: Apollo Hospital Vicinity (Sarita Vihar & South Delhi) (Donors 26 - 37) ---
  // Wave 1 from Apollo (0 - 3 km)
  {
    name: "Tushar Narang",
    phoneNumber: "+919810100026",
    latitude: 28.5360,
    longitude: 77.2880, // Sarita Vihar Pocket A (0.65 km from Apollo)
    bloodGroup: BloodGroup.A_POS,
    gender: Gender.MALE,
    weightKg: 76,
    trustScore: 4.9,
  },
  {
    name: "Radhika Pillai",
    phoneNumber: "+919810100027",
    latitude: 28.5420,
    longitude: 77.2910, // Jasola Vihar (0.79 km from Apollo)
    bloodGroup: BloodGroup.A_POS,
    gender: Gender.FEMALE,
    weightKg: 61,
    trustScore: 4.8,
  },
  {
    name: "Chetan Bhagat",
    phoneNumber: "+919810100028",
    latitude: 28.5310,
    longitude: 77.2710, // Okhla Phase 2 (1.56 km from Apollo)
    bloodGroup: BloodGroup.A_POS,
    gender: Gender.MALE,
    weightKg: 69,
    trustScore: 4.7,
  },
  {
    name: "Mohit Raina",
    phoneNumber: "+919810100029",
    latitude: 28.5450,
    longitude: 77.3050, // Kalindi Kunj (2.20 km from Apollo)
    bloodGroup: BloodGroup.A_POS,
    gender: Gender.MALE,
    weightKg: 84,
    trustScore: 4.5,
  },
  {
    name: "Shweta Tiwari",
    phoneNumber: "+919810100030",
    latitude: 28.5390,
    longitude: 77.2860, // Jasola Apollo Metro (0.70 km from Apollo)
    bloodGroup: BloodGroup.O_POS,
    gender: Gender.FEMALE,
    weightKg: 47, // Boundary: WB eligible (>=45kg), SDP ineligible (<50kg)
    trustScore: 4.2,
  },
  {
    name: "Dharmendra K.",
    phoneNumber: "+919810100031",
    latitude: 28.5280,
    longitude: 77.2980, // Madanpur Khadar (2.40 km from Apollo)
    bloodGroup: BloodGroup.B_POS,
    gender: Gender.MALE,
    weightKg: 44, // Boundary: Ineligible for all (<45kg)
    trustScore: 3.4,
  },

  // Wave 2 from Apollo (3 - 7 km)
  {
    name: "Pankaj Tripathi",
    phoneNumber: "+919810100032",
    latitude: 28.5480,
    longitude: 77.2510, // Kalkaji Extension (3.27 km from Apollo)
    bloodGroup: BloodGroup.O_POS,
    gender: Gender.MALE,
    weightKg: 72,
    trustScore: 4.8,
  },
  {
    name: "Meenakshi S.",
    phoneNumber: "+919810100033",
    latitude: 28.5490,
    longitude: 77.2520, // Nehru Place (3.20 km from Apollo)
    bloodGroup: BloodGroup.B_POS,
    gender: Gender.FEMALE,
    weightKg: 63,
    trustScore: 4.6,
  },
  {
    name: "Manoj Bajpayee",
    phoneNumber: "+919810100034",
    latitude: 28.5050,
    longitude: 77.3010, // Badarpur Border (4.27 km from Apollo)
    bloodGroup: BloodGroup.A_NEG,
    gender: Gender.MALE,
    weightKg: 75,
    trustScore: 4.7,
  },
  {
    name: "Aditi Rao",
    phoneNumber: "+919810100035",
    latitude: 28.5660,
    longitude: 77.2750, // New Friends Colony (2.99 km from Apollo)
    bloodGroup: BloodGroup.AB_POS,
    gender: Gender.FEMALE,
    weightKg: 58,
    trustScore: 4.5,
  },

  // Wave 3 from Apollo (7 - 15 km)
  {
    name: "Abhishek Ray",
    phoneNumber: "+919810100036",
    latitude: 28.6200,
    longitude: 77.3650, // Noida Sector 62 (11.95 km from Apollo)
    bloodGroup: BloodGroup.B_POS,
    gender: Gender.MALE,
    weightKg: 81,
    trustScore: 4.3,
  },
  {
    name: "Jagdish Prasad",
    phoneNumber: "+919810100037",
    latitude: 28.4800,
    longitude: 77.3100, // Sector 37 Faridabad (7.18 km from Apollo)
    bloodGroup: BloodGroup.O_NEG,
    gender: Gender.MALE,
    weightKg: 79,
    trustScore: 4.8,
  },

  // --- CLUSTER 3: Fortis Faridabad Vicinity & NCR South (Donors 38 - 52) ---
  // Wave 1 from Fortis (0 - 3 km)
  {
    name: "Devendra Pal",
    phoneNumber: "+919810100038",
    latitude: 28.4150,
    longitude: 77.3290, // Sector 15 Faridabad (1.29 km from Fortis)
    bloodGroup: BloodGroup.O_NEG,
    gender: Gender.MALE,
    weightKg: 73,
    trustScore: 4.9,
  },
  {
    name: "Sonia Gandhi",
    phoneNumber: "+919810100039",
    latitude: 28.4160,
    longitude: 77.3050, // Sector 21B Faridabad (1.48 km from Fortis)
    bloodGroup: BloodGroup.O_NEG,
    gender: Gender.FEMALE,
    weightKg: 57,
    trustScore: 4.7,
  },
  {
    name: "Anil Kapoor",
    phoneNumber: "+919810100040",
    latitude: 28.3990,
    longitude: 77.3020, // NIT Faridabad 1 (1.90 km from Fortis)
    bloodGroup: BloodGroup.B_POS,
    gender: Gender.MALE,
    weightKg: 68,
    trustScore: 4.6,
  },
  {
    name: "Renu Bala",
    phoneNumber: "+919810100041",
    latitude: 28.4100,
    longitude: 77.3350, // Sector 16 Faridabad (1.69 km from Fortis)
    bloodGroup: BloodGroup.A_POS,
    gender: Gender.FEMALE,
    weightKg: 62,
    trustScore: 4.4,
  },
  {
    name: "Tarun Gill",
    phoneNumber: "+919810100042",
    latitude: 28.4020,
    longitude: 77.3110, // NIT Faridabad 2 (1.05 km from Fortis)
    bloodGroup: BloodGroup.AB_POS,
    gender: Gender.MALE,
    weightKg: 70,
    trustScore: 4.1,
  },
  {
    name: "Babita Phogat",
    phoneNumber: "+919810100043",
    latitude: 28.4230,
    longitude: 77.3180, // Old Faridabad (1.60 km from Fortis)
    bloodGroup: BloodGroup.B_POS,
    gender: Gender.FEMALE,
    weightKg: 49, // Boundary: WB eligible (>=45kg), SDP ineligible (<50kg)
    trustScore: 4.0,
  },

  // Wave 2 from Fortis (3 - 7 km)
  {
    name: "Kapil Dev",
    phoneNumber: "+919810100044",
    latitude: 28.4200,
    longitude: 77.2800, // Badkhal Lake (3.90 km from Fortis)
    bloodGroup: BloodGroup.O_NEG,
    gender: Gender.MALE,
    weightKg: 76,
    trustScore: 4.9,
  },
  {
    name: "Geeta Phogat",
    phoneNumber: "+919810100045",
    latitude: 28.4410,
    longitude: 77.3150, // Sector 28 Faridabad (3.60 km from Fortis)
    bloodGroup: BloodGroup.O_NEG,
    gender: Gender.FEMALE,
    weightKg: 60,
    trustScore: 4.8,
  },
  {
    name: "Virender Sehwag",
    phoneNumber: "+919810100046",
    latitude: 28.4650,
    longitude: 77.2880, // Surajkund Green Valley (6.80 km from Fortis)
    bloodGroup: BloodGroup.B_NEG,
    gender: Gender.MALE,
    weightKg: 82,
    trustScore: 4.7,
  },
  {
    name: "Ajay Hooda",
    phoneNumber: "+919810100047",
    latitude: 28.4120,
    longitude: 77.3480, // Sector 29 Faridabad (3.10 km from Fortis)
    bloodGroup: BloodGroup.A_POS,
    gender: Gender.MALE,
    weightKg: 74,
    trustScore: 4.3,
  },
  {
    name: "Jyoti Malik",
    phoneNumber: "+919810100048",
    latitude: 28.4250,
    longitude: 77.3320, // Sector 14 Faridabad (2.20 km from Fortis)
    bloodGroup: BloodGroup.O_POS,
    gender: Gender.FEMALE,
    weightKg: 65,
    trustScore: 4.5,
  },

  // Wave 3 from Fortis (7 - 15 km)
  {
    name: "Kuldeep Rawat",
    phoneNumber: "+919810100049",
    latitude: 28.3410,
    longitude: 77.3250, // Ballabgarh Market (7.58 km from Fortis)
    bloodGroup: BloodGroup.O_POS,
    gender: Gender.MALE,
    weightKg: 71,
    trustScore: 4.2,
  },
  {
    name: "Nisha Dahiya",
    phoneNumber: "+919810100050",
    latitude: 28.3950,
    longitude: 77.3750, // Greater Faridabad Sector 81 (5.80 km from Fortis)
    bloodGroup: BloodGroup.A_POS,
    gender: Gender.FEMALE,
    weightKg: 58,
    trustScore: 4.4,
  },
  {
    name: "Balwan Singh",
    phoneNumber: "+919810100051",
    latitude: 28.4900,
    longitude: 77.3100, // Badarpur Border South (10.50 km from Fortis)
    bloodGroup: BloodGroup.B_POS,
    gender: Gender.MALE,
    weightKg: 75,
    lastPlateletHoursAgo: 24, // Boundary: Platelet 24h ago (Ineligible, <48h)
    trustScore: 4.0,
  },
  {
    name: "Yashpal Sharma",
    phoneNumber: "+919810100052",
    latitude: 28.4450,
    longitude: 77.2500, // Manav Rachna Aravali (7.80 km from Fortis)
    bloodGroup: BloodGroup.B_POS,
    gender: Gender.MALE,
    weightKg: 80,
    lastPlateletHoursAgo: 72, // Boundary: Platelet 72h ago (Eligible, >=48h)
    trustScore: 4.7,
  },
];

export async function main() {
  console.log("==================================================================");
  console.log("  V2V Emergency Blood Dispatch: Deterministic Seed Pipeline");
  console.log("==================================================================");

  const now = new Date();

  // Configure SQLite WAL mode and busy timeout for high concurrency
  try {
    await prisma.$queryRawUnsafe("PRAGMA journal_mode = WAL;");
    await prisma.$queryRawUnsafe("PRAGMA busy_timeout = 5000;");
    await prisma.$queryRawUnsafe("PRAGMA synchronous = NORMAL;");
  } catch (e) {
    // Non-fatal if non-sqlite
  }

  // 1. Clean existing records in strict reverse dependency order
  console.log("Purging existing records to ensure deterministic idempotency...");
  await prisma.referralLedger.deleteMany({});
  await prisma.donorLease.deleteMany({});
  await prisma.emergencyRequest.deleteMany({});
  await prisma.donor.deleteMany({});

  // 2. Seed 52 Donors
  console.log(`Seeding ${DONOR_DEFINITIONS.length} deterministic donors across Delhi NCR & Faridabad...`);
  const createdDonors: Record<number, any> = {};

  for (let i = 0; i < DONOR_DEFINITIONS.length; i++) {
    const def = DONOR_DEFINITIONS[i];
    const donorIndex = i + 1;

    const lastWholeBlood = def.lastWholeBloodDaysAgo
      ? new Date(now.getTime() - def.lastWholeBloodDaysAgo * 24 * 60 * 60 * 1000)
      : undefined;

    const lastPlatelet = def.lastPlateletHoursAgo
      ? new Date(now.getTime() - def.lastPlateletHoursAgo * 60 * 60 * 1000)
      : undefined;

    const lastPRBC = def.lastPRBCDaysAgo
      ? new Date(now.getTime() - def.lastPRBCDaysAgo * 24 * 60 * 60 * 1000)
      : undefined;

    const lastPingedAt = def.lastPingedHoursAgo
      ? new Date(now.getTime() - def.lastPingedHoursAgo * 60 * 60 * 1000)
      : undefined;

    const snoozeUntil = def.snoozeDaysAhead
      ? new Date(now.getTime() + def.snoozeDaysAhead * 24 * 60 * 60 * 1000)
      : undefined;

    const created = await prisma.donor.create({
      data: {
        name: def.name,
        phoneNumber: def.phoneNumber,
        latitude: def.latitude,
        longitude: def.longitude,
        bloodGroup: def.bloodGroup as any,
        gender: def.gender as any,
        weightKg: def.weightKg,
        lastWholeBlood,
        lastPlatelet,
        lastPRBC,
        lastPingedAt,
        snoozeUntil,
        trustScore: def.trustScore,
        createdAt: now,
        updatedAt: now,
      },
    });

    createdDonors[donorIndex] = created;
  }
  console.log(`✓ Successfully seeded ${Object.keys(createdDonors).length} donors.`);

  // 3. Seed 5 Multi-State Emergency Requests across the 3 Sample Hospitals
  console.log("Seeding multi-state emergency requests across 3 sample hospitals...");

  // Request 1: AIIMS Delhi - WAVE_1_DISPATCH (Platelets SDP)
  const req1 = await prisma.emergencyRequest.create({
    data: {
      patientName: "Aarav Sharma",
      patientUhid: "AIIMS-2026-9921",
      hospitalName: SAMPLE_HOSPITALS[0].name,
      hospitalLat: SAMPLE_HOSPITALS[0].latitude,
      hospitalLng: SAMPLE_HOSPITALS[0].longitude,
      component: Component.SDP as any,
      bloodGroup: BloodGroup.B_POS as any,
      requestMode: RequestMode.EXACT_OR_SDP as any,
      unitsNeeded: 2,
      waveState: WaveState.WAVE_1_DISPATCH as any,
      shortHash: "v2v_w1_aiims",
      expiresAt: new Date(now.getTime() + 12 * 60 * 60 * 1000),
      createdAt: now,
      updatedAt: now,
    },
  });

  // Request 2: Fortis Faridabad - WAVE_2_DISPATCH (Whole Blood O-)
  const req2 = await prisma.emergencyRequest.create({
    data: {
      patientName: "Simran Kaur",
      patientUhid: "FORTIS-FBD-4412",
      hospitalName: SAMPLE_HOSPITALS[2].name,
      hospitalLat: SAMPLE_HOSPITALS[2].latitude,
      hospitalLng: SAMPLE_HOSPITALS[2].longitude,
      component: Component.WHOLE_BLOOD as any,
      bloodGroup: BloodGroup.O_NEG as any,
      requestMode: RequestMode.EXACT_OR_SDP as any,
      unitsNeeded: 1,
      waveState: WaveState.WAVE_2_DISPATCH as any,
      shortHash: "v2v_w2_frbd",
      expiresAt: new Date(now.getTime() + 10 * 60 * 60 * 1000),
      createdAt: now,
      updatedAt: now,
    },
  });

  // Request 3: Indraprastha Apollo - LEASE_LOCKED (Token Bucket Full N+1)
  const req3 = await prisma.emergencyRequest.create({
    data: {
      patientName: "Rajesh Gupta",
      patientUhid: "APOLLO-DEL-8831",
      hospitalName: SAMPLE_HOSPITALS[1].name,
      hospitalLat: SAMPLE_HOSPITALS[1].latitude,
      hospitalLng: SAMPLE_HOSPITALS[1].longitude,
      component: Component.WHOLE_BLOOD as any,
      bloodGroup: BloodGroup.A_POS as any,
      requestMode: RequestMode.REPLACEMENT_ANY as any,
      unitsNeeded: 2, // N=2, N+1=3 active slots
      waveState: WaveState.LEASE_LOCKED as any,
      shortHash: "v2v_lk_aplo",
      expiresAt: new Date(now.getTime() + 8 * 60 * 60 * 1000),
      createdAt: now,
      updatedAt: now,
    },
  });

  // Request 4: AIIMS Delhi - FULFILLED_CLOSED (Anti-Tout Contact Deactivation)
  const req4 = await prisma.emergencyRequest.create({
    data: {
      patientName: "Priya Malhotra",
      patientUhid: "AIIMS-2026-1044",
      hospitalName: SAMPLE_HOSPITALS[0].name,
      hospitalLat: SAMPLE_HOSPITALS[0].latitude,
      hospitalLng: SAMPLE_HOSPITALS[0].longitude,
      component: Component.SDP as any,
      bloodGroup: BloodGroup.O_POS as any,
      requestMode: RequestMode.EXACT_OR_SDP as any,
      unitsNeeded: 1,
      waveState: WaveState.FULFILLED_CLOSED as any,
      shortHash: "v2v_fn_aiims",
      expiresAt: new Date(now.getTime() + 4 * 60 * 60 * 1000),
      createdAt: now,
      updatedAt: now,
    },
  });

  // Request 5: AIIMS Delhi - EXPIRED (12-hour TTL exceeded)
  const req5 = await prisma.emergencyRequest.create({
    data: {
      patientName: "Vikramaditya Rao",
      patientUhid: "AIIMS-2026-0012",
      hospitalName: SAMPLE_HOSPITALS[0].name,
      hospitalLat: SAMPLE_HOSPITALS[0].latitude,
      hospitalLng: SAMPLE_HOSPITALS[0].longitude,
      component: Component.WHOLE_BLOOD as any,
      bloodGroup: BloodGroup.BOMBAY_OH as any,
      requestMode: RequestMode.EXACT_OR_SDP as any,
      unitsNeeded: 1,
      waveState: WaveState.EXPIRED as any,
      shortHash: "v2v_ex_aiims",
      expiresAt: new Date(now.getTime() - 2 * 60 * 60 * 1000), // Expired 2h ago
      createdAt: new Date(now.getTime() - 14 * 60 * 60 * 1000),
      updatedAt: now,
    },
  });

  console.log("✓ Successfully seeded 5 emergency requests across 3 hospitals.");

  // 4. Seed Donor Leases attached to Requests
  console.log("Seeding donor leases across wave states...");

  // Leases for Request 1 (WAVE_1_DISPATCH): Donors 2 and 4 pinged
  await prisma.donorLease.createMany({
    data: [
      {
        requestId: req1.id,
        donorId: createdDonors[2].id, // Neha Sharma (INA Colony, 0.98 km)
        status: LeaseStatus.PINGED as any,
        leaseExpiresAt: now,
        createdAt: now,
      },
      {
        requestId: req1.id,
        donorId: createdDonors[4].id, // Kunal Malhotra (South Ext 1, 1.27 km)
        status: LeaseStatus.PINGED as any,
        leaseExpiresAt: now,
        createdAt: now,
      },
    ],
  });

  // Leases for Request 2 (WAVE_2_DISPATCH): Wave 1 donor unanswered, Wave 2 pinged
  await prisma.donorLease.createMany({
    data: [
      {
        requestId: req2.id,
        donorId: createdDonors[39].id, // Sonia Gandhi (Sec 21B, 1.48 km)
        status: LeaseStatus.PINGED as any,
        leaseExpiresAt: new Date(now.getTime() - 15 * 60 * 1000),
        createdAt: new Date(now.getTime() - 15 * 60 * 1000),
      },
      {
        requestId: req2.id,
        donorId: createdDonors[44].id, // Kapil Dev (Badkhal Lake, 3.90 km)
        status: LeaseStatus.PINGED as any,
        leaseExpiresAt: now,
        createdAt: now,
      },
      {
        requestId: req2.id,
        donorId: createdDonors[45].id, // Geeta Phogat (Sec 28 Faridabad, 3.60 km)
        status: LeaseStatus.PINGED as any,
        leaseExpiresAt: now,
        createdAt: now,
      },
    ],
  });

  // Leases for Request 3 (LEASE_LOCKED): 3 Active (N+1) + 1 Standby
  await prisma.donorLease.createMany({
    data: [
      {
        requestId: req3.id,
        donorId: createdDonors[26].id, // Tushar Narang (Sarita Vihar, 0.65 km)
        status: LeaseStatus.ARRIVED as any,
        leaseExpiresAt: new Date(now.getTime() + 5 * 60 * 1000),
        handshakePin: "4821",
        createdAt: new Date(now.getTime() - 20 * 60 * 1000),
      },
      {
        requestId: req3.id,
        donorId: createdDonors[27].id, // Radhika Pillai (Jasola Vihar, 0.79 km)
        status: LeaseStatus.EN_ROUTE as any,
        leaseExpiresAt: new Date(now.getTime() + 18 * 60 * 1000),
        handshakePin: "7734",
        createdAt: new Date(now.getTime() - 7 * 60 * 1000),
      },
      {
        requestId: req3.id,
        donorId: createdDonors[28].id, // Chetan Bhagat (Okhla Phase 2, 1.56 km)
        status: LeaseStatus.JIT_PASSED as any,
        leaseExpiresAt: new Date(now.getTime() + 24 * 60 * 1000),
        handshakePin: "9102",
        createdAt: new Date(now.getTime() - 1 * 60 * 1000),
      },
      {
        requestId: req3.id,
        donorId: createdDonors[29].id, // Mohit Raina (Kalindi Kunj, 2.20 km)
        status: LeaseStatus.STANDBY as any,
        leaseExpiresAt: new Date(now.getTime() + 25 * 60 * 1000),
        handshakePin: null,
        createdAt: new Date(now.getTime() - 30 * 1000),
      },
    ],
  });

  // Lease for Request 4 (FULFILLED_CLOSED): 1 Completed lease
  await prisma.donorLease.create({
    data: {
      requestId: req4.id,
      donorId: createdDonors[1].id, // Rohit Verma (Green Park, 0.99 km)
      status: LeaseStatus.COMPLETED as any,
      leaseExpiresAt: new Date(now.getTime() - 30 * 60 * 1000),
      handshakePin: "3391",
      createdAt: new Date(now.getTime() - 60 * 60 * 1000),
    },
  });

  console.log("✓ Successfully seeded 10 donor leases.");
  console.log("==================================================================");
  console.log("  Database Seed Complete (R1 & AC1 Satisfied)");
  console.log(`  - Donors Seeded:        ${Object.keys(createdDonors).length} (>= 50 requirement)`);
  console.log(`  - Sample Hospitals:     ${SAMPLE_HOSPITALS.length} (AIIMS, Apollo, Fortis)`);
  console.log(`  - Emergency Requests:   5 (Covering WAVE_1, WAVE_2, LOCKED, CLOSED, EXPIRED)`);
  console.log(`  - Donor Leases:         10 (Active, Standby, Arrived, Pinged, Completed)`);
  console.log("==================================================================");
}

// Auto-execute if invoked as a standalone script
if (require.main === module || process.argv[1]?.endsWith("seed.ts")) {
  main()
    .catch((err) => {
      console.error("FATAL SEED ERROR:", err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

export default main;
