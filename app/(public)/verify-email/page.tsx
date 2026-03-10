"use client";

import Link from "next/link";
import { useState } from "react";
import { Mail, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";

export default function VerifyEmailPage() {
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleResend() {
    setError(null);
    setResending(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        setError("No email found. Please sign up again.");
        return;
      }
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email: user.email,
      });
      if (resendError) {
        setError("Failed to resend. Please try again in a few minutes.");
        return;
      }
      setResent(true);
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="min-h-screen noise-bg flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block font-display font-extrabold text-2xl text-text">
            Vault<span className="text-accent">X</span>
          </Link>
        </div>
        <Card className="text-center p-10">
          <div className="w-16 h-16 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-5">
            <Mail className="w-7 h-7 text-accent" />
          </div>
          <h1 className="font-display font-extrabold text-xl text-text mb-2">Verify your email</h1>
          <p className="text-muted text-sm mb-6 leading-relaxed">
            We sent a verification link to your email address. Click the link to activate your account and get started.
          </p>

          {resent && (
            <div className="bg-success/10 border border-success/20 rounded-lg p-3 mb-4">
              <p className="text-success text-sm">Verification email resent!</p>
            </div>
          )}

          {error && (
            <div className="bg-danger/10 border border-danger/20 rounded-lg p-3 mb-4">
              <p className="text-danger text-sm">{error}</p>
            </div>
          )}

          <Button
            variant="secondary"
            className="w-full mb-3"
            onClick={handleResend}
            loading={resending}
            disabled={resent}
          >
            <RefreshCw className="w-4 h-4" />
            {resent ? "Email sent!" : "Resend verification email"}
          </Button>

          <Link href="/login" className="text-sm text-muted hover:text-accent transition-colors">
            Back to sign in
          </Link>
        </Card>
      </div>
    </div>
  );
}
