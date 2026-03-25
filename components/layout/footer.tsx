import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border bg-surface py-10 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h4 className="font-display font-extrabold text-sm text-text mb-3">Product</h4>
            <ul className="space-y-2 text-sm text-muted">
              <li><Link href="/pricing" className="hover:text-accent transition-colors">Pricing</Link></li>
              <li><Link href="/viewer" className="hover:text-accent transition-colors">Viewer</Link></li>
              <li><Link href="/assets" className="hover:text-accent transition-colors">Assets</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display font-extrabold text-sm text-text mb-3">Account</h4>
            <ul className="space-y-2 text-sm text-muted">
              <li><Link href="/signup" className="hover:text-accent transition-colors">Sign up</Link></li>
              <li><Link href="/login" className="hover:text-accent transition-colors">Sign in</Link></li>
              <li><Link href="/dashboard" className="hover:text-accent transition-colors">Dashboard</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display font-extrabold text-sm text-text mb-3">Legal</h4>
            <ul className="space-y-2 text-sm text-muted">
              <li><Link href="/privacy" className="hover:text-accent transition-colors">Privacy</Link></li>
              <li><Link href="/terms" className="hover:text-accent transition-colors">Terms</Link></li>
              <li><Link href="/security" className="hover:text-accent transition-colors">Security</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display font-extrabold text-sm text-text mb-3">Company</h4>
            <ul className="space-y-2 text-sm text-muted">
              <li><a href="mailto:hello@vaultx.app" className="hover:text-accent transition-colors">Contact</a></li>
              <li><a href="https://status.vaultx.app" className="hover:text-accent transition-colors">Status</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-display font-extrabold text-sm">
            Vault<span className="text-accent">X</span>
          </span>
          <p className="text-xs text-muted">
            &copy; {new Date().getFullYear()} VaultX. Secure access. Protected assets. Zero compromise.
          </p>
        </div>
      </div>
    </footer>
  );
}
