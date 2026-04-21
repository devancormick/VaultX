import type { Metadata } from "next";
import "./globals.css";
import "../instrumentation";
import { ToastProvider } from "@/components/ui/toast";

export const metadata: Metadata = {
  title: {
    default: "VaultX",
    template: "%s · VaultX",
  },
  description:
    "VaultX — 3D asset delivery, football playbook platform, and team management. Built for coaches and athletes who demand more.",
  applicationName: "VaultX",
  keywords: ["football playbook", "3D viewer", "team management", "play design", "coaching platform"],
  authors: [{ name: "VaultX" }],
  openGraph: {
    title: "VaultX",
    description: "3D asset delivery and football playbook platform for coaches and athletes.",
    type: "website",
    siteName: "VaultX",
  },
  twitter: {
    card: "summary",
    title: "VaultX",
    description: "3D asset delivery and football playbook platform for coaches and athletes.",
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
