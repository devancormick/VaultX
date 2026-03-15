import { redirect } from "next/navigation";
import Link from "next/link";
import { Lock, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { VaultXViewer } from "@/components/viewer/vaultx-viewer";
import type { Profile, Subscription } from "@/lib/supabase/types";

export default async function ViewerPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: subscription }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active")
      .single(),
  ]);

  const hasAccess = !!subscription;

  if (!hasAccess) {
    return <SubscriptionWall />;
  }

  return (
    <div className="-mt-8 -mx-4 sm:-mx-6 h-[calc(100vh-56px)] relative">
      <VaultXViewer
        profile={profile as Profile}
        subscription={subscription as Subscription}
      />
    </div>
  );
}

function SubscriptionWall() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 rounded-full bg-violet/10 border border-violet/20 flex items-center justify-center mx-auto mb-5">
          <Lock className="w-7 h-7 text-violet" />
        </div>
        <h2 className="font-display font-extrabold text-xl text-text mb-2">
          Active subscription required
        </h2>
        <p className="text-muted text-sm mb-6">
          The 3D viewer requires an active subscription. Upgrade to access the full viewer experience.
        </p>
        <Link href="/onboarding">
          <Button>
            View plans <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
