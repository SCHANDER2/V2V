import { PrismaClient } from "@prisma/client";
import path from "path";
import fs from "fs";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  let dbUrl: string | undefined;

  // On Vercel or AWS Lambda serverless execution
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const tmpDbPath = path.join("/tmp", "dev.db");
    if (!fs.existsSync(tmpDbPath)) {
      const possibleSources = [
        path.join(process.cwd(), "prisma", "dev.db"),
        path.join(process.cwd(), "dev.db"),
        path.resolve("./prisma/dev.db"),
        path.resolve("./dev.db"),
      ];
      for (const src of possibleSources) {
        if (fs.existsSync(src)) {
          try {
            fs.copyFileSync(src, tmpDbPath);
            break;
          } catch (e) {
            console.error("[Prisma] Failed to copy db file to /tmp:", e);
          }
        }
      }
    }
    if (fs.existsSync(tmpDbPath)) {
      dbUrl = `file:${tmpDbPath}`;
    }
  } else {
    // Local / CI / Test environments
    const localDbPath = path.resolve(process.cwd(), "prisma", "dev.db");
    const rootDbPath = path.resolve(process.cwd(), "dev.db");
    if (fs.existsSync(localDbPath)) {
      dbUrl = `file:${localDbPath}`;
    } else if (fs.existsSync(rootDbPath)) {
      dbUrl = `file:${rootDbPath}`;
    }
  }

  if (dbUrl) {
    return new PrismaClient({
      datasources: {
        db: {
          url: dbUrl,
        },
      },
    });
  }

  return new PrismaClient();
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
