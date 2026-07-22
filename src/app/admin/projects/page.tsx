"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { ProjectColor } from "@/components/dashboard/project-color";
import { ProgressRing } from "@/components/dashboard/progress-ring";
import { FolderKanban, Search, Archive, Trash2, RotateCcw } from "lucide-react";

interface Project {
  id: string; name: string; description: string | null; color: string; status: string;
  taskCount: number; completedCount: number;
  owner: { id: string; name: string }; workspace: { id: string; name: string };
  createdAt: string;
}

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => { fetchProjects(); }, [page, filterStatus]);

  async function fetchProjects() {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (filterStatus !== "all") params.set("status", filterStatus);
    if (search) params.set("search", search);
    const res = await fetch(`/api/admin/projects?${params}`, { headers: { Authorization: `Bearer ${localStorage.getItem("pulse_token")}` } });
    const data = await res.json();
    setProjects(data.projects || []);
    setTotalPages(data.totalPages || 1);
    setLoading(false);
  }

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/admin/projects/${id}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${localStorage.getItem("pulse_token")}`, "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchProjects();
  }

  async function deleteProject(id: string) {
    if (!confirm("Delete this project?")) return;
    await fetch(`/api/admin/projects/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${localStorage.getItem("pulse_token")}` } });
    fetchProjects();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage all projects across workspaces</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search projects..." value={search} onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchProjects()} className="pl-9" />
        </div>
        <Select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
          options={[{ value: "all", label: "All Statuses" }, { value: "active", label: "Active" }, { value: "archived", label: "Archived" }]} />
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-56 rounded-xl bg-muted animate-pulse" />)}</div>
      ) : projects.length === 0 ? (
        <EmptyState icon={<FolderKanban className="h-8 w-8" />} title="No projects found" description="Try adjusting your filters." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => {
            const progress = project.taskCount > 0 ? Math.round((project.completedCount / project.taskCount) * 100) : 0;
            return (
              <Card key={project.id} hover className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <ProjectColor color={project.color} size="lg" />
                    <div>
                      <h3 className="font-semibold">{project.name}</h3>
                      <p className="text-xs text-muted-foreground">by {project.owner.name}</p>
                    </div>
                  </div>
                  <Badge variant={project.status === "active" ? "success" : "secondary"}>{project.status}</Badge>
                </div>
                {project.description && <p className="mt-3 text-sm text-muted-foreground line-clamp-2">{project.description}</p>}
                <p className="mt-2 text-xs text-muted-foreground">Workspace: {project.workspace.name}</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{project.completedCount}/{project.taskCount} tasks</span>
                  <ProgressRing value={progress} size={36} strokeWidth={3} />
                </div>
                <div className="flex gap-2 mt-4">
                  {project.status === "active" ? (
                    <Button variant="outline" size="sm" onClick={() => updateStatus(project.id, "archived")}>
                      <Archive className="h-3.5 w-3.5" /> Archive
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => updateStatus(project.id, "active")}>
                      <RotateCcw className="h-3.5 w-3.5" /> Restore
                    </Button>
                  )}
                  <Button variant="destructive" size="sm" onClick={() => deleteProject(project.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
          <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
}
