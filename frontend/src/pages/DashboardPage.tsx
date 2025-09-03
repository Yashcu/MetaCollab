import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { Link } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import SkeletonCard from "@/components/SkeletonCard";
import { useUIStore } from "@/state/uiStore";
import { useEffect, useState } from "react";
import { Project } from "@/types";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2 } from "lucide-react";
import {
  createProject,
  getProjects,
  deleteProject,
} from "@/services/projectService";
import { useAuth } from "@/hooks/useAuth";

// Validation schema for the new project form
const projectSchema = z.object({
  name: z.string().min(3, "Project name must be at least 3 characters"),
  description: z.string().optional(),
});
type TProjectSchema = z.infer<typeof projectSchema>;

const DashboardPage = () => {
  const { isProjectsLoading, setProjectsLoading } = useUIStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { user } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<TProjectSchema>({
    resolver: zodResolver(projectSchema),
  });

  const onProjectDelete = async (e: React.MouseEvent, projectId: string) => {
    e.preventDefault(); // Prevent navigation when clicking the button
    e.stopPropagation();

    if (window.confirm("Are you sure you want to delete this project?")) {
      try {
        await deleteProject(projectId);
        // Remove the project from the state for an instant UI update
        setProjects((prevProjects) =>
          prevProjects.filter((p) => p.id !== projectId)
        );
      } catch (error) {
        console.error("Failed to delete project", error);
        // Optionally, show an error toast
      }
    }
  };

  useEffect(() => {
    const fetchProjects = async () => {
      setProjectsLoading(true);
      try {
        const fetchedProjects = await getProjects();
        setProjects(fetchedProjects);
      } catch (error) {
        console.error("Failed to fetch projects", error);
        // Optionally, show a toast notification for the error
      } finally {
        setProjectsLoading(false);
      }
    };
    fetchProjects();
  }, [setProjectsLoading]);

  // Handler for project creation form submission
  const onProjectCreate = async (data: TProjectSchema) => {
    try {
      const newProject = await createProject({
        name: data.name,
        description: data.description || "",
      });
      // Add the new project to the top of the list for an instant UI update
      setProjects((prevProjects) => [newProject, ...prevProjects]);
      reset();
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Failed to create project", error);
      // Optionally, show a toast notification for the error
    }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-4 justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button aria-label="Create new project">
              <PlusCircle className="mr-2 h-4 w-4" /> Create Project
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create a New Project</DialogTitle>
              <DialogDescription>
                Give your project a name to get started.
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={handleSubmit(onProjectCreate)}
              className="grid gap-4 py-4"
            >
              <div className="grid gap-2">
                <Label htmlFor="name">Project Name</Label>
                <Input
                  {...register("name")}
                  id="name"
                  placeholder="My Awesome Project"
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name.message}</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                  {...register("description")}
                  id="description"
                  placeholder="A brief description of the project."
                />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create Project"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <h2 className="text-2xl font-semibold mb-4">Your Projects</h2>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isProjectsLoading
          ? Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
          : projects.map((p) => (
              <Link
                to={`/project/${p.id}`}
                key={p.id}
                aria-label={`View project ${p.name}`}
                className="relative group"
              >
                <Card className="hover:shadow-lg transition-shadow h-full">
                  <CardHeader>
                    <CardTitle>{p.name}</CardTitle>
                    <CardDescription>{p.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {p.members.length} members
                    </p>
                  </CardContent>
                </Card>
                {/* Add Delete Button */}
                {user?.id === p.owner.id && (
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => onProjectDelete(e, p.id)}
                    aria-label="Delete project"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </Link>
            ))}
      </div>
    </div>
  );
};

export default DashboardPage;
