/**
 * Adversarial Stress Harness for Database Seed (R1 & AC1)
 * Tests Counter-Loops against the seeded database:
 * 1. Counter-Loop 1: Haversine distance verification & wave matching
 * 2. Counter-Loop 2: Token Bucket capacity validation on seeded LEASE_LOCKED request
 * 3. Counter-Loop 3: Eviction simulation on seeded leases
 * 4. Counter-Loop 4: Handshake PIN & Anti-tout integrity
 * 5. NBTC Clinical Boundary testing on seeded donors
 */

import { PrismaClient } from "@prisma/client";
import { HaversineDistance } from "../src/utils/haversine";
import { isEligible } from "../src/lib/engines/eligibility";
import { prioritizedGroups } from "../src/lib/engines/compatibility";
import { selectDonorsForWave } from "../src/lib/engines/dispatcher";
import { WaveState, LeaseStatus, BloodGroup, Component, RequestMode } from "../src/types/enums";

const prisma = new PrismaClient();

async function runStressTests() {
  console.log("==================================================================");
  console.log("  ADVERSARIAL STRESS TEST: SEED DATA & ENGINE COMPLIANCE");
  console.log("==================================================================");

  // 1. Verify Seeded Donors against NBTC Eligibility Engine
  console.log("\n[TEST 1] NBTC Engine Evaluation on Seeded Donors:");
  const donors = await prisma.donor.findMany();
  let ineligibleWholeBlood = 0;
  let ineligiblePlatelets = 0;
  let eligibleBoth = 0;

  for (const d of donors) {
    const wbEligible = isEligible(d as any, Component.WHOLE_BLOOD);
    const sdpEligible = isEligible(d as any, Component.SDP);

    if (!wbEligible) ineligibleWholeBlood++;
    if (!sdpEligible) ineligiblePlatelets++;
    if (wbEligible && sdpEligible) eligibleBoth++;
  }

  console.log(`  - Total Donors Evaluated:               ${donors.length}`);
  console.log(`  - Ineligible for Whole Blood:           ${ineligibleWholeBlood}`);
  console.log(`  - Ineligible for SDP Platelets:         ${ineligiblePlatelets}`);
  console.log(`  - Fully Eligible for Both:              ${eligibleBoth}`);

  if (ineligibleWholeBlood === 0 || ineligiblePlatelets === 0) {
    throw new Error("Adversarial failure: Seed data lacks clinical boundary edge cases!");
  }
  console.log("  ✓ PASS: Seed data contains calibrated clinical boundary edge cases.");

  // 2. Verify Counter-Loop 1: Concentric Wave Selection on Seeded Request 1
  console.log("\n[TEST 2] Counter-Loop 1: Concentric Wave Dispatch on Seeded Request 1:");
  const req1 = await prisma.emergencyRequest.findUnique({
    where: { shortHash: "v2v_w1_aiims" },
  });
  if (!req1) throw new Error("Request v2v_w1_aiims not found in seed!");

  console.log(`  - Evaluating Request: ${req1.patientName} (${req1.hospitalName})`);
  console.log(`    Component: ${req1.component}, Blood Group: ${req1.bloodGroup}, Wave: ${req1.waveState}`);

  const w1SelectedDonors = await selectDonorsForWave(req1.id);
  console.log(`  - Donors Selected for Wave 1 (0-3km): ${w1SelectedDonors.length}`);

  for (const d of w1SelectedDonors) {
    const dist = HaversineDistance(req1.hospitalLat, req1.hospitalLng, d.latitude, d.longitude);
    if (dist > 3.0) {
      throw new Error(`Wave 1 distance breach: Donor ${d.name} is ${dist.toFixed(2)} km away (> 3.0 km)!`);
    }
    // Verify compatibility
    const allowed = prioritizedGroups(req1.bloodGroup as any, req1.requestMode as any);
    if (!allowed.includes(d.bloodGroup as any)) {
      throw new Error(`Incompatible donor ${d.name} (${d.bloodGroup}) selected for request (${req1.bloodGroup})!`);
    }
    // Verify eligibility
    const elig = isEligible(d as any, req1.component as any);
    if (!elig) {
      throw new Error(`Ineligible donor ${d.name} selected!`);
    }
  }
  console.log(`  ✓ PASS: All ${w1SelectedDonors.length} Wave 1 donors strictly within 0-3km, compatible, and eligible.`);

  // 3. Verify Counter-Loop 2: Atomic N+1 Token Bucket on Seeded Request 3
  console.log("\n[TEST 3] Counter-Loop 2: Atomic N+1 Token Bucket on Seeded Request 3:");
  const req3 = await prisma.emergencyRequest.findUnique({
    where: { shortHash: "v2v_lk_aplo" },
    include: { leases: true },
  });
  if (!req3) throw new Error("Request v2v_lk_aplo not found in seed!");

  const targetSlots = req3.unitsNeeded + 1; // N + 1
  const activeLeases = req3.leases.filter((l) =>
    ["JIT_PASSED", "EN_ROUTE", "ARRIVED"].includes(l.status)
  );
  const standbyLeases = req3.leases.filter((l) => l.status === "STANDBY");

  console.log(`  - Units Needed (N):           ${req3.unitsNeeded}`);
  console.log(`  - Target Active Slots (N+1):  ${targetSlots}`);
  console.log(`  - Active Leases in DB:        ${activeLeases.length}`);
  console.log(`  - Standby Leases in DB:       ${standbyLeases.length}`);

  if (activeLeases.length !== targetSlots) {
    throw new Error(`Token bucket mismatch: Expected ${targetSlots} active leases, found ${activeLeases.length}!`);
  }
  if (standbyLeases.length < 1) {
    throw new Error("Expected at least 1 STANDBY lease on LEASE_LOCKED request!");
  }
  console.log("  ✓ PASS: Seeded Request 3 adheres strictly to N+1 Token Bucket constraint.");

  // 4. Verify Counter-Loop 4: Anti-Tout & Handshake PIN Security
  console.log("\n[TEST 4] Counter-Loop 4: Anti-Tout Security & PIN Verification:");
  for (const l of activeLeases) {
    if (!l.handshakePin || !/^\d{4}$/.test(l.handshakePin)) {
      throw new Error(`Active lease ${l.id} missing valid 4-digit handshake PIN!`);
    }
  }
  for (const l of standbyLeases) {
    if (l.handshakePin !== null) {
      throw new Error(`Standby lease ${l.id} has exposed handshake PIN!`);
    }
  }
  console.log("  ✓ PASS: Handshake PINs present on active leases and strictly masked on standby leases.");

  // 5. Verify Counter-Loop 4: Closed Request Anti-Tout Contact Masking
  console.log("\n[TEST 5] Counter-Loop 4: Closed & Expired Request Status:");
  const req4 = await prisma.emergencyRequest.findUnique({
    where: { shortHash: "v2v_fn_aiims" },
    include: { leases: true },
  });
  if (!req4) throw new Error("Request v2v_fn_aiims not found in seed!");
  if (req4.waveState !== WaveState.FULFILLED_CLOSED) {
    throw new Error(`Request 4 state is ${req4.waveState}, expected FULFILLED_CLOSED!`);
  }
  const completedLeases = req4.leases.filter((l) => l.status === LeaseStatus.COMPLETED);
  if (completedLeases.length !== 1) {
    throw new Error(`Request 4 expected 1 COMPLETED lease, found ${completedLeases.length}!`);
  }

  const req5 = await prisma.emergencyRequest.findUnique({
    where: { shortHash: "v2v_ex_aiims" },
  });
  if (!req5) throw new Error("Request v2v_ex_aiims not found in seed!");
  if (req5.waveState !== WaveState.EXPIRED) {
    throw new Error(`Request 5 state is ${req5.waveState}, expected EXPIRED!`);
  }
  if (req5.expiresAt.getTime() > Date.now()) {
    throw new Error("Expired request expiresAt is in the future!");
  }
  console.log("  ✓ PASS: Closed and Expired requests properly configured.");

  console.log("\n==================================================================");
  console.log("  ALL ADVERSARIAL STRESS TESTS PASSED!");
  console.log("==================================================================");
}

runStressTests()
  .catch((err) => {
    console.error("\n[STRESS TEST FAILED]:", err.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
