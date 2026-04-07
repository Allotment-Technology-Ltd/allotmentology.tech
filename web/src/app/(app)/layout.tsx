import { AppShell } from "@/components/app-shell";
import { requireApprovedAppUserOrRedirect } from "@/lib/auth/access-control.server";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireApprovedAppUserOrRedirect();

  return <AppShell>{children}</AppShell>;
}
