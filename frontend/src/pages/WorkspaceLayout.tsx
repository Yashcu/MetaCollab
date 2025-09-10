import { useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { throttle } from "lodash";
import { shallow } from "zustand/shallow";
import KanbanBoard from "../components/KanbanBoard";
import ChatBox from "../components/ChatBox";
import ProjectDetails from "../components/ProjectDetails";
import Header from "@/components/Header";
import CallDialog from "@/components/CallDialog";
import { useSocketStore } from "@/state/socketStore";
import { useProjectStore } from "@/state/projectStore";
import { useCallStore } from "@/state/callStore";
import { useChatStore } from "@/state/chatStore";
import { getProjectById } from "@/services/projectService";
import { getTasks } from "@/services/taskService";
import { useToast } from "@/components/ui/use-toast";

const CursorsOverlay = () => {
  const cursors = useProjectStore((state) => state.cursors, shallow);
  const projectUsers = useSocketStore((state) => state.projectUsers, shallow);

  return (
    <>
      {Array.from(cursors.entries()).map(([userId, { position }]) => {
        const user = projectUsers.find((p) => p.userId === userId);

        return (
          <div
            key={userId}
            className="absolute z-50 pointer-events-none transition-transform duration-75 ease-linear"
            style={{
              transform: `translate3d(${position.x}px, ${position.y}px, 0)`,

              left: -12, // Offset to center the cursor

              top: -12, // Offset to center the cursor
            }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-blue-500"
            >
                           {" "}
              <path
                d="M5.63604 5.63604C7.19839 4.07368 9.47463 3.5 12 3.5C14.5254 3.5 16.8016 4.07368 18.364 5.63604C19.9263 7.19839 20.5 9.47463 20.5 12C20.5 14.5254 19.9263 16.8016 18.364 18.364C16.8016 19.9263 14.5254 20.5 12 20.5C9.47463 20.5 7.19839 19.9263 5.63604 18.364C4.07368 16.8016 3.5 14.5254 3.5 12C3.5 9.47463 4.07368 7.19839 5.63604 5.63604Z"
                stroke="white"
                strokeWidth="2"
              />
                           {" "}
              <path
                d="M5.63604 5.63604C7.19839 4.07368 9.47463 3.5 12 3.5C14.5254 3.5 16.8016 4.07368 18.364 5.63604C19.9263 7.19839 20.5 9.47463 20.5 12C20.5 14.5254 19.9263 16.8016 18.364 18.364C16.8016 19.9263 14.5254 20.5 12 20.5C9.47463 20.5 7.19839 19.9263 5.63604 18.364C4.07368 16.8016 3.5 14.5254 3.5 12C3.5 9.47463 4.07368 7.19839 5.63604 5.63604Z"
                fill="currentColor"
              />
                         {" "}
            </svg>
                        {/* User's Name Label */}           {" "}
            <span className="ml-2 mt-1 absolute whitespace-nowrap bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded-full">
                            {user?.userName || "..."}           {" "}
            </span>
                     {" "}
          </div>
        );
      })}
    </>
  );
};

const WorkspaceLayout = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate(); // For redirecting on error
  const { toast } = useToast();

  const { joinProject, leaveProject } = useSocketStore();
  const { activeProject, initializeProject, clearProject, moveCursor } =
    useProjectStore();
  const {
    init: initCallStore,
    cleanup: cleanupCallStore,
    status: callStatus,
    endCall: endCallAction,
  } = useCallStore();
  const {
    init: initChatStore,
    cleanup: cleanupChatStore,
    clearMessages,
  } = useChatStore();

  useEffect(() => {
    if (!projectId) return;
    let isMounted = true;

    const setupWorkspace = async () => {
      try {
        const [projectData, tasksData] = await Promise.all([
          getProjectById(projectId),
          getTasks(projectId),
        ]);
        if (isMounted) {
          initializeProject(projectData, tasksData);
          joinProject(projectId);
          initChatStore();
          initCallStore();
        }
      } catch (error) {
        toast({ variant: "destructive", title: "Failed to load project" });
        navigate("/dashboard");
      }
    };

    setupWorkspace();

    return () => {
      isMounted = false;
      leaveProject(projectId);
      clearProject();
      cleanupChatStore();
      cleanupCallStore();
      clearMessages();
    };
  }, [
    projectId,
    initializeProject,
    joinProject,
    leaveProject,
    clearProject,
    initChatStore,
    cleanupChatStore,
    initCallStore,
    cleanupCallStore,
    clearMessages,
    navigate,
    toast,
  ]);

  const handleMouseMove = useCallback(
    throttle((e: React.MouseEvent<HTMLDivElement>) => {
      moveCursor({ x: e.clientX, y: e.clientY });
    }, 100),
    [moveCursor]
  );

  if (!activeProject) {
    return <div className="text-center p-8">Loading project...</div>;
  }

  return (
    <div
      className="flex h-screen bg-gray-100 dark:bg-gray-900 overflow-hidden relative"
      onMouseMove={handleMouseMove}
    >
      <CursorsOverlay />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header showCallButton={true} />
        <main className="flex flex-1 p-4 gap-4 overflow-hidden">
          <div className="w-64 flex-shrink-0 bg-white dark:bg-gray-800 rounded shadow p-4 overflow-auto">
            <ProjectDetails project={activeProject} />
          </div>
          <div className="flex-1 bg-transparent rounded p-4 overflow-auto">
            <KanbanBoard />
          </div>
          <div className="w-80 flex-shrink-0 flex flex-col gap-4">
            <ChatBox projectId={projectId!} />
          </div>
        </main>
      </div>
      <CallDialog
        isOpen={callStatus !== "idle" && callStatus !== "failed"}
        onClose={endCallAction}
      />
    </div>
  );
};

export default WorkspaceLayout;
