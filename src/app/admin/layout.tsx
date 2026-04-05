import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { DarkGradientBg } from "@/components/ui/dark-gradient-bg";
import { AdminSidebar } from "./admin-sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    await requireAdmin();
  } catch {
    redirect("/login");
  }

  let tenantName = "Dashboard";
  let tenantInitial = "A";
  let tenantColor = "#059669";
  let tenantSlug = "";

  try {
    const { getTenant } = await import("@/lib/tenant");
    const tenant = await getTenant();
    tenantName = tenant.name;
    tenantInitial = tenant.name.charAt(0).toUpperCase();
    tenantColor = tenant.primaryColor;
    tenantSlug = tenant.slug;
  } catch {
    // No tenant context
  }

  return (
    <DarkGradientBg>
      <div className="flex min-h-screen">
        <AdminSidebar tenantName={tenantName} tenantInitial={tenantInitial} tenantColor={tenantColor} tenantSlug={tenantSlug} />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </DarkGradientBg>
  );
}
