import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";

export async function GET() {
  const cwd = process.cwd();
  let cwdFiles: string[] = [];
  try {
    cwdFiles = fs.readdirSync(cwd);
  } catch (e: any) {
    cwdFiles = [e.message];
  }

  let prismaFiles: string[] = [];
  try {
    prismaFiles = fs.readdirSync(path.join(cwd, "prisma"));
  } catch (e: any) {
    prismaFiles = [e.message];
  }

  return NextResponse.json({
    cwd,
    cwdFiles,
    prismaFiles,
    env: {
      VERCEL: process.env.VERCEL,
      NODE_ENV: process.env.NODE_ENV,
      DATABASE_URL: process.env.DATABASE_URL,
    },
  });
}
