import { useState } from "react";
import { Task } from "../types";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";
import { useProjectStore } from "@/state/projectStore";
import { useSocketStore } from "@/state/socketStore";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { PlusCircle, Trash2 } from "lucide-react";
import { createTask, deleteTask } from "@/services/taskService";
import { useToast } from "./ui/use-toast";
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

// --- Components ---

const TaskCard = ({ task, index, onDelete }: { task: Task; index: number; onDelete: (id: string) => void }) => {
  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm mb-3 group flex justify-between items-center gap-3 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all"
        >
          <p className="font-medium text-gray-900 dark:text-gray-100 break-all text-sm">
            {task.title}
          </p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="h-3.5 w-3.5 text-gray-400 hover:text-red-500" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Task?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(task.id)} className="bg-red-600 hover:bg-red-700">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </Draggable>
  );
};

const KanbanColumn = ({ status, tasks, onDeleteTask }: { status: Task["status"]; tasks: Task[]; onDeleteTask: (id: string) => void }) => {
  return (
    <Droppable droppableId={status}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className="flex-1 bg-gray-50/50 dark:bg-white/5 backdrop-blur-sm p-4 rounded-xl flex flex-col border border-gray-200/50 dark:border-white/5 min-w-[280px]"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold capitalize text-gray-700 dark:text-gray-200">
              {status.replace("-", " ")}
            </h3>
            <span className="text-xs font-medium bg-gray-200 dark:bg-white/10 px-2 py-1 rounded-full text-gray-600 dark:text-gray-400">
              {tasks.length}
            </span>
          </div>

          <div className="flex-grow overflow-y-auto scrollbar-hide min-h-[100px]">
            {tasks.map((task, index) => (
              <TaskCard key={task.id} task={task} index={index} onDelete={onDeleteTask} />
            ))}
            {provided.placeholder}
          </div>
        </div>
      )}
    </Droppable>
  );
};

// --- Main Component ---

const KanbanBoard = () => {
  const { tasks, reorderTasks: reorderTasksAction, activeProject } = useProjectStore();
  const { roomStatus, status } = useSocketStore();
  const { toast } = useToast();

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const isOffline = status !== "connected";
  const isAlone = roomStatus === "waiting";
  const statuses: Task["status"][] = ["todo", "in-progress", "done"];

  // --- Handlers ---

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !activeProject) return;

    setIsCreating(true);
    try {
      await createTask(activeProject.id, { title: newTaskTitle });
      setNewTaskTitle("");
      toast({ title: "Task added" });
    } catch (error) {
      toast({ variant: "destructive", title: "Failed to create task" });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!activeProject) return;
    try {
      await deleteTask(activeProject.id, taskId);
      toast({ title: "Task deleted" });
    } catch (error) {
      toast({ variant: "destructive", title: "Failed to delete task" });
    }
  };

  const onDragEnd = (result: DropResult) => {
    const { destination, source } = result;

    // Dropped outside or no change
    if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) {
      return;
    }

    const allTasks = [...tasks];
    const sourceStatus = source.droppableId as Task["status"];
    const destStatus = destination.droppableId as Task["status"];

    // Filter tasks for each column and sort by order
    const sourceTasks = allTasks.filter(t => t.status === sourceStatus).sort((a, b) => a.order - b.order);
    const destTasks = sourceStatus === destStatus
      ? sourceTasks
      : allTasks.filter(t => t.status === destStatus).sort((a, b) => a.order - b.order);

    // Remove from source
    const [movedTask] = sourceTasks.splice(source.index, 1);

    // Update task status if moved to different column
    if (sourceStatus !== destStatus) {
      movedTask.status = destStatus;
    }

    // Insert into destination
    destTasks.splice(destination.index, 0, movedTask);

    // Reconstruct final list
    const finalTasks: Task[] = [];

    // Add tasks from other columns that weren't touched
    allTasks.forEach(t => {
      if (t.status !== sourceStatus && t.status !== destStatus) {
        finalTasks.push(t);
      }
    });

    // Add updated source tasks
    if (sourceStatus !== destStatus) {
      sourceTasks.forEach((t, i) => finalTasks.push({ ...t, order: i }));
    }

    // Add updated dest tasks
    destTasks.forEach((t, i) => finalTasks.push({ ...t, order: i }));

    reorderTasksAction(finalTasks);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Input Area */}
      <form onSubmit={handleCreateTask} className="flex gap-3 mb-6 flex-shrink-0">
        <Input
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          placeholder="Add a new task..."
          disabled={isCreating}
          className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-white/20"
        />
        <Button type="submit" disabled={isCreating} className="bg-white text-black hover:bg-gray-200">
          {isCreating ? "Adding..." : <><PlusCircle className="mr-2 h-4 w-4" /> Add</>}
        </Button>
      </form>

      {/* Warning for offline mode */}
      {isOffline && (
        <div className="text-center text-xs text-red-500/80 mb-4 bg-red-500/10 p-2 rounded-lg border border-red-500/20">
          Offline: Reconnecting...
        </div>
      )}
      {!isOffline && isAlone && (
        <div className="text-center text-xs text-blue-400/80 mb-4 bg-blue-500/10 p-2 rounded-lg border border-blue-500/20">
          Waiting for others to join...
        </div>
      )}

      {/* Board */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-6 flex-1 overflow-x-auto pb-2">
          {statuses.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              tasks={tasks.filter(t => t.status === status).sort((a, b) => a.order - b.order)}
              onDeleteTask={handleDeleteTask}
            />
          ))}
        </div>
      </DragDropContext>
    </div>
  );
};

export default KanbanBoard;
