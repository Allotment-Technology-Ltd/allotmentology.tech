import { AppShell } from "@/components/app-shell";
import { ensureAppUser } from "@/lib/auth/ensure-app-user";

export const dynamic = "force-dynamic";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await ensureAppUser();

  return <AppShell>{children}</AppShell>;
}
