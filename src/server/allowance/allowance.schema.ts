import { z } from "zod";
import { EmployeeType } from "@/types/enums";

const credit = z.number("Credits must be a number").int("Credits must be a whole number").min(0, "Cannot be negative").max(10000);
export const saveAllowanceSchema = z.object({
  [EmployeeType.WFO]: credit,
  [EmployeeType.HYBRID]: credit,
});
