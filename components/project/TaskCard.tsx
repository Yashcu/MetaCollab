"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Trash2, GripVertical, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { deleteTask } from "@/services/taskService";
import { useProjectStore } from "@/store/projectStore";
import type { Task } from "@/services/taskService";

interface TaskCardProps {
    task: Task;
    onDragStart: (e: React.DragEvent, taskId: string) => void;
    // Bug 15 fix: onDragEnd was missing — without it the parent can't clear
    // draggedTaskId when a card is dropped outside a valid column.
    onDragEnd: () => void;
}

// Bug fix: "urgent" was missing — accessing .className on undefined crashed silently.
// Bug fix (TS18048): indexing a Record<string, V> returns V | undefined in strict mode.
// Solution: use `as const`, declare a typed fallback, use a helper that always returns
// a defined value — no non-null assertion needed.
const priorityConfig = {
    low: { label: "Low", className: "bg-white/5 text-white/30 border-white/10" },
    medium: { label: "Med", className: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
    high: { label: "High", className: "bg-red-500/10 text-red-400 border-red-500/20" },
    urgent: { label: "Urgent", className: "bg-red-600/20 text-red-300 border-red-600/30" },
} as const;

type PriorityKey = keyof typeof priorityConfig;
type PriorityEntry = (typeof priorityConfig)[PriorityKey];

const PRIORITY_FALLBACK: PriorityEntry = priorityConfig.medium;

function getPriority(key: string | null | undefined): PriorityEntry {
    if (key && key in priorityConfig) {
        return priorityConfig[key as PriorityKey];
    }
    return PRIORITY_FALLBACK;
}

export function TaskCard({ task, onDragStart, onDragEnd }: TaskCardProps) {
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchTasks = useProjectStore((s) => s.fetchTasks);
    const activeProject = useProjectStore((s) => s.activeProject);

    const handleDelete = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!activeProject) return;

        setIsDeleting(true);
        try {
            await deleteTask(task.id);
            await fetchTasks(activeProject.id);
        } catch {
            toast.error("Failed to delete task");
        } finally {
            setIsDeleting(false);
        }
    };

    // getPriority always returns a defined entry — TS18048 is gone
    const priority = getPriority(task.priority);

    return (
        <div
            draggable
            onDragStart={(e) => onDragStart(e, task.id)}
            onDragEnd={onDragEnd}
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