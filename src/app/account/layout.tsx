import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Header } from "@/components/layout/header";
import { logoutAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Package, MapPin, RefreshCw, User, LogOut } from "lucide-react";

const navItems = [
  { href: "/account", label: "Overview", icon: User },
  { href: "/account/orders", label: "Orders", icon: Package },
  { href: "/account/addresses", label: "Addresses", icon: MapPin },
  { href: "/account/subscriptions", label: "Subscriptions", icon: RefreshCw },
];

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <>
      <Header />
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Account</h1>
            <p className="text-sm text-gray-500">
              Welcome back, {user.firstName}
            </p>
          </div>
          <form action={logoutAction}>
            <Button variant="ghost" size="sm">
              <LogOut className="mr-2 h-4 w-4" /> Sign Out
            </Button>
          </form>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[220px_1fr]">
          <nav className="flex gap-1 overflow-x-auto lg:flex-col">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-emerald-900"
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </nav>
          <div>{children}</div>
        </div>
      </div>
    </>
  );
}
