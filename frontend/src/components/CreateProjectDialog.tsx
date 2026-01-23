import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { createProject } from "@/services/projectService";
import { AxiosError } from "axios";
import { Project } from "@/types";

const projectSchema = z.object({
  name: z.string().min(3, "Project name must be at least 3 characters"),
  description: z.string().optional(),
});

type TProjectSchema = z.infer<typeof projectSchema>;

interface CreateProjectDialogProps {
  onProjectCreated: (project: Project) => void;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const CreateProjectDialog = ({ onProjectCreated, trigger, open: controlledOpen, onOpenChange: setControlledOpen }: CreateProjectDialogProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const { toast } = useToast();

  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;
  const setIsOpen = isControlled ? setControlledOpen! : setInternalOpen;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<TProjectSchema>({
    resolver: zodResolver(projectSchema),
  });

  const onProjectCreate = async (data: TProjectSchema) => {
    try {
      const newProject = await createProject({
        name: data.name,
        description: data.description || "",
      });
      onProjectCreated(newProject);
      reset();
      setIsOpen(false);
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
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button aria-label="Create new project" className="bg-white text-black hover:bg-gray-200 transition-colors">
            <PlusCircle className="mr-2 h-4 w-4" /> Create Project
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="bg-[#0a0a0a] border-white/10 text-white sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-white">Create a New Project</DialogTitle>
          <DialogDescription className="text-gray-400">
            Give your project a name to get started.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={handleSubmit(onProjectCreate)}
          className="grid gap-4 py-4"
        >
          <div className="grid gap-2">
            <Label htmlFor="name" className="text-gray-300">Project Name</Label>
            <Input
              {...register("name")}
              id="name"
              placeholder="My Awesome Project"
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-white/30"
            />
            {errors.name && (
              <p className="text-sm text-red-400">{errors.name.message}</p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description" className="text-gray-300">Description (Optional)</Label>
            <Input
              {...register("description")}
              id="description"
              placeholder="A brief description of the project."
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-white/30"
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting} className="bg-white text-black hover:bg-gray-200">
              {isSubmitting ? "Creating..." : "Create Project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateProjectDialog;
