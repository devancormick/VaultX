export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/server";

const ALLOWED_TYPES = ["model/gltf-binary", "model/gltf+json", "image/png", "image/jpeg", "application/octet-stream"];
const EXTENSION_MAP: Record<string, string> = {
  "model/gltf-binary": "glb",
  "model/gltf+json": "gltf",
  "image/png": "png",
  "image/jpeg": "jpg",
  "application/octet-stream": "glb",
};

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized", code: "unauthorized" }, { status: 401 });
    }

    // Check Pro or Enterprise subscription
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("status, plan")
      .eq("user_id", user.id)
      .eq("status", "active")
      .in("plan", ["pro", "enterprise"])
      .single();

    if (!subscription) {
      return NextResponse.json(
        { error: "Pro or Enterprise plan required for uploads", code: "plan_upgrade_required" },
        { status: 403 }
      );
    }

    // Get plan limits
    const { data: planLimits } = await supabase
      .from("plan_limits")
      .select("max_assets, max_asset_size_mb")
      .eq("plan", subscription.plan)
      .single();

    // Check asset count
    const { count } = await supabase
      .from("assets")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);

    if (count !== null && planLimits && count >= planLimits.max_assets) {
      return NextResponse.json(
        { error: `Asset limit reached (${planLimits.max_assets} max for ${subscription.plan} plan)`, code: "asset_limit_reached" },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided", code: "missing_file" }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "File type not allowed. Supported: GLB, GLTF, PNG, JPEG", code: "invalid_file_type" },
        { status: 400 }
      );
    }

    // Validate file size
    const maxSizeBytes = (planLimits?.max_asset_size_mb ?? 25) * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return NextResponse.json(
        { error: `File too large. Max ${planLimits?.max_asset_size_mb ?? 25}MB for your plan`, code: "file_too_large" },
        { status: 400 }
      );
    }

    const ext = EXTENSION_MAP[file.type] ?? "bin";
    const storagePath = `${user.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

    const serviceClient = createServiceRoleClient();
    const { error: uploadError } = await serviceClient.storage
      .from("assets")
      .upload(storagePath, await file.arrayBuffer(), {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json({ error: "Upload failed", code: "upload_error" }, { status: 500 });
    }

    const { data: asset, error: dbError } = await supabase
      .from("assets")
      .insert({
        user_id: user.id,
        storage_path: storagePath,
        file_name: file.name,
        file_size: file.size,
        file_type: ext,
      })
      .select()
      .single();

    if (dbError) {
      return NextResponse.json({ error: "Failed to record asset", code: "db_error" }, { status: 500 });
    }

    return NextResponse.json({ asset }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error", code: "server_error" }, { status: 500 });
  }
}
