import { PrismaClient } from "@prisma/client";
import { main, SAMPLE_HOSPITALS } from "../../../../prisma/seed";
import { WaveState, LeaseStatus } from "@/types/enums";

const prisma = new PrismaClient();

describe("Database Seed Verification (R1 & AC1)", () => {
  beforeAll(async () => {
    // Execute seed script
    await main();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test("populates >= 50 donors", async () => {
    const donorCount = await prisma.donor.count();
    expect(donorCount).toBeGreaterThanOrEqual(50);
  });

  test("populates 3 distinct sample hospitals", async () => {
    const requests = await prisma.emergencyRequest.findMany({
      select: { hospitalName: true },
    });
    const uniqueHospitals = Array.from(new Set(requests.map((r) => r.hospitalName)));
    expect(uniqueHospitals.length).toBe(3);
    for (const h of SAMPLE_HOSPITALS) {
      expect(uniqueHospitals).toContain(h.name);
    }
  });

  test("contains all required blood groups and clinical boundaries", async () => {
    const donors = await prisma.donor.findMany();

    // Check blood group diversity
    const bloodGroups = new Set(donors.map((d) => d.bloodGroup));
    expect(bloodGroups.has("A_POS")).toBe(true);
    expect(bloodGroups.has("O_NEG")).toBe(true);
    expect(bloodGroups.has("B_POS")).toBe(true);
    expect(bloodGroups.has("BOMBAY_OH")).toBe(true);

    // Check weight boundaries
    const under45 = donors.filter((d) => d.weightKg < 45);
    const between45and50 = donors.filter((d) => d.weightKg >= 45 && d.weightKg < 50);
    const over50 = donors.filter((d) => d.weightKg >= 50);
    expect(under45.length).toBeGreaterThanOrEqual(2);
    expect(between45and50.length).toBeGreaterThanOrEqual(2);
    expect(over50.length).toBeGreaterThanOrEqual(40);
  });

  test("seeds multi-state emergency requests and donor leases", async () => {
    const requests = await prisma.emergencyRequest.findMany();
    const states = new Set(requests.map((r) => r.waveState));
    expect(states.has(WaveState.WAVE_1_DISPATCH)).toBe(true);
    expect(states.has(WaveState.WAVE_2_DISPATCH)).toBe(true);
    expect(states.has(WaveState.LEASE_LOCKED)).toBe(true);
    expect(states.has(WaveState.FULFILLED_CLOSED)).toBe(true);
    expect(states.has(WaveState.EXPIRED)).toBe(true);

    const leases = await prisma.donorLease.findMany();
    expect(leases.length).toBeGreaterThanOrEqual(10);
    const leaseStatuses = new Set(leases.map((l) => l.status));
    expect(leaseStatuses.has(LeaseStatus.PINGED)).toBe(true);
    expect(leaseStatuses.has(LeaseStatus.ARRIVED)).toBe(true);
    expect(leaseStatuses.has(LeaseStatus.EN_ROUTE)).toBe(true);
    expect(leaseStatuses.has(LeaseStatus.JIT_PASSED)).toBe(true);
    expect(leaseStatuses.has(LeaseStatus.STANDBY)).toBe(true);
    expect(leaseStatuses.has(LeaseStatus.COMPLETED)).toBe(true);
  });
});
