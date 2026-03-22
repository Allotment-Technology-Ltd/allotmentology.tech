"use client";

import { UserButton } from "@neondatabase/auth/react";

export function AuthUserMenu() {
  return (
    <UserButton
      size="default"
      className="text-zinc-200 [&_button]:border-zinc-700 [&_button]:bg-zinc-900"
    />
  );
}
