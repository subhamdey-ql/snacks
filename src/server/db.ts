import { PrismaClient, type Prisma } from "@prisma/client";

// Reuse one client across dev hot-reloads so we do not exhaust connections.
const g = globalThis as { db?: PrismaClient };
export const db: PrismaClient = g.db ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") g.db = db;

export type Db = PrismaClient | Prisma.TransactionClient;
