import { z } from "zod";
import { idSchema } from "@/server/ids";

export const setMenuSchema = z.object({ snackIds: z.array(idSchema).max(100, "Too many snacks on one menu") });
export type SetMenuInput = z.infer<typeof setMenuSchema>;
