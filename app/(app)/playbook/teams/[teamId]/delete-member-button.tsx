"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, UserMinus } from "lucide-react";

export function DeleteMemberButton({ teamId, memberId }: { teamId: string; memberId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleRemove() {
    if (!confirm("Remove this player from the team?")) return;
    setLoading(true);
    try {
      await fetch(`/api/playbook/teams/${teamId}/members/${memberId}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleRemove} disabled={loading} className="text-danger hover:text-danger">
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserMinus className="w-3.5 h-3.5" />}
    </Button>
  );
}
