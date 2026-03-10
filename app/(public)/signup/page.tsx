"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { signUpSchema } from "@/lib/validation/schemas";
import { stripe } from "@/lib/stripe/client";

export default function SignUpPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const result = signUpSchema.safeParse({ email, password, fullName });
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (authError) {
        if (authError.message.includes("already registered")) {
          setError("An account with this email already exists. Sign in instead.");
        } else {
          setError(authError.message);
        }
        return;
      }

      if (data.user) {
        // Create Stripe customer
        await fetch("/api/stripe/create-customer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, name: fullName }),
        }).catch(() => {});
      }

      setSuccess(true);
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen noise-bg flex items-center justify-center px-4">
        <Card className="max-w-md w-full text-center p-10">
          <div className="w-14 h-14 rounded-full bg-success/10 border border-success/20 flex items-center justify-center mx-auto mb-5">
            <span className="text-2xl">✉️</span>
          </div>
          <h2 className="font-display font-extrabold text-xl text-text mb-2">Check your email</h2>
          <p className="text-muted text-sm mb-6">
            We sent a verification link to <strong className="text-text">{email}</strong>.
            Click the link to activate your account.
          </p>
          <Link href="/login">
            <Button variant="secondary" className="w-full">Back to sign in</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen noise-bg flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block font-display font-extrabold text-2xl text-text mb-4">
            Vault<span className="text-accent">X</span>
          </Link>
          <h1 className="font-display font-extrabold text-2xl text-text">Create your account</h1>
          <p className="text-muted text-sm mt-1">Start free — no card required</p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              id="fullName"
              label="Full name"
              type="text"
              placeholder="Alex Johnson"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              autoComplete="name"
              required
            />
            <Input
              id="email"
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-sm font-medium text-text">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-10 px-3 pr-10 rounded-lg bg-card border border-border text-text placeholder:text-muted text-sm focus:border-accent outline-none transition-all"
                  placeholder="Min 8 characters"
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-text transition-colors"
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-danger bg-danger/10 border border-danger/20 rounded-lg px-3 py-2" role="alert">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" loading={loading}>
              Create account
            </Button>
          </form>
          <p className="text-xs text-muted text-center mt-4">
            By creating an account you agree to our{" "}
            <Link href="/terms" className="text-accent hover:underline">Terms</Link> and{" "}
            <Link href="/privacy" className="text-accent hover:underline">Privacy Policy</Link>.
          </p>
        </Card>

        <p className="text-center text-sm text-muted mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-accent hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
