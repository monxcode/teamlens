"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Settings } from "lucide-react";

interface Setting { id: string; key: string; value: string; category: string; }

export default function AdminSettingsPage() {
  const [grouped, setGrouped] = useState<Record<string, Setting[]>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/settings", { headers: { Authorization: `Bearer ${localStorage.getItem("pulse_token")}` } })
      .then((r) => r.json())
      .then((d) => { setGrouped(d.grouped || {}); setLoading(false); });
  }, []);

  async function updateSetting(id: string, value: string) {
    setSaving(id);
    await fetch(`/api/admin/settings/${id}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${localStorage.getItem("pulse_token")}`, "Content-Type": "application/json" },
      body: JSON.stringify({ value }),
    });
    setSaving(null);
  }

  const categoryLabels: Record<string, string> = {
    general: "General", auth: "Authentication", security: "Security",
    email: "Email", storage: "Storage",
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">System Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Configure application settings</p>
      </div>

      {loading ? (
        <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-48 rounded-xl bg-muted animate-pulse" />)}</div>
      ) : (
        Object.entries(grouped).map(([category, settings]) => (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Settings className="h-4 w-4" /> {categoryLabels[category] || category}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {settings.map((s) => (
                <div key={s.id} className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="text-sm font-medium">{s.key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}</label>
                  </div>
                  <Input value={s.value} onChange={(e) => {
                    const newGrouped = { ...grouped };
                    newGrouped[category] = newGrouped[category].map((st) => st.id === s.id ? { ...st, value: e.target.value } : st);
                    setGrouped(newGrouped);
                  }} className="max-w-xs" />
                  <Button size="sm" variant="outline" disabled={saving === s.id} onClick={() => updateSetting(s.id, s.value)}>
                    {saving === s.id ? "Saving..." : "Save"}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
