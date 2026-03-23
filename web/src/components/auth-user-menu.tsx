"use client";

import { UserButton } from "@neondatabase/auth/react";

export function AuthUserMenu() {
  return (
    <div className="auth-user-menu min-w-0">
      <UserButton
        size="default"
        className="w-full max-w-[min(100%,20rem)] justify-start border-zinc-700 bg-zinc-900 text-zinc-100 shadow-none [&_button]:border-zinc-700 [&_button]:bg-zinc-900 [&_button]:text-zinc-100 [&_span]:text-zinc-100 [&_p]:text-zinc-100 [&_a]:text-zinc-100"
      />
    </div>
  );
}
