import { PrismaClient, EmergencyRequest, Donor, DonorLease } from "@prisma/client";
import { LeaseStatus } from "@/types/enums";
import { attemptLease, evictExpiredLeases, maybeLockRequest } from "../lease-manager";

// Simple helper to add days to a Date
const addDays = (date: Date, days: number): Date => new Date(date.getTime() + days * 24 * 60 * 60 * 1000);

const prisma = new PrismaClient();

const TEST_SHORT_HASHES = ["hash123", "hash456"];
const TEST_PHONES = ["+911234567890", "+919876543211", "+919876543210"];

async function cleanupTestData() {
  await prisma.donorLease.deleteMany({
    where: {
      OR: [
        { request: { shortHash: { in: TEST_SHORT_HASHES } } },
        { donor: { phoneNumber: { in: TEST_PHONES } } },
      ],
    },
  }).catch(() => {});
  await prisma.emergencyRequest.deleteMany({
    where: { shortHash: { in: TEST_SHORT_HASHES } },
  }).catch(() => {});
  await prisma.donor.deleteMany({
    where: { phoneNumber: { in: TEST_PHONES } },
  }).catch(() => {});
}

beforeAll(async () => {
  await cleanupTestData();

  // create a donor
  await prisma.donor.create({
    data: {
      name: "Test Donor",
      phoneNumber: "+911234567890",
      latitude: 28.6139,
      longitude: 77.2090,
      bloodGroup: "A_POS",
      gender: "MALE",
      weightKg: 70,
    },
  });
});

afterAll(async () => {
  await cleanupTestData();
  await prisma.$disconnect();
});

test("attemptLease creates active lease when slots available", async () => {
  // create request needing 1 unit
  const request = await prisma.emergencyRequest.create({
    data: {
      patientName: "John Doe",
      patientUhid: "UHID123",
      hospitalName: "Test Hospital",
      hospitalLat: 28.6139,
      hospitalLng: 77.2090,
      bloodGroup: "A_POS",
      component: "WHOLE_BLOOD",
      requestMode: "REPLACEMENT_ANY",
      unitsNeeded: 1,
      shortHash: "hash123",
      expiresAt: addDays(new Date(), 1),
    },
  });

  const donor = await prisma.donor.findFirst({ where: { phoneNumber: "+911234567890" } });
  const lease = await attemptLease(request.id, donor!.id);
  expect(lease.status).toBe(LeaseStatus.JIT_PASSED);
});

test("evictExpiredLeases promotes standby", async () => {
  const request = await prisma.emergencyRequest.create({
    data: {
      patientName: "Jane Doe",
      patientUhid: "UHID456",
      hospitalName: "Another Hospital",
      hospitalLat: 28.7,
      hospitalLng: 77.3,
      bloodGroup: "B_POS",
      component: "WHOLE_BLOOD",
      requestMode: "REPLACEMENT_ANY",
      unitsNeeded: 1, // Target slots N+1 = 2
      shortHash: "hash456",
      expiresAt: addDays(new Date(), 1),
    },
  });

  const donor1 = await prisma.donor.findFirst({ where: { phoneNumber: "+911234567890" } });
  // Fill slot 1 of 2
  const lease1 = await attemptLease(request.id, donor1!.id);
  expect(lease1.status).toBe(LeaseStatus.JIT_PASSED);

  // Create donor buffer to fill slot 2 of 2
  const donorBuffer = await prisma.donor.create({
    data: {
      name: "Buffer Donor",
      phoneNumber: "+919876543211",
      latitude: 28.63,
      longitude: 77.23,
      bloodGroup: "B_POS",
      gender: "MALE",
      weightKg: 65,
    },
  });
  const leaseBuffer = await attemptLease(request.id, donorBuffer.id);
  expect(leaseBuffer.status).toBe(LeaseStatus.JIT_PASSED);

  // Create a standby donor (3rd donor exceeds N+1, queued as STANDBY)
  const donor2 = await prisma.donor.create({
    data: {
      name: "Standby Donor",
      phoneNumber: "+919876543210",
      latitude: 28.62,
      longitude: 77.22,
      bloodGroup: "B_POS",
      gender: "FEMALE",
      weightKg: 60,
    },
  });
  const lease2 = await attemptLease(request.id, donor2.id);
  expect(lease2.status).toBe(LeaseStatus.STANDBY);

  // Artificially expire the first active lease
  await prisma.donorLease.update({
    where: { id: lease1.id },
    data: { leaseExpiresAt: new Date(0) },
  });

  const evictionResult = await evictExpiredLeases();
  expect(evictionResult.evictedCount).toBe(1);
  expect(evictionResult.promotedCount).toBe(1);

  const promoted = await prisma.donorLease.findFirst({
    where: { requestId: request.id, donorId: donor2.id },
  });
  expect(promoted!.status).toBe(LeaseStatus.JIT_PASSED);
});
