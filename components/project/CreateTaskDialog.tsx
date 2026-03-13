"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createTask } from "@/services/taskService";
import { useProjectStore } from "@/store/projectStore";

interface CreateTaskDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    defaultStatus?: "todo" | "in_progress" | "done";
}

export function CreateTaskDialog({
    open,
    onOpenChange,
    defaultStatus = "todo",
}: CreateTaskDialogProps) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
    const [isLoading, setIsLoading] = useState(false);
    const { activeProject, fetchTasks } = useProjectStore();

    const handleSubmit = async () => {
        if (!title.trim() || !activeProject) return;
        setIsLoading(true);
        try {
            await createTask(activeProject.id, {
                title: title.trim(),
                description: description.trim(),
                status: defaultStatus,
                priority,
            });
            await fetchTasks(activeProject.id);
            toast.success("Task created!");
            setTitle("");
            setDescription("");
            setPriority("medium");
            onOpenChange(false);
        } catch (error) {
            const msg = error instanceof Error ? error.message : "Failed to create task";
            toast.error("Could not create task", { description: msg });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-[#0d1424] border-white/10 text-white max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-white font-bold" style={{ fontFamily: "'Syne', sans-serif" }}>
                        New Task
                    </DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-4 pt-2">
                    <div className="flex flex-col gap-1.5">
                        <Label className="text-white/50 text-xs uppercase tracking-wider">Title</Label>
                        <Input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="What needs to be done?"
                            className="bg-white/[0.04] border-white/10 text-white placeholder:text-white/20 focus:border-cyan-400/50 focus:ring-0"
                            autoFocus
                            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <Label className="text-white/50 text-xs uppercase tracking-wider">
                            Description <span className="normal-case text-white/25">(optional)</span>
                        </Label>
                        <Textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Add more details..."
                            className="bg-white/[0.04] border-white/10 text-white placeholder:text-white/20 focus:border-cyan-400/50 focus:ring-0 resize-none"
                            rows={3}
                        />
                    </div>

                    {/* Priority */}
                    <div className="flex flex-col gap-1.5">
                        <Label className="text-white/50 text-xs uppercase tracking-wider">Priority</Label>
                        <div className="flex gap-2">
                            {(["low", "medium", "high"] as const).map((p) => (
                                <button
                                    key={p}
                                    onClick={() => setPriority(p)}
                                    className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all capitalize ${priority === p
                                            ? p === "high"
                                                ? "bg-red-500/15 border-red-500/30 text-red-400"
                                                : p === "medium"
                                                    ? "bg-amber-500/15 border-amber-500/30 text-amber-400"
                                                    : "bg-white/10 border-white/20 text-white/60"
                                            : "bg-transparent border-white/10 text-white/25 hover:border-white/20"
                                        }`}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-2 pt-1">
                        <Button
                            variant="ghost"
                            className="flex-1 text-white/40 hover:text-white hover:bg-white/[0.04]"
                            onClick={() => onOpenChange(false)}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            className="flex-1 bg-cyan-400 hover:bg-cyan-300 text-[#070b14] font-semibold"
                            onClick={handleSubmit}
                            disabled={isLoading || !title.trim()}
                        >
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Task"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}