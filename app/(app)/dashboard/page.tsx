import { redirect } from "next/navigation";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Eye, FolderOpen, Upload, Clock, Activity, Database } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, formatRelativeTime, maskIpAddress } from "@/lib/utils";
import type { AuditLog, Subscription } from "@/lib/supabase/types";
import { DashboardTour } from "./tour";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [
    { data: profile },
    { data: subscription },
    { data: auditLogs },
    { count: assetCount },
    { count: sessionCount },
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("subscriptions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).single(),
    supabase.from("audit_log").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10),
    supabase.from("assets").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("viewer_sessions").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("revoked", false).gt("expires_at", new Date().toISOString()),
  ]);

  const sub = subscription as Subscription | null;
  const plan = sub?.plan ?? "free";

  // Access events this month
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
  const { count: monthlyAccess } = await supabase
    .from("audit_log")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("created_at", startOfMonth);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display font-extrabold text-2xl md:text-3xl text-text">Dashboard</h1>
        <p className="text-muted mt-1">Welcome back, {profile?.full_name?.split(" ")[0] ?? "there"}</p>
      </div>

      {/* Subscription card */}
      <Card className={`subscription-card ${plan !== "free" ? "border-accent/30" : ""}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Subscription</CardTitle>
            <Badge variant={sub?.status === "active" ? "active" : sub?.status === "past_due" ? "past_due" : "free"}>
              {sub?.status ?? "free"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant={plan as Parameters<typeof Badge>[0]["variant"]}>{plan}</Badge>
              </div>
              {sub?.current_period_end && (
                <p className="text-sm text-muted">
                  Renews {formatDate(sub.current_period_end)}
                  {sub.cancel_at_period_end && <span className="text-warning ml-2">(cancels at period end)</span>}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              {plan === "free" ? (
                <Link href="/onboarding">
                  <Button size="sm">Upgrade plan</Button>
                </Link>
              ) : (
                <ManageBillingButton />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={Database} label="Assets stored" value={String(assetCount ?? 0)} />
        <StatCard icon={Activity} label="Access events this month" value={String(monthlyAccess ?? 0)} />
        <StatCard icon={Eye} label="Active sessions" value={String(sessionCount ?? 0)} />
      </div>

      {/* Quick actions */}
      <div className="quick-actions">
        <h2 className="font-display font-extrabold text-lg text-text mb-4">Quick actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/viewer">
            <Button variant="secondary" size="sm">
              <Eye className="w-4 h-4" /> Open Viewer
            </Button>
          </Link>
          <Link href="/assets">
            <Button variant="secondary" size="sm">
              <FolderOpen className="w-4 h-4" /> Browse Assets
            </Button>
          </Link>
          {plan !== "free" && (
            <Link href="/assets">
              <Button variant="secondary" size="sm">
                <Upload className="w-4 h-4" /> Upload Asset
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Activity feed */}
      <div>
        <h2 className="font-display font-extrabold text-lg text-text mb-4">Recent activity</h2>
        <Card>
          {!auditLogs || auditLogs.length === 0 ? (
            <div className="text-center py-10 text-muted">
              <Clock className="w-8 h-8 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No activity yet</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {(auditLogs as AuditLog[]).map((log) => (
                <ActivityRow key={log.id} log={log} />
              ))}
            </div>
          )}
        </Card>
      </div>

      <DashboardTour />
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <Card>
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-accent/10">
          <Icon className="w-5 h-5 text-accent" />
        </div>
        <div>
          <p className="text-2xl font-display font-extrabold text-text">{value}</p>
          <p className="text-xs text-muted">{label}</p>
        </div>
      </div>
    </Card>
  );
}

function ActivityRow({ log }: { log: AuditLog }) {
  const eventLabels: Record<string, string> = {
    "viewer.load": "Viewer loaded",
    "asset.signed_url": "Asset accessed",
    "auth.login": "Signed in",
    "auth.logout": "Signed out",
    "subscription.changed": "Subscription updated",
    "migration.batch": "Migration batch",
  };


  return (
    <div className="flex items-center gap-3 py-3 px-1">
      <div className="w-2 h-2 rounded-full bg-accent flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-text">{eventLabels[log.event_type] ?? log.event_type}</p>
        <div className="flex items-center gap-2 text-xs text-muted mt-0.5">
          <span>{formatRelativeTime(log.created_at)}</span>
          {log.ip_address && <span>· {maskIpAddress(log.ip_address)}</span>}
        </div>
      </div>
      <Badge variant={log.status === "success" ? "active" : log.status === "error" ? "canceled" : "past_due"}>
        {log.status ?? "unknown"}
      </Badge>
    </div>
  );
}

function ManageBillingButton() {
  "use client";
  return (
    <form action="/api/stripe/create-portal" method="POST">
      <Button type="submit" variant="secondary" size="sm">
        Manage billing
      </Button>
    </form>
  );
}
