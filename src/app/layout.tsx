import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NaijaPantry — Authentic Nigerian Foods",
  description:
    "Shop authentic Nigerian groceries, spices, drinks and beauty products. Fresh delivery across Nigeria with subscribe-and-save options.",
  keywords: ["Nigerian food", "African groceries", "Garri", "Egusi", "Jollof Rice", "Nigerian store"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-white text-gray-900 antialiased`}>
        {children}
      </body>
    </html>
  );
}
