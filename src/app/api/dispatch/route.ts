// src/app/api/dispatch/route.ts
import { NextResponse } from "next/server";
import { dispatchWave } from "@/lib/engines/dispatcher";

export async function POST(req: Request) {
  const { requestId } = await req.json();
  await dispatchWave(requestId);
  return NextResponse.json({ ok: true });
}
