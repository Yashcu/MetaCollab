import { Button } from "@/components/ui/button";
import SkeletonCard from "@/components/SkeletonCard";
import { useUIStore } from "@/state/uiStore";
import { useEffect, useState } from "react";
import { Project } from "@/types";
import {
  getProjects,
  deleteProject,
} from "@/services/projectService";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/use-toast";
import CreateProjectDialog from "@/components/CreateProjectDialog";
import ProjectCard from "@/components/ProjectCard";

const DashboardPage = () => {
  const { isProjectsLoading, setProjectsLoading } = useUIStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchProjects = async () => {
      setProjectsLoading(true);
      try {
        const fetchedProjects = await getProjects();
        setProjects(fetchedProjects);
      } catch (error) {
        toast({ variant: "destructive", title: "Failed to load projects" });
      } finally {
        setProjectsLoading(false);
      }
    };
    fetchProjects();

    const handleRefetch = () => fetchProjects();
    window.addEventListener("dashboard:refetch", handleRefetch);

    return () => {
      window.removeEventListener("dashboard:refetch", handleRefetch);
    };
  }, [setProjectsLoading, toast]);

  const handleProjectDelete = async (projectId: string) => {
    try {
      await deleteProject(projectId);
      setProjects((p) => p.filter((proj) => proj.id !== projectId));
      toast({ title: "Project Deleted" });
    } catch (error) {
      toast({ variant: "destructive", title: "Deletion Failed" });
    }
  };

  const handleProjectCreated = (newProject: Project) => {
    setProjects((p) => [newProject, ...p]);
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex flex-wrap gap-4 justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-gray-400 mt-1">Manage your projects and collaborations</p>
        </div>

        <CreateProjectDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          onProjectCreated={handleProjectCreated}
        />
      </div>

      <h2 className="text-xl font-semibold mb-6 text-white/80">Your Projects</h2>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isProjectsLoading
          ? Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
          : projects.map((p, index) => (
            <ProjectCard
              key={p.id}
              project={p}
              index={index}
              isOwner={user?.id === p.owner.id}
              onDelete={handleProjectDelete}
            />
          ))}
      </div>

      {!isProjectsLoading && projects.length === 0 && (
        <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl bg-white/5">
          <h3 className="text-xl font-medium text-white mb-2">No projects yet</h3>
          <p className="text-gray-400 mb-6">Create your first project to get started</p>
          <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-white text-black hover:bg-gray-200">
            Create Project
          </Button>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
