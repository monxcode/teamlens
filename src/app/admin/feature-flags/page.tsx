"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";
import { Flag, Plus, Trash2 } from "lucide-react";

interface FeatureFlag { id: string; name: string; description: string | null; enabled: boolean; createdAt: string; }

export default function AdminFeatureFlagsPage() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newFlag, setNewFlag] = useState({ name: "", description: "" });
  const [creating, setCreating] = useState(false);

  useEffect(() => { fetchFlags(); }, []);

  async function fetchFlags() {
    const res = await fetch("/api/admin/feature-flags", { headers: { Authorization: `Bearer ${sessionStorage.getItem("pulse_token")}` } });
    const data = await res.json();
    setFlags(data.flags || []);
    setLoading(false);
  }

  async function toggleFlag(id: string, enabled: boolean) {
    await fetch(`/api/admin/feature-flags/${id}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${sessionStorage.getItem("pulse_token")}`, "Content-Type": "application/json" },
      body: JSON.stringify({ enabled }),
    });
    fetchFlags();
  }

  async function createFlag(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    const res = await fetch("/api/admin/feature-flags", {
      method: "POST",
      headers: { Authorization: `Bearer ${sessionStorage.getItem("pulse_token")}`, "Content-Type": "application/json" },
      body: JSON.stringify(newFlag),
    });
    if (res.ok) { setShowCreate(false); setNewFlag({ name: "", description: "" }); fetchFlags(); }
    setCreating(false);
  }

  async function deleteFlag(id: string) {
    if (!confirm("Delete this feature flag?")) return;
    await fetch(`/api/admin/feature-flags/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${sessionStorage.getItem("pulse_token")}` } });
    fetchFlags();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Feature Flags</h1>
          <p className="mt-1 text-sm text-muted-foreground">{flags.length} flags</p>
        </div>
        <Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4" /> New Flag</Button>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />)}</div>
      ) : flags.length === 0 ? (
        <EmptyState icon={<Flag className="h-8 w-8" />} title="No feature flags" description="Create feature flags to toggle functionality." />
      ) : (
        <div className="space-y-2">
          {flags.map((flag) => (
            <Card key={flag.id} className="p-4">
              <div className="flex items-center gap-4">
                <button onClick={() => toggleFlag(flag.id, !flag.enabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${flag.enabled ? "bg-primary" : "bg-muted"}`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${flag.enabled ? "translate-x-6" : "translate-x-1"}`} />
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold">{flag.name}</h3>
                    <Badge variant={flag.enabled ? "success" : "secondary"}>{flag.enabled ? "Enabled" : "Disabled"}</Badge>
                  </div>
                  {flag.description && <p className="text-xs text-muted-foreground mt-0.5">{flag.description}</p>}
                </div>
                <button onClick={() => deleteFlag(flag.id)} className="text-destructive hover:bg-destructive/10 rounded-lg p-1.5">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create Feature Flag">
        <form onSubmit={createFlag} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Name</label>
            <Input placeholder="e.g. new_dashboard" value={newFlag.name} onChange={(e) => setNewFlag({ ...newFlag, name: e.target.value })} required />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Input placeholder="What does this flag control?" value={newFlag.description} onChange={(e) => setNewFlag({ ...newFlag, description: e.target.value })} />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setShowCreate(false)} className="flex-1">Cancel</Button>
            <Button type="submit" className="flex-1" disabled={creating}>
              {creating ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : "Create"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
