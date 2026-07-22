"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { Avatar } from "@/components/ui/avatar";
import { ProjectColor } from "@/components/dashboard/project-color";
import {
  getStatusColor,
  getStatusLabel,
  getPriorityColor,
  getPriorityLabel,
  formatRelativeTime,
} from "@/lib/utils";
import {
  ArrowLeft,
  Plus,
  MoreHorizontal,
  Calendar,
  User,
} from "lucide-react";
import Link from "next/link";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  assignee: { id: string; name: string; avatarUrl?: string | null } | null;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  color: string;
  owner: { name: string };
  tasks: Task[];
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "medium",
    assigneeId: "",
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchProject();
  }, [params.id]);

  async function fetchProject() {
    try {
      const token = localStorage.getItem("pulse_token");
      const res = await fetch(`/api/projects/${params.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        router.push("/dashboard/projects");
        return;
      }
      const data = await res.json();
      setProject(data.project);
    } catch (error) {
      console.error("Failed to fetch project:", error);
    } finally {
      setLoading(false);
    }
  }

  async function createTask(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const token = localStorage.getItem("pulse_token");
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...newTask,
          projectId: params.id,
        }),
      });
      if (res.ok) {
        setShowTaskModal(false);
        setNewTask({ title: "", description: "", priority: "medium", assigneeId: "" });
        fetchProject();
      }
    } catch (error) {
      console.error("Failed to create task:", error);
    } finally {
      setCreating(false);
    }
  }

  async function updateTaskStatus(taskId: string, status: string) {
    try {
      const token = localStorage.getItem("pulse_token");
      await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });
      fetchProject();
    } catch (error) {
      console.error("Failed to update task:", error);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-12 w-48 rounded-lg bg-muted animate-pulse" />
        <div className="h-48 rounded-xl bg-muted animate-pulse" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-32 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!project) return null;

  const tasksByStatus = {
    todo: project.tasks.filter((t) => t.status === "todo"),
    in_progress: project.tasks.filter((t) => t.status === "in_progress"),
    in_review: project.tasks.filter((t) => t.status === "in_review"),
    done: project.tasks.filter((t) => t.status === "done"),
  };

  const statusColumns = [
    { key: "todo", label: "To Do" },
    { key: "in_progress", label: "In Progress" },
    { key: "in_review", label: "In Review" },
    { key: "done", label: "Done" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/projects"
          className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex items-center gap-3">
          <ProjectColor color={project.color} size="lg" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
            {project.description && (
              <p className="text-sm text-muted-foreground">
                {project.description}
              </p>
            )}
          </div>
        </div>
        <div className="ml-auto">
          <Button onClick={() => setShowTaskModal(true)}>
            <Plus className="h-4 w-4" />
            Add Task
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statusColumns.map((col) => {
          const tasks = tasksByStatus[col.key as keyof typeof tasksByStatus];
          return (
            <div key={col.key} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold">{col.label}</h3>
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground">
                    {tasks.length}
                  </span>
                </div>
              </div>
              <div className="space-y-2 min-h-[100px] rounded-xl bg-muted/30 p-2">
                {tasks.map((task) => (
                  <Card key={task.id} className="p-3 cursor-pointer hover:shadow-md transition-all">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-medium leading-snug">
                        {task.title}
                      </h4>
                      <button className="rounded p-0.5 hover:bg-muted shrink-0">
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {task.description && (
                      <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">
                        {task.description}
                      </p>
                    )}
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className={getPriorityColor(task.priority)}>
                          {getPriorityLabel(task.priority)}
                        </Badge>
                        {task.dueDate && (
                          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {new Date(task.dueDate).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        )}
                      </div>
                      {task.assignee && (
                        <Avatar name={task.assignee.name} src={task.assignee.avatarUrl} size="sm" />
                      )}
                    </div>
                    <div className="mt-2 flex gap-1">
                      {statusColumns
                        .filter((s) => s.key !== task.status)
                        .slice(0, 2)
                        .map((s) => (
                          <button
                            key={s.key}
                            onClick={() => updateTaskStatus(task.id, s.key)}
                            className="rounded-md bg-muted px-2 py-0.5 text-[10px] text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                          >
                            → {s.label}
                          </button>
                        ))}
                    </div>
                  </Card>
                ))}
                {tasks.length === 0 && (
                  <div className="flex items-center justify-center py-8 text-xs text-muted-foreground">
                    No tasks
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Modal
        open={showTaskModal}
        onClose={() => setShowTaskModal(false)}
        title="New Task"
      >
        <form onSubmit={createTask} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Task Title</label>
            <Input
              placeholder="What needs to be done?"
              value={newTask.title}
              onChange={(e) =>
                setNewTask((t) => ({ ...t, title: e.target.value }))
              }
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea
              placeholder="Add more details..."
              value={newTask.description}
              onChange={(e) =>
                setNewTask((t) => ({ ...t, description: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Priority</label>
            <Select
              value={newTask.priority}
              onChange={(e) =>
                setNewTask((t) => ({ ...t, priority: e.target.value }))
              }
              options={[
                { value: "low", label: "Low" },
                { value: "medium", label: "Medium" },
                { value: "high", label: "High" },
                { value: "urgent", label: "Urgent" },
              ]}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowTaskModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={creating}>
              {creating ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                "Create Task"
              )}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
