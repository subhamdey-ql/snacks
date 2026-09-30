import { redirect } from "next/navigation";
import { LoginTemplate } from "@/modules/auth/templates/login-template";
import { isAuthed } from "@/server/auth/session";

export default async function LoginPage(): Promise<React.JSX.Element> {
  if (await isAuthed()) redirect("/"); // already logged in
  return <LoginTemplate />;
}
