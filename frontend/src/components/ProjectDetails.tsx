import { useState } from "react";
import { Project, User } from "../types";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { useToast } from "./ui/use-toast";
import { addMember } from "@/services/projectService";

interface Props {
  project: Project;
  onMemberAdded: (updatedProject: Project) => void;
}

const AddMemberForm = ({ project, onMemberAdded }: Props) => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsSubmitting(true);
    try {
      const updatedProject = await addMember(project.id, email);
      onMemberAdded(updatedProject);
      toast({ title: "Success", description: "Member added successfully!" });
      setEmail("");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error adding member",
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
      />
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Adding..." : "Add Member"}
      </Button>
    </form>
  );
};

const ProjectDetails = ({ project, onMemberAdded }: Props) => {
  const { user } = useAuth();
  const isOwner = user?.id === (project.owner as User)?.id;

  return (
    <div className="space-y-2">
      <h2 className="text-xl font-bold">{project.name}</h2>
      <p className="text-gray-600 dark:text-gray-300">{project.description}</p>
      <p className="text-sm text-gray-500">Project ID: {project.id}</p>
      <div className="pt-4">
        <h3 className="font-semibold mb-2">Members</h3>
        <ul className="space-y-1">
          {project.members.map((member) => (
            <li
              key={member.id}
              className="text-sm text-gray-600 dark:text-gray-400"
            >
              {member.name} ({member.email})
            </li>
          ))}
        </ul>
      </div>
      {isOwner && (
        <AddMemberForm project={project} onMemberAdded={onMemberAdded} />
      )}
    </div>
  );
};

export default ProjectDetails;
