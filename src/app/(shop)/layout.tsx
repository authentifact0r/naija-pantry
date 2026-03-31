import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { TenantProvider, type TenantConfig } from "@/components/tenant-provider";
import { getTenant } from "@/lib/tenant";

export default async function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tenant = await getTenant();

  const tenantConfig: TenantConfig = {
    id: tenant.id,
    name: tenant.name,
    slug: tenant.slug,
    logo: tenant.logo,
    primaryColor: tenant.primaryColor,
    accentColor: tenant.accentColor,
    tagline: tenant.tagline,
    currency: tenant.currency,
    freeShippingMinimum: tenant.freeShippingMinimum,
    heroBannerTitle: tenant.heroBannerTitle,
    heroBannerSubtitle: tenant.heroBannerSubtitle,
  };

  return (
    <TenantProvider tenant={tenantConfig}>
      <Header />
      <main className="min-h-[calc(100vh-4rem)]">{children}</main>
      <Footer />
    </TenantProvider>
  );
}
