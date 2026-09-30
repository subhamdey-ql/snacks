import type { Snack } from "@prisma/client";
import { db } from "@/server/db";
import { HttpError } from "@/server/http";
import type { CreateSnackInput, UpdateSnackInput } from "@/server/snack/snack.schema";

export function listSnacks(includeInactive: boolean): Promise<Snack[]> {
  return db.snack.findMany({ where: includeInactive ? {} : { active: true }, orderBy: { name: "asc" } });
}

// Adding a name that already exists re-activates it with the new cost instead of failing.
export function createSnack(input: CreateSnackInput): Promise<Snack> {
  return db.snack.upsert({ where: { name: input.name }, update: { credits: input.credits, active: true }, create: input });
}

export async function updateSnack(id: number, input: UpdateSnackInput): Promise<Snack> {
  const { count } = await db.snack.updateMany({ where: { id }, data: input });
  if (count === 0) throw new HttpError(404, "Snack not found");
  return db.snack.findUniqueOrThrow({ where: { id } });
}
