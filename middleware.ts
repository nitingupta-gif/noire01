import { auth } from "./lib/auth";
import { NextResponse } from "next/server";

const PROTECTED_CUSTOMER_ROUTES = [
  "/account",
  "/checkout",
  "/orders",
  "/wishlist",
];

// These routes must stay reachable even when logged out — they're how you get logged in.
const AUTH_ROUTES = ["/account/login", "/account/signup"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const role = (req.auth?.user as any)?.role;

  if (pathname.startsWith("/admin")) {
    if (!isLoggedIn || role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  const isAuthRoute = AUTH_ROUTES.some((p) => pathname.startsWith(p));
  const isProtected = PROTECTED_CUSTOMER_ROUTES.some((p) => pathname.startsWith(p));

  if (isProtected && !isAuthRoute && !isLoggedIn) {
    const loginUrl = new URL("/account/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/account/:path*", "/checkout/:path*", "/orders/:path*", "/wishlist/:path*"],
};