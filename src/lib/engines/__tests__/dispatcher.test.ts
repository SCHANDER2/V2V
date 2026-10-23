import { PrismaClient } from "@prisma/client";
import { WaveState, LeaseStatus } from "@/types/enums";
import {
  selectDonorsForWave,
  pingDonors,
  advanceWaveOrClose,
  dispatchWave,
} from "../dispatcher";
import { main } from "../../../../prisma/seed";

const prisma = new PrismaClient();

beforeAll(async () => {
  await main();
}, 30000);

afterAll(async () => {
  await prisma.$disconnect();
});

describe("Dispatcher Engine", () => {
  test("selectDonorsForWave selects eligible donors within current wave radius", async () => {
    // Request 1 is AIIMS, WAVE_1_DISPATCH (0-3km), SDP B_POS, unitsNeeded 2 (target slots 3)
    const req1 = await prisma.emergencyRequest.findUnique({
      where: { shortHash: "v2v_w1_aiims" },
    });
    expect(req1).not.toBeNull();

    const donors = await selectDonorsForWave(req1!.id);
    expect(donors.length).toBeGreaterThan(0);
    // Donors should have compatible blood groups
    for (const d of donors) {
      expect(["B_POS", "B_NEG", "O_POS", "O_NEG"]).toContain(d.bloodGroup);
      expect(d.weightKg).toBeGreaterThanOrEqual(50); // SDP weight requirement
    }
  });

  test("pingDonors updates lastPingedAt and creates PINGED lease records", async () => {
    // Create isolated test request
    const testReq = await prisma.emergencyRequest.create({
      data: {
        patientName: "Test Dispatch Patient",
        patientUhid: "UHID-TEST-001",
        hospitalName: "AIIMS Delhi, Trauma Centre",
        hospitalLat: 28.5672,
        hospitalLng: 77.2100,
        component: "WHOLE_BLOOD",
        bloodGroup: "O_POS",
        requestMode: "REPLACEMENT_ANY",
        unitsNeeded: 1,
        waveState: WaveState.WAVE_1_DISPATCH,
        shortHash: "testhash_ping_" + Date.now(),
        expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000),
      },
    });

    const donors = await selectDonorsForWave(testReq.id);
    expect(donors.length).toBeGreaterThan(0);

    const testDonor = donors[0];
    await pingDonors(testReq.id, [testDonor]);

    const updatedDonor = await prisma.donor.findUnique({ where: { id: testDonor.id } });
    expect(updatedDonor?.lastPingedAt).not.toBeNull();

    const createdLease = await prisma.donorLease.findFirst({
      where: { requestId: testReq.id, donorId: testDonor.id },
    });
    expect(createdLease).not.toBeNull();
    expect(createdLease?.status).toBe(LeaseStatus.PINGED);
  });

  test("advanceWaveOrClose transitions wave states sequentially", async () => {
    const testReq = await prisma.emergencyRequest.create({
      data: {
        patientName: "Advance Wave Patient",
        patientUhid: "UHID-TEST-ADV",
        hospitalName: "AIIMS Delhi, Trauma Centre",
        hospitalLat: 28.5672,
        hospitalLng: 77.2100,
        component: "WHOLE_BLOOD",
        bloodGroup: "O_POS",
        requestMode: "REPLACEMENT_ANY",
        unitsNeeded: 1,
        waveState: WaveState.WAVE_1_DISPATCH,
        shortHash: "testhash_adv_" + Date.now(),
        expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000),
      },
    });

    await advanceWaveOrClose(testReq.id);
    let updated = await prisma.emergencyRequest.findUnique({ where: { id: testReq.id } });
    expect(updated?.waveState).toBe(WaveState.WAVE_2_DISPATCH);

    await advanceWaveOrClose(testReq.id);
    updated = await prisma.emergencyRequest.findUnique({ where: { id: testReq.id } });
    expect(updated?.waveState).toBe(WaveState.WAVE_3_DISPATCH);

    await advanceWaveOrClose(testReq.id);
    updated = await prisma.emergencyRequest.findUnique({ where: { id: testReq.id } });
    expect(updated?.waveState).toBe(WaveState.EXPIRED);
  });

  test("dispatchWave returns waveState and pinged count", async () => {
    const testReq = await prisma.emergencyRequest.create({
      data: {
        patientName: "Dispatch Wave Patient",
        patientUhid: "UHID-TEST-DISP",
        hospitalName: "AIIMS Delhi, Trauma Centre",
        hospitalLat: 28.5672,
        hospitalLng: 77.2100,
        component: "WHOLE_BLOOD",
        bloodGroup: "O_POS",
        requestMode: "REPLACEMENT_ANY",
        unitsNeeded: 1,
        waveState: WaveState.PENDING_VERIFICATION,
        shortHash: "testhash_disp_" + Date.now(),
        expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000),
      },
    });

    const result = await dispatchWave(testReq.id);
    expect(result.waveState).toBe(WaveState.WAVE_1_DISPATCH);
    expect(result.pingedDonorsCount).toBeGreaterThan(0);
  });
});
