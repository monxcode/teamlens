"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { formatRelativeTime } from "@/lib/utils";
import {
  Link2, Plus, Trash2, FolderKanban, CheckSquare, Users, Search,
} from "lucide-react";

interface Team {
  id: string;
  name: string;
  _count: { members: number };
}

interface Project {
  id: string;
  name: string;
  color: string;
  status: string;
}

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  project: { id: string; name: string };
}

interface Assignment {
  id: string;
  type: string;
  status: string;
  createdAt: string;
  team: {
    id: string;
    name: string;
    memberCount: number;
    members: { user: { id: string; name: string } }[];
  };
  project: { id: string; name: string; color: string } | null;
  task: { id: string; title: string; status: string } | null;
}

export default function AdminAssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignType, setAssignType] = useState<"project" | "task">("project");
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [selectedResourceId, setSelectedResourceId] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [filterType, setFilterType] = useState("all");

  useEffect(() => {
    fetchAssignments();
    fetchTeams();
    fetchProjects();
    fetchTasks();
  }, []);

  async function fetchAssignments() {
    setLoading(true);
    const res = await fetch("/api/admin/assignments", {
      headers: { Authorization: `Bearer ${localStorage.getItem("pulse_token")}` },
    });
    const data = await res.json();
    setAssignments(data.assignments || []);
    setLoading(false);
  }

  async function fetchTeams() {
    const res = await fetch("/api/admin/teams", {
      headers: { Authorization: `Bearer ${localStorage.getItem("pulse_token")}` },
    });
    const data = await res.json();
    setTeams(data.teams || []);
  }

  async function fetchProjects() {
    const res = await fetch("/api/admin/projects?limit=100", {
      headers: { Authorization: `Bearer ${localStorage.getItem("pulse_token")}` },
    });
    const data = await res.json();
    setProjects(data.projects || []);
  }

  async function fetchTasks() {
    const res = await fetch("/api/admin/tasks?limit=100", {
      headers: { Authorization: `Bearer ${localStorage.getItem("pulse_token")}` },
    });
    const data = await res.json();
    setTasks(data.tasks || []);
  }

  async function createAssignment() {
    if (!selectedTeamId || !selectedResourceId) return;
    setAssigning(true);

    const body: Record<string, string> = {
      type: assignType,
      teamId: selectedTeamId,
    };
    if (assignType === "project") body.projectId = selectedResourceId;
    if (assignType === "task") body.taskId = selectedResourceId;

    const res = await fetch("/api/admin/assignments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("pulse_token")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      setShowAssignModal(false);
      setSelectedTeamId("");
      setSelectedResourceId("");
      fetchAssignments();
    }
    setAssigning(false);
  }

  async function removeAssignment(assignmentId: string) {
    if (!confirm("Remove this assignment? Team members will lose access.")) return;

    await fetch(`/api/admin/assignments?id=${assignmentId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${localStorage.getItem("pulse_token")}` },
    });
    fetchAssignments();
  }

  const filtered = assignments.filter((a) =>
    filterType === "all" || a.type === filterType
  );

  const typeColors: Record<string, string> = {
    project: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
    task: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Team Assignments</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Assign projects and tasks to entire teams
          </p>
        </div>
        <Button onClick={() => setShowAssignModal(true)}>
          <Plus className="h-4 w-4" /> New Assignment
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Link2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{assignments.length}</p>
              <p className="text-xs text-muted-foreground">Total Assignments</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/10">
              <FolderKanban className="h-5 w-5 text-indigo-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{assignments.filter((a) => a.type === "project").length}</p>
              <p className="text-xs text-muted-foreground">Project Assignments</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
              <CheckSquare className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{assignments.filter((a) => a.type === "task").length}</p>
              <p className="text-xs text-muted-foreground">Task Assignments</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex gap-3">
        <Select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          options={[
            { value: "all", label: "All Types" },
            { value: "project", label: "Projects" },
            { value: "task", label: "Tasks" },
          ]}
        />
      </div>

      {/* Assignments List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-12">
          <EmptyState
            icon={<Link2 className="h-8 w-8" />}
            title="No assignments yet"
            description="Assign projects or tasks to teams to get started."
            action={
              <Button onClick={() => setShowAssignModal(true)}>
                <Plus className="h-4 w-4" /> Create Assignment
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((assignment) => (
            <Card key={assignment.id} className="p-4 hover:shadow-md transition-all">
              <div className="flex items-center gap-4">
                <Badge className={typeColors[assignment.type]}>
                  {assignment.type === "project" ? (
                    <FolderKanban className="h-3 w-3 mr-1" />
                  ) : (
                    <CheckSquare className="h-3 w-3 mr-1" />
                  )}
                  {assignment.type}
                </Badge>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold">
                      {assignment.type === "project"
                        ? assignment.project?.name
                        : assignment.task?.title}
                    </h3>
                    <Badge variant="success">{assignment.status}</Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      Team: {assignment.team.name}
                    </span>
                    <span>{assignment.team.memberCount} members</span>
                    <span>{formatRelativeTime(assignment.createdAt)}</span>
                  </div>
                </div>

                {/* Team Members Avatars */}
                <div className="hidden sm:flex items-center -space-x-2">
                  {assignment.team.members.slice(0, 4).map((m, i) => (
                    <Avatar
                      key={m.user.id}
                      name={m.user.name}
                      size="sm"
                      className="ring-2 ring-background"
                    />
                  ))}
                  {assignment.team.members.length > 4 && (
                    <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium text-muted-foreground ring-2 ring-background">
                      +{assignment.team.members.length - 4}
                    </div>
                  )}
                </div>

                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => removeAssignment(assignment.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Assign Modal */}
      <Modal
        open={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        title="New Team Assignment"
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Assignment Type</label>
            <Select
              value={assignType}
              onChange={(e) => {
                setAssignType(e.target.value as "project" | "task");
                setSelectedResourceId("");
              }}
              options={[
                { value: "project", label: "Project" },
                { value: "task", label: "Task" },
              ]}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Select Team</label>
            <Select
              value={selectedTeamId}
              onChange={(e) => setSelectedTeamId(e.target.value)}
              options={[
                { value: "", label: "Choose a team..." },
                ...teams.map((t) => ({
                  value: t.id,
                  label: `${t.name} (${t._count.members} members)`,
                })),
              ]}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Select {assignType === "project" ? "Project" : "Task"}
            </label>
            <Select
              value={selectedResourceId}
              onChange={(e) => setSelectedResourceId(e.target.value)}
              options={
                assignType === "project"
                  ? [
                      { value: "", label: "Choose a project..." },
                      ...projects
                        .filter((p) => p.status === "active")
                        .map((p) => ({ value: p.id, label: p.name })),
                    ]
                  : [
                      { value: "", label: "Choose a task..." },
                      ...tasks.map((t) => ({
                        value: t.id,
                        label: `${t.title} (${t.project.name})`,
                      })),
                    ]
              }
            />
          </div>

          {selectedTeamId && selectedResourceId && (
            <div className="rounded-lg bg-primary/5 p-3 text-sm">
              <p className="font-medium">Assignment Preview</p>
              <p className="text-muted-foreground mt-1">
                All members of <strong>{teams.find((t) => t.id === selectedTeamId)?.name}</strong>{" "}
                will be assigned to this {assignType}.
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setShowAssignModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={createAssignment}
              disabled={!selectedTeamId || !selectedResourceId || assigning}
              className="flex-1"
            >
              {assigning ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                "Create Assignment"
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
