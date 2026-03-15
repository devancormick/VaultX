import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AssetGrid } from "@/components/assets/asset-grid";
import { AssetUploader } from "@/components/assets/asset-uploader";
import type { Asset } from "@/lib/supabase/types";

export default async function AssetsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: assets }, { data: subscription }] = await Promise.all([
    supabase.from("assets").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("subscriptions").select("plan, status").eq("user_id", user.id).eq("status", "active").single(),
  ]);

  const plan = subscription?.plan ?? "free";
  const canUpload = plan === "pro" || plan === "enterprise";

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display font-extrabold text-2xl md:text-3xl text-text">Assets</h1>
          <p className="text-muted mt-1">{assets?.length ?? 0} file{(assets?.length ?? 0) !== 1 ? "s" : ""} in your library</p>
        </div>
        {canUpload && <AssetUploader />}
      </div>

      <AssetGrid assets={(assets ?? []) as Asset[]} canUpload={canUpload} />
    </div>
  );
}
