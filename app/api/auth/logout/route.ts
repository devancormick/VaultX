export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      await supabase.from("audit_log").insert({
        user_id: user.id,
        event_type: "auth.logout",
        event_data: {},
        status: "success",
      });
    }

    await supabase.auth.signOut();
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to sign out", code: "logout_error" }, { status: 500 });
  }
}
