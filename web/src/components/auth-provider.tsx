"use client";

import { NeonAuthUIProvider } from "@neondatabase/auth/react";

import { getAuthClient, isNeonAuthConfiguredClient } from "@/lib/auth/client";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  if (!isNeonAuthConfiguredClient()) {
    return <>{children}</>;
  }

  return (
    <NeonAuthUIProvider
      authClient={getAuthClient()}
      redirectTo="/"
      social={{ providers: ["google"] }}
    >
      {children}
    </NeonAuthUIProvider>
  );
}
