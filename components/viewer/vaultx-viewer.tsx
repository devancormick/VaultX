"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import type { Profile, Subscription } from "@/lib/supabase/types";

const VaultScene = dynamic(() => import("./vault-scene"), {
  ssr: false,
  loading: () => <ViewerSkeleton />,
});

interface VaultXViewerProps {
  profile: Profile;
  subscription: Subscription;
}

export function VaultXViewer({ profile, subscription }: VaultXViewerProps) {
  return (
    <div className="relative w-full h-full bg-bg">
      <Suspense fallback={<ViewerSkeleton />}>
        <VaultScene />
      </Suspense>

      {/* Session indicator */}
      <div className="absolute top-4 right-4 flex items-center gap-2 bg-card/80 backdrop-blur-card border border-border rounded-lg px-3 py-2">
        <Avatar src={profile.avatar_url} name={profile.full_name} email={profile.email} size="sm" />
        <div className="hidden sm:block">
          <p className="text-xs text-muted max-w-[120px] truncate">{profile.email}</p>
        </div>
        <Badge variant={subscription.plan as Parameters<typeof Badge>[0]["variant"]}>
          {subscription.plan}
        </Badge>
      </div>
    </div>
  );
}

function ViewerSkeleton() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-bg">
      <div className="text-center space-y-4">
        <div className="w-20 h-20 mx-auto relative">
          <div className="w-full h-full rounded-full border-2 border-accent/30 animate-spin-slow" />
          <div className="absolute inset-2 rounded-full border border-accent/20 animate-pulse-glow" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-2 w-40 mx-auto" />
          <Skeleton className="h-2 w-24 mx-auto" />
        </div>
        <p className="text-xs text-muted">Loading viewer...</p>
      </div>
    </div>
  );
}
