import React from "react";
import prisma from "@/lib/prisma";
import { WaveState } from "@/types/enums";

export default async function RequestStatusPage({ params }: { params: { shortHash: string } }) {
  const { shortHash } = params;
  const request = await prisma.emergencyRequest.findUnique({ where: { shortHash } });

  if (!request) return <div className="p-4 text-red-500">Request not found.</div>;

  const isFinal = request.waveState === WaveState.FULFILLED_CLOSED || request.waveState === WaveState.EXPIRED;

  return (
    <main className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Emergency Request Status</h1>
      {isFinal ? (
        <div className="text-center py-8">
          <h2 className="text-xl font-semibold mb-2">Requirement Fulfilled — Thank You!</h2>
          <p>No contact buttons are displayed as per Counter‑Loop 4.</p>
        </div>
      ) : (
        <div>
          <p>Current Wave: {request.waveState}</p>
          <p>Units Needed: {request.unitsNeeded}</p>
        </div>
      )}
    </main>
  );
}
