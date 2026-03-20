export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized", code: "unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: "Admin access required", code: "forbidden" }, { status: 403 });
    }

    const { jobId } = await params;

    const { data: batch } = await supabase
      .from("migration_batches")
      .select("*")
      .eq("id", jobId)
      .single();

    if (!batch) {
      return NextResponse.json({ error: "Batch not found", code: "not_found" }, { status: 404 });
    }

    const { data: migrationUsers } = await supabase
      .from("migration_users")
      .select("*")
      .eq("batch_id", jobId)
      .order("migrated_at", { ascending: false })
      .limit(100);

    return NextResponse.json({ batch, users: migrationUsers ?? [] });
  } catch {
    return NextResponse.json({ error: "Internal server error", code: "server_error" }, { status: 500 });
  }
}
