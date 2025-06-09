import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { validateRequest } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const session = await validateRequest(request);

  // Public paths that don't require authentication
  if (request.nextUrl.pathname === "/login") {
    if (session) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  // Protected routes
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Admin-only routes
  if (request.nextUrl.pathname.startsWith("/admin") && session.role !== "admin") {
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  // Cashier-only routes
  if (request.nextUrl.pathname.startsWith("/cashier") && session.role !== "kasir") {
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/cashier/:path*", "/login"],
};