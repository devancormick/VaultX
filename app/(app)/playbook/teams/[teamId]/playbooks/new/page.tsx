"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function NewPlaybookPage() {
  const { teamId } = useParams<{ teamId: string }>();
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/playbook/playbooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), team_id: teamId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create playbook");
      router.push(`/playbook/teams/${teamId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create playbook");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <Link href={`/playbook/teams/${teamId}`}>
          <Button variant="ghost" size="sm" className="gap-1.5 -ml-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Team
          </Button>
        </Link>
        <h1 className="font-display font-extrabold text-2xl text-text mt-2">New Playbook</h1>
        <p className="text-muted text-sm mt-1">A playbook holds a collection of plays your team will learn.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-accent" />
            Playbook Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Playbook name</Label>
              <Input
                id="name"
                placeholder="e.g. Week 1 Offensive Plays"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={loading}
                autoFocus
              />
            </div>

            {error && (
              <div className="text-sm text-danger bg-danger/10 border border-danger/20 rounded-lg p-3">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <Button type="submit" disabled={loading || !name.trim()} className="gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookOpen className="w-4 h-4" />}
                Create Playbook
              </Button>
              <Link href={`/playbook/teams/${teamId}`}>
                <Button type="button" variant="secondary">Cancel</Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
