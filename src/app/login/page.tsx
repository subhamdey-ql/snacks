import { redirect } from "next/navigation";
import { homeFor } from "@/lib/routes";
import { LoginTemplate } from "@/modules/auth/templates/login-template";
import { getSession } from "@/server/auth/session";

export default async function LoginPage(): Promise<React.JSX.Element> {
  const session = await getSession();
  if (session) redirect(homeFor(session.role)); // already logged in
  return <LoginTemplate />;
}
