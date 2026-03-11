"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createProject } from "@/services/projectService";
import { useProjectStore } from "@/store/projectStore";

interface CreateProjectDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CreateProjectDialog({ open, onOpenChange }: CreateProjectDialogProps) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const fetchProjects = useProjectStore((s) => s.fetchProjects);

    const handleSubmit = async () => {
        if (!name.trim()) {
            toast.error("Project name is required");
            return;
        }

        setIsLoading(true);
        try {
            await createProject({ name: name.trim(), description: description.trim() });
            toast.success("Project created!", { description: `"${name}" is ready.` });
            await fetchProjects();
            setName("");
            setDescription("");
            onOpenChange(false);
        } catch (error) {
            const msg = error instanceof Error ? error.message : "Failed to create project";
            toast.error("Could not create project", { description: msg });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-[#0d1424] border-white/10 text-white max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-white text-lg font-bold" style={{ fontFamily: "'Syne', sans-serif" }}>
                        New Project
                    </DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-4 pt-2">
                    <div className="flex flex-col gap-1.5">
                        <Label className="text-white/60 text-xs uppercase tracking-wider">Project Name</Label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Marketing Campaign"
                            className="bg-white/[0.04] border-white/10 text-white placeholder:text-white/20 focus:border-cyan-400/50 focus:ring-0"
                            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                            autoFocus
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <Label className="text-white/60 text-xs uppercase tracking-wider">Description <span className="normal-case text-white/30">(optional)</span></Label>
                        <Textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="What's this project about?"
                            className="bg-white/[0.04] border-white/10 text-white placeholder:text-white/20 focus:border-cyan-400/50 focus:ring-0 resize-none"
                            rows={3}
                        />
                    </div>

                    <div className="flex gap-2 pt-2">
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
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <>
                                    <Plus className="w-4 h-4 mr-1.5" />
                                    Create
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}