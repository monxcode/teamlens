"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { ProjectColor } from "@/components/dashboard/project-color";
import {
  getStatusColor,
  getStatusLabel,
  getPriorityColor,
  getPriorityLabel,
  formatRelativeTime,
} from "@/lib/utils";
import {
  Plus,
  Search,
  Filter,
  CheckSquare,
  Calendar,
  SlidersHorizontal,
} from "lucide-react";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  assignee: { id: string; name: string; avatarUrl?: string | null } | null;
  project: { id: string; name: string; color: string };
  createdAt: string;
}

interface Project {
  id: string;
  name: string;
  color: string;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    status: "todo",
    priority: "medium",
    projectId: "",
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchTasks();
    fetchProjects();

    // Poll for updates every 30 seconds
    const interval = setInterval(() => {
      fetchTasks();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  async function fetchTasks() {
    try {
      const token = sessionStorage.getItem("pulse_token");
      const res = await fetch("/api/tasks", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setTasks(data.tasks || []);
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchProjects() {
    try {
      const token = sessionStorage.getItem("pulse_token");
      const res = await fetch("/api/projects", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setProjects(
        (data.projects || []).map((p: Project) => ({
          id: p.id,
          name: p.name,
          color: p.color,
        }))
      );
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    }
  }

  async function createTask(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const token = sessionStorage.getItem("pulse_token");
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newTask),
      });
      if (res.ok) {
        setShowModal(false);
        fetchTasks();
      }
    } catch (error) {
      console.error("Failed to create task:", error);
    } finally {
      setCreating(false);
    }
  }

  async function updateTaskStatus(taskId: string, status: string) {
    try {
      const token = sessionStorage.getItem("pulse_token");
      await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status } : t))
      );
    } catch (error) {
      console.error("Failed to update task:", error);
    }
  }

  function setShowTaskModal() {
    setShowModal(!showModal);
    if (showModal) {
      setNewTask({ title: "", description: "", status: "todo", priority: "medium", projectId: "" });
    }
  }

  const filtered = tasks.filter((task) => {
    const matchesSearch = task.title
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || task.status === filterStatus;
    const matchesPriority =
      filterPriority === "all" || task.priority === filterPriority;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tasks</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage and track all tasks across projects
          </p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="h-4 w-4" />
          New Task
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          options={[
            { value: "all", label: "All Statuses" },
            { value: "todo", label: "To Do" },
            { value: "in_progress", label: "In Progress" },
            { value: "in_review", label: "In Review" },
            { value: "done", label: "Done" },
          ]}
        />
        <Select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          options={[
            { value: "all", label: "All Priorities" },
            { value: "low", label: "Low" },
            { value: "medium", label: "Medium" },
            { value: "high", label: "High" },
            { value: "urgent", label: "Urgent" },
          ]}
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<CheckSquare className="h-8 w-8" />}
          title="No tasks found"
          description={
            search || filterStatus !== "all" || filterPriority !== "all"
              ? "Try adjusting your search or filters."
              : "Create your first task to get started."
          }
          action={
            <Button onClick={() => setShowModal(true)}>
              <Plus className="h-4 w-4" />
              Create Task
            </Button>
          }
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((task) => (
            <Card key={task.id} className="p-4 hover:shadow-md transition-all">
              <div className="flex items-center gap-4">
                <button
                  onClick={() =>
                    updateTaskStatus(
                      task.id,
                      task.status === "done" ? "todo" : "done"
                    )
                  }
                  className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all shrink-0 ${
                    task.status === "done"
                      ? "bg-emerald-500 border-emerald-500 text-white"
                      : "border-muted-foreground hover:border-primary"
                  }`}
                >
                  {task.status === "done" && (
                    <svg
                      className="h-3 w-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3
                      className={`text-sm font-medium ${
                        task.status === "done"
                          ? "line-through text-muted-foreground"
                          : ""
                      }`}
                    >
                      {task.title}
                    </h3>
                  </div>
                  <div className="flex items-center gap-3 mt-1.5">
                    <div className="flex items-center gap-1.5">
                      <ProjectColor color={task.project.color} size="sm" />
                      <span className="text-xs text-muted-foreground">
                        {task.project.name}
                      </span>
                    </div>
                    {task.dueDate && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {new Date(task.dueDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Badge className={getStatusColor(task.status)}>
                    {getStatusLabel(task.status)}
                  </Badge>
                  <Badge className={getPriorityColor(task.priority)}>
                    {getPriorityLabel(task.priority)}
                  </Badge>
                  {task.assignee && (
                    <Avatar name={task.assignee.name} src={task.assignee.avatarUrl} size="sm" />
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={showModal}
        onClose={() => setShowModal(true)}
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
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Project</label>
              <Select
                value={newTask.projectId}
                onChange={(e) =>
                  setNewTask((t) => ({ ...t, projectId: e.target.value }))
                }
                options={projects.map((p) => ({
                  value: p.id,
                  label: p.name,
                }))}
                placeholder="Select project"
                required
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
          </div>
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowModal(true)}
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
