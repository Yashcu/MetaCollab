import { useEffect, useState, MouseEvent, useCallback } from "react";
import { useParams } from "react-router-dom";
import { throttle } from "lodash";
import KanbanBoard from "../components/KanbanBoard";
import ChatBox from "../components/ChatBox";
import ProjectDetails from "../components/ProjectDetails";
import Header from "@/components/Header";
import { useSocketStore } from "@/state/socketStore";
import { useAuth } from "@/hooks/useAuth";
import { Task, Project } from "@/types";
import CallDialog from "@/components/CallDialog";
import { useCallStore } from "@/state/callStore";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { getProjectById } from "@/services/projectService";
import { getTasks } from "@/services/taskService";

interface SocketUser {
  id: string;
  name: string;
}

interface Cursor {
  user: SocketUser;
  position: { x: number; y: number };
}

const WorkspaceLayout = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const { socket } = useSocketStore();
  const { user } = useAuth();
  const [cursors, setCursors] = useState<Map<string, Cursor>>(new Map());
  const { call, setCall, answerCall, callUser, leaveCall, callAccepted } =
    useCallStore();
  const { toast } = useToast();

  useEffect(() => {
    if (!projectId) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [projectData, tasksData] = await Promise.all([
          getProjectById(projectId),
          getTasks(projectId),
        ]);
        setActiveProject(projectData);
        setTasks(tasksData);
      } catch (error) {
        console.error("Failed to fetch project data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [projectId]);

  const handleTasksUpdate = (updatedTasks: Task[]) => {
    setTasks(updatedTasks);
  };

  const handleMemberAdded = (updatedProject: Project) => {
    setActiveProject(updatedProject);
  };

  const handleMouseMove = useCallback(
    throttle((e: MouseEvent<HTMLDivElement>) => {
      if (socket && projectId) {
        socket.emit("cursor:move", {
          projectId,
          position: { x: e.clientX, y: e.clientY },
        });
      }
    }, 100),
    [socket, projectId]
  );

  useEffect(() => {
    if (!socket) return;

    const handleCursorMove = (data: Cursor) => {
      if (data.user.id === user?.id) return;
      setCursors((prev) => new Map(prev).set(data.user.id, data));
    };

    const handleIncomingCall = (data: { from: any; signal: any }) => {
      setCall({ isReceivingCall: true, from: data.from, signal: data.signal });
      toast({
        title: "Incoming Call",
        description: `${data.from.name} is calling you.`,
        // The action now directly triggers `answerCall` from the store
        action: <Button onClick={answerCall}>Answer</Button>,
        duration: 15000,
      });
    };

    const handleUserOnline = (data: { id: string; name: string }) => {
      if (data.id !== user?.id) {
        toast({
          title: "User Joined",
          description: `${data.name} is now online.`,
        });
      }
    };

    const handleUserOffline = (data: { id: string }) => {
      if (data.id !== user?.id) {
        setCursors((prev) => {
          const newCursors = new Map(prev);
          newCursors.delete(data.id);
          return newCursors;
        });
        toast({ title: "User Left", description: `A user has gone offline.` });
      }
    };

    socket.on("cursor:move", handleCursorMove);
    socket.on("call:incoming", handleIncomingCall);
    socket.on("user:online", handleUserOnline);
    socket.on("user:offline", handleUserOffline);

    return () => {
      socket.off("cursor:move", handleCursorMove);
      socket.off("call:incoming", handleIncomingCall);
      socket.off("user:online", handleUserOnline);
      socket.off("user:offline", handleUserOffline);
    };
  }, [socket, user?.id, setCall, toast, answerCall]);

  const handleStartCall = () => {
    const onlineUsers = useSocketStore.getState().onlineUsers;
    const otherUsers = onlineUsers.filter((id) => id !== user?.id);
    if (otherUsers.length > 0) {
      // Directly call the store action
      callUser(otherUsers[0]);
    } else {
      toast({
        variant: "destructive",
        title: "No one else is online to call.",
      });
    }
  };

  // The single source of truth for closing the dialog is the `leaveCall` action.
  const handleCloseCallDialog = useCallback(() => {
    leaveCall();
  }, [leaveCall]);

  if (loading) return <p className="text-center p-8">Loading project...</p>;
  if (!activeProject)
    return <p className="text-center p-8">Project not found.</p>;

  return (
    <div
      className="flex h-screen bg-gray-100 dark:bg-gray-900 overflow-hidden relative"
      onMouseMove={handleMouseMove}
    >
      {Array.from(cursors.values()).map((cursor) => (
        <div
          key={cursor.user.id}
          className="absolute z-50 pointer-events-none transition-transform duration-75 linear"
          style={{
            transform: `translate3d(${cursor.position.x}px, ${cursor.position.y}px, 0)`,
          }}
        >
          {/* SVG Cursor */}
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-blue-500"
          >
            <path
              d="M5.63604 5.63604C7.19839 4.07368 9.47463 3.5 12 3.5C14.5254 3.5 16.8016 4.07368 18.364 5.63604C19.9263 7.19839 20.5 9.47463 20.5 12C20.5 14.5254 19.9263 16.8016 18.364 18.364C16.8016 19.9263 14.5254 20.5 12 20.5C9.47463 20.5 7.19839 19.9263 5.63604 18.364C4.07368 16.8016 3.5 14.5254 3.5 12C3.5 9.47463 4.07368 7.19839 5.63604 5.63604Z"
              stroke="white"
              strokeWidth="2"
            />
            <path
              d="M5.63604 5.63604C7.19839 4.07368 9.47463 3.5 12 3.5C14.5254 3.5 16.8016 4.07368 18.364 5.63604C19.9263 7.19839 20.5 9.47463 20.5 12C20.5 14.5254 19.9263 16.8016 18.364 18.364C16.8016 19.9263 14.5254 20.5 12 20.5C9.47463 20.5 7.19839 19.9263 5.63604 18.364C4.07368 16.8016 3.5 14.5254 3.5 12C3.5 9.47463 4.07368 7.19839 5.63604 5.63604Z"
              fill="currentColor"
            />
          </svg>
          <span className="ml-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-full">
            {cursor.user.name}
          </span>
        </div>
      ))}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onStartCall={handleStartCall} />
        <main className="flex flex-1 p-4 gap-4 overflow-hidden">
          <div className="w-64 flex-shrink-0 bg-white dark:bg-gray-800 rounded shadow p-4 overflow-auto">
            <ProjectDetails
              project={activeProject}
              onMemberAdded={handleMemberAdded}
            />
          </div>
          <div className="flex-1 bg-transparent rounded p-4 overflow-auto">
            <KanbanBoard tasks={tasks} onTasksUpdate={handleTasksUpdate} />
          </div>
          <div className="w-80 flex-shrink-0 flex flex-col gap-4">
            <ChatBox projectId={projectId!} />
          </div>
        </main>
      </div>
      <CallDialog
        isOpen={call.isReceivingCall || callAccepted}
        onClose={handleCloseCallDialog}
      />
    </div>
  );
};

export default WorkspaceLayout;
