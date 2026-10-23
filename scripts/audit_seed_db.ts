/**
 * Empirical Adversarial Audit Script for Database Seed (R1 & AC1)
 * Challenger: challenger_m1_2
 * Target: prisma/dev.db
 */

import { PrismaClient } from "@prisma/client";
import { HaversineDistance } from "../src/utils/haversine";

const prisma = new PrismaClient();

async function runAudit() {
  console.log("==================================================================");
  console.log("  EMPIRICAL CHALLENGER AUDIT: SEED DATA INTEGRITY (R1 & AC1)");
  console.log("==================================================================");

  // 1. Quantitative Counts
  const donorCount = await prisma.donor.count();
  const requestCount = await prisma.emergencyRequest.count();
  const leaseCount = await prisma.donorLease.count();
  const referralCount = await prisma.referralLedger.count();

  console.log("\n[1] RECORD COUNTS:");
  console.log(`  - Donors:             ${donorCount} (Requirement: >= 50)`);
  console.log(`  - Emergency Requests: ${requestCount}`);
  console.log(`  - Donor Leases:       ${leaseCount}`);
  console.log(`  - Referral Ledger:    ${referralCount}`);

  if (donorCount < 50) {
    throw new Error(`CRITICAL FAILURE: Donor count ${donorCount} is less than 50!`);
  }

  // 2. Fetch all donors for deep verification
  const donors = await prisma.donor.findMany();

  // Phone number uniqueness and formatting
  console.log("\n[2] PHONE NUMBER INTEGRITY & UNIQUENESS:");
  const phoneNumbers = donors.map((d) => d.phoneNumber);
  const uniquePhones = new Set(phoneNumbers);
  const phoneDuplicates = phoneNumbers.filter((p, index) => phoneNumbers.indexOf(p) !== index);
  const invalidPhones = phoneNumbers.filter((p) => !/^\+91[0-9]{10}$/.test(p));

  console.log(`  - Total Phone Numbers:  ${phoneNumbers.length}`);
  console.log(`  - Unique Phone Numbers: ${uniquePhones.size}`);
  console.log(`  - Duplicates Count:     ${phoneDuplicates.length} ${phoneDuplicates.length > 0 ? `(${phoneDuplicates.join(", ")})` : "✓ NONE"}`);
  console.log(`  - Invalid Format Count: ${invalidPhones.length} ${invalidPhones.length > 0 ? `(${invalidPhones.join(", ")})` : "✓ NONE (+91XXXXXXXXXX compliant)"}`);

  if (uniquePhones.size !== donorCount) {
    throw new Error("CRITICAL FAILURE: Duplicate phone numbers detected!");
  }
  if (invalidPhones.length > 0) {
    throw new Error(`CRITICAL FAILURE: Invalid phone numbers detected: ${invalidPhones.join(", ")}`);
  }

  // 3. Geospatial Bounding Box & Distribution
  console.log("\n[3] GEOGRAPHIC COORDINATES & BOUNDING BOX:");
  // Delhi NCR / Faridabad bounding box roughly:
  // Lat: 28.2000 to 28.9000 N
  // Lng: 76.8000 to 77.5000 E
  let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
  const outOfBounds: any[] = [];

  for (const d of donors) {
    if (d.latitude < minLat) minLat = d.latitude;
    if (d.latitude > maxLat) maxLat = d.latitude;
    if (d.longitude < minLng) minLng = d.longitude;
    if (d.longitude > maxLng) maxLng = d.longitude;

    // Strict NCR envelope check: 28.0 <= lat <= 29.0 and 76.8 <= lng <= 77.6
    if (d.latitude < 28.0 || d.latitude > 29.0 || d.longitude < 76.8 || d.longitude > 77.6) {
      outOfBounds.push({ id: d.id, name: d.name, lat: d.latitude, lng: d.longitude });
    }
  }

  console.log(`  - Min Latitude:  ${minLat.toFixed(4)}° N`);
  console.log(`  - Max Latitude:  ${maxLat.toFixed(4)}° N`);
  console.log(`  - Min Longitude: ${minLng.toFixed(4)}° E`);
  console.log(`  - Max Longitude: ${maxLng.toFixed(4)}° E`);
  console.log(`  - Out of Bounds Count: ${outOfBounds.length} ${outOfBounds.length > 0 ? JSON.stringify(outOfBounds) : "✓ NONE (100% strictly within Delhi NCR & Faridabad)"}`);

  // 4. Blood Group Distribution & Bombay Oh Check
  console.log("\n[4] BLOOD GROUP DISTRIBUTION:");
  const expectedGroups = [
    "A_POS", "A_NEG", "B_POS", "B_NEG", "AB_POS", "AB_NEG", "O_POS", "O_NEG", "BOMBAY_OH"
  ];
  const groupCounts: Record<string, number> = {};
  for (const g of expectedGroups) {
    groupCounts[g] = 0;
  }
  for (const d of donors) {
    groupCounts[d.bloodGroup] = (groupCounts[d.bloodGroup] || 0) + 1;
  }

  for (const [bg, count] of Object.entries(groupCounts)) {
    const pct = ((count / donorCount) * 100).toFixed(1);
    console.log(`  - ${bg.padEnd(12)}: ${count.toString().padStart(2)} donors (${pct}%)`);
  }

  const missingGroups = expectedGroups.filter((g) => !groupCounts[g] || groupCounts[g] === 0);
  console.log(`  - Missing Groups: ${missingGroups.length > 0 ? missingGroups.join(", ") : "✓ NONE (All 8 ABO/Rh + Bombay Oh present)"}`);

  if (missingGroups.length > 0) {
    throw new Error(`CRITICAL FAILURE: Missing blood groups: ${missingGroups.join(", ")}`);
  }

  // 5. Gender Distribution
  console.log("\n[5] GENDER DISTRIBUTION:");
  const genderCounts: Record<string, number> = { MALE: 0, FEMALE: 0, OTHER: 0 };
  for (const d of donors) {
    genderCounts[d.gender] = (genderCounts[d.gender] || 0) + 1;
  }
  for (const [g, count] of Object.entries(genderCounts)) {
    if (count > 0 || g !== "OTHER") {
      const pct = ((count / donorCount) * 100).toFixed(1);
      console.log(`  - ${g.padEnd(8)}: ${count.toString().padStart(2)} donors (${pct}%)`);
    }
  }
  if (genderCounts.MALE === 0 || genderCounts.FEMALE === 0) {
    throw new Error("CRITICAL FAILURE: Both genders are NOT present!");
  }

  // 6. Weight Distribution (NBTC Boundaries)
  console.log("\n[6] WEIGHT DISTRIBUTION & NBTC BOUNDARY CHECK:");
  const under45 = donors.filter((d) => d.weightKg < 45);
  const between45and50 = donors.filter((d) => d.weightKg >= 45 && d.weightKg < 50);
  const over50 = donors.filter((d) => d.weightKg >= 50);

  console.log(`  - < 45 kg (NBTC Ineligible):       ${under45.length} donors`);
  console.log(`  - 45 - 50 kg (WB only, SDP ineligible): ${between45and50.length} donors`);
  console.log(`  - >= 50 kg (WB & SDP eligible):    ${over50.length} donors`);

  // 7. Cooldown & Availability Status Variation
  console.log("\n[7] COOLDOWN & READINESS VARIATION:");
  const now = new Date();
  let hasActiveWholeBloodCooldown = 0;
  let hasPastWholeBloodCooldown = 0;
  let hasNoWholeBloodDonation = 0;
  let hasPlateletCooldown = 0;
  let hasPingCooldown = 0;
  let hasActiveSnooze = 0;
  let fullyReadyToDonate = 0;

  for (const d of donors) {
    let onCooldown = false;

    // Whole blood cooldown check (90d male, 120d female)
    if (d.lastWholeBlood) {
      const daysAgo = (now.getTime() - new Date(d.lastWholeBlood).getTime()) / (1000 * 60 * 60 * 24);
      const reqDays = d.gender === "FEMALE" ? 120 : 90;
      if (daysAgo < reqDays) {
        hasActiveWholeBloodCooldown++;
        onCooldown = true;
      } else {
        hasPastWholeBloodCooldown++;
      }
    } else {
      hasNoWholeBloodDonation++;
    }

    // Platelet cooldown (<48h)
    if (d.lastPlatelet) {
      const hoursAgo = (now.getTime() - new Date(d.lastPlatelet).getTime()) / (1000 * 60 * 60);
      if (hoursAgo < 48) {
        hasPlateletCooldown++;
        onCooldown = true;
      }
    }

    // 72h ping cooldown
    if (d.lastPingedAt) {
      const hoursAgo = (now.getTime() - new Date(d.lastPingedAt).getTime()) / (1000 * 60 * 60);
      if (hoursAgo < 72) {
        hasPingCooldown++;
        onCooldown = true;
      }
    }

    // Snooze
    if (d.snoozeUntil && new Date(d.snoozeUntil) > now) {
      hasActiveSnooze++;
      onCooldown = true;
    }

    // Underweight (<45kg)
    if (d.weightKg < 45) {
      onCooldown = true;
    }

    if (!onCooldown) {
      fullyReadyToDonate++;
    }
  }

  console.log(`  - On Active Whole Blood Cooldown: ${hasActiveWholeBloodCooldown} donors`);
  console.log(`  - Whole Blood Cooldown Expired:   ${hasPastWholeBloodCooldown} donors`);
  console.log(`  - No Prior Whole Blood Record:    ${hasNoWholeBloodDonation} donors`);
  console.log(`  - On Platelet Cooldown (<48h):    ${hasPlateletCooldown} donors`);
  console.log(`  - Under 72h Ping Cooldown:        ${hasPingCooldown} donors`);
  console.log(`  - Snooze Currently Active:        ${hasActiveSnooze} donors`);
  console.log(`  - Fully Ready To Donate (No Block): ${fullyReadyToDonate} donors`);

  if (hasActiveWholeBloodCooldown === 0 && hasPlateletCooldown === 0 && hasPingCooldown === 0) {
    throw new Error("CRITICAL FAILURE: No donors are on cooldown!");
  }
  if (fullyReadyToDonate === 0) {
    throw new Error("CRITICAL FAILURE: No donors are ready to donate!");
  }

  // 8. Sample Hospitals Verification
  console.log("\n[8] SAMPLE HOSPITALS VERIFICATION:");
  const requests = await prisma.emergencyRequest.findMany();
  const hospitalNames = Array.from(new Set(requests.map((r) => r.hospitalName)));
  console.log(`  - Unique Hospitals Found: ${hospitalNames.length}`);
  for (const h of hospitalNames) {
    const reqsForHospital = requests.filter((r) => r.hospitalName === h);
    console.log(`    * "${h}" (Coordinates: ${reqsForHospital[0].hospitalLat}, ${reqsForHospital[0].hospitalLng}) -> ${reqsForHospital.length} requests`);
  }

  if (hospitalNames.length !== 3) {
    throw new Error(`CRITICAL FAILURE: Expected exactly 3 sample hospitals, found ${hospitalNames.length}`);
  }

  // 9. Multi-State Emergency Requests Verification
  console.log("\n[9] MULTI-STATE EMERGENCY REQUESTS:");
  const waveStates = Array.from(new Set(requests.map((r) => r.waveState)));
  console.log(`  - Distinct Wave States: ${waveStates.join(", ")}`);

  const requiredStates = ["WAVE_1_DISPATCH", "WAVE_2_DISPATCH", "LEASE_LOCKED", "FULFILLED_CLOSED"];
  for (const reqState of requiredStates) {
    const found = waveStates.includes(reqState);
    console.log(`  - State ${reqState.padEnd(20)}: ${found ? "✓ PRESENT" : "✗ MISSING"}`);
    if (!found) {
      throw new Error(`CRITICAL FAILURE: Required wave state ${reqState} missing from seed!`);
    }
  }

  // Check also EXPIRED if present
  console.log(`  - State EXPIRED:             ${waveStates.includes("EXPIRED") ? "✓ PRESENT" : "Omitted"}`);

  // 10. Donor Leases Verification & Foreign Key Integrity
  console.log("\n[10] DONOR LEASES & TOKEN BUCKET INTEGRITY:");
  const leases = await prisma.donorLease.findMany({
    include: {
      request: true,
      donor: true,
    },
  });

  const leaseStatuses: Record<string, number> = {};
  let orphanedRequests = 0;
  let orphanedDonors = 0;
  let activeLeasesWithPin = 0;
  let activeLeasesMissingPin = 0;

  for (const l of leases) {
    leaseStatuses[l.status] = (leaseStatuses[l.status] || 0) + 1;
    if (!l.request) orphanedRequests++;
    if (!l.donor) orphanedDonors++;

    if (["JIT_PASSED", "EN_ROUTE", "ARRIVED", "COMPLETED"].includes(l.status)) {
      if (l.handshakePin && /^[0-9]{4}$/.test(l.handshakePin)) {
        activeLeasesWithPin++;
      } else {
        activeLeasesMissingPin++;
      }
    }
  }

  console.log(`  - Total Leases: ${leases.length}`);
  for (const [st, count] of Object.entries(leaseStatuses)) {
    console.log(`    * ${st.padEnd(16)}: ${count}`);
  }
  console.log(`  - Orphaned Request Relations: ${orphanedRequests}`);
  console.log(`  - Orphaned Donor Relations:   ${orphanedDonors}`);
  console.log(`  - Active Leases with Valid 4-digit PIN: ${activeLeasesWithPin}`);
  console.log(`  - Active Leases Missing PIN:           ${activeLeasesMissingPin}`);

  if (orphanedRequests > 0 || orphanedDonors > 0) {
    throw new Error("CRITICAL FAILURE: Orphaned foreign keys in DonorLease!");
  }

  // 11. Concentric Wave Distance Verification from Hospitals
  console.log("\n[11] CONCENTRIC WAVE DISTANCES FROM HOSPITALS (Haversine Analysis):");
  const hospitals = [
    { name: "AIIMS Delhi", lat: 28.5672, lng: 77.2100 },
    { name: "Apollo Sarita Vihar", lat: 28.5401, lng: 77.2832 },
    { name: "Fortis Faridabad", lat: 28.4089, lng: 77.3178 },
  ];

  for (const h of hospitals) {
    const distances = donors.map((d) => ({
      name: d.name,
      distKm: HaversineDistance(h.lat, h.lng, d.latitude, d.longitude),
    }));
    const wave1 = distances.filter((d) => d.distKm <= 3.0);
    const wave2 = distances.filter((d) => d.distKm > 3.0 && d.distKm <= 7.0);
    const wave3 = distances.filter((d) => d.distKm > 7.0 && d.distKm <= 15.0);
    const wave4 = distances.filter((d) => d.distKm > 15.0);

    console.log(`  - Hospital: ${h.name}`);
    console.log(`    Wave 1 (0 - 3 km):   ${wave1.length} donors (Closest: ${Math.min(...distances.map(d=>d.distKm)).toFixed(2)} km)`);
    console.log(`    Wave 2 (3 - 7 km):   ${wave2.length} donors`);
    console.log(`    Wave 3 (7 - 15 km):  ${wave3.length} donors`);
    console.log(`    Outer (> 15 km):     ${wave4.length} donors`);
  }

  console.log("\n==================================================================");
  console.log("  ALL AUDIT CHECKS COMPLETED SUCCESSFULLY!");
  console.log("==================================================================");
}

runAudit()
  .catch((err) => {
    console.error("\n[AUDIT FAILURE]:", err.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
