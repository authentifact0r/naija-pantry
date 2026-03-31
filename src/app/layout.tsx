import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  try {
    const { getTenant } = await import("@/lib/tenant");
    const tenant = await getTenant();
    return {
      title: tenant.defaultMetaTitle || `${tenant.name} — ${tenant.tagline || "Shop Online"}`,
      description:
        tenant.defaultMetaDescription ||
        `Shop quality products at ${tenant.name}. Fast delivery with subscribe-and-save options.`,
      openGraph: tenant.defaultOgImage
        ? { images: [{ url: tenant.defaultOgImage }] }
        : undefined,
    };
  } catch {
    // Fallback when tenant context is not available (e.g., API routes)
    return {
      title: "Authentifactor — Multi-Tenant Commerce",
      description:
        "Shop quality products online. Fresh delivery with subscribe-and-save options.",
    };
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning className={`${inter.className} min-h-screen bg-white text-gray-900 antialiased`}>
        {children}
      </body>
    </html>
  );
}
