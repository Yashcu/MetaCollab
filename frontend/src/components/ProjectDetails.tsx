import { useState } from "react";
import { Project } from "../types";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { useToast } from "./ui/use-toast";
import { inviteMember, removeMember } from "@/services/projectService";
import { XCircle } from "lucide-react";

const AddMemberForm = ({ project }: { project: Project }) => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setIsSubmitting(true);
    try {
      await inviteMember(project.id, email);
      toast({ description: "Invitation sent successfully!" });
      setEmail("");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error sending invite",
        description: error.response?.data?.message || "An error occurred.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-2">
      <Input
        type="email"
        placeholder="Enter user email to invite"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        disabled={isSubmitting}
      />
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Sending Invite..." : "Invite Member"}
      </Button>
    </form>
  );
};

const ProjectDetails = ({ project }: { project: Project }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const isOwner = user?.id === project.owner.id;

  const handleRemoveMember = async (memberId: string) => {
    try {
      await removeMember(project.id, memberId);
      toast({ description: "The user has been removed from the project." });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to remove member",
        description: error.response?.data?.message || "An error occurred.",
      });
    }
  };

  return (
    <div className="space-y-2">
      <h2 className="text-xl font-bold">{project.name}</h2>
      <p className="text-gray-600 dark:text-gray-300">
        {project.description || "No description provided."}
      </p>
      <div className="pt-4">
        <h3 className="font-semibold mb-2">
          Members ({project.members.length})
        </h3>
        <ul className="space-y-2 max-h-48 overflow-y-auto">
          {project.members.map((member) => (
            <li
              key={member.id}
              className="group text-sm text-gray-600 dark:text-gray-400 flex items-center justify-between gap-2"
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <img
                  src={
                    member.avatarUrl ||
                    `https://api.dicebear.com/7.x/micah/svg?seed=${member.name}`
                  }
                  alt={member.name}
                  className="h-6 w-6 rounded-full bg-muted flex-shrink-0"
                />
                <span className="truncate">{member.name}</span>
              </div>
              {isOwner && user?.id !== member.id && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-600"
                  onClick={() => handleRemoveMember(member.id)}
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              )}
            </li>
          ))}
        </ul>
      </div>
      {isOwner && <AddMemberForm project={project} />}
    </div>
  );
};

export default ProjectDetails;
