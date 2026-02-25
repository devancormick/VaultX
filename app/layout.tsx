import type { Metadata } from "next";
import "./globals.css";
import "../instrumentation";
import { ToastProvider } from "@/components/ui/toast";

export const metadata: Metadata = {
  title: "VaultX — Secure access. Protected assets. Zero compromise.",
  description:
    "VaultX is a production-grade SaaS platform delivering gated browser-based 3D experiences with enterprise-level backend security, real Stripe billing, and complete user management.",
  openGraph: {
    title: "VaultX",
    description: "Secure access. Protected assets. Zero compromise.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-bg text-text antialiased">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
