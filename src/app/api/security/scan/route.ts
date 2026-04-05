import { NextResponse } from "next/server";
import { execSync } from "node:child_process";

const DOMAINS = [
  { name: "Authentifactor", url: "https://authentifactor.com", domain: "authentifactor.com" },
  { name: "Vibrant Minds", url: "https://vibrantmindsasc.org.uk", domain: "vibrantmindsasc.org.uk" },
  { name: "Styled by Maryam", url: "https://styledbymaryam.com", domain: "styledbymaryam.com" },
  { name: "CitiesTroves", url: "https://citiestroves.com", domain: "citiestroves.com" },
  { name: "Clarity Conduct", url: "https://clarityconduct.com", domain: "clarityconduct.com" },
  { name: "Careceutical", url: "https://careceutical.vercel.app", domain: "careceutical.vercel.app" },
  { name: "BowSea", url: "https://placementsportal-81608.web.app", domain: "placementsportal-81608.web.app" },
];

const REQUIRED_HEADERS: Record<string, { label: string; severity: string }> = {
  "strict-transport-security": { label: "HSTS", severity: "high" },
  "x-frame-options": { label: "X-Frame-Options", severity: "high" },
  "x-content-type-options": { label: "X-Content-Type-Options", severity: "medium" },
  "referrer-policy": { label: "Referrer-Policy", severity: "medium" },
  "permissions-policy": { label: "Permissions-Policy", severity: "low" },
  "content-security-policy": { label: "CSP", severity: "high" },
  "cross-origin-resource-policy": { label: "CORP", severity: "low" },
  "x-xss-protection": { label: "X-XSS-Protection", severity: "low" },
};

async function checkSSL(domain: string) {
  try {
    const output = execSync(
      `echo | openssl s_client -servername ${domain} -connect ${domain}:443 2>/dev/null | openssl x509 -noout -dates 2>/dev/null`,
      { encoding: "utf-8", timeout: 8000 }
    );
    const notAfter = output.match(/notAfter=(.*)/)?.[1];
    if (!notAfter) return { domain, status: "error", daysLeft: null };
    const expiry = new Date(notAfter);
    const daysLeft = Math.floor((expiry.getTime() - Date.now()) / 86400000);
    return {
      domain,
      status: daysLeft < 7 ? "critical" : daysLeft < 30 ? "warning" : "ok",
      daysLeft,
      expiryDate: expiry.toISOString(),
    };
  } catch {
    return { domain, status: "error", daysLeft: null };
  }
}

async function checkHeaders(url: string) {
  try {
    const res = await fetch(url, { method: "HEAD", redirect: "follow", signal: AbortSignal.timeout(8000) });
    const headers: Record<string, string> = {};
    res.headers.forEach((v, k) => { headers[k.toLowerCase()] = v; });

    let score = 100;
    const missing: string[] = [];
    const present: string[] = [];

    for (const [header, config] of Object.entries(REQUIRED_HEADERS)) {
      if (headers[header]) {
        present.push(config.label);
      } else {
        missing.push(config.label);
        score -= config.severity === "high" ? 15 : config.severity === "medium" ? 10 : 5;
      }
    }

    return { url, score: Math.max(0, score), missing, present };
  } catch {
    return { url, score: 0, missing: [], present: [] };
  }
}

async function checkUptime(url: string) {
  const start = Date.now();
  try {
    const res = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(10000) });
    return { url, status: res.ok ? "up" : "degraded", httpStatus: res.status, latencyMs: Date.now() - start };
  } catch {
    return { url, status: "down", httpStatus: 0, latencyMs: Date.now() - start };
  }
}

export async function GET() {
  try {
    const ssl = await Promise.all(DOMAINS.map((d) => checkSSL(d.domain)));
    const headers = await Promise.all(DOMAINS.map((d) => checkHeaders(d.url)));
    const uptime = await Promise.all(DOMAINS.map((d) => checkUptime(d.url)));

    // Compute posture score
    let score = 100;
    const issues: { severity: string; message: string }[] = [];

    // SSL
    for (const s of ssl) {
      if (s.status === "critical") { score -= 20; issues.push({ severity: "critical", message: `SSL: ${s.domain} expires in ${s.daysLeft} days` }); }
      else if (s.status === "warning") { score -= 10; issues.push({ severity: "warning", message: `SSL: ${s.domain} expires in ${s.daysLeft} days` }); }
    }

    // Headers
    const avgHeaders = headers.reduce((s, h) => s + h.score, 0) / headers.length;
    if (avgHeaders < 50) { score -= 15; issues.push({ severity: "warning", message: `Security headers avg: ${avgHeaders.toFixed(0)}/100` }); }
    else if (avgHeaders < 70) { score -= 8; issues.push({ severity: "info", message: `Security headers avg: ${avgHeaders.toFixed(0)}/100` }); }

    // Uptime
    const down = uptime.filter((u) => u.status === "down");
    if (down.length > 0) { score -= down.length * 10; issues.push({ severity: "critical", message: `${down.length} endpoints DOWN` }); }

    score = Math.max(0, Math.min(100, score));
    const grade = score >= 90 ? "A" : score >= 80 ? "B" : score >= 70 ? "C" : score >= 50 ? "D" : "F";

    const domains = DOMAINS.map((d, i) => ({
      ...d,
      ssl: ssl[i],
      headers: headers[i],
      uptime: uptime[i],
    }));

    return NextResponse.json({ score, grade, issues, domains, scannedAt: new Date().toISOString() });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
