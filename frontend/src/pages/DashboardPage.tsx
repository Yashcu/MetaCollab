// frontend/src/pages/DashboardPage.tsx

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Trash2 } from "lucide-react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import SkeletonCard from "@/components/SkeletonCard";
import { useUIStore } from "@/state/uiStore";
import { useEffect, useState } from "react";
import { Project } from "@/types";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createProject,
  getProjects,
  deleteProject,
} from "@/services/projectService";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/use-toast";
import { AxiosError } from "axios";

const projectSchema = z.object({
  name: z.string().min(3, "Project name must be at least 3 characters"),
  description: z.string().optional(),
});
type TProjectSchema = z.infer<typeof projectSchema>;

const DashboardPage = () => {
  const { isProjectsLoading, setProjectsLoading } = useUIStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<TProjectSchema>({
    resolver: zodResolver(projectSchema),
  });

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

  const onProjectDelete = async (projectId: string) => {
    try {
      await deleteProject(projectId);
      setProjects((p) => p.filter((proj) => proj.id !== projectId));
      toast({ title: "Project Deleted" });
    } catch (error) {
      toast({ variant: "destructive", title: "Deletion Failed" });
    }
  };

  const onProjectCreate = async (data: TProjectSchema) => {
    try {
      const newProject = await createProject({
        name: data.name,
        description: data.description || "",
      });
      setProjects((p) => [newProject, ...p]);
      reset();
      setIsCreateDialogOpen(false);
      toast({ title: "Project Created!" });
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      toast({
        variant: "destructive",
        title: "Creation Failed",
        description: axiosError.response?.data?.message,
      });
    }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-4 justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
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
              <Card
                key={p.id}
                className="relative group hover:shadow-lg transition-shadow h-full flex flex-col"
              >
                <Link
                  to={`/project/${p.id}`}
                  className="flex flex-col flex-grow"
                >
                  <CardHeader>
                    <CardTitle>{p.name}</CardTitle>
                    <CardDescription>
                      {p.description || "No description."}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <p className="text-sm text-muted-foreground">
                      {p.members.length} member(s)
                    </p>
                  </CardContent>
                </Link>
                {user?.id === p.owner.id && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Delete project"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete the "{p.name}" project
                          and all of its tasks.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => onProjectDelete(p.id)}
                        >
                          Continue
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </Card>
            ))}
      </div>
    </div>
  );
};

export default DashboardPage;
