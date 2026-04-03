import { NextResponse, type NextRequest } from "next/server";

// Known platform domains (not tenant custom domains)
const PLATFORM_HOSTS = ["vercel.app", "localhost", "authentifactor.com"];

// Routes that belong to the platform itself (not tenant storefronts)
const PLATFORM_ROUTES = [
  "/platform",
  "/login",
  "/register",
  "/superadmin",
  "/api",
];

function isPlatformHost(host: string): boolean {
  return PLATFORM_HOSTS.some((ph) => host.includes(ph));
}

function resolveTenantSlug(request: NextRequest): string | null {
  // Dev/preview override via query param
  const paramSlug = request.nextUrl.searchParams.get("tenant");
  if (paramSlug) return paramSlug;

  const host = request.headers.get("host") ?? "";

  // Platform hosts don't have tenants (unless using ?tenant= override)
  if (isPlatformHost(host)) return null;

  // Custom domain mapping (e.g., tmfoods.co.uk → resolved via DB in tenant.ts)
  // Subdomain extraction (e.g., tom.authentifactor.com → tom)
  const parts = host.split(".");
  if (parts.length >= 3) return parts[0];

  // Custom domain — pass full host, tenant.ts will resolve from DB
  return host;
}

const protectedPrefixes = ["/account", "/admin"];

const publicPaths = [
  "/api/webhooks",
  "/api/billing/webhook",
  "/login",
  "/register",
  "/billing-issue",
  "/_next",
  "/favicon.ico",
  "/images",
  "/platform",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get("host") ?? "";

  // ── Platform host hitting root "/" → redirect to /platform ──
  if (isPlatformHost(host) && pathname === "/") {
    return NextResponse.redirect(new URL("/platform", request.url));
  }

  // ── Resolve tenant ──
  const tenantSlug = resolveTenantSlug(request);
  const requestHeaders = new Headers(request.headers);

  if (tenantSlug) {
    requestHeaders.set("x-tenant-slug", tenantSlug);
  }

  // Allow public paths, static assets, platform routes
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

  // ── Tenant custom domain hitting "/" → serve their storefront ──
  // ── Platform host hitting tenant routes (e.g., /shop) without tenant → redirect to /platform ──
  if (isPlatformHost(host) && !tenantSlug) {
    const isPlatformRoute = PLATFORM_ROUTES.some((r) => pathname.startsWith(r));
    if (!isPlatformRoute && pathname !== "/") {
      // Non-platform route on platform host with no tenant → redirect
      return NextResponse.redirect(new URL("/platform", request.url));
    }
  }

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots\\.txt|sitemap.*\\.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml)$).*)",
  ],
};
