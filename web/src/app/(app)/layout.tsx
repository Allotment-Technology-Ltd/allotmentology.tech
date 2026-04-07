import type { Metadata } from "next";

import { AppShell } from "@/components/app-shell";
import { requireApprovedAppUserOrRedirect } from "@/lib/auth/access-control.server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Workspace — Allotment Technology",
  description: "Approval-gated workspace for Allotment Technology.",
};

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireApprovedAppUserOrRedirect();

  return <AppShell>{children}</AppShell>;
}
