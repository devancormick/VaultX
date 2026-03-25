"use client";

import { useState, useRef } from "react";
import { Upload, Play, RefreshCw, Download } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { formatDate, formatRelativeTime } from "@/lib/utils";

interface AdminUser {
  id: string;
  email: string;
  full_name: string | null;
  is_admin: boolean;
  created_at: string;
}

interface MigrationBatch {
  id: string;
  total_users: number | null;
  succeeded: number;
  failed: number;
  status: string;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

interface AdminDashboardProps {
  users: AdminUser[];
  batches: MigrationBatch[];
}

export function AdminDashboard({ users, batches }: AdminDashboardProps) {
  return (
    <div className="space-y-8">
      {/* Users table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-4 text-muted font-medium">Email</th>
                  <th className="text-left py-2 pr-4 text-muted font-medium">Name</th>
                  <th className="text-left py-2 pr-4 text-muted font-medium">Role</th>
                  <th className="text-left py-2 text-muted font-medium">Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-border/50 hover:bg-surface/50">
                    <td className="py-2.5 pr-4 text-text font-mono text-xs">{u.email}</td>
                    <td className="py-2.5 pr-4 text-muted">{u.full_name ?? "—"}</td>
                    <td className="py-2.5 pr-4">
                      <Badge variant={u.is_admin ? "enterprise" : "free"}>{u.is_admin ? "admin" : "user"}</Badge>
                    </td>
                    <td className="py-2.5 text-muted text-xs">{formatDate(u.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Migration section */}
      <MigrationSection batches={batches} />
    </div>
  );
}

function MigrationSection({ batches }: { batches: MigrationBatch[] }) {
  const { toast } = useToast();
  const [csvData, setCsvData] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const [currentBatchId, setCurrentBatchId] = useState<string | null>(null);
  const [pollData, setPollData] = useState<{ batch: MigrationBatch; users: unknown[] } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function handleCsvFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const errors = validateCsv(text);
      setValidationErrors(errors);
      setCsvData(errors.length === 0 ? text : null);
    };
    reader.readAsText(file);
  }

  function validateCsv(text: string): string[] {
    const lines = text.trim().split("\n");
    if (lines.length < 2) return ["CSV must have a header row and at least one data row"];
    const header = lines[0].toLowerCase();
    const required = ["memberstackid", "email", "stripecustomerid", "plan"];
    const missing = required.filter((c) => !header.includes(c));
    if (missing.length > 0) return [`Missing columns: ${missing.join(", ")}`];
    return [];
  }

  async function startMigration() {
    if (!csvData) return;
    setRunning(true);
    try {
      const lines = csvData.trim().split("\n");
      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
      const users = lines.slice(1).map((line) => {
        const vals = line.split(",").map((v) => v.trim());
        return headers.reduce((obj, key, i) => ({ ...obj, [key === "memberstackid" ? "memberstackId" : key === "stripecustomerid" ? "stripeCustomerId" : key]: vals[i] }), {});
      });

      const res = await fetch("/api/migrate/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ users }),
      });
      const data = await res.json() as { batchId?: string };
      if (!data.batchId) throw new Error("No batch ID returned");

      setCurrentBatchId(data.batchId);
      toast({ title: "Migration started", description: `Processing ${users.length} users`, variant: "info" });

      pollRef.current = setInterval(async () => {
        const pollRes = await fetch(`/api/migrate/status/${data.batchId}`);
        const pollJson = await pollRes.json() as { batch: MigrationBatch; users: unknown[] };
        setPollData(pollJson);
        if (pollJson.batch.status === "complete" || pollJson.batch.status === "failed") {
          if (pollRef.current) clearInterval(pollRef.current);
          setRunning(false);
          toast({
            title: pollJson.batch.status === "complete" ? "Migration complete" : "Migration failed",
            description: `${pollJson.batch.succeeded} succeeded, ${pollJson.batch.failed} failed`,
            variant: pollJson.batch.status === "complete" ? "success" : "error",
          });
        }
      }, 2000);
    } catch (err) {
      toast({ title: "Migration failed to start", description: err instanceof Error ? err.message : "Unknown error", variant: "error" });
      setRunning(false);
    }
  }

  const activeBatch = pollData?.batch ?? batches[0];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Memberstack Migration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* CSV upload */}
        <div>
          <label className="block text-sm font-medium text-text mb-2">Upload CSV</label>
          <div className="flex gap-2 flex-wrap">
            <Button variant="secondary" size="sm" onClick={() => fileRef.current?.click()} type="button">
              <Upload className="w-4 h-4" /> Choose CSV
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleCsvFile}
            />
            {csvData && (
              <Button onClick={startMigration} loading={running} size="sm">
                <Play className="w-4 h-4" /> Start Migration
              </Button>
            )}
          </div>
          <p className="text-xs text-muted mt-2">
            Required columns: memberstackId, email, stripeCustomerId, plan
          </p>
          {validationErrors.length > 0 && (
            <div className="mt-2 text-xs text-danger space-y-1">
              {validationErrors.map((e) => <p key={e}>{e}</p>)}
            </div>
          )}
          {csvData && validationErrors.length === 0 && (
            <p className="mt-2 text-xs text-success">CSV validated — ready to migrate</p>
          )}
        </div>

        {/* Progress */}
        {(activeBatch || pollData) && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-text">
                {pollData ? "Current batch" : "Last batch"}
              </p>
              <Badge variant={activeBatch?.status === "complete" ? "active" : activeBatch?.status === "failed" ? "canceled" : "past_due"}>
                {activeBatch?.status ?? "unknown"}
              </Badge>
            </div>
            {activeBatch && (
              <div className="space-y-2 text-sm text-muted">
                <div className="h-2 bg-border rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent rounded-full transition-all"
                    style={{
                      width: `${activeBatch.total_users ? ((activeBatch.succeeded + activeBatch.failed) / activeBatch.total_users) * 100 : 0}%`
                    }}
                  />
                </div>
                <div className="flex gap-4 text-xs">
                  <span className="text-success">{activeBatch.succeeded} succeeded</span>
                  <span className="text-danger">{activeBatch.failed} failed</span>
                  <span>of {activeBatch.total_users ?? "?"} total</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Batch history */}
        {batches.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-text mb-2">Batch history</h3>
            <div className="space-y-2">
              {batches.slice(0, 5).map((b) => (
                <div key={b.id} className="flex items-center justify-between text-xs border border-border rounded-lg px-3 py-2">
                  <span className="text-muted font-mono">{b.id.slice(0, 8)}...</span>
                  <span className="text-muted">{formatRelativeTime(b.created_at)}</span>
                  <span className="text-muted">{b.succeeded}/{b.total_users ?? "?"}</span>
                  <Badge variant={b.status === "complete" ? "active" : b.status === "failed" ? "canceled" : "past_due"}>
                    {b.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
