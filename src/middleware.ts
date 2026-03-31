import { NextResponse, type NextRequest } from "next/server";

// Known platform domains (not tenant subdomains)
const PLATFORM_HOSTS = ["vercel.app", "localhost", "authentifactor.com"];

function resolveTenantSlug(request: NextRequest): string {
  // Dev/preview override via query param
  const paramSlug = request.nextUrl.searchParams.get("tenant");
  if (paramSlug) return paramSlug;

  const host = request.headers.get("host") ?? "";

  // Skip subdomain extraction for platform hosts (e.g., naija-pantry.vercel.app)
  const isPlatformHost = PLATFORM_HOSTS.some((ph) => host.endsWith(ph));
  if (isPlatformHost) return "taste-of-motherland";

  // Custom domain mapping (e.g., tmfoods.co.uk → taste-of-motherland)
  // The actual mapping is done via DB lookup in tenant.ts
  // Here we pass the full host for custom domain resolution
  const parts = host.split(".");
  if (parts.length >= 3) return parts[0]; // subdomain extraction

  // Default tenant
  return "taste-of-motherland";
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
