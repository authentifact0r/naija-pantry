import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { Package, BarChart3, Warehouse, ShoppingCart, Zap, Box, LogOut } from "lucide-react";
import { logoutAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: BarChart3 },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/inventory", label: "Inventory", icon: Box },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/flash-sales", label: "Flash Sales", icon: Zap },
  { href: "/admin/warehouses", label: "Warehouses", icon: Warehouse },
];

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

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="hidden w-60 flex-shrink-0 border-r bg-gray-50 lg:block">
        <div className="flex h-16 items-center gap-2 border-b px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-900 text-sm font-bold text-white">
            N
          </div>
          <span className="font-semibold text-gray-900">Admin</span>
        </div>
        <nav className="space-y-1 p-4">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-white hover:text-emerald-900 hover:shadow-sm"
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto border-t p-4">
          <form action={logoutAction}>
            <Button variant="ghost" size="sm" className="w-full justify-start">
              <LogOut className="mr-2 h-4 w-4" /> Sign Out
            </Button>
          </form>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        {/* Mobile nav */}
        <div className="flex items-center gap-2 overflow-x-auto border-b p-4 lg:hidden">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-1 whitespace-nowrap rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700"
            >
              <Icon className="h-3 w-3" />
              {label}
            </Link>
          ))}
        </div>
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
