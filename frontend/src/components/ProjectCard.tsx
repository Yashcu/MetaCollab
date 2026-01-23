import { Project } from "@/types";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
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

interface ProjectCardProps {
  project: Project;
  isOwner: boolean;
  onDelete: (id: string) => void;
  index: number;
}

const ProjectCard = ({ project, isOwner, onDelete, index }: ProjectCardProps) => {
  return (
    <Card
      className="relative group border-white/10 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-all duration-300 h-full flex flex-col overflow-hidden animate-in zoom-in-95 fade-in fill-mode-both"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <Link
        to={`/project/${project.id}`}
        className="flex flex-col flex-grow p-6"
      >
        <CardHeader className="p-0 mb-4">
          <CardTitle className="text-xl text-white group-hover:text-blue-400 transition-colors">
            {project.name}
          </CardTitle>
          <CardDescription className="text-gray-400 line-clamp-2">
            {project.description || "No description."}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 flex-grow flex items-end">
          <div className="flex items-center text-sm text-gray-500">
            <div className="flex -space-x-2 mr-3">
              {project.members.slice(0, 3).map((member) => (
                <Avatar key={member.id} className="w-6 h-6 border border-[#0a0a0a]">
                  <AvatarImage src={member.avatarUrl} alt={member.name} />
                  <AvatarFallback className="text-[10px] bg-gray-700 text-white">
                    {member.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
            {project.members.length} member(s)
          </div>
        </CardContent>
      </Link>
      {isOwner && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 h-8 w-8 text-gray-400 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/20 hover:text-red-400"
              aria-label="Delete project"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-[#0a0a0a] border-white/10 text-white">
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription className="text-gray-400">
                This will permanently delete the "{project.name}" project and all of
                its tasks.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-transparent border-white/10 text-white hover:bg-white/10">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => onDelete(project.id)}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </Card>
  );
};

export default ProjectCard;
