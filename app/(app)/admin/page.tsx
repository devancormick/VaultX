import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminDashboard } from "@/components/migration/migration-dashboard";

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) redirect("/dashboard");

  const [{ data: users }, { data: batches }] = await Promise.all([
    supabase.from("profiles").select("id, email, full_name, is_admin, created_at").order("created_at", { ascending: false }).limit(50),
    supabase.from("migration_batches").select("*").order("created_at", { ascending: false }).limit(10),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display font-extrabold text-2xl md:text-3xl text-text">Admin Panel</h1>
        <p className="text-muted mt-1">Manage users, migrations, and system health</p>
      </div>
      <AdminDashboard users={users ?? []} batches={batches ?? []} />
    </div>
  );
}
