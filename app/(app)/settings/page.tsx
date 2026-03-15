"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { User, Shield, CreditCard, Bell, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { createClient } from "@/lib/supabase/client";

type Tab = "profile" | "security" | "billing" | "notifications" | "danger";

const TABS: { key: Tab; label: string; icon: LucideIcon }[] = [
  { key: "profile", label: "Profile", icon: User },
  { key: "security", label: "Security", icon: Shield },
  { key: "billing", label: "Billing", icon: CreditCard },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "danger", label: "Danger Zone", icon: AlertTriangle },
];

function SettingsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>((searchParams.get("tab") as Tab) ?? "profile");

  function switchTab(tab: Tab) {
    setActiveTab(tab);
    router.replace(`/settings?tab=${tab}`, { scroll: false });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-extrabold text-2xl md:text-3xl text-text">Settings</h1>
        <p className="text-muted mt-1">Manage your account preferences</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar nav */}
        <nav className="md:w-48 flex md:flex-col gap-1 overflow-x-auto md:overflow-visible">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => switchTab(t.key)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors whitespace-nowrap ${
                activeTab === t.key
                  ? "bg-card border border-border text-text"
                  : "text-muted hover:text-text hover:bg-card/50"
              } ${t.key === "danger" ? "text-danger hover:text-danger" : ""}`}
            >
              <t.icon className="w-4 h-4 flex-shrink-0" />
              {t.label}
            </button>
          ))}
        </nav>

        {/* Tab content */}
        <div className="flex-1">
          {activeTab === "profile" && <ProfileTab />}
          {activeTab === "security" && <SecurityTab />}
          {activeTab === "billing" && <BillingTab />}
          {activeTab === "notifications" && <NotificationsTab />}
          {activeTab === "danger" && <DangerZoneTab />}
        </div>
      </div>
    </div>
  );
}

function ProfileTab() {
  const { toast } = useToast();
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      setFullName(data.user?.user_metadata?.full_name ?? "");
    });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from("profiles").update({ full_name: fullName }).eq("id", user.id);
      toast({ title: "Profile updated", variant: "success" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <h2 className="font-display font-extrabold text-lg text-text mb-5">Profile</h2>
      <form onSubmit={handleSave} className="space-y-4 max-w-sm">
        <Input
          id="fullName"
          label="Full name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
        <Button type="submit" loading={loading}>Save changes</Button>
      </form>
    </Card>
  );
}

function SecurityTab() {
  const { toast } = useToast();
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPw.length < 8) {
      toast({ title: "Password too short", description: "Minimum 8 characters", variant: "error" });
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: newPw });
      if (error) {
        toast({ title: "Error", description: error.message, variant: "error" });
        return;
      }
      toast({ title: "Password updated", variant: "success" });
      setCurrentPw("");
      setNewPw("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <h2 className="font-display font-extrabold text-lg text-text mb-5">Security</h2>
      <form onSubmit={handleChangePassword} className="space-y-4 max-w-sm">
        <Input
          id="currentPw"
          label="Current password"
          type="password"
          value={currentPw}
          onChange={(e) => setCurrentPw(e.target.value)}
          autoComplete="current-password"
        />
        <Input
          id="newPw"
          label="New password"
          type="password"
          value={newPw}
          onChange={(e) => setNewPw(e.target.value)}
          hint="Minimum 8 characters"
          autoComplete="new-password"
        />
        <Button type="submit" loading={loading}>Update password</Button>
      </form>
    </Card>
  );
}

function BillingTab() {
  const [loading, setLoading] = useState(false);

  async function openPortal() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/create-portal", { method: "POST" });
      const data = await res.json() as { url?: string };
      if (data.url) window.location.href = data.url;
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <h2 className="font-display font-extrabold text-lg text-text mb-2">Billing</h2>
      <p className="text-muted text-sm mb-5">
        Manage your subscription, payment methods, and billing history via the Stripe Customer Portal.
      </p>
      <Button onClick={openPortal} loading={loading} variant="secondary">
        Open billing portal
      </Button>
    </Card>
  );
}

function NotificationsTab() {
  const { toast } = useToast();
  const [prefs, setPrefs] = useState({ billing: true, access: true, product: false });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    createClient().auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const supabase = createClient();
      const { data: profile } = await supabase.from("profiles").select("notification_prefs").eq("id", data.user.id).single();
      if (profile?.notification_prefs) setPrefs(profile.notification_prefs as typeof prefs);
    });
  }, []);

  async function handleSave() {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from("profiles").update({ notification_prefs: prefs }).eq("id", user.id);
      toast({ title: "Preferences saved", variant: "success" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <h2 className="font-display font-extrabold text-lg text-text mb-5">Notifications</h2>
      <div className="space-y-4 max-w-sm">
        {(Object.entries(prefs) as [keyof typeof prefs, boolean][]).map(([key, val]) => (
          <label key={key} className="flex items-center justify-between cursor-pointer">
            <span className="text-sm text-text capitalize">{key} emails</span>
            <button
              type="button"
              role="switch"
              aria-checked={val}
              onClick={() => setPrefs((p) => ({ ...p, [key]: !p[key] }))}
              className={`relative w-10 h-6 rounded-full transition-colors ${val ? "bg-accent" : "bg-border"}`}
            >
              <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${val ? "translate-x-5" : "translate-x-1"}`} />
            </button>
          </label>
        ))}
        <Button loading={loading} onClick={handleSave}>Save preferences</Button>
      </div>
    </Card>
  );
}

function DangerZoneTab() {
  const router = useRouter();
  const { toast } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (confirmText !== "DELETE") return;
    setLoading(true);
    try {
      const res = await fetch("/api/auth/delete-account", { method: "POST" });
      if (res.ok) {
        toast({ title: "Account deleted", description: "Your data will be removed within 30 days.", variant: "info" });
        router.push("/");
      } else {
        toast({ title: "Error", description: "Failed to delete account. Contact support.", variant: "error" });
      }
    } finally {
      setLoading(false);
      setConfirmOpen(false);
    }
  }

  return (
    <Card className="border-danger/30">
      <h2 className="font-display font-extrabold text-lg text-danger mb-2">Danger Zone</h2>
      <p className="text-muted text-sm mb-5">
        Permanently delete your account, assets, and all associated data. This cannot be undone.
        Your data is preserved for 30 days before permanent deletion.
      </p>
      <Button variant="danger" onClick={() => setConfirmOpen(true)}>
        Delete account
      </Button>

      <Modal
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete account"
        description="This action cannot be undone. Type DELETE to confirm."
      >
        <div className="space-y-4">
          <Input
            id="confirmDelete"
            label='Type "DELETE" to confirm'
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="DELETE"
          />
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={() => setConfirmOpen(false)}>Cancel</Button>
            <Button
              variant="danger"
              disabled={confirmText !== "DELETE"}
              loading={loading}
              onClick={handleDelete}
            >
              Delete permanently
            </Button>
          </div>
        </div>
      </Modal>
    </Card>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={null}>
      <SettingsContent />
    </Suspense>
  );
}
