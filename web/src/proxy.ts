import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { isNeonAuthConfigured } from "@/lib/auth/auth-config";

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isPublicPath = path === "/" || path === "/pending-approval";

  if (isNeonAuthConfigured() && path === "/setup") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (!isNeonAuthConfigured()) {
    if (
      isPublicPath ||
      path === "/setup" ||
      path.startsWith("/_next") ||
      path === "/favicon.ico"
    ) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/setup", request.url));
  }

  const { neonAuthMiddleware } = await import("@neondatabase/auth/next/server");
  const runAuth = neonAuthMiddleware({
    loginUrl: "/auth/sign-in",
  });
  if (isPublicPath) {
    return NextResponse.next();
  }
  return runAuth(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/auth|auth/).*)",
  ],
};
