import Link from "next/link";
import Image from "next/image";

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Header */}
      <header className="fixed top-0 z-50 w-full border-b border-white/10 bg-gray-950/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/platform" className="flex items-center gap-3">
            <Image
              src="/images/authentifactor-logo.png"
              alt="Authentifactor"
              width={375}
              height={375}
              className="h-12 w-auto"
              priority
            />
          </Link>
          <nav className="flex items-center gap-6">
            <Link
              href="#services"
              className="hidden text-sm font-medium text-gray-400 transition-colors hover:text-white sm:block"
            >
              Services
            </Link>
            <Link
              href="#clients"
              className="hidden text-sm font-medium text-gray-400 transition-colors hover:text-white sm:block"
            >
              Clients
            </Link>
            <Link
              href="/login"
              className="text-sm font-medium text-gray-400 transition-colors hover:text-white"
            >
              Sign In
            </Link>
            <Link
              href="/platform/onboard"
              className="rounded-full bg-gradient-to-r from-emerald-500 to-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:shadow-xl hover:shadow-emerald-500/30"
            >
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="pt-16">{children}</main>

      {/* Footer */}
      <footer className="bg-gray-950 py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-12 md:grid-cols-4">
            <div className="md:col-span-2">
              <Image
                src="/images/authentifactor-logo.png"
                alt="Authentifactor"
                width={375}
                height={375}
                className="h-20 w-auto"
              />
              <p className="mt-4 max-w-md text-sm leading-relaxed text-gray-400">
                We architect the digital infrastructure that powers ambitious
                brands. From e-commerce to fashion, food retail to SaaS — your
                vision, our engineering.
              </p>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Services
              </h4>
              <ul className="mt-4 space-y-3 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">E-Commerce Platforms</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Brand Websites</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Mobile Apps</a></li>
                <li><a href="#" className="hover:text-white transition-colors">SEO & Marketing</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Company
              </h4>
              <ul className="mt-4 space-y-3 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 border-t border-gray-800 pt-8 text-center text-xs text-gray-600">
            &copy; 2026 Authentifactor. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
