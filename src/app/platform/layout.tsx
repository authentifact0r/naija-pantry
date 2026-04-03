import type { Metadata } from "next";
import PlatformShell from "./platform-shell";

export const metadata: Metadata = {
  title: "Authentifactor — We Architect Digital Infrastructure That Scales",
  description:
    "Multi-tenant commerce and web platform powering ambitious brands. E-commerce platforms, brand websites, mobile apps, SEO, and custom development. Trusted by 100+ clients worldwide.",
  keywords: [
    "multi-tenant platform",
    "e-commerce development",
    "white-label storefront",
    "brand website",
    "digital infrastructure",
    "Authentifactor",
    "web development agency",
    "Next.js",
    "Stripe integration",
    "custom development UK",
  ],
  authors: [{ name: "Authentifactor" }],
  creator: "Authentifactor",
  publisher: "Authentifactor",
  metadataBase: new URL("https://authentifactor.com"),
  alternates: {
    canonical: "/platform",
  },
  openGraph: {
    type: "website",
    locale: "en_GB",
    url: "https://authentifactor.com/platform",
    siteName: "Authentifactor",
    title: "Authentifactor — We Architect Digital Infrastructure That Scales",
    description:
      "From e-commerce to fashion, food retail to SaaS — we design, engineer, and scale world-class digital products for ambitious businesses.",
    images: [
      {
        url: "/images/authentifactor-logo.png",
        width: 375,
        height: 375,
        alt: "Authentifactor",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Authentifactor — We Architect Digital Infrastructure",
    description:
      "Multi-tenant commerce platform powering ambitious brands. E-commerce, websites, mobile apps, and custom development.",
    images: ["/images/authentifactor-logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

// JSON-LD structured data
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Authentifactor",
  url: "https://authentifactor.com",
  logo: "https://authentifactor.com/images/authentifactor-logo.png",
  description:
    "Multi-tenant commerce and web platform powering ambitious brands with e-commerce, websites, mobile apps, and custom development.",
  foundingDate: "2025",
  sameAs: [],
  contactPoint: {
    "@type": "ContactPoint",
    email: "hello@authentifactor.com",
    contactType: "sales",
  },
  offers: {
    "@type": "AggregateOffer",
    priceCurrency: "GBP",
    lowPrice: "49",
    highPrice: "199",
    offerCount: "3",
  },
};

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PlatformShell>{children}</PlatformShell>
    </>
  );
}
