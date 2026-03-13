"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Plus, FolderKanban, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ProjectCard } from "@/components/dashboard/ProjectCard";
import { CreateProjectDialog } from "@/components/dashboard/CreateProjectDialog";
import { InvitationsPanel } from "@/components/dashboard/InvitationsPanel";
import { useProjectStore } from "@/store/projectStore";
import { useInvitationStore } from "@/store/invitationStore";

export default function DashboardPage() {
    const { user } = useUser();
    const [createOpen, setCreateOpen] = useState(false);
    const projects = useProjectStore((s) => s.projects);
    const isLoading = useProjectStore((s) => s.isLoadingProjects);
    const invitations = useInvitationStore((s) => s.invitations);

    const firstName = user?.firstName ?? "there";

    return (
        <div className="min-h-full px-8 py-8 max-w-6xl">
            {/* Header */}
            <div className="flex items-start justify-between mb-10">
                <div>
                    <p className="text-white/30 text-sm mb-1">Good to see you,</p>
                    <h1
                        className="text-white text-3xl font-bold leading-tight font-display"
                    >
                        {firstName} 👋
                    </h1>
                </div>
                <Button
                    onClick={() => setCreateOpen(true)}
                    className="bg-cyan-400 hover:bg-cyan-300 text-[#070b14] font-semibold gap-2 shadow-[0_0_20px_rgba(110,231,247,0.15)]"
                >
                    <Plus className="w-4 h-4" />
                    New Project
                </Button>
            </div>

            <div className="flex gap-8">
                {/* Projects grid */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-5">
                        <FolderKanban className="w-4 h-4 text-cyan-400" />
                        <h2 className="text-white font-semibold text-sm uppercase tracking-wider">
                            Your Projects
                        </h2>
                        {!isLoading && (
                            <span className="ml-auto text-white/25 text-xs">
                                {projects.length} project{projects.length !== 1 ? "s" : ""}
                            </span>
                        )}
                    </div>

                    {isLoading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {[1, 2, 3, 4].map((i) => (
                                <Skeleton key={i} className="h-36 bg-white/[0.04] rounded-xl" />
                            ))}
                        </div>
                    ) : projects.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center rounded-xl border border-dashed border-white/[0.08]">
                            <div className="w-14 h-14 rounded-2xl bg-white/[0.04] flex items-center justify-center mb-4">
                                <FolderKanban className="w-7 h-7 text-white/20" />
                            </div>
                            <p className="text-white/40 font-medium mb-1">No projects yet</p>
                            <p className="text-white/20 text-sm mb-5">Create your first project to get started</p>
                            <Button
                                onClick={() => setCreateOpen(true)}
                                size="sm"
                                className="bg-white/[0.06] hover:bg-white/10 text-white border border-white/10"
                            >
                                <Plus className="w-4 h-4 mr-1.5" />
                                Create project
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {projects.map((project) => (
                                <ProjectCard key={project.id} project={project} />
                            ))}
                        </div>
                    )}
                </div>

                {/* Invitations sidebar */}
                <div className="w-72 shrink-0">
                    <div className="sticky top-8">
                        <div className="flex items-center gap-2 mb-5">
                            <Bell className="w-4 h-4 text-violet-400" />
                            <h2 className="text-white font-semibold text-sm uppercase tracking-wider">
                                Invitations
                            </h2>
                            {invitations.length > 0 && (
                                <span className="ml-auto flex items-center justify-center w-5 h-5 rounded-full bg-violet-500/20 text-violet-400 text-[10px] font-bold">
                                    {invitations.length}
                                </span>
                            )}
                        </div>
                        <InvitationsPanel />
                    </div>
                </div>
            </div>

            <CreateProjectDialog open={createOpen} onOpenChange={setCreateOpen} />
        </div>
    );
}