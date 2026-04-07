import "server-only";

import { redirect } from "next/navigation";

import { ensureAppUser } from "@/lib/auth/ensure-app-user";

export function resolveAppHomePath(approvalStatus: "pending" | "approved" | "rejected") {
  return approvalStatus === "approved" ? "/dashboard" : "/pending-approval";
}

export async function requireSessionAppUserOrRedirect() {
  const appUser = await ensureAppUser();
  if (!appUser) {
    redirect("/auth/sign-in");
  }
  return appUser;
}

export async function requireApprovedAppUserOrRedirect() {
  const appUser = await requireSessionAppUserOrRedirect();
  if (appUser.approvalStatus !== "approved") {
    redirect("/pending-approval");
  }
  return appUser;
}

export async function requireAdminAppUserOrRedirect() {
  const appUser = await requireApprovedAppUserOrRedirect();
  if (!appUser.isAdmin) {
    redirect("/dashboard");
  }
  return appUser;
}
