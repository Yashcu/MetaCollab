"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Trash2, GripVertical, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { deleteTask } from "@/services/taskService";
// Reactive selectors — component re-renders when these store values change.
// Never use useProjectStore.getState() inside a component; it bypasses reactivity.
import { useProjectStore } from "@/store/projectStore";
import type { Task } from "@/services/taskService";

interface TaskCardProps {
    task: Task;
    onDragStart: (e: React.DragEvent, taskId: string) => void;
}

const priorityConfig = {
    low: { label: "Low", className: "bg-white/5 text-white/30 border-white/10" },
    medium: { label: "Med", className: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
    high: { label: "High", className: "bg-red-500/10 text-red-400 border-red-500/20" },
};

export function TaskCard({ task, onDragStart }: TaskCardProps) {
    const [isDeleting, setIsDeleting] = useState(false);

    // Reactive selectors — these re-render the component when store values change.
    // This is the correct Zustand pattern inside React components.
    const fetchTasks = useProjectStore((s) => s.fetchTasks);
    const activeProject = useProjectStore((s) => s.activeProject);

    const handleDelete = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!activeProject) return;

        setIsDeleting(true);
        try {
            await deleteTask(task.id);
            // Refresh the task list so the deleted card disappears
            await fetchTasks(activeProject.id);
        } catch {
            toast.error("Failed to delete task");
        } finally {
            setIsDeleting(false);
        }
    };

    const priority = priorityConfig[task.priority ?? "medium"];

    return (
        <div
            draggable
            onDragStart={(e) => onDragStart(e, task.id)}
            className="group relative rounded-lg border border-white/[0.07] bg-white/[0.03] p-3.5 cursor-grab active:cursor-grabbing hover:border-white/[0.14] hover:bg-white/[0.05] transition-all duration-150"
        >
            <GripVertical className="absolute left-1.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/10 group-hover:text-white/25 transition-colors" />

            <div className="pl-3">
                <p className="text-white/80 text-sm leading-snug pr-6">{task.title}</p>

                {task.description && (
                    <p className="text-white/30 text-xs mt-1.5 line-clamp-2 leading-relaxed">
                        {task.description}
                    </p>
                )}

                <div className="flex items-center gap-2 mt-3">
                    <Badge
                        variant="outline"
                        className={`text-[10px] px-1.5 py-0 h-4 font-medium border ${priority.className}`}
                    >
                        {priority.label}
                    </Badge>

                    {task.dueDate && (
                        <span className="text-white/20 text-[10px]">
                            Due{" "}
                            {new Date(task.dueDate).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                            })}
                        </span>
                    )}
                </div>
            </div>

            {/* Shows a spinner while deleting, trash icon otherwise */}
            <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400 hover:bg-red-400/10 transition-all duration-150 disabled:opacity-50"
            >
                {isDeleting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-white/30" />
                ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                )}
            </button>
        </div>
    );
}