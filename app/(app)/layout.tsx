import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Navbar } from "@/components/layout/navbar";
import type { Profile, Subscription } from "@/lib/supabase/types";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: profile }, { data: subscriptions }, { data: teams }, { data: memberships }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("subscriptions").select("*").eq("user_id", user.id).in("status", ["active", "trialing"]).order("created_at", { ascending: false }).limit(1),
    supabase.from("teams").select("id").eq("coach_id", user.id).limit(1),
    supabase.from("team_memberships").select("id").eq("player_id", user.id).eq("status", "active").limit(1),
  ]);

  const subscription = subscriptions?.[0];
  const planName = subscription?.plan ?? "free";
  const isPaidPlan = planName === "pro" || planName === "enterprise";

  // Show Playbook for any paid user (even before they create a team)
  const hasCoachAccess = true;
  const hasPlayerAccess = memberships && memberships.length > 0;

  return (
    <div className="min-h-screen noise-bg flex flex-col">
      <Navbar
        profile={profile as Profile | null}
        subscription={subscription as Subscription | null}
        hasCoachAccess={!!hasCoachAccess}
        hasPlayerAccess={!!hasPlayerAccess}
      />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8">
        {children}
      </main>
    </div>
  );
}
