"use client";

import Link from "next/link";
import { Users, ArrowRight } from "lucide-react";
import type { Project } from "@/services/projectService";

interface ProjectCardProps {
    project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
    return (
        <Link href={`/projects/${project.id}`} className="group block">
            <div className="relative rounded-xl border border-white/[0.08] bg-white/[0.03] p-5 transition-all duration-200 hover:border-cyan-400/30 hover:bg-white/[0.06] hover:-translate-y-0.5 hover:shadow-[0_0_24px_rgba(110,231,247,0.06)]">
                {/* Subtle top accent line */}
                <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        {/* Project name */}
                        <h3 className="text-white font-semibold text-[15px] truncate leading-tight mb-1.5 group-hover:text-cyan-300 transition-colors duration-150"
                            style={{ fontFamily: "'Syne', sans-serif" }}>
                            {project.name}
                        </h3>

                        {/* Description */}
                        <p className="text-white/40 text-sm leading-relaxed line-clamp-2">
                            {project.description || "No description yet."}
                        </p>
                    </div>

                    {/* Arrow */}
                    <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all duration-150 mt-0.5 shrink-0" />
                </div>

                {/* Footer */}
                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/[0.06]">
                    <div className="flex items-center gap-1.5 text-white/30 text-xs">
                        <Users className="w-3.5 h-3.5" />
                        <span>{project.members?.length ?? 0} member{(project.members?.length ?? 0) !== 1 ? "s" : ""}</span>
                    </div>
                    <div className="text-white/20 text-xs ml-auto">
                        {new Date(project.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                        })}
                    </div>
                </div>
            </div>
        </Link>
    );
}