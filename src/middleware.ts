import { NextResponse, type NextRequest } from "next/server";

function resolveTenantSlug(request: NextRequest): string {
  // Dev override
  const paramSlug = request.nextUrl.searchParams.get("tenant");
  if (paramSlug) return paramSlug;

  const host = request.headers.get("host") ?? "";

  // Extract subdomain (e.g., "naijapantry" from "naijapantry.platform.com")
  const parts = host.split(".");
  if (parts.length >= 3) return parts[0];

  // Default tenant for localhost / single-domain setup
  return "naijapantry";
}

const protectedPrefixes = ["/account", "/admin"];

const publicPaths = [
  "/api/webhooks",
  "/login",
  "/register",
  "/_next",
  "/favicon.ico",
  "/images",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Resolve tenant slug and inject into request headers
  const tenantSlug = resolveTenantSlug(request);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-tenant-slug", tenantSlug);

  // Allow public paths, static assets, and API webhooks
  if (publicPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  // Protect /superadmin/* routes
  if (pathname.startsWith("/superadmin")) {
    const token = request.cookies.get("access_token")?.value;
    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  // Protect /account/* and /admin/* routes
  const isProtected = protectedPrefixes.some((prefix) =>
    pathname.startsWith(prefix)
  );

  if (isProtected) {
    const token = request.cookies.get("access_token")?.value;
    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public folder assets
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
