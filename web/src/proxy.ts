import type { NextRequest } from "next/server";
import { neonAuthMiddleware } from "@neondatabase/auth/next/server";

const runAuth = neonAuthMiddleware({
  loginUrl: "/auth/sign-in",
});

export async function proxy(request: NextRequest) {
  return runAuth(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/auth|auth/).*)",
  ],
};
