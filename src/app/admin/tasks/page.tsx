"use client";

import { useEffect, useState, useCallback } from "react";
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
import { getStatusColor, getStatusLabel, getPriorityColor, getPriorityLabel, formatRelativeTime } from "@/lib/utils";
import { CheckSquare, Search, Trash2, Plus, MoreHorizontal, UserPlus, Edit, Calendar } from "lucide-react";

interface Task {
  id: string; title: string; description: string | null; status: string; priority: string;
  dueDate: string | null;
  assignee: { id: string; name: string; email: string; avatarUrl?: string | null } | null;
  project: { id: string; name: string; color: string };
  createdAt: string;
}

interface User {
  id: string; name: string; email: string; avatarUrl: string | null; role: string;
}

interface Project {
  id: string; name: string; color: string;
}

export default function AdminTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterAssignee, setFilterAssignee] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Create modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTask, setNewTask] = useState({ title: "", description: "", status: "todo", priority: "medium", projectId: "", assigneeId: "", dueDate: "" });
  const [creating, setCreating] = useState(false);

  // Edit modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [editData, setEditData] = useState({ title: "", description: "", status: "", priority: "", assigneeId: "", dueDate: "" });
  const [updating, setUpdating] = useState(false);

  // Quick assign modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignTask, setAssignTask] = useState<Task | null>(null);
  const [assignUserId, setAssignUserId] = useState("");

  // User search
  const [userSearch, setUserSearch] = useState("");
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [actionMenu, setActionMenu] = useState<string | null>(null);

  useEffect(() => { fetchTasks(); fetchUsers(); fetchProjects(); }, [page, filterStatus, filterPriority, filterAssignee]);

  async function fetchTasks() {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (filterStatus !== "all") params.set("status", filterStatus);
    if (filterPriority !== "all") params.set("priority", filterPriority);
    if (filterAssignee !== "all") params.set("assigneeId", filterAssignee);
    if (search) params.set("search", search);
    const res = await fetch(`/api/admin/tasks?${params}`, { headers: { Authorization: `Bearer ${localStorage.getItem("pulse_token")}` } });
    const data = await res.json();
    setTasks(data.tasks || []);
    setTotalPages(data.totalPages || 1);
    setLoading(false);
  }

  async function fetchUsers() {
    const res = await fetch("/api/admin/users?limit=100", { headers: { Authorization: `Bearer ${localStorage.getItem("pulse_token")}` } });
    const data = await res.json();
    setUsers(data.users || []);
  }

  async function fetchProjects() {
    const res = await fetch("/api/admin/projects?limit=100", { headers: { Authorization: `Bearer ${localStorage.getItem("pulse_token")}` } });
    const data = await res.json();
    setProjects(data.projects || []);
  }

  function filterUsers(query: string) {
    setUserSearch(query);
    if (!query) { setFilteredUsers([]); return; }
    const q = query.toLowerCase();
    setFilteredUsers(users.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)).slice(0, 8));
  }

  async function createTask(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    const res = await fetch("/api/admin/tasks", {
      method: "POST",
      headers: { Authorization: `Bearer ${localStorage.getItem("pulse_token")}`, "Content-Type": "application/json" },
      body: JSON.stringify({ ...newTask, dueDate: newTask.dueDate || undefined }),
    });
    if (res.ok) {
      setShowCreateModal(false);
      setNewTask({ title: "", description: "", status: "todo", priority: "medium", projectId: "", assigneeId: "", dueDate: "" });
      fetchTasks();
    }
    setCreating(false);
  }

  async function updateTask() {
    if (!editTask) return;
    setUpdating(true);
    const res = await fetch(`/api/admin/tasks/${editTask.id}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${localStorage.getItem("pulse_token")}`, "Content-Type": "application/json" },
      body: JSON.stringify({ ...editData, assigneeId: editData.assigneeId || null, dueDate: editData.dueDate || null }),
    });
    if (res.ok) { setShowEditModal(false); fetchTasks(); }
    setUpdating(false);
  }

  async function quickAssign() {
    if (!assignTask || !assignUserId) return;
    await fetch(`/api/admin/tasks/${assignTask.id}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${localStorage.getItem("pulse_token")}`, "Content-Type": "application/json" },
      body: JSON.stringify({ assigneeId: assignUserId }),
    });
    setShowAssignModal(false);
    setAssignUserId("");
    fetchTasks();
  }

  async function removeAssignment(taskId: string) {
    await fetch(`/api/admin/tasks/${taskId}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${localStorage.getItem("pulse_token")}`, "Content-Type": "application/json" },
      body: JSON.stringify({ assigneeId: null }),
    });
    setActionMenu(null);
    fetchTasks();
  }

  async function deleteTask(id: string) {
    if (!confirm("Delete this task?")) return;
    await fetch(`/api/admin/tasks/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${localStorage.getItem("pulse_token")}` } });
    setActionMenu(null);
    fetchTasks();
  }

  function openEditModal(task: Task) {
    setEditTask(task);
    setEditData({
      title: task.title,
      description: task.description || "",
      status: task.status,
      priority: task.priority,
      assigneeId: task.assignee?.id || "",
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "",
    });
    setShowEditModal(true);
    setActionMenu(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tasks</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage all tasks across projects</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}><Plus className="h-4 w-4" /> New Task</Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search tasks..." value={search} onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchTasks()} className="pl-9" />
        </div>
        <Select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
          options={[{ value: "all", label: "All Statuses" }, { value: "todo", label: "To Do" }, { value: "in_progress", label: "In Progress" }, { value: "in_review", label: "In Review" }, { value: "done", label: "Done" }]} />
        <Select value={filterPriority} onChange={(e) => { setFilterPriority(e.target.value); setPage(1); }}
          options={[{ value: "all", label: "All Priorities" }, { value: "low", label: "Low" }, { value: "medium", label: "Medium" }, { value: "high", label: "High" }, { value: "urgent", label: "Urgent" }]} />
        <Select value={filterAssignee} onChange={(e) => { setFilterAssignee(e.target.value); setPage(1); }}
          options={[{ value: "all", label: "All Assignees" }, { value: "unassigned", label: "Unassigned" }, ...users.map((u) => ({ value: u.id, label: u.name }))]} />
      </div>

      {/* Task List */}
      {loading ? (
        <div className="space-y-3">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />)}</div>
      ) : tasks.length === 0 ? (
        <EmptyState icon={<CheckSquare className="h-8 w-8" />} title="No tasks found" description="Create a task or adjust your filters." action={<Button onClick={() => setShowCreateModal(true)}><Plus className="h-4 w-4" /> Create Task</Button>} />
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => (
            <Card key={task.id} className="p-4 hover:shadow-md transition-all">
              <div className="flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium">{task.title}</h3>
                    {task.dueDate && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1.5">
                    <div className="flex items-center gap-1.5">
                      <ProjectColor color={task.project.color} size="sm" />
                      <span className="text-xs text-muted-foreground">{task.project.name}</span>
                    </div>
                    {task.assignee ? (
                      <button
                        onClick={() => { setAssignTask(task); setAssignUserId(task.assignee!.id); setShowAssignModal(true); setActionMenu(null); }}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Avatar name={task.assignee.name} src={task.assignee.avatarUrl} size="sm" className="h-4 w-4" />
                        {task.assignee.name}
                      </button>
                    ) : (
                      <button
                        onClick={() => { setAssignTask(task); setAssignUserId(""); setShowAssignModal(true); setActionMenu(null); }}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                      >
                        <UserPlus className="h-3 w-3" /> Assign
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge className={getStatusColor(task.status)}>{getStatusLabel(task.status)}</Badge>
                  <Badge className={getPriorityColor(task.priority)}>{getPriorityLabel(task.priority)}</Badge>
                  <div className="relative">
                    <button onClick={() => setActionMenu(actionMenu === task.id ? null : task.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-muted">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                    {actionMenu === task.id && (
                      <div className="absolute right-0 top-full mt-1 w-48 rounded-xl border bg-card shadow-xl z-50 py-1">
                        <button onClick={() => openEditModal(task)} className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted w-full text-left">
                          <Edit className="h-4 w-4" /> Edit Task
                        </button>
                        <button onClick={() => { setAssignTask(task); setAssignUserId(task.assignee?.id || ""); setShowAssignModal(true); setActionMenu(null); }}
                          className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted w-full text-left">
                          <UserPlus className="h-4 w-4" /> {task.assignee ? "Reassign" : "Assign"}
                        </button>
                        {task.assignee && (
                          <button onClick={() => removeAssignment(task.id)} className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted w-full text-left text-amber-600">
                            Remove Assignee
                          </button>
                        )}
                        <button onClick={() => deleteTask(task.id)} className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted w-full text-left text-destructive">
                          <Trash2 className="h-4 w-4" /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
          <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</Button>
        </div>
      )}

      {/* Create Task Modal */}
      <Modal open={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create Task">
        <form onSubmit={createTask} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Title</label>
            <Input placeholder="Task title" value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} required />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea placeholder="Task description..." value={newTask.description} onChange={(e) => setNewTask({ ...newTask, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Project</label>
              <Select value={newTask.projectId} onChange={(e) => setNewTask({ ...newTask, projectId: e.target.value })}
                options={[{ value: "", label: "Select project..." }, ...projects.map((p) => ({ value: p.id, label: p.name }))]} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Priority</label>
              <Select value={newTask.priority} onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                options={[{ value: "low", label: "Low" }, { value: "medium", label: "Medium" }, { value: "high", label: "High" }, { value: "urgent", label: "Urgent" }]} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Assign To</label>
              <div className="relative">
                <Input placeholder="Search users..." value={userSearch} onChange={(e) => filterUsers(e.target.value)} />
                {filteredUsers.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-card border rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto">
                    {filteredUsers.map((u) => (
                      <button key={u.id} type="button"
                        onClick={() => { setNewTask({ ...newTask, assigneeId: u.id }); setUserSearch(u.name); setFilteredUsers([]); }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-muted text-left">
                        <Avatar name={u.name} src={u.avatarUrl} size="sm" />
                        <div>
                          <p className="font-medium">{u.name}</p>
                          <p className="text-xs text-muted-foreground">{u.email}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {newTask.assigneeId && (
                <div className="flex items-center gap-2 mt-1">
                  <Avatar name={users.find((u) => u.id === newTask.assigneeId)?.name || ""} size="sm" />
                  <span className="text-sm">{users.find((u) => u.id === newTask.assigneeId)?.name}</span>
                  <button type="button" onClick={() => { setNewTask({ ...newTask, assigneeId: "" }); setUserSearch(""); }} className="text-xs text-destructive">Remove</button>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Due Date</label>
              <Input type="date" value={newTask.dueDate} onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)} className="flex-1">Cancel</Button>
            <Button type="submit" className="flex-1" disabled={creating || !newTask.projectId}>
              {creating ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : "Create Task"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Task Modal */}
      <Modal open={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Task">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Title</label>
            <Input value={editData.title} onChange={(e) => setEditData({ ...editData, title: e.target.value })} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea value={editData.description} onChange={(e) => setEditData({ ...editData, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={editData.status} onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                options={[{ value: "todo", label: "To Do" }, { value: "in_progress", label: "In Progress" }, { value: "in_review", label: "In Review" }, { value: "done", label: "Done" }]} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Priority</label>
              <Select value={editData.priority} onChange={(e) => setEditData({ ...editData, priority: e.target.value })}
                options={[{ value: "low", label: "Low" }, { value: "medium", label: "Medium" }, { value: "high", label: "High" }, { value: "urgent", label: "Urgent" }]} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Assign To</label>
              <div className="relative">
                <Input placeholder="Search users..." value={userSearch} onChange={(e) => filterUsers(e.target.value)} />
                {filteredUsers.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-card border rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto">
                    {filteredUsers.map((u) => (
                      <button key={u.id} type="button"
                        onClick={() => { setEditData({ ...editData, assigneeId: u.id }); setUserSearch(u.name); setFilteredUsers([]); }}
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-muted text-left">
                        <Avatar name={u.name} src={u.avatarUrl} size="sm" />
                        <div>
                          <p className="font-medium">{u.name}</p>
                          <p className="text-xs text-muted-foreground">{u.email}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {editData.assigneeId && (
                <div className="flex items-center gap-2 mt-1">
                  <Avatar name={users.find((u) => u.id === editData.assigneeId)?.name || ""} size="sm" />
                  <span className="text-sm">{users.find((u) => u.id === editData.assigneeId)?.name}</span>
                  <button type="button" onClick={() => { setEditData({ ...editData, assigneeId: "" }); setUserSearch(""); }} className="text-xs text-destructive">Remove</button>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Due Date</label>
              <Input type="date" value={editData.dueDate} onChange={(e) => setEditData({ ...editData, dueDate: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowEditModal(false)} className="flex-1">Cancel</Button>
            <Button onClick={updateTask} className="flex-1" disabled={updating}>
              {updating ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : "Save Changes"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Quick Assign Modal */}
      <Modal open={showAssignModal} onClose={() => setShowAssignModal(false)} title={`Assign "${assignTask?.title || ""}"`}>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Select User</label>
            <div className="relative">
              <Input placeholder="Search users..." value={userSearch} onChange={(e) => filterUsers(e.target.value)} />
              {filteredUsers.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-card border rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto">
                  {filteredUsers.map((u) => (
                    <button key={u.id} type="button"
                      onClick={() => { setAssignUserId(u.id); setUserSearch(u.name); setFilteredUsers([]); }}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-muted text-left">
                      <Avatar name={u.name} src={u.avatarUrl} size="sm" />
                      <div>
                        <p className="font-medium">{u.name}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {assignUserId && (
              <div className="flex items-center gap-2 mt-1">
                <Avatar name={users.find((u) => u.id === assignUserId)?.name || ""} size="sm" />
                <span className="text-sm">{users.find((u) => u.id === assignUserId)?.name}</span>
                <button type="button" onClick={() => { setAssignUserId(""); setUserSearch(""); }} className="text-xs text-destructive">Remove</button>
              </div>
            )}
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowAssignModal(false)} className="flex-1">Cancel</Button>
            <Button onClick={quickAssign} disabled={!assignUserId} className="flex-1">Assign</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
