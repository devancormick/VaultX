"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import type { Profile, Subscription } from "@/lib/supabase/types";

interface NavbarProps {
  profile?: Profile | null;
  subscription?: Subscription | null;
}

export function Navbar({ profile, subscription }: NavbarProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const plan = subscription?.plan ?? "free";

  return (
    <nav className="sticky top-0 z-40 border-b border-border bg-surface/80 backdrop-blur-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <VaultXLogo className="w-7 h-7" />
          <span className="font-display font-extrabold text-lg">
            Vault<span className="text-accent">X</span>
          </span>
        </Link>

        {/* Desktop nav */}
        {profile && (
          <div className="hidden md:flex items-center gap-1">
            <NavLink href="/dashboard">Dashboard</NavLink>
            <NavLink href="/viewer">Viewer</NavLink>
            <NavLink href="/assets">Assets</NavLink>
            <NavLink href="/settings">Settings</NavLink>
            {profile.is_admin && <NavLink href="/admin">Admin</NavLink>}
          </div>
        )}

        {/* Right side */}
        <div className="flex items-center gap-3">
          {profile ? (
            <>
              <Badge variant={plan as Parameters<typeof Badge>[0]["variant"]}>
                {plan}
              </Badge>
              <div className="flex items-center gap-2">
                <Avatar src={profile.avatar_url} name={profile.full_name} email={profile.email} size="sm" />
                <span className="hidden md:block text-sm text-muted max-w-[120px] truncate">
                  {profile.email}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="text-muted hover:text-danger transition-colors p-1.5 rounded"
                aria-label="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">Sign in</Button>
              </Link>
              <Link href="/signup">
                <Button size="sm">Get started</Button>
              </Link>
            </>
          )}

          {/* Mobile menu toggle */}
          {profile && (
            <button
              className="md:hidden text-muted hover:text-text p-1"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && profile && (
        <div className="md:hidden border-t border-border bg-surface px-4 py-3 space-y-1">
          <MobileNavLink href="/dashboard" onClick={() => setMenuOpen(false)}>Dashboard</MobileNavLink>
          <MobileNavLink href="/viewer" onClick={() => setMenuOpen(false)}>Viewer</MobileNavLink>
          <MobileNavLink href="/assets" onClick={() => setMenuOpen(false)}>Assets</MobileNavLink>
          <MobileNavLink href="/settings" onClick={() => setMenuOpen(false)}>Settings</MobileNavLink>
          {profile.is_admin && (
            <MobileNavLink href="/admin" onClick={() => setMenuOpen(false)}>Admin</MobileNavLink>
          )}
        </div>
      )}
    </nav>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="px-3 py-1.5 rounded-lg text-sm text-muted hover:text-text hover:bg-card transition-all duration-200"
    >
      {children}
    </Link>
  );
}

function MobileNavLink({ href, children, onClick }: { href: string; children: React.ReactNode; onClick?: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="block px-3 py-2 rounded-lg text-sm text-muted hover:text-text hover:bg-card transition-colors"
    >
      {children}
    </Link>
  );
}

function VaultXLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polygon points="16,2 30,9 30,23 16,30 2,23 2,9" fill="none" stroke="#00D4FF" strokeWidth="1.5" />
      <circle cx="16" cy="16" r="5" fill="none" stroke="#00D4FF" strokeWidth="1.5" />
      <line x1="12" y1="12" x2="20" y2="20" stroke="#00D4FF" strokeWidth="1.5" />
      <line x1="20" y1="12" x2="12" y2="20" stroke="#00D4FF" strokeWidth="1.5" />
    </svg>
  );
}
