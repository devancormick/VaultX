"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (!sessionId) {
      router.push("/dashboard");
      return;
    }
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timer);
          router.push("/dashboard");
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [sessionId, router]);

  return (
    <div className="min-h-screen noise-bg flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        {/* Progress */}
        <div className="flex items-center gap-3 mb-10 justify-center">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-success text-bg text-xs font-bold flex items-center justify-center">
              <CheckCircle className="w-4 h-4" />
            </div>
            <span className="text-sm text-muted line-through">Choose plan</span>
          </div>
          <div className="w-8 h-px bg-success/40" />
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-accent text-bg text-xs font-bold flex items-center justify-center">2</div>
            <span className="text-sm text-text font-medium">Activate</span>
          </div>
        </div>

        <div className="w-20 h-20 rounded-full bg-success/10 border border-success/20 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-success" />
        </div>

        <h1 className="font-display font-extrabold text-3xl text-text mb-3">
          Subscription activated!
        </h1>
        <p className="text-muted mb-8">
          Your plan is now active. Redirecting to your dashboard in {countdown}...
        </p>

        <div className="flex items-center justify-center gap-2 text-sm text-muted">
          <Loader2 className="w-4 h-4 animate-spin" />
          Preparing your workspace
        </div>

        <Button
          variant="secondary"
          className="mt-6"
          onClick={() => router.push("/dashboard")}
        >
          Go to dashboard now
        </Button>
      </div>
    </div>
  );
}

export default function OnboardingSuccessPage() {
  return (
    <Suspense fallback={null}>
      <SuccessContent />
    </Suspense>
  );
}
