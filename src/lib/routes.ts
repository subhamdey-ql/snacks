import { Role } from "@/types/enums";

// Where each role lands after login (and where a wrong-side visit is sent). Pure, so client code can use it too.
export const homeFor = (role: Role): string => (role === Role.ADMIN ? "/" : "/me");
