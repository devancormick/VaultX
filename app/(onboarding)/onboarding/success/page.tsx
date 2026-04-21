"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

type PollingState = "polling" | "confirmed" | "timeout";

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [state, setState] = useState<PollingState>("polling");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!sessionId) {
      router.push("/dashboard");
      return;
    }

    const supabase = createClient();

    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("plan, status")
        .eq("user_id", user.id)
        .in("status", ["active", "trialing"])
        .limit(1)
        .single();
      if (sub) {
        clearInterval(intervalRef.current!);
        clearTimeout(timeoutRef.current!);
        setState("confirmed");
        setTimeout(() => router.push("/dashboard"), 1500);
      }
    };

    intervalRef.current = setInterval(check, 2000);
    check(); // immediate first check

    timeoutRef.current = setTimeout(() => {
      clearInterval(intervalRef.current!);
      setState("timeout");
      router.push("/dashboard");
    }, 30000);

    return () => {
      clearInterval(intervalRef.current!);
      clearTimeout(timeoutRef.current!);
    };
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
          {state === "confirmed" ? (
            <CheckCircle className="w-10 h-10 text-success" />
          ) : (
            <Loader2 className="w-10 h-10 text-success animate-spin" />
          )}
        </div>

        <h1 className="font-display font-extrabold text-3xl text-text mb-3">
          {state === "confirmed" ? "Subscription activated!" : "Activating your subscription…"}
        </h1>
        <p className="text-muted mb-8">
          {state === "confirmed"
            ? "Your plan is now active. Redirecting to your dashboard…"
            : "Please wait while we confirm your payment with Stripe."}
        </p>

        {state === "polling" && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted">
            <Loader2 className="w-4 h-4 animate-spin" />
            Preparing your workspace
          </div>
        )}

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
