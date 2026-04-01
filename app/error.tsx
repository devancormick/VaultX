"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen noise-bg flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-full bg-danger/10 border border-danger/20 flex items-center justify-center mx-auto mb-5">
          <AlertTriangle className="w-7 h-7 text-danger" />
        </div>
        <h1 className="font-display font-extrabold text-2xl text-text mb-2">Something went wrong</h1>
        <p className="text-muted text-sm mb-6">
          An unexpected error occurred. This has been logged automatically.
        </p>
        <div className="flex gap-3 justify-center">
          <Button onClick={reset} variant="secondary">Try again</Button>
          <Link href="/dashboard"><Button>Go to dashboard</Button></Link>
        </div>
      </div>
    </div>
  );
}
