"use client";
import { createContext, useContext } from "react";

export interface TenantConfig {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  primaryColor: string;
  accentColor: string;
  tagline: string | null;
  currency: string;
  freeShippingMinimum: number | null;
  heroBannerTitle: string | null;
  heroBannerSubtitle: string | null;
}

const TenantContext = createContext<TenantConfig | null>(null);

export function TenantProvider({ tenant, children }: { tenant: TenantConfig; children: React.ReactNode }) {
  return (
    <TenantContext.Provider value={tenant}>
      <style dangerouslySetInnerHTML={{ __html: `:root { --color-brand: ${tenant.primaryColor}; --color-accent: ${tenant.accentColor}; }` }} />
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const ctx = useContext(TenantContext);
  if (!ctx) throw new Error("useTenant must be used within TenantProvider");
  return ctx;
}
