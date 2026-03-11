"use client";

import { useState, useCallback } from "react";
import { Plus, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TaskCard } from "@/components/project/TaskCard";
import { CreateTaskDialog } from "@/components/project/CreateTaskDialog";
import { InviteMemberDialog } from "@/components/project/InviteMemberDialog";
import { useProjectStore } from "@/store/projectStore";
import { updateTask } from "@/services/taskService";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import type { Task } from "@/services/taskService";

type Status = "todo" | "in-progress" | "done";

const columns: { id: Status; label: string; accent: string; dot: string }[] = [
    { id: "todo", label: "To Do", accent: "border-white/10", dot: "bg-white/20" },
    { id: "in-progress", label: "In Progress", accent: "border-amber-500/20", dot: "bg-amber-400" },
    { id: "done", label: "Done", accent: "border-cyan-500/20", dot: "bg-cyan-400" },
];

export default function ProjectPage() {
    const { tasks, isLoading, activeProject, fetchTasks, reorderTasks } = useProjectStore();
    const [createOpen, setCreateOpen] = useState(false);
    const [inviteOpen, setInviteOpen] = useState(false);
    const [defaultStatus, setDefaultStatus] = useState<Status>("todo");
    const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

    const tasksByStatus = (status: Status): Task[] =>
        tasks
            .filter((t) => t.status === status)
            .sort((a, b) => a.order - b.order);

    const handleDragStart = useCallback((e: React.DragEvent, taskId: string) => {
        setDraggedTaskId(taskId);
        e.dataTransfer.effectAllowed = "move";
    }, []);

    const handleDrop = useCallback(
        async (e: React.DragEvent, targetStatus: Status) => {
            e.preventDefault();
            if (!draggedTaskId || !activeProject) return;

            const task = tasks.find((t) => t.id === draggedTaskId);
            if (!task || task.status === targetStatus) return;

            // Optimistic update
            const updatedTasks = tasks.map((t) =>
                t.id === draggedTaskId ? { ...t, status: targetStatus } : t
            );
            reorderTasks(updatedTasks);

            try {
                await updateTask(draggedTaskId, { status: targetStatus });
                await fetchTasks(activeProject.id);
            } catch {
                await fetchTasks(activeProject.id); // revert on error
            }

            setDraggedTaskId(null);
        },
        [draggedTaskId, tasks, activeProject, reorderTasks, fetchTasks]
    );

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };

    const openCreateFor = (status: Status) => {
        setDefaultStatus(status);
        setCreateOpen(true);
    };

    if (isLoading && tasks.length === 0) {
        return (
            <div className="flex items-center justify-center h-full">
                <LoadingSpinner size="lg" label="Loading tasks..." />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* Toolbar */}
            <div className="flex items-center gap-3 px-6 py-3 border-b border-white/[0.06]">
                <div className="ml-auto flex items-center gap-2">
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setInviteOpen(true)}
                        className="text-white/40 hover:text-white hover:bg-white/[0.04] text-xs gap-1.5"
                    >
                        <UserPlus className="w-3.5 h-3.5" />
                        Invite
                    </Button>
                    <Button
                        size="sm"
                        onClick={() => openCreateFor("todo")}
                        className="bg-cyan-400 hover:bg-cyan-300 text-[#070b14] font-semibold text-xs gap-1.5"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        Add Task
                    </Button>
                </div>
            </div>

            {/* Kanban columns */}
            <div className="flex gap-4 flex-1 overflow-x-auto p-6 min-h-0">
                {columns.map(({ id, label, accent, dot }) => {
                    const columnTasks = tasksByStatus(id);
                    return (
                        <div
                            key={id}
                            className="flex flex-col w-72 shrink-0"
                            onDrop={(e) => handleDrop(e, id)}
                            onDragOver={handleDragOver}
                        >
                            {/* Column header */}
                            <div className={`flex items-center gap-2.5 px-3 py-2.5 mb-3 rounded-lg border ${accent} bg-white/[0.02]`}>
                                <div className={`w-2 h-2 rounded-full ${dot}`} />
                                <span className="text-white/60 text-xs font-semibold uppercase tracking-wider">
                                    {label}
                                </span>
                                <span className="ml-auto text-white/20 text-xs font-medium">
                                    {columnTasks.length}
                                </span>
                            </div>

                            {/* Tasks */}
                            <div className="flex flex-col gap-2 flex-1 overflow-y-auto min-h-[120px] rounded-lg">
                                {columnTasks.map((task) => (
                                    <TaskCard
                                        key={task.id}
                                        task={task}
                                        onDragStart={handleDragStart}
                                    />
                                ))}

                                {/* Add task button at bottom of column */}
                                <button
                                    onClick={() => openCreateFor(id)}
                                    className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-white/20 hover:text-white/40 hover:bg-white/[0.03] transition-all duration-150 text-sm mt-1"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    Add task
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            <CreateTaskDialog
                open={createOpen}
                onOpenChange={setCreateOpen}
                defaultStatus={defaultStatus}
            />
            <InviteMemberDialog open={inviteOpen} onOpenChange={setInviteOpen} />
        </div>
    );
}